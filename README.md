# ✈️ GitPilot: PR Dashboard & AI Code Reviewer

[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-blue.svg?logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![GitHub API](https://img.shields.io/badge/GitHub_API-v3-black.svg?logo=github&logoColor=white)](https://docs.github.com/en/rest)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AI Supported](https://img.shields.io/badge/AI_Powered-Gemini_&_Claude-8E44AD.svg?logo=google-gemini&logoColor=white)](https://ai.google.dev/)

**GitPilot** is an industry-grade, ultra-responsive Chrome Extension designed for software engineers who want to manage their GitHub Pull Requests and automate line-by-line code reviews seamlessly. With custom metrics, real-time status alerts, customizable daily reminders, and advanced cloud & keyless AI integrations, GitPilot takes the friction out of code collaboration.

---

## 🎨 Features & Highlights

### 1. Modern Glassmorphic UI & Default Dark Mode
- **Esthetics:** Designed to match GitHub's native dark theme (`#0d1117`, `#161b22`) featuring a highly modern glassmorphism navbar and headers with deep blur backdrops.
- **Micro-Interactions:** Custom slide-in panels, soft card scales, smooth tab-switching animations, and custom thin scrollbars.

### 2. High-Performance PR Dashboard
- **PR Cards:** Unified list showing PR titles, repository links, PR numbers, labels/tags as colored flag chips (using raw GitHub tag colors), and last-updated relative timestamps.
- **Review Status Badges:** Color-coded status badges indicating:
  - 🟡 **Pending Review** — Awaiting reviewer responses.
  - 🔴 **Changes Requested** — Reviewers requested improvements.
  - 🟢 **Approved** — All requested reviewers approved.
  - 🔵 **Review Requested from Me** — Assigned to you for review.
- **Pending Review Avatars:** Lists exactly which reviewers are outstanding so you can unblock your team.

### 3. Smart Metrics & Stats View
- **Dashboard Metrics:** Track high-level metrics for "Needs Review," "Pending," "Changes Requested," and "Approved."
- **Stats Dashboard:** Live graphs outlining PR status distributions, total PRs opened, and your **Average Close Time** calculated from your last 30 closed pull requests.

### 4. Resilient & Robust AI Code Review
- **Interactive Badges:** Start reviews via a beautiful pill-shaped `"✨ AI Review"` badge. It shifts dynamically to a rotating loading spinner, then pops into a gorgeous **pulsing green check badge** upon completion.
- **Bulletproof 422 Bypassing:** Inline comments are strictly validated against the PR file's added-diff patch (`RIGHT` side only). If GitHub rejects anchoring due to unresolved lines (triggering a `422 Unprocessable Entity`), GitPilot **automatically catches the error and retries by posting a beautifully formatted summarized review**, guaranteeing no feedback is lost.
- **AI Support Matrix:**
  - 🪐 **Gemini local Nano:** Completely keyless, locally-run AI reviews using Chrome’s experimental `window.ai` language model.
  - 🎭 **Claude Web Session:** Keyless AI reviews using your browser's active `Claude.ai` cookies.
  - 🌐 **Gemini REST API:** Fast cloud reviews with `gemini-2.5-flash` or `gemini-2.5-pro`.
  - 🚀 **Claude REST API:** High-quality reviews using `claude-3-5-sonnet`.

### 5. Automated Alerts & Alarms
- **Daily Reminders:** Set a daily scheduled reminder (e.g., 10:00 AM) using `chrome.alarms` to ping you with Chrome notifications summarizing outstanding reviews.
- **Real-time Event Polling:** Automatic background syncs every 5 minutes notify you instantly when your opened PR gets approved, or a new PR is requested for your review.

---

## 🛠️ System Architecture

GitPilot is built strictly under Vanilla Web standards to ensure maximum security, native performance, and light resource consumption.

```
pr-dashboard/
├── manifest.json       ← Extension permissions, background sw registration, MV3 config
├── popup.html          ← Pop-up main layout containing Dashboard, Metrics, Stats and Settings Panel
├── popup.js            ← Tab controllers, DOM manipulation, metrics calculation, and review loaders
├── popup.css           ← Modern CSS variables, glassmorphism templates, pulsing animations
├── background.js       ← Service Worker orchestrating background alarms, notifications, and event polling
└── github-api.js       ← Primary client class handling caching, PATCH diff parsing, and API integrations
```

---

## 🚀 Setup & Installation Guide

### Step 1: Download the Extension
Clone or download this repository onto your machine:
```bash
git clone https://github.com/AneeqMalik/GitPilot.git
```

### Step 2: Configure Chrome for Development
1. Open Google Chrome and go to `chrome://extensions/`.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `pr-dashboard` folder inside the directory you cloned.

### Step 3: Create a GitHub Personal Access Token (PAT)
To allow GitPilot to fetch your repositories, pull requests, and review comments:
1. Navigate to **GitHub** -> **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Provide a clear note (e.g., `GitPilot PR Extension`).
4. Select the **`repo`** scope (required to read private and public pull requests).
5. Click **Generate token** and copy the resulting string.

### Step 4: Configure Settings
1. Click the **GitPilot** icon in your extension bar.
2. Click the gear icon (**⚙️**) in the top right to slide open the Settings Panel.
3. Paste your **GitHub PAT** into the input field.
4. (Optional) Provide your GitHub username (if omitted, GitPilot will automatically fetch it from the API).
5. Choose your **AI Provider** and enter your respective API keys if you wish to use Cloud reviews.
6. Enable the **Daily Reminder** and customize your timing.
7. Click **Save Settings** to persist the configurations securely via `chrome.storage.sync`.

---

## 🔒 Security & Privacy

GitPilot is built with security first:
- **No Third-Party Servers:** Your Personal Access Token (PAT) and API keys are stored entirely inside Chrome's native, encrypted storage (`chrome.storage.sync`) and are only ever sent directly to official endpoints (`api.github.com` or `generativelanguage.googleapis.com`).
- **No Analytics:** GitPilot does not collect, track, or share any of your private repositories, profile statistics, or code snippets. All data processing is executed inside your client's sandboxed environment.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ by Aneeq Malik & GitPilot contributors.</p>
