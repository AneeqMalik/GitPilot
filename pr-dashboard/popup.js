// State
let prData = { myPRs: [], reviewRequestedPRs: [] };
let currentUsername = '';

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
}

async function loadSettings() {
  const data = await chrome.storage.sync.get([
    'github_pat', 'github_username', 'reminder_enabled', 'reminder_time'
  ]);
  
  currentUsername = data.github_username || '';
  
  document.getElementById('github-pat').value = data.github_pat || '';
  document.getElementById('github-username').value = currentUsername;
  document.getElementById('reminder-enabled').checked = data.reminder_enabled !== false; // default true
  document.getElementById('reminder-time').value = data.reminder_time || '10:00';
}

async function saveSettings() {
  const pat = document.getElementById('github-pat').value.trim();
  const username = document.getElementById('github-username').value.trim();
  const reminderEnabled = document.getElementById('reminder-enabled').checked;
  const reminderTime = document.getElementById('reminder-time').value;

  const msgEl = document.getElementById('settings-message');
  
  await chrome.storage.sync.set({
    github_pat: pat,
    github_username: username,
    reminder_enabled: reminderEnabled,
    reminder_time: reminderTime
  });

  currentUsername = username;

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

    card.innerHTML = `
      <div class="card-top">
        <div class="repo-info">
          <a href="${pr.repo_url}" target="_blank" class="repo-link">${escapeHtml(pr.repo_name)} #${pr.number}</a>
          <span class="pr-author">${escapeHtml(authorDisplay)}</span>
        </div>
        <span class="status-badge ${badgeClass}">${pr.status}</span>
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