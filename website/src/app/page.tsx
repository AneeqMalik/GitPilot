"use client";

import React, { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  text: string;
  strongText?: string;
  postText?: string;
}

export default function Home() {
  // ==========================================
  // 1. Tab Navigation System (Setup vs Publish)
  // ==========================================
  const [activeTab, setActiveTab] = useState<"setup" | "publish">("setup");

  const handleTabChange = (tab: "setup" | "publish", e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setActiveTab(tab);
    // Smooth scroll to the top of content area
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  // ==========================================
  // 2. Clipboard Copy Button State & Logic
  // ==========================================
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // ==========================================
  // 3. Store Portal Sub-Tab Swapping
  // ==========================================
  const [activeStore, setActiveStore] = useState<"chrome" | "edge" | "firefox">("chrome");

  // ==========================================
  // 4. Pre-Flight Checklist Logic with LocalStorage
  // ==========================================
  const checklistItems: ChecklistItem[] = [
    {
      id: "manifest",
      text: "Verify ",
      strongText: "manifest.json",
      postText: " properties (verify \"version\" is set to initial 1.0 or incremented, check \"description\" is descriptive)."
    },
    {
      id: "secrets",
      text: "Ensure ",
      strongText: "no API keys, tokens, or private secrets",
      postText: " are hardcoded inside any of the extension JavaScript files. (Use chrome.storage.sync as implemented!)."
    },
    {
      id: "icons",
      text: "Check that the ",
      strongText: "icons/",
      postText: " folder contains correct transparent icons for sizes 16x16px, 48x48px, and 128x128px as specified in the manifest."
    },
    {
      id: "unused",
      text: "Clean up the folder: exclude all developer-only PowerShell scripts (",
      strongText: ".ps1 files",
      postText: "), unused media, git folders, and documentation."
    },
    {
      id: "privacy",
      text: "Prepare a simple ",
      strongText: "Privacy Policy",
      postText: " hosted online (can be a GitHub Gist or single webpage), explaining that GitPilot stores data locally and does not collect personal data."
    },
    {
      id: "promos",
      text: "Create promotional material: At least 1 store screenshot (",
      strongText: "1280x800px",
      postText: " or 640x400px) and a small store tile icon (440x280px)."
    }
  ];

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  // Initialize and load from LocalStorage only on client side
  useEffect(() => {
    setIsClient(true);
    const loadedState: Record<string, boolean> = {};
    checklistItems.forEach(item => {
      const saved = localStorage.getItem(`gitpilot_preflight_${item.id}`);
      loadedState[item.id] = saved === "true";
    });
    setChecklistState(loadedState);
  }, []);

  const handleCheckboxChange = (id: string) => {
    const nextState = {
      ...checklistState,
      [id]: !checklistState[id]
    };
    setChecklistState(nextState);
    localStorage.setItem(`gitpilot_preflight_${id}`, String(nextState[id]));
  };

  // Calculate percentage progress
  const checkedCount = Object.values(checklistState).filter(Boolean).length;
  const progressPercentage = checklistItems.length > 0 
    ? (checkedCount / checklistItems.length) * 100 
    : 0;

  return (
    <>
      {/* Header / Navigation */}
      <header>
        <div className="container nav-wrapper">
          <a href="#" className="logo-container" onClick={(e) => handleTabChange("setup", e)}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span className="logo-text">GitPilot Docs</span>
          </a>
          <ul className="nav-links">
            <li>
              <a 
                href="#" 
                className={activeTab === "setup" ? "active" : ""} 
                onClick={(e) => handleTabChange("setup", e)}
              >
                Configuration
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === "publish" ? "active" : ""} 
                onClick={(e) => handleTabChange("publish", e)}
              >
                Publishing Hub
              </a>
            </li>
            <li>
              <a href="https://github.com/AneeqMalik/GitPilot" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Elevate Your Pull Request <span>Workflow</span></h1>
          <p className="hero-subtitle">GitPilot aggregates your authored PRs, active code reviews, and utilizes keyless AI engines to make line-by-line code review seamless and enjoyable.</p>
          
          {/* Tab Controls */}
          <div className="tabs-control">
            <button 
              className={`tab-btn ${activeTab === "setup" ? "active" : ""}`}
              onClick={(e) => handleTabChange("setup", e)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
              </svg>
              Setup & Configuration
            </button>
            <button 
              className={`tab-btn ${activeTab === "publish" ? "active" : ""}`}
              onClick={(e) => handleTabChange("publish", e)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              Web Store Publishing
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="container">

        {/* ==================== TAB 1: SETUP GUIDE ==================== */}
        <div className={`tab-content ${activeTab === "setup" ? "active" : ""}`}>
          <div className="steps-container">

            {/* Step 1: Get Code */}
            <div className="step-card">
              <div className="step-badge">1</div>
              <div className="step-body">
                <h3 className="step-title">Acquire the Extension Source Code</h3>
                <p className="step-desc">GitPilot is loaded locally as a developer extension during development. Obtain the latest release by cloning the codebase to your machine.</p>
                
                <div className="codeblock-container">
                  <div className="codeblock-header">
                    <span>Terminal / Git Bash</span>
                    <button 
                      className={`copy-btn ${copiedId === "git-clone" ? "copied" : ""}`}
                      onClick={() => handleCopy("git-clone", "git clone https://github.com/AneeqMalik/GitPilot.git")}
                    >
                      {copiedId === "git-clone" ? (
                        <>
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="codeblock-body">
                    <pre><code>git clone https://github.com/AneeqMalik/GitPilot.git</code></pre>
                  </div>
                </div>
                <p className="step-desc">After cloning, make sure you can see the <strong><code>pr-dashboard</code></strong> directory. It contains all the necessary source files (`manifest.json`, `popup.html`, `popup.js`, `background.js`, `github-api.js`, etc.) which Chrome requires to run the extension.</p>
              </div>
            </div>

            {/* Step 2: Create Token */}
            <div className="step-card">
              <div className="step-badge">2</div>
              <div className="step-body">
                <h3 className="step-title">Create a GitHub Personal Access Token (PAT)</h3>
                <p className="step-desc">GitPilot queries your Pull Requests directly from the GitHub REST API securely from your browser. To do this, it requires a Personal Access Token (classic) with access to your repositories.</p>
                
                <ul className="sub-steps">
                  <li>Log in to your <strong>GitHub account</strong> and navigate to <strong>Settings</strong> (via your profile icon in the top right).</li>
                  <li>Scroll down the left sidebar and click on <strong>Developer settings</strong>.</li>
                  <li>In the Developer settings sidebar, expand <strong>Personal access tokens</strong> and select <strong>Tokens (classic)</strong>.</li>
                  <li>Click the <strong>Generate new token</strong> dropdown and select <strong>Generate new token (classic)</strong>.</li>
                  <li>Set a note (e.g., <code>GitPilot Extension</code>) and choose an expiration date (e.g., 90 days or No expiration).</li>
                  <li>Under <strong>Select scopes</strong>, select the following checkbox:</li>
                </ul>

                {/* Scopes visual mapping */}
                <div className="scope-grid">
                  <div className="scope-card">
                    <div className="scope-checkbox"></div>
                    <div className="scope-text">
                      <h4>[ ] repo</h4>
                      <p>Grants full control over private and public repositories, enabling GitPilot to fetch your PRs, read review statuses, and list pending reviewers.</p>
                    </div>
                  </div>
                </div>

                <ul className="sub-steps" style={{ marginTop: "15px" }}>
                  <li>Scroll to the bottom of the page and click <strong>Generate token</strong>.</li>
                  <li><strong>Crucial:</strong> Copy the generated token immediately! You will not be able to see it again once you navigate away from the page.</li>
                </ul>

                <div className="callout">
                  <div className="callout-title">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    Security Best Practice
                  </div>
                  <p>GitPilot is designed with zero third-party servers. Your PAT is stored directly inside Chrome's local storage sync system (encrypted on your machine). It is sent <em>directly</em> to GitHub's official API endpoints. No analytics, tracking, or telemetry exist.</p>
                </div>
              </div>
            </div>

            {/* Step 3: Load Extension in Chrome */}
            <div className="step-card">
              <div className="step-badge">3</div>
              <div className="step-body">
                <h3 className="step-title">Load the Extension into Google Chrome</h3>
                <p className="step-desc">With Developer Mode enabled, Chrome allows loading raw unpacked extension folders as fully functional extensions.</p>
                
                <ul className="sub-steps">
                  <li>Open Google Chrome and navigate to the extensions control panel by entering: <strong style={{ fontFamily: "monospace", background: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>chrome://extensions/</strong> in the address bar.</li>
                  <li>In the top-right corner of the Extensions page, toggle the <strong>Developer mode</strong> switch to <strong>ON</strong>.</li>
                  <li>In the top-left corner of the page, click the <strong>Load unpacked</strong> button.</li>
                  <li>In the file explorer dialogue, navigate to your cloned repository and select the <strong><code>pr-dashboard</code></strong> folder (ensure you select the folder containing `manifest.json` directly).</li>
                  <li>Click **Select Folder** (or **Open**).</li>
                </ul>

                <p className="step-desc">🎉 The GitPilot extension card should now appear in your list! You can pin the extension to your Chrome toolbar by clicking the extensions puzzle piece icon in your toolbar and clicking the pin icon next to <strong>GitPilot</strong>.</p>
              </div>
            </div>

            {/* Step 4: Configure settings */}
            <div className="step-card">
              <div className="step-badge">4</div>
              <div className="step-body">
                <h3 className="step-title">Configure Settings & Personalize</h3>
                <p className="step-desc">Once loaded, you need to input your GitHub PAT and optionally set up custom alarms, review intervals, or keyless AI reviewers.</p>
                
                <ul className="sub-steps">
                  <li>Click the <strong>GitPilot icon</strong> in your browser toolbar to open the glassmorphic dashboard popup.</li>
                  <li>Click the **Gear Settings icon** (⚙️) in the top-right corner. The settings slide-over panel will open.</li>
                  <li>Paste your copied **GitHub Personal Access Token (PAT)** into the designated input field.</li>
                  <li><em>(Optional)</em> Enter your **GitHub Username**. If left blank, GitPilot will automatically fetch your username securely from the API during the next synchronization.</li>
                  <li><em>(Optional)</em> Choose your **AI Provider** (e.g. Gemini API, Gemini Local Nano, Claude Web Session, or Claude API) if you wish to run automatic line-by-line AI code reviews. Input your corresponding API Keys if using cloud services.</li>
                  <li><em>(Optional)</em> Enable **Daily Reminders** and set your preferred reminder hour (e.g., <code>10:00 AM</code>). This uses <code>chrome.alarms</code> to ping you daily.</li>
                  <li>Click **Save Settings** at the bottom of the panel.</li>
                </ul>

                <p className="step-desc" style={{ color: "var(--accent-green)", fontWeight: 600 }}>Success! The dashboard will immediately synchronize and display your Pull Requests (both authored by you and requesting your reviews) with their respective review status badges, tags, and reviewer status timelines.</p>
              </div>
            </div>

          </div>
        </div>

        {/* ==================== TAB 2: PUBLISHING HUB ==================== --> */}
        <div className={`tab-content ${activeTab === "publish" ? "active" : ""}`}>
          
          {/* Pre-flight Developer Checklist */}
          <div className="checklist-card">
            <h3 className="checklist-title">
              <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              Developer Pre-Flight Checklist
            </h3>
            <p className="step-desc" style={{ marginBottom: "12px" }}>Ensure your extension is completely polished and optimized before packaging and submitting to the store reviews. Tick off these boxes to generate a checklist report:</p>
            
            <div className="checklist-progress-bar">
              <div 
                className="checklist-progress-fill" 
                style={{ width: `${isClient ? progressPercentage : 0}%` }}
              ></div>
            </div>

            <div className="checklist-items">
              {checklistItems.map(item => (
                <label className="checklist-item" key={item.id}>
                  <input 
                    type="checkbox" 
                    id={`check-${item.id}`}
                    checked={!!checklistState[item.id]}
                    onChange={() => handleCheckboxChange(item.id)}
                  />
                  <span className="custom-checkbox"></span>
                  <span className="checklist-item-text">
                    {item.text}
                    {item.strongText && <strong>{item.strongText}</strong>}
                    {item.postText}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Manual Packaging Guide */}
          <div className="step-card" style={{ marginBottom: "40px", borderLeft: "4px solid var(--accent-blue)" }}>
            <div className="step-badge" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--accent-blue)", color: "var(--accent-blue)" }}>📦</div>
            <div className="step-body">
              <h3 className="step-title">Step 1: Manually Package the Extension</h3>
              <p className="step-desc">To submit your extension to any web extensions store, you must bundle the files into a standard flat <strong>ZIP file</strong>. It&apos;s crucial that you only package client-facing files, omitting unnecessary repository configs or helper scripts.</p>
              
              <div className="pack-comparison">
                {/* Include Card */}
                <div className="pack-card">
                  <h4 className="pack-card-title include">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>
                    Include in ZIP (Root)
                  </h4>
                  <ul className="pack-list include-list">
                    <li className="file">manifest.json</li>
                    <li className="file">popup.html</li>
                    <li className="file">popup.css</li>
                    <li className="file">popup.js</li>
                    <li className="file">background.js</li>
                    <li className="file">github-api.js</li>
                    <li>icons/
                      <ul className="pack-list" style={{ marginTop: "4px", marginLeft: "12px", fontSize: "0.8rem" }}>
                        <li className="file">icon16.png</li>
                        <li className="file">icon48.png</li>
                        <li className="file">icon128.png</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                {/* Exclude Card */}
                <div className="pack-card">
                  <h4 className="pack-card-title exclude">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>
                    Omit from ZIP
                  </h4>
                  <ul className="pack-list exclude-list">
                    <li>.git / (git configuration directory)</li>
                    <li>.gitignore</li>
                    <li>website / (this website directory)</li>
                    <li>README.md</li>
                    <li className="file">remove-bg.ps1</li>
                    <li className="file">update-logo.ps1</li>
                    <li className="file">fix-icon.ps1</li>
                    <li>Other developer templates/plans</li>
                  </ul>
                </div>
              </div>

              <h4 className="step-title" style={{ fontSize: "1.1rem", marginTop: "20px" }}>How to Create the ZIP:</h4>
              <p className="step-desc" style={{ marginBottom: "8px" }}><strong>On Windows:</strong> Navigate inside the <code>pr-dashboard</code> folder, select only the files to include, right-click, select <strong>Send to</strong> → <strong>Compressed (zipped) folder</strong>, and name it <code>gitpilot-v1.0.zip</code>.</p>
              <p className="step-desc"><strong>On macOS/Linux:</strong> Open terminal inside the <code>pr-dashboard</code> folder and run the command:</p>
              
              <div className="codeblock-container">
                <div className="codeblock-header">
                  <span>Unix Command Line</span>
                  <button 
                    className={`copy-btn ${copiedId === "zip-command" ? "copied" : ""}`}
                    onClick={() => handleCopy("zip-command", "zip -r gitpilot-v1.0.zip manifest.json popup.html popup.css popup.js background.js github-api.js icons/")}
                  >
                    {copiedId === "zip-command" ? (
                      <>
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="codeblock-body">
                  <pre><code>zip -r gitpilot-v1.0.zip manifest.json popup.html popup.css popup.js background.js github-api.js icons/</code></pre>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Submission Guides (Sub-tabs) */}
          <div style={{ marginTop: "40px" }}>
            <h3 className="step-title">
              <svg viewBox="0 0 24 24" style={{ width: "24px", height: "24px", fill: "var(--accent-green)" }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>
              Step 2: Cross-Store Publishing Portals
            </h3>
            <p className="step-desc">Publish your ZIP package to individual browser developer consoles. Select your target store below to see the precise configuration requirements:</p>
            
            <div className="store-tabs">
              <button 
                className={`store-tab-btn ${activeStore === "chrome" ? "active" : ""}`}
                onClick={() => setActiveStore("chrome")}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>
                Chrome Web Store
              </button>
              <button 
                className={`store-tab-btn ${activeStore === "edge" ? "active" : ""}`}
                onClick={() => setActiveStore("edge")}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm5.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>
                Microsoft Edge Add-ons
              </button>
              <button 
                className={`store-tab-btn ${activeStore === "firefox" ? "active" : ""}`}
                onClick={() => setActiveStore("firefox")}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm5.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>
                Mozilla Firefox (AMO)
              </button>
            </div>

            {/* Chrome Web Store Panel */}
            <div className={`store-panel ${activeStore === "chrome" ? "active" : ""}`}>
              <h3>Chrome Web Store Publishing Guide</h3>
              
              <ul className="sub-steps">
                <li><strong>Developer Registration:</strong> Navigate to the <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>Chrome Developer Console</a>. Log in with a Google account and pay the one-time <strong>$5.00 USD</strong> developer registration fee (Google&apos;s anti-spam measure).</li>
                <li><strong>Create New Item:</strong> Click the <strong>Add new item</strong> button in the top right, then select and upload your prepared <code>gitpilot-v1.0.zip</code> file.</li>
                <li><strong>Configure Metadata:</strong> Fill in the extension identity:
                  <ul>
                    <li><strong>Summary:</strong> Max 150 characters. &quot;A modern Pull Request dashboard and review tracker.&quot;</li>
                    <li><strong>Description:</strong> Fill in a detailed description of features, settings, and scopes.</li>
                    <li><strong>Category:</strong> Select <code>Developer Tools</code> or <code>Productivity</code>.</li>
                  </ul>
                </li>
                <li><strong>Graphics & Screenshots:</strong> Upload your promotional material:
                  <ul>
                    <li>At least 1 store screenshot (**1280x800px** or **640x400px**).</li>
                    <li>A small tile icon (**440x280px**).</li>
                  </ul>
                </li>
                <li><strong>Privacy & Permissions Justification:</strong>
                  <p className="step-desc" style={{ marginTop: "10px", marginBottom: "5px" }}>Chrome requires you to explain why you are using each requested permission. Use these standard justifications:</p>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px", fontSize: "0.9rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                          <th style={{ padding: "8px" }}>Permission</th>
                          <th style={{ padding: "8px" }}>Your Justification for Chrome Web Store</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--accent-purple)" }}>storage</td>
                          <td style={{ padding: "8px", color: "var(--text-muted)" }}>Required to store the user&apos;s encrypted GitHub Personal Access Token, username, and extension alarm preferences locally on their machine.</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--accent-purple)" }}>alarms</td>
                          <td style={{ padding: "8px", color: "var(--text-muted)" }}>Powers the background periodic checking (polling) every 5 minutes and daily reminders scheduled by the user.</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--accent-purple)" }}>notifications</td>
                          <td style={{ padding: "8px", color: "var(--text-muted)" }}>Used to display real-time system notifications when PR review states change or when daily review alarms fire.</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--accent-purple)" }}>cookies</td>
                          <td style={{ padding: "8px", color: "var(--text-muted)" }}>Required to authenticate requests for the experimental keyless Claude Web Session AI code review engine.</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--accent-purple)" }}>host_permissions</td>
                          <td style={{ padding: "8px", color: "var(--text-muted)" }}>Enables secure, sandboxed client API requests directly to api.github.com, generativelanguage.googleapis.com, api.anthropic.com, and claude.ai.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
                <li><strong>Privacy Policy:</strong> Link to your hosted privacy policy. Ensure you explicitly state: <em>&quot;GitPilot collects zero user data. All configurations, personal keys, and cached repository info remain sandboxed inside the client&apos;s local storage sync.&quot;</em></li>
                <li><strong>Review Submission:</strong> Click the <strong>Submit for review</strong> button. Manifest V3 extensions typically take <strong>1 to 3 business days</strong> to get approved and published live!</li>
              </ul>
            </div>

            {/* Microsoft Edge Add-ons Panel */}
            <div className={`store-panel ${activeStore === "edge" ? "active" : ""}`}>
              <h3>Microsoft Edge Add-ons Publishing Guide</h3>
              <p className="step-desc" style={{ marginBottom: "15px" }}>Microsoft Edge shares the identical Chromium base and Manifest V3 specifications as Chrome. This means you can upload your <code>gitpilot-v1.0.zip</code> file with absolutely zero modifications!</p>
              
              <ul className="sub-steps">
                <li><strong>Developer Sign Up:</strong> Go to the <a href="https://partner.microsoft.com/dashboard/microsoftedge" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>Microsoft Partner Center</a>. Registration as an Edge extension developer is <strong>completely free of charge</strong>.</li>
                <li><strong>Create Submission:</strong> Click <strong>Create new extension</strong>, upload the exact same zip folder, and Edge Partner Center will automatically parse your <code>manifest.json</code> metadata.</li>
                <li><strong>Import Details:</strong> Edge Console permits you to import store text, icons, and descriptions directly from your existing live Chrome Web Store page, reducing manual copying!</li>
                <li><strong>Fill in Details:</strong> Fill in promotional material and screenshots. Detail privacy declarations matching Chrome&apos;s justifications.</li>
                <li><strong>Submit:</strong> Submit the extension. Microsoft&apos;s review process is largely automated and typically approves submissions within <strong>24 to 48 hours</strong>.</li>
              </ul>
            </div>

            {/* Mozilla Firefox Panel */}
            <div className={`store-panel ${activeStore === "firefox" ? "active" : ""}`}>
              <h3>Mozilla Firefox (AMO) Guide</h3>
              <p className="step-desc" style={{ marginBottom: "15px" }}>Firefox fully supports Manifest V3 extensions now, but with some architectural nuances you should keep in mind.</p>
              
              <ul className="sub-steps">
                <li><strong>Firefox Developer Portal:</strong> Create a developer account on <a href="https://addons.mozilla.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>Mozilla Add-ons (AMO) Developer Hub</a>.</li>
                <li><strong>Manifest V3 Compatibilities:</strong> 
                  <p className="step-desc" style={{ marginTop: "5px" }}>Firefox supports service worker background scripts as <code>background.service_worker</code>, but still recommends non-persistent background scripts or HTML background pages for older Firefox builds. For absolute compatibility, AMO lets you adapt the manifest automatically on submission, or you can verify it using their CLI packaging tool:</p>
                  
                  <div className="codeblock-container">
                    <div className="codeblock-header">
                      <span>Terminal</span>
                      <button 
                        className={`copy-btn ${copiedId === "firefox-lint" ? "copied" : ""}`}
                        onClick={() => handleCopy("firefox-lint", "npx web-ext lint")}
                      >
                        {copiedId === "firefox-lint" ? (
                          <>
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="codeblock-body">
                      <pre><code>npx web-ext lint</code></pre>
                    </div>
                  </div>
                </li>
                <li><strong>Self-Signing vs. AMO Store:</strong> Firefox lets you choose:
                  <ul>
                    <li><strong>On-Store distribution:</strong> Listed on addons.mozilla.org, visible to public search, reviewed by Mozilla.</li>
                    <li><strong>Self-signed distribution:</strong> Mozilla signs your ZIP and issues an `.xpi` file. You can host this file yourself. It won&apos;t appear on the Firefox store, which is ideal for internal team tools or private beta testers!</li>
                  </ul>
                </li>
                <li><strong>Submit:</strong> Upload your ZIP. Mozilla reviews can take from <strong>a few hours to a couple of days</strong>.</li>
              </ul>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>&copy; 2026 GitPilot. Created for secure, high-performance GitHub Pull Request management and automated AI code reviews.</p>
          <p>Need help? View the full codebase and issues on the official <a href="https://github.com/AneeqMalik/GitPilot" target="_blank" rel="noopener noreferrer">GitPilot GitHub Repository</a>.</p>
        </div>
      </footer>
    </>
  );
}
