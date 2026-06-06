# GitPilot Chrome Extension

A localized, real-time dashboard for your GitHub Pull Requests. GitPilot keeps track of PRs authored by you and PRs awaiting your review.

## Features
- **Dashboard Views:** Quickly toggle between "My PRs" and "Review Requested" PRs.
- **Real-time Status:** See PR status badges (Pending Review, Changes Requested, Approved, Review Requested from Me).
- **Background Notifications:** Get alerted when your PR is approved or a new review is requested from you.
- **Daily Reminders:** Set a custom daily alarm to remind you to clear your review queue.
- **Dark Mode Native:** Styled specifically to match GitHub's default dark mode aesthetic.

## Setup Instructions

1. **Clone or Download** this directory to your local machine.
2. **Generate a GitHub Personal Access Token (PAT):**
   - Go to GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic).
   - Click "Generate new token (classic)".
   - Give it a note (e.g., "GitPilot Extension").
   - Select the `repo` scope (this is required to read pull requests and review statuses).
   - Generate and copy the token.
3. **Install the Extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" in the top right corner.
   - Click "Load unpacked" and select the `pr-dashboard` directory.
4. **Configure GitPilot:**
   - Click the GitPilot icon in your Chrome toolbar.
   - Click the Settings gear icon (⚙️) in the top right.
   - Paste your PAT into the "GitHub PAT" field.
   - (Optional) Enter your GitHub username. If left blank, GitPilot will fetch it automatically.
   - Configure your Daily Reminder time.
   - Click "Save Settings".

You're all set! GitPilot will now fetch your PRs and keep you updated.
