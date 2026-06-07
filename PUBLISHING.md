# 🚀 GitPilot: Browser Web Store Publishing Manual

This comprehensive guide walks you through the exact steps required to package, register, and publish **GitPilot** as a live, production extension across the major browser marketplaces:
1. **Chrome Web Store** (Chromium & Google Chrome)
2. **Microsoft Edge Add-ons** (Microsoft Edge)
3. **Mozilla Add-on Developer Hub (AMO)** (Mozilla Firefox)

---

## 📋 Pre-Flight Checklist

Before you begin, ensure your local workspace is completely polished:
- [ ] **Increment Version:** Confirm `"version": "1.0"` inside `pr-dashboard/manifest.json`. For subsequent updates, increment this version (e.g., `1.0.1`, `1.1`).
- [ ] **Clean Code:** Verify there are no hardcoded API keys, GitHub PATs, or developer tokens inside any of the script files. (All configurations must live in the user's `chrome.storage.sync` container).
- [ ] **Validate Icons:** Verify the `icons/` directory has transparent PNGs for all three sizes: `icon16.png`, `icon48.png`, and `icon128.png`.
- [ ] **Exclusions Checked:** Confirm that developer-only scripts (`.ps1` files), local documentation files, git directories, and the setup `website` directory are omitted from the bundle.

---

## 📦 Step 1: Create Your Store-Ready ZIP Package

Web stores accept extension uploads in flat **ZIP** file formats. The zip file should contain only the files in the `pr-dashboard` directory.

### Manual Zipping (Windows Explorer GUI)
1. Open your file explorer and double-click into the **`pr-dashboard`** folder.
2. Select only these essential files:
   - `manifest.json`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `background.js`
   - `github-api.js`
   - `icons/` (the entire folder containing `icon16.png`, `icon48.png`, and `icon128.png`)
3. Right-click the selection and choose **Send to** ➔ **Compressed (zipped) folder**.
4. Rename your file to `gitpilot-release-v1.0.zip`.

### Manual Zipping (macOS / Linux Terminal)
Open your terminal inside the **`pr-dashboard`** folder and execute:
```bash
zip -r gitpilot-release-v1.0.zip manifest.json popup.html popup.css popup.js background.js github-api.js icons/
```

---

## 🌐 Step 2: Publishing Portals Walkthrough

---

### 1. Google Chrome Web Store

Google's developer panel reviews submissions to ensure they conform to security and design standards.

#### A. Registration & Setup
1. Go to the [Chrome Developer Console](https://chrome.google.com/webstore/devconsole).
2. Log in using a standard Google account.
3. Pay the one-time **$5.00 USD** developer registration fee. This is a security measure required by Google to limit spam.

#### B. Uploading and Core Metadata
1. Click **Add new item** in the top right.
2. Drag and drop your prepared `gitpilot-release-v1.0.zip` file.
3. Once processed, fill out the Store Listing details:
   - **Summary (Max 150 chars):** "A modern, responsive GitHub Pull Request dashboard and real-time review tracker with automated AI code reviews."
   - **Detailed Description:** Outline the features (My PRs, Review Requested, relative activity timestamps, daily review alarms, event notifications, and multi-mode AI integrations).
   - **Category:** Select `Developer Tools` or `Productivity`.

#### C. Store Graphics Requirements
Upload the following image assets to complete your listing presence:
- **Screenshots:** At least 1 (recommended 4) of size **1280x800px** or **640x400px** showing the dashboard popup and the settings panel.
- **Small Tile Icon:** Exactly **440x280px** containing your logo and brand colors.

#### D. Privacy & Permissions Justification
Chrome requires a specific explanation for each permission declared in your `manifest.json`. Use the following standard, compliant justifications:

| Permission | Justification |
| :--- | :--- |
| **`storage`** | Used to securely persist the user's GitHub Personal Access Token, configured username, and reminder configurations locally on their machine. |
| **`alarms`** | Essential to power the background 5-minute synchronization loop (event polling) and trigger the daily scheduled review reminder. |
| **`notifications`** | Used to display native desktop push alerts when a PR gets approved, a new review is assigned, or the daily reminder fires. |
| **`cookies`** | Required to safely authenticate requests for the experimental, keyless Claude Web Session AI review engine. |
| **`host_permissions`** | Required to make secure sandboxed API requests directly from the client's browser to `api.github.com` (for PR metadata) and Generative AI providers (`generativelanguage.googleapis.com`, `api.anthropic.com`, and `claude.ai`). |

#### E. Privacy Policy Requirement
You must provide a URL to a hosted Privacy Policy. You can host this policy on GitHub Pages, as a public GitHub Gist, or a single-page website.
- **Policy Statement Recommendation:**
  > "GitPilot values user privacy. The extension operates with a localized serverless architecture. Your Personal Access Token (PAT) and API keys are stored solely inside Chrome's native storage (`chrome.storage.sync`) on your machine and are only sent directly to official endpoints (api.github.com, Google Gemini, Anthropic Claude). GitPilot collects no analytics, tracking, or telemetry."

#### F. Submission
Click **Submit for review**. Review times for Manifest V3 extensions typically range from **1 to 3 business days**. Once approved, you will receive an automated email and the extension will be live on the store!

---

### 2. Microsoft Edge Add-ons Store

Since Microsoft Edge is built on the same Chromium core, it is 100% compatible with GitPilot's Manifest V3 ZIP.

#### A. Registration & Setup
1. Navigate to the [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge).
2. Register as an Edge Extension Developer. Registration is **completely free**.

#### B. Create Submission & Import Listing
1. Click **Create new extension** and upload the same `gitpilot-release-v1.0.zip` package.
2. The Partner Center will automatically read and configure your permissions and manifest attributes.
3. Microsoft allows you to **import the store listing details directly from your active Chrome Web Store page**. Simply paste your Chrome Web Store listing URL, and Microsoft will pull in your screenshots, icons, and descriptions automatically.
4. Input privacy policy links and permissions justifications matching Chrome's definitions.

#### C. Review & Launch
Click **Submit**. Microsoft Edge's review process is largely automated and very fast, usually approving and launching extensions within **24 to 48 hours**.

---

### 3. Mozilla Firefox Add-ons (AMO)

Firefox uses the WebExtensions API and fully supports Manifest V3, but with some architectural details.

#### A. Registration & Setup
1. Create a developer account on the [Mozilla Add-on Developer Hub (AMO)](https://addons.mozilla.org/).
2. Click **Submit a New Add-on**.

#### B. Service Worker Adaptation
While modern Firefox versions support service workers, older environments preferred non-persistent background scripts. The Mozilla upload parser automatically lints your ZIP and provides inline adaptation suggestions if compatibility flags arise.
- To check your ZIP for Firefox compliance before uploading, you can run the official Mozilla lint tool:
  ```bash
  npx web-ext lint
  ```

#### C. Listed vs. Unlisted Distribution
Firefox offers two flexible distribution styles:
- **On-Store Distribution (Listed):** Your extension is hosted on AMO, publicly searchable, and automatically updated for users.
- **Self-Signed Distribution (Unlisted):** Mozilla signs your ZIP and generates an `.xpi` file. You host this file yourself. It won't appear on the Firefox store, which is ideal for internal developer teams or private beta testing.

#### D. Submission
Submit your package. Review times on Firefox AMO average between **a few hours to 3 days**.

---

## 🔄 Step 3: Pushing Updates

When you fix bugs, add features, or update styles:
1. Increment the `"version"` field in `pr-dashboard/manifest.json` (e.g., from `1.0` to `1.0.1`).
2. Package the files again into a new ZIP.
3. Upload the new ZIP in your Developer Consoles.
4. Fill in a brief "What's New" or release log (e.g., "Performance optimizations for background polling").
5. Submit for review. Updates are usually approved faster than initial submissions (typically under 24 hours).
