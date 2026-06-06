importScripts('github-api.js');

// Configuration
const POLL_INTERVAL_MINUTES = 5;
const ALARM_POLL = 'poll-prs';
const ALARM_DAILY = 'daily-reminder';

chrome.runtime.onInstalled.addListener(() => {
  setupAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarms();
});

async function setupAlarms() {
  // Setup 5-minute polling
  chrome.alarms.create(ALARM_POLL, { periodInMinutes: POLL_INTERVAL_MINUTES });

  // Setup daily reminder
  const data = await chrome.storage.sync.get(['reminder_enabled', 'reminder_time']);
  if (data.reminder_enabled !== false) { // Default to true if not set
    scheduleDailyReminder(data.reminder_time || '10:00');
  }
}

function scheduleDailyReminder(timeString) {
  chrome.alarms.clear(ALARM_DAILY, () => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (alarmTime.getTime() <= now.getTime()) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const delayInMinutes = (alarmTime.getTime() - now.getTime()) / 60000;
    
    chrome.alarms.create(ALARM_DAILY, {
      delayInMinutes: delayInMinutes,
      periodInMinutes: 24 * 60 // Repeat every 24 hours
    });
  });
}

// Listen for settings changes to update the daily reminder alarm
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.reminder_enabled || changes.reminder_time) {
      chrome.storage.sync.get(['reminder_enabled', 'reminder_time'], (data) => {
        if (data.reminder_enabled === false) {
          chrome.alarms.clear(ALARM_DAILY);
        } else {
          scheduleDailyReminder(data.reminder_time || '10:00');
        }
      });
    }
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_POLL) {
    await handlePolling();
  } else if (alarm.name === ALARM_DAILY) {
    await handleDailyReminder();
  }
});

async function handlePolling() {
  // Get old data
  const localData = await chrome.storage.local.get(['prData']);
  const oldData = localData.prData;

  // Fetch new data
  try {
    const newData = await self.githubAPI.fetchAllPRData();
    if (!oldData) return; // First run, no baseline to compare

    checkForChanges(oldData, newData);
  } catch (error) {
    console.error("Polling failed:", error);
  }
}

function checkForChanges(oldData, newData) {
  // Check for newly approved PRs (My PRs)
  if (oldData.myPRs && newData.myPRs) {
    const oldMyPRsMap = new Map(oldData.myPRs.map(pr => [pr.id, pr]));
    
    newData.myPRs.forEach(newPr => {
      const oldPr = oldMyPRsMap.get(newPr.id);
      if (oldPr && oldPr.status !== 'Approved' && newPr.status === 'Approved') {
        showNotification(
          `pr-approved-${newPr.id}`,
          '✅ PR Approved!',
          `${newPr.repo_name}: ${newPr.title}`,
          newPr.html_url
        );
      }
    });
  }

  // Check for new review requests
  if (oldData.reviewRequestedPRs && newData.reviewRequestedPRs) {
    const oldReviewReqMap = new Map(oldData.reviewRequestedPRs.map(pr => [pr.id, pr]));
    
    newData.reviewRequestedPRs.forEach(newPr => {
      if (!oldReviewReqMap.has(newPr.id)) {
        showNotification(
          `pr-review-req-${newPr.id}`,
          '👀 Review Requested',
          `${newPr.author} requested your review on ${newPr.repo_name}: ${newPr.title}`,
          newPr.html_url
        );
      }
    });
  }
}

async function handleDailyReminder() {
  try {
    const data = await self.githubAPI.fetchAllPRData();
    const count = data.reviewRequestedPRs ? data.reviewRequestedPRs.length : 0;
    
    if (count > 0) {
      showNotification(
        'daily-reminder',
        '⏰ Time to review your PRs!',
        `You have ${count} PR(s) awaiting your attention.`,
        'extension-popup' // Special URL to just open extension
      );
    }
  } catch (error) {
    console.error("Daily reminder failed:", error);
  }
}

// Store notification URLs so we can open them on click
const notificationUrls = {};

function showNotification(id, title, message, url) {
  if (url) {
    notificationUrls[id] = url;
  }
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icons/icon128.png', // We'll need to make sure this exists
    title: title,
    message: message,
    priority: 1
  });
}

chrome.notifications.onClicked.addListener((notificationId) => {
  const url = notificationUrls[notificationId];
  if (url) {
    if (url === 'extension-popup') {
       // Cannot easily open popup programmatically, maybe focus a dashboard tab if we had one
       // For now, doing nothing is fine, user will open popup manually.
    } else {
       chrome.tabs.create({ url: url });
    }
    delete notificationUrls[notificationId];
    chrome.notifications.clear(notificationId);
  }
});
