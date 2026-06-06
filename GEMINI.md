Build me a complete Chrome extension called "PR Dashboard" for GitHub Pull Requests with the following specifications:

---

## OVERVIEW
A Chrome extension that shows a dashboard of GitHub PRs — specifically:
- PRs **opened by me**
- PRs where **I am requested as a reviewer**
- Once a PR I reviewed is merged/closed or no longer needs my review, **remove it from the list**

Use the **GitHub REST API** with a **Personal Access Token (PAT)** stored in Chrome's `chrome.storage.sync`.

---

## FEATURES

### 1. PR List with Repo Links
- Show each PR with a clickable title that opens the PR in a new tab
- Show the **repository name** as a clickable link that opens the repo in a new tab
- Show the **PR number** (e.g., #142)

### 2. Review Status Badges
Each PR must show a colored status badge:
- 🟡 **Pending Review** — no review submitted yet
- 🔴 **Changes Requested** — at least one reviewer requested changes
- 🟢 **Approved** — all requested reviewers approved
- 🔵 **Review Requested from Me** — I am in the requested reviewers list

### 3. Pending Review — Show Who It's Pending On
- If status is "Pending Review", show an avatar list or names of **which reviewers haven't responded yet**
- Example: "Pending on: @alice, @bob"

### 4. Last Reviewed Date/Time
- Show the **last review activity timestamp** for each PR
- Format: relative time like "2 hours ago", "Yesterday", "3 days ago"
- If no review yet, show "No reviews yet"

### 5. Tags with Git Flag Icons
- Show PR **labels/tags** as styled chips
- Each tag chip should include a small **git flag icon** (🏷️ or a custom SVG flag icon)
- Color the chips based on the label color returned by GitHub API

### 6. Scheduled Review Reminder Alerts
- Add a **settings panel** where the user can set a **daily reminder time** (e.g., 10:00 AM)
- Use `chrome.alarms` API to fire every day at the specified time
- When the alarm fires, show a **Chrome notification** saying:
  "⏰ Time to review your PRs! You have X PRs awaiting attention."
- Allow the user to enable/disable this reminder from the settings panel

### 7. Real-time Alerts for PR Events
Use **polling every 5 minutes** (via `chrome.alarms`) to check for changes and fire Chrome notifications when:
- ✅ A PR you opened gets **approved**
- 👀 A new PR is **assigned to you for review**
- Include the PR title and repo name in the notification
- Clicking the notification should open the PR in a new tab

### 8. Modern UI Design
Design a **popup (400×580px)** with this layout:

**Header:**
- App name "PR Dashboard" with a GitHub Octocat or git branch SVG icon
- Refresh button (🔄) top right
- Settings gear icon (⚙️) top right

**Filter Tabs:**
- "My PRs" tab | "Review Requested" tab | "All" tab

**PR Cards** (each card contains):
- Top row: Repo name (linked) + PR number + status badge
- Middle row: PR title (linked, truncated if long)
- Below title: Tags/labels as colored flag chips
- Bottom row left: "Pending on: @user1, @user2" or reviewer avatars
- Bottom row right: Last reviewed time (e.g., "2h ago")
- Subtle hover effect on cards
- Left border color-coded by status (yellow/red/green/blue)

**Settings Panel** (slide-in or separate view):
- GitHub PAT input field (masked, with save button)
- GitHub username input
- Daily reminder toggle (on/off)
- Time picker for daily reminder (default 10:00 AM)
- "Save Settings" button

**Color Scheme:**
- Dark mode by default
- Background: #0d1117 (GitHub dark)
- Card background: #161b22
- Accent: #238636 (GitHub green)
- Text: #e6edf3
- Borders: #30363d

**Typography & Polish:**
- Use Inter or system-ui font
- Smooth transitions and hover animations
- Empty state illustration/message when no PRs found
- Loading skeletons while fetching
- Error state if PAT is invalid or API fails

---

## TECH STACK
- **Manifest V3** Chrome Extension
- Vanilla JS (no frameworks) OR React if cleaner
- GitHub REST API v3: `https://api.github.com`
- `chrome.storage.sync` for settings
- `chrome.alarms` for scheduling
- `chrome.notifications` for alerts

---

## FILE STRUCTURE

pr-dashboard/
├── manifest.json
├── popup.html
├── popup.js
├── popup.css
├── background.js       ← service worker for alarms + notifications
├── github-api.js       ← all GitHub API calls
├── settings.html       ← optional separate settings page
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           ← setup instructions including how to generate PAT

---

## GITHUB API ENDPOINTS TO USE
- `GET /user` — get authenticated user info
- `GET /search/issues?q=is:pr+is:open+author:{username}` — PRs opened by me
- `GET /search/issues?q=is:pr+is:open+review-requested:{username}` — PRs needing my review
- `GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews` — get review statuses
- `GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers` — pending reviewers

---

## IMPORTANT IMPLEMENTATION NOTES
1. Store the **last known state** of each PR in `chrome.storage.local` to detect changes for notifications
2. Rate limit awareness: cache responses and avoid redundant API calls
3. If PAT is not set, show an onboarding screen prompting setup
4. All API calls must include `Authorization: Bearer {PAT}` and `Accept: application/vnd.github+json` headers
5. Handle **pagination** for users with many PRs
6. Add a **manual refresh button** that re-fetches all data immediately

Generate all files completely with no placeholders. The extension should work after loading into Chrome as an unpacked extension and entering a GitHub PAT.