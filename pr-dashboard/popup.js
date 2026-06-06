// State
let prData = { myPRs: [], reviewRequestedPRs: [] };
let currentUsername = '';
let aiSettings = { provider: 'none', geminiKey: '', geminiModel: 'gemini-2.5-flash', claudeKey: '', claudeModel: 'claude-3-5-sonnet-20241022', showForOthers: false };
let aiReviewedPrs = [];

// DOM Elements
const prListEl = document.getElementById('pr-list');
const loadingEl = document.getElementById('loading');
const emptyStateEl = document.getElementById('empty-state');
const errorStateEl = document.getElementById('error-state');
const emptyMessageEl = document.getElementById('empty-message');
const refreshBtn = document.getElementById('refresh-btn');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const setupPatBtn = document.getElementById('setup-pat-btn');
const settingsPanel = document.getElementById('settings-panel');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const dashboardMetricsEl = document.getElementById('dashboard-metrics');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();

  // Load reviewed PRs
  const localReviewed = await chrome.storage.local.get(['aiReviewedPrs']);
  aiReviewedPrs = localReviewed.aiReviewedPrs || [];

  await loadSettings();
  
  // Try loading cached data first for instant render
  const localData = await chrome.storage.local.get(['prData']);
  if (localData.prData) {
    prData = localData.prData;
    renderPRs();
  }

  // Then fetch fresh data
  fetchData();
});

function setupEventListeners() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const currentBtn = e.currentTarget;
      navBtns.forEach(b => b.classList.remove('active'));
      currentBtn.classList.add('active');
      
      const target = currentBtn.dataset.target;
      if (target === 'dashboard') {
        document.getElementById('view-dashboard').classList.remove('hidden');
        document.getElementById('view-stats').classList.add('hidden');
      } else if (target === 'stats') {
        document.getElementById('view-dashboard').classList.add('hidden');
        document.getElementById('view-stats').classList.remove('hidden');
        renderStats();
      }
    });
  });

  refreshBtn.addEventListener('click', () => {
    // Spin icon momentarily
    const icon = refreshBtn.querySelector('svg');
    icon.style.transform = 'rotate(180deg)';
    icon.style.transition = 'transform 0.3s ease';
    setTimeout(() => { icon.style.transform = 'none'; }, 300);
    fetchData();
  });

  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden');
    // slight delay to ensure display:block applies before animating transform
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        settingsPanel.classList.add('open');
      });
    });
  });

  const closeSettings = () => {
    settingsPanel.classList.remove('open');
    setTimeout(() => settingsPanel.classList.add('hidden'), 350);
  };

  closeSettingsBtn.addEventListener('click', closeSettings);
  setupPatBtn.addEventListener('click', () => {
    errorStateEl.classList.add('hidden');
    settingsBtn.click();
  });

  saveSettingsBtn.addEventListener('click', saveSettings);

  // Toggle visible settings cards based on AI provider
  const aiProviderSelect = document.getElementById('ai-provider');

  aiProviderSelect.addEventListener('change', () => {
    const val = aiProviderSelect.value;
    document.getElementById('ai-gemini-local-info').classList.add('hidden');
    document.getElementById('ai-claude-web-info').classList.add('hidden');
    document.getElementById('ai-gemini-settings').classList.add('hidden');
    document.getElementById('ai-claude-settings').classList.add('hidden');
    
    if (val === 'gemini-local') {
      document.getElementById('ai-gemini-local-info').classList.remove('hidden');
    } else if (val === 'claude-web') {
      document.getElementById('ai-claude-web-info').classList.remove('hidden');
    } else if (val === 'gemini') {
      document.getElementById('ai-gemini-settings').classList.remove('hidden');
    } else if (val === 'claude') {
      document.getElementById('ai-claude-settings').classList.remove('hidden');
    }
  });
}

async function loadSettings() {
  const data = await chrome.storage.sync.get([
    'github_pat', 'github_username', 'reminder_enabled', 'reminder_time',
    'ai_provider', 'ai_gemini_key', 'ai_gemini_model', 'ai_claude_key', 'ai_claude_model',
    'ai_show_for_others'
  ]);
  
  currentUsername = data.github_username || '';
  
  document.getElementById('github-pat').value = data.github_pat || '';
  document.getElementById('github-username').value = currentUsername;
  document.getElementById('reminder-enabled').checked = data.reminder_enabled !== false; // default true
  document.getElementById('reminder-time').value = data.reminder_time || '10:00';

  // Load AI configurations
  const aiProvider = data.ai_provider || 'none';
  const aiShowForOthers = data.ai_show_for_others === true; // default false
  document.getElementById('ai-provider').value = aiProvider;
  document.getElementById('ai-show-for-others').checked = aiShowForOthers;
  document.getElementById('ai-gemini-key').value = data.ai_gemini_key || '';
  let geminiModel = data.ai_gemini_model || 'gemini-2.5-flash';
  if (geminiModel === 'gemini-1.5-flash') geminiModel = 'gemini-2.5-flash';
  document.getElementById('ai-gemini-model').value = geminiModel;
  document.getElementById('ai-claude-key').value = data.ai_claude_key || '';
  document.getElementById('ai-claude-model').value = data.ai_claude_model || 'claude-3-5-sonnet-20241022';

  // Cache settings state globally
  aiSettings = {
    provider: aiProvider,
    geminiKey: data.ai_gemini_key || '',
    geminiModel: data.ai_gemini_model || 'gemini-2.5-flash',
    claudeKey: data.ai_claude_key || '',
    claudeModel: data.ai_claude_model || 'claude-3-5-sonnet-20241022',
    showForOthers: aiShowForOthers
  };

  // Toggle visibility of fields
  document.getElementById('ai-gemini-local-info').classList.add('hidden');
  document.getElementById('ai-claude-web-info').classList.add('hidden');
  document.getElementById('ai-gemini-settings').classList.add('hidden');
  document.getElementById('ai-claude-settings').classList.add('hidden');
  
  if (aiProvider === 'gemini-local') {
    document.getElementById('ai-gemini-local-info').classList.remove('hidden');
  } else if (aiProvider === 'claude-web') {
    document.getElementById('ai-claude-web-info').classList.remove('hidden');
  } else if (aiProvider === 'gemini') {
    document.getElementById('ai-gemini-settings').classList.remove('hidden');
  } else if (aiProvider === 'claude') {
    document.getElementById('ai-claude-settings').classList.remove('hidden');
  }
}

async function saveSettings() {
  const pat = document.getElementById('github-pat').value.trim();
  const username = document.getElementById('github-username').value.trim();
  const reminderEnabled = document.getElementById('reminder-enabled').checked;
  const reminderTime = document.getElementById('reminder-time').value;

  const aiProvider = document.getElementById('ai-provider').value;
  const aiShowForOthers = document.getElementById('ai-show-for-others').checked;
  const aiGeminiKey = document.getElementById('ai-gemini-key').value.trim();
  const aiGeminiModel = document.getElementById('ai-gemini-model').value;
  const aiClaudeKey = document.getElementById('ai-claude-key').value.trim();
  const aiClaudeModel = document.getElementById('ai-claude-model').value;

  const msgEl = document.getElementById('settings-message');
  
  await chrome.storage.sync.set({
    github_pat: pat,
    github_username: username,
    reminder_enabled: reminderEnabled,
    reminder_time: reminderTime,
    ai_provider: aiProvider,
    ai_show_for_others: aiShowForOthers,
    ai_gemini_key: aiGeminiKey,
    ai_gemini_model: aiGeminiModel,
    ai_claude_key: aiClaudeKey,
    ai_claude_model: aiClaudeModel
  });

  currentUsername = username;

  // Cache settings state globally
  aiSettings = {
    provider: aiProvider,
    geminiKey: aiGeminiKey,
    geminiModel: aiGeminiModel,
    claudeKey: aiClaudeKey,
    claudeModel: aiClaudeModel,
    showForOthers: aiShowForOthers
  };

  msgEl.classList.remove('hidden');
  setTimeout(() => msgEl.classList.add('hidden'), 3000);

  // Trigger a background fetch since settings changed
  fetchData();
}

async function fetchData() {
  showLoading();
  
  try {
    const data = await chrome.storage.sync.get(['github_pat']);
    if (!data.github_pat) {
      showError('Please configure your GitHub PAT in settings.');
      return;
    }

    const api = self.githubAPI;
    await api.init();
    
    // Fallback if currentUsername was empty but api fetched it
    if (api.username) {
        currentUsername = api.username;
    }

    prData = await api.fetchAllPRData();
    renderPRs();
    if (!document.getElementById('view-stats').classList.contains('hidden')) {
      renderStats();
    }

  } catch (error) {
    console.error(error);
    showError(error.message || 'Failed to fetch data.');
  }
}

function showLoading() {
  prListEl.innerHTML = '';
  loadingEl.classList.remove('hidden');
  emptyStateEl.classList.add('hidden');
  errorStateEl.classList.add('hidden');
  dashboardMetricsEl.classList.add('hidden');
}

function showError(msg) {
  loadingEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');
  prListEl.innerHTML = '';
  document.getElementById('error-message').textContent = msg;
  errorStateEl.classList.remove('hidden');
  dashboardMetricsEl.classList.add('hidden');
}

function showEmpty(msg) {
  loadingEl.classList.add('hidden');
  errorStateEl.classList.add('hidden');
  prListEl.innerHTML = '';
  emptyMessageEl.textContent = msg;
  emptyStateEl.classList.remove('hidden');
  dashboardMetricsEl.classList.remove('hidden');
}

function renderPRs() {
  loadingEl.classList.add('hidden');
  errorStateEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');
  prListEl.innerHTML = '';
  dashboardMetricsEl.classList.remove('hidden');

  let listToRender = [...(prData.myPRs || []), ...(prData.reviewRequestedPRs || [])];
  
  // Deduplicate
  listToRender = listToRender.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
  // Sort by updated descending
  listToRender.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // Calculate metrics
  const needsReviewCount = (prData.reviewRequestedPRs || []).length;
  const myOpenCount = (prData.myPRs || []).filter(pr => pr.status === 'Pending Review').length;
  const changesReqCount = (prData.myPRs || []).filter(pr => pr.status === 'Changes Requested').length;
  const approvedCount = (prData.myPRs || []).filter(pr => pr.status === 'Approved').length;

  document.getElementById('metric-needs-review').textContent = needsReviewCount;
  document.getElementById('metric-pending').textContent = myOpenCount;
  document.getElementById('metric-changes').textContent = changesReqCount;
  document.getElementById('metric-approved').textContent = approvedCount;

  if (listToRender.length === 0) {
    showEmpty('You have no active PRs.');
    return;
  }

  listToRender.forEach(pr => {
    const card = document.createElement('div');
    
    let statusClass = 'status-pending';
    let badgeClass = 'pending';
    
    if (pr.status === 'Changes Requested') { statusClass = 'status-changes'; badgeClass = 'changes'; }
    if (pr.status === 'Approved') { statusClass = 'status-approved'; badgeClass = 'approved'; }
    if (pr.status === 'Review Requested from Me') { statusClass = 'status-requested'; badgeClass = 'requested'; }

    card.className = `pr-card ${statusClass}`;

    const tagSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414l8.204 8.204a2.4 2.4 0 0 0 3.4 0l5.414-5.414a2.4 2.4 0 0 0 0-3.4L11.4 5.586z"/><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/></svg>`;

    const tagsHtml = pr.labels.map(l => {
      // Inline style to match GitHub label color if available, else default
      const colorStyle = l.color ? `style="border-color: #${l.color}40; color: #${l.color};"` : '';
      return `<span class="tag" ${colorStyle}>${tagSvg} ${escapeHtml(l.name)}</span>`;
    }).join('');

    const pendingOnHtml = pr.pending_on && pr.pending_on.length > 0 
      ? `Pending on: ${escapeHtml(pr.pending_on.join(', '))}`
      : '';
      
    const authorDisplay = currentUsername && pr.author.toLowerCase() === currentUsername.toLowerCase() ? 'by me' : `by ${pr.author}`;

    // AI Review Integration
    const hasAiReviewed = aiReviewedPrs.includes(pr.id);
    let aiReviewHtml = '';
    const showAiButton = pr.status === 'Review Requested from Me' || (aiSettings.showForOthers === true);
    if (aiSettings.provider !== 'none' && showAiButton) {
      if (hasAiReviewed) {
        aiReviewHtml = `
          <span class="ai-review-btn completed circular-check-badge" title="AI Review Completed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        `;
      } else {
        aiReviewHtml = `
          <button class="ai-review-btn ai-badge-pill" data-pr-id="${pr.id}" data-repo="${escapeHtml(pr.repo_name)}" data-number="${pr.number}" title="Request AI Code Review">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
            AI Review
          </button>
        `;
      }
    }

    card.innerHTML = `
      <div class="card-top">
        <div class="repo-info">
          <a href="${pr.repo_url}" target="_blank" class="repo-link">${escapeHtml(pr.repo_name)} #${pr.number}</a>
          <span class="pr-author">${escapeHtml(authorDisplay)}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span class="status-badge ${badgeClass}">${pr.status}</span>
          ${aiReviewHtml}
        </div>
      </div>
      <a href="${pr.html_url}" target="_blank" class="pr-title">${escapeHtml(pr.title)}</a>
      ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ''}
      <div class="card-bottom">
        <div class="pending-on" title="${pendingOnHtml}">${pendingOnHtml}</div>
        <div class="time" title="${new Date(pr.updated_at).toLocaleString()}">${timeAgo(new Date(pr.updated_at))}</div>
      </div>
    `;

    prListEl.appendChild(card);
  });

  // Bind AI Review Buttons
  const aiBtns = prListEl.querySelectorAll('.ai-review-btn:not(.completed)');
  aiBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const prId = parseInt(btn.dataset.prId, 10);
      const repo = btn.dataset.repo;
      const number = parseInt(btn.dataset.number, 10);
      
      await runAiReview(btn, prId, repo, number);
    });
  });
}

function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

function formatDuration(ms) {
  if (!ms || ms === 0) return 'N/A';
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return Math.round(hours) + "h";
  const days = hours / 24;
  return Math.round(days) + "d";
}

function renderStats() {
  if (!prData.myPRs) return;

  let approved = 0;
  let pending = 0;
  let changes = 0;

  prData.myPRs.forEach(pr => {
    if (pr.status === 'Approved') approved++;
    else if (pr.status === 'Changes Requested') changes++;
    else pending++;
  });

  const statsData = prData.statsData || { totalOpened: 0, averageCloseTime: 0 };
  
  document.getElementById('stat-total-opened').textContent = statsData.totalOpened;
  document.getElementById('stat-avg-close').textContent = formatDuration(statsData.averageCloseTime);

  const total = approved + pending + changes;
  const chartEl = document.getElementById('status-chart');
  const legendEl = document.getElementById('status-legend');
  
  chartEl.innerHTML = '';
  legendEl.innerHTML = '';

  if (total === 0) {
    chartEl.innerHTML = '<div style="width: 100%; text-align: center; font-size: 11px; color: var(--text-muted); line-height: 24px;">No Data</div>';
    return;
  }

  const pApp = (approved / total) * 100;
  const pPen = (pending / total) * 100;
  const pCha = (changes / total) * 100;

  if (pApp > 0) chartEl.innerHTML += `<div class="chart-segment segment-approved" style="width: ${pApp}%" title="Approved: ${approved}"></div>`;
  if (pPen > 0) chartEl.innerHTML += `<div class="chart-segment segment-pending" style="width: ${pPen}%" title="Pending: ${pending}"></div>`;
  if (pCha > 0) chartEl.innerHTML += `<div class="chart-segment segment-changes" style="width: ${pCha}%" title="Changes Requested: ${changes}"></div>`;

  if (approved > 0) legendEl.innerHTML += `<div class="legend-item"><div class="legend-color approved"></div>Approved (${approved})</div>`;
  if (pending > 0) legendEl.innerHTML += `<div class="legend-item"><div class="legend-color pending"></div>Pending (${pending})</div>`;
  if (changes > 0) legendEl.innerHTML += `<div class="legend-item"><div class="legend-color changes"></div>Changes Req (${changes})</div>`;
}

async function runAiReview(btn, prId, repo, number) {
  // Show loading state on button
  btn.classList.add('loading');
  // Replace sparkles with loading spinner
  btn.innerHTML = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="6.34" y1="17.66" x2="8.46" y2="19.54"/><line x1="15.54" y1="4.46" x2="17.66" y2="6.34"/></svg>
    Reviewing...
  `;
  btn.title = "AI Reviewing...";

  try {
    const api = self.githubAPI;
    await api.init();
    
    // Split repo into owner and repo name
    const parts = repo.split('/');
    if (parts.length !== 2) throw new Error('Invalid repository name');
    const owner = parts[0];
    const repoName = parts[1];

    // 1. Fetch files
    const files = await api.getPRFiles(owner, repoName, number);
    if (!files || files.length === 0) {
      throw new Error('No files found to review.');
    }

    // 2. Format patch files for AI
    const formattedChanges = api.formatPRChangesForAI(files);
    if (!formattedChanges.trim()) {
      throw new Error('No code changes detected to review.');
    }

    // 3. Run AI Review
    let reviewResult;
    if (aiSettings.provider === 'gemini-local') {
      reviewResult = await api.runLocalGeminiReview(formattedChanges);
    } else if (aiSettings.provider === 'gemini') {
      if (!aiSettings.geminiKey) throw new Error('Gemini API key is not configured.');
      reviewResult = await api.runGeminiReview(aiSettings.geminiKey, aiSettings.geminiModel, formattedChanges);
    } else if (aiSettings.provider === 'claude-web') {
      reviewResult = await api.runClaudeWebReview(formattedChanges);
    } else if (aiSettings.provider === 'claude') {
      if (!aiSettings.claudeKey) throw new Error('Claude API key is not configured.');
      reviewResult = await api.runClaudeReview(aiSettings.claudeKey, aiSettings.claudeModel, formattedChanges);
    } else {
      throw new Error('No AI provider selected.');
    }

    // 4. Submit review to GitHub
    await api.submitPRReview(owner, repoName, number, reviewResult, files);

    // 5. Update complete state
    btn.classList.remove('loading');
    btn.classList.remove('ai-badge-pill');
    btn.classList.add('completed');
    btn.classList.add('circular-check-badge');
    btn.title = "AI Review Completed";
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    `;

    // 6. Save completed review status
    aiReviewedPrs.push(prId);
    await chrome.storage.local.set({ aiReviewedPrs: aiReviewedPrs });

  } catch (error) {
    console.error('AI Review failed:', error);
    btn.classList.remove('loading');
    // Restore sparkles icon and pill layout
    btn.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
      AI Review
    `;
    btn.title = "Review failed. Click to try again.";
    alert(`AI Review failed: ${error.message}`);
  }
}