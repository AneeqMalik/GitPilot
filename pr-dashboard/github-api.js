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

  async getPRFiles(owner, repo, prNumber) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`;
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`Failed to fetch PR files: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching PR files:', error);
      throw error;
    }
  }

  parsePatch(patch) {
    if (!patch) return [];
    const lines = patch.split('\n');
    const parsedLines = [];
    let lineNew = 0;
    let lineOld = 0;

    for (const line of lines) {
      const hunkHeaderMatch = line.match(/^@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (hunkHeaderMatch) {
        lineOld = parseInt(hunkHeaderMatch[1], 10);
        lineNew = parseInt(hunkHeaderMatch[2], 10);
        parsedLines.push({ type: 'header', text: line });
        continue;
      }

      if (line.startsWith('+')) {
        parsedLines.push({ type: 'added', text: line, lineNum: lineNew });
        lineNew++;
      } else if (line.startsWith('-')) {
        parsedLines.push({ type: 'deleted', text: line, lineNum: lineOld });
        lineOld++;
      } else {
        parsedLines.push({ type: 'context', text: line, lineNum: lineNew });
        lineNew++;
        lineOld++;
      }
    }
    return parsedLines;
  }

  formatPRChangesForAI(files) {
    let formatted = "";
    for (const file of files) {
      if (!file.patch) continue;
      formatted += `File: ${file.filename}\n`;
      const parsed = this.parsePatch(file.patch);
      for (const pl of parsed) {
        if (pl.type === 'header') {
          formatted += `${pl.text}\n`;
        } else if (pl.type === 'added') {
          formatted += `[${pl.lineNum}] + ${pl.text.substring(1)}\n`;
        } else if (pl.type === 'deleted') {
          formatted += `[-] - ${pl.text.substring(1)}\n`;
        } else if (pl.type === 'context') {
          formatted += `[${pl.lineNum}]   ${pl.text.substring(1)}\n`;
        }
      }
      formatted += `\n`;
    }
    return formatted;
  }

  async runGeminiReview(apiKey, model, formattedChanges) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const systemInstruction = `You are a professional software engineer performing a line-by-line code review of a GitHub PR.
Analyze the file changes carefully, looking for:
- Bug and logic errors.
- Cleanliness, readability, and idiomatic code structure.
- Efficiency and performance bottlenecks.
- Basic security concerns.

RULES:
1. Only comment on added or modified lines (marked with '+' and having a positive integer line number in brackets like [12]).
2. Never comment on deleted lines (marked with '[-]') or context lines.
3. Ensure comments are highly specific and actionable.
4. Output a JSON object matching this schema:
{
  "comments": [
    {
      "path": "relative/file/path.js",
      "line": 12,
      "body": "Your review comment on this line"
    }
  ]
}
5. If no issues are found, return an empty comments list. Keep comments focused, only comment on actual issues or clear improvements.`;

    const userPrompt = `Here is the formatted diff showing the files and lines changed in the pull request:

${formattedChanges}

Please review the code changes and return your response strictly as a JSON object containing the comments.`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: userPrompt }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              { text: systemInstruction }
            ]
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errData.error?.message || response.statusText}`);
      }

      const resData = await response.json();
      const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error('Empty response from Gemini API');
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error in Gemini review:', error);
      throw error;
    }
  }

  async runClaudeReview(apiKey, model, formattedChanges) {
    const url = 'https://api.anthropic.com/v1/messages';
    
    const systemInstruction = `You are a professional software engineer performing a line-by-line code review of a GitHub PR.
Analyze the file changes carefully, looking for:
- Bug and logic errors.
- Cleanliness, readability, and idiomatic code structure.
- Efficiency and performance bottlenecks.
- Basic security concerns.

RULES:
1. Only comment on added or modified lines (marked with '+' and having a positive integer line number in brackets like [12]).
2. Never comment on deleted lines (marked with '[-]') or context lines.
3. Ensure comments are highly specific and actionable.
4. You must output a JSON object matching this schema. Your entire response must be a single, valid JSON object, and contain nothing else. Do not use markdown wraps or explanations outside of the JSON.
{
  "comments": [
    {
      "path": "relative/file/path.js",
      "line": 12,
      "body": "Your review comment on this line"
    }
  ]
}
5. If no issues are found, return an empty comments list. Keep comments focused, only comment on actual issues or clear improvements.`;

    const userPrompt = `Here is the formatted diff showing the files and lines changed in the pull request:

${formattedChanges}

Please review the code changes and return your response strictly as a JSON object containing the comments.`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          temperature: 0.2,
          system: systemInstruction,
          messages: [
            {
              role: 'user',
               content: userPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} - ${errData.error?.message || response.statusText}`);
      }

      const resData = await response.json();
      const responseText = resData.content?.[0]?.text;
      if (!responseText) throw new Error('Empty response from Claude API');
      
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error in Claude review:', error);
      throw error;
    }
  }

  async submitPRReview(owner, repo, prNumber, reviewData) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
    
    const githubComments = (reviewData.comments || []).map(c => ({
      path: c.path,
      line: parseInt(c.line, 10),
      side: 'RIGHT',
      body: c.body
    }));

    const hasComments = githubComments.length > 0;
    const bodyText = hasComments 
      ? "✨ **GitPilot AI Code Review:** I have completed the line-by-line code review. Please see the comments below."
      : "✨ **GitPilot AI Code Review:** No issues found! High quality changes! LGTM 👍";

    const reviewBody = {
      body: bodyText,
      event: 'COMMENT'
    };

    if (hasComments) {
      reviewBody.comments = githubComments;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(reviewBody)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Failed to submit review: ${response.status} - ${errData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting PR review:', error);
      throw error;
    }
  }

  async runLocalGeminiReview(formattedChanges) {
    if (!window.ai || !window.ai.languageModel) {
      throw new Error('Chrome Gemini Nano (window.ai.languageModel) is not enabled. Please enable it in chrome://flags.');
    }

    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'no') {
      throw new Error('Gemini Nano is not available or not yet downloaded on this machine. Check chrome://components.');
    }

    const systemInstruction = `You are a professional software engineer performing a line-by-line code review of a GitHub PR.
Analyze the file changes carefully, looking for:
- Bug and logic errors.
- Cleanliness, readability, and idiomatic code structure.
- Efficiency and performance bottlenecks.
- Basic security concerns.

RULES:
1. Only comment on added or modified lines (marked with '+' and having a positive integer line number in brackets like [12]).
2. Never comment on deleted lines (marked with '[-]') or context lines.
3. Ensure comments are highly specific and actionable.
4. You must output a JSON object matching this schema. Your entire response must be a single, valid JSON object, and contain nothing else. Do not use markdown wraps or explanations outside of the JSON.
{
  "comments": [
    {
      "path": "relative/file/path.js",
      "line": 12,
      "body": "Your review comment on this line"
    }
  ]
}
5. If no issues are found, return an empty comments list. Keep comments focused, only comment on actual issues or clear improvements.`;

    const userPrompt = `Here is the formatted diff showing the files and lines changed in the pull request:

${formattedChanges}

Please review the code changes and return your response strictly as a JSON object containing the comments.`;

    let session;
    try {
      session = await window.ai.languageModel.create({
        systemPrompt: systemInstruction,
        temperature: 0.2
      });

      const responseText = await session.prompt(userPrompt);
      
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error in local Gemini review:', error);
      throw error;
    } finally {
      if (session) {
        session.destroy();
      }
    }
  }

  async runClaudeWebReview(formattedChanges) {
    const systemInstruction = `You are a professional software engineer performing a line-by-line code review of a GitHub PR.
Analyze the file changes carefully, looking for:
- Bug and logic errors.
- Cleanliness, readability, and idiomatic code structure.
- Efficiency and performance bottlenecks.
- Basic security concerns.

RULES:
1. Only comment on added or modified lines (marked with '+' and having a positive integer line number in brackets like [12]).
2. Never comment on deleted lines (marked with '[-]') or context lines.
3. Ensure comments are highly specific and actionable.
4. You must output a JSON object matching this schema. Your entire response must be a single, valid JSON object, and contain nothing else. Do not use markdown wraps or explanations outside of the JSON.
{
  "comments": [
    {
      "path": "relative/file/path.js",
      "line": 12,
      "body": "Your review comment on this line"
    }
  ]
}
5. If no issues are found, return an empty comments list. Keep comments focused, only comment on actual issues or clear improvements.`;

    const userPrompt = `Here is the formatted diff showing the files and lines changed in the pull request:

${formattedChanges}

Please review the code changes and return your response strictly as a JSON object containing the comments.`;

    try {
      const orgId = await this.fetchClaudeWebOrgId();
      const convId = await this.createClaudeWebConversation(orgId);

      const promptText = `${systemInstruction}\n\n${userPrompt}`;
      const response = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations/${convId}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attachments: [],
          files: [],
          model: "claude-3-5-sonnet",
          timezone: "UTC",
          rendering_mode: "raw",
          prompt: promptText
        })
      });

      if (!response.ok) throw new Error(`Claude Web Completion failed: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data:')) {
              try {
                const jsonStr = line.replace(/^data:\s*/, '').trim();
                const parsed = JSON.parse(jsonStr);
                if (parsed.completion) {
                  fullText += parsed.completion;
                }
              } catch (e) {
                // skip
              }
            }
          }
        }
      }

      await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations/${convId}`, {
        method: 'DELETE'
      }).catch(() => {});

      let cleanedText = fullText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      return JSON.parse(cleanedText);

    } catch (error) {
      console.error('Error in Claude Web review:', error);
      throw error;
    }
  }

  async fetchClaudeWebOrgId() {
    const response = await fetch('https://claude.ai/api/organizations', {
      method: 'GET'
    });
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('Please sign in to https://claude.ai in your browser first.');
      }
      throw new Error(`Failed to authenticate with Claude Web: ${response.status}`);
    }
    const orgs = await response.json();
    if (!orgs || orgs.length === 0) throw new Error('No Claude organizations found.');
    return orgs[0].uuid;
  }

  async createClaudeWebConversation(orgId) {
    const response = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "GitPilot AI Code Review"
      })
    });
    if (!response.ok) throw new Error('Failed to create Claude Web conversation');
    const conv = await response.json();
    return conv.uuid;
  }
}

// Export for use in background and popup
self.githubAPI = new GitHubAPI();
