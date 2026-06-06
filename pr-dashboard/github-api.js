class GitHubAPI {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.pat = null;
    this.username = null;
  }

  async init() {
    const data = await chrome.storage.sync.get(['github_pat', 'github_username']);
    this.pat = data.github_pat;
    this.username = data.github_username;
    
    if (this.pat && !this.username) {
       await this.fetchAndSaveUser();
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.pat}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async fetchAndSaveUser() {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      this.username = data.login;
      await chrome.storage.sync.set({ github_username: this.username });
      return this.username;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async fetchMyPRs() {
    if (!this.username) throw new Error('Username not set');
    const query = `is:pr is:open author:${this.username}`;
    return this.searchIssues(query);
  }

  async fetchReviewRequestedPRs() {
    if (!this.username) throw new Error('Username not set');
    const query = `is:pr is:open review-requested:${this.username}`;
    return this.searchIssues(query);
  }

  async searchIssues(query) {
    const url = `${this.baseUrl}/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error('Error searching issues:', error);
      throw error;
    }
  }

  async getPRDetails(prUrl) {
    // prUrl is like https://api.github.com/repos/owner/repo/issues/number
    // but we need the pulls endpoint for review details
    const pullsUrl = prUrl.replace('/issues/', '/pulls/');
    try {
      const response = await fetch(pullsUrl, { headers: this.getHeaders() });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching PR details:', error);
      return null;
    }
  }

  async getReviews(owner, repo, prNumber) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/reviews?per_page=100`;
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }
  
  async getRequestedReviewers(owner, repo, prNumber) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`;
    try {
       const response = await fetch(url, { headers: this.getHeaders() });
       if (!response.ok) return { users: [], teams: [] };
       return await response.json();
    } catch (error) {
       console.error('Error fetching requested reviewers:', error);
       return { users: [], teams: [] };
    }
  }

  parseRepoDetailsFromUrl(url) {
    // URL format: https://api.github.com/repos/{owner}/{repo}/issues/{number}
    const match = url.match(/repos\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
    if (match) {
      return { owner: match[1], repo: match[2], number: match[3] };
    }
    return null;
  }

  async fetchStats() {
    if (!this.username) return null;
    try {
      // 1. Get total opened by me
      const allQuery = `is:pr author:${this.username}`;
      const allUrl = `${this.baseUrl}/search/issues?q=${encodeURIComponent(allQuery)}&per_page=1`;
      
      // 2. Get last 30 closed PRs to calculate average close time
      const closedQuery = `is:pr is:closed author:${this.username}`;
      const closedUrl = `${this.baseUrl}/search/issues?q=${encodeURIComponent(closedQuery)}&per_page=30`;

      const [allRes, closedRes] = await Promise.all([
        fetch(allUrl, { headers: this.getHeaders() }),
        fetch(closedUrl, { headers: this.getHeaders() })
      ]);

      const allData = allRes.ok ? await allRes.json() : { total_count: 0 };
      const closedData = closedRes.ok ? await closedRes.json() : { items: [] };

      let totalTime = 0;
      let closedCount = 0;
      for (const pr of closedData.items) {
        if (pr.closed_at && pr.created_at) {
          totalTime += (new Date(pr.closed_at) - new Date(pr.created_at));
          closedCount++;
        }
      }

      let averageCloseTime = 0;
      if (closedCount > 0) {
        averageCloseTime = totalTime / closedCount;
      }

      return {
        totalOpened: allData.total_count || 0,
        averageCloseTime: averageCloseTime
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }

  async fetchAllPRData() {
    await this.init();
    if (!this.pat) throw new Error('No PAT configured');

    const [myPRsRaw, reviewRequestedPRsRaw, statsData] = await Promise.all([
      this.fetchMyPRs(),
      this.fetchReviewRequestedPRs(),
      this.fetchStats()
    ]);

    // Process My PRs
    const myPRs = await this.enrichPRs(myPRsRaw, 'authored');
    
    // Process Review Requested PRs
    const reviewRequestedPRs = await this.enrichPRs(reviewRequestedPRsRaw, 'requested');

    const allPRs = {
      myPRs,
      reviewRequestedPRs,
      statsData,
      lastUpdated: new Date().toISOString()
    };

    // Cache to local storage
    await chrome.storage.local.set({ prData: allPRs });
    return allPRs;
  }

  async enrichPRs(prsRaw, type) {
    const enriched = [];
    for (const pr of prsRaw) {
      const repoDetails = this.parseRepoDetailsFromUrl(pr.url);
      if (!repoDetails) continue;

      const { owner, repo, number } = repoDetails;
      
      const [reviews, requestedReviewers, prDetails] = await Promise.all([
         this.getReviews(owner, repo, number),
         this.getRequestedReviewers(owner, repo, number),
         type === 'authored' ? this.getPRDetails(pr.url) : Promise.resolve(null)
      ]);

      const status = this.determinePRStatus(reviews, requestedReviewers, type);

      enriched.push({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        html_url: pr.html_url,
        repo_name: `${owner}/${repo}`,
        repo_url: `https://github.com/${owner}/${repo}`,
        status: status.state,
        pending_on: status.pendingOn,
        labels: pr.labels,
        updated_at: pr.updated_at,
        created_at: pr.created_at,
        author: pr.user.login,
        commits: prDetails ? prDetails.commits : 0
      });
    }
    return enriched;
  }

  determinePRStatus(reviews, requestedReviewers, type) {
    // Status can be: 'Pending Review', 'Changes Requested', 'Approved', 'Review Requested'
    
    if (type === 'requested') {
      return { state: 'Review Requested from Me', pendingOn: [] };
    }

    // For PRs authored by me
    const requestedLogins = requestedReviewers.users.map(u => u.login);
    
    // Process reviews to get latest state per reviewer
    const latestReviews = {};
    for (const review of reviews) {
      latestReviews[review.user.login] = review.state;
    }

    const reviewStates = Object.values(latestReviews);
    
    if (reviewStates.includes('CHANGES_REQUESTED')) {
      return { state: 'Changes Requested', pendingOn: requestedLogins };
    }

    if (reviewStates.includes('APPROVED') && requestedLogins.length === 0) {
      return { state: 'Approved', pendingOn: [] };
    }

    return { state: 'Pending Review', pendingOn: requestedLogins };
  }
}

// Export for use in background and popup
self.githubAPI = new GitHubAPI();
