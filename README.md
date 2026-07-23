# Google Chrome

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)](./LICENSE)
[![Electron](https://img.shields.io/badge/Electron-36-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)](./README.md)
[![Donate](https://img.shields.io/badge/Donate-Crypto-F7931A?logo=bitcoin&logoColor=white)](https://nowpayments.io/donation/stellaray777)

A privacy-focused desktop web browser built with Electron, TypeScript, React, and Vite. Designed for users who want everyday browsing with strong defaults for tracking protection, permission control, and screen-capture exclusion.

## Documentation

| Document | Description |
|----------|-------------|
| [Features](#overview) | Full feature reference (this file) |
| [Privacy Policy](./docs/PRIVACY_POLICY.md) | Data handling and user privacy |
| [Contributing](./CONTRIBUTING.md) | Development setup and PR guidelines |
| [Architecture](./docs/ARCHITECTURE.md) | Technical design overview |
| [Development workflow](./docs/WORKFLOW.md) | Editing, branches, and releases |
| [Security](./SECURITY.md) | Vulnerability reporting |
| [Changelog](./CHANGELOG.md) | Release history |
| [Code of Conduct](./CODE_OF_CONDUCT.md) | Community guidelines |
| [License](./LICENSE) | Copyright and usage terms |

## Table of contents

- [Overview](#overview)
- [User Interface](#user-interface)
- [Tab Browsing](#tab-browsing)
- [Navigation & Address Bar](#navigation--address-bar)
- [Privacy Features](#privacy-features)
- [Screen-Capture Protection](#screen-capture-protection)
- [Find in Page](#find-in-page)
- [Zoom](#zoom)
- [Bookmarks](#bookmarks)
- [Security Architecture](#security-architecture)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Privacy Roadmap](#privacy-roadmap)
- [Requirements](#requirements)
- [Installation](#installation)
- [Development](#development)
- [Production](#production)
- [Automated releases](#automated-releases)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)

## Overview

Google Chrome combines a modern **3D-depth UI** with OS-level privacy features. Web pages render in isolated `BrowserView` instances behind a custom React chrome layer. The browser shell handles tabs, navigation, bookmarks, find-in-page, zoom, and a live privacy dashboard — while each tab loads web content in its own sandboxed view.

The UI uses a dark theme with raised/inset surfaces, a **Google Chrome** brand mark in the tab bar, custom window controls (minimize / maximize / close), and purple-accented private browsing indicators.

---

## User Interface

### Frameless chrome

- Native OS title bar is hidden (`frame: false`).
- The window is draggable from the tab bar logo area, empty tab-strip space, and other `-webkit-app-region: drag` zones.
- Custom **Windows-style window controls** sit on the right of the tab bar.
- App icon is loaded from `build/icon.ico` (taskbar and packaged builds).

### Tab bar

- **Google Chrome** logo on the far left.
- Scrollable tab strip with 3D-styled tabs (subtle depth on inactive tabs, stronger depth on the active tab).
- Each tab shows a favicon, title, and close button (visible on hover or when active).
- **Middle-click** a tab to close it.
- **New tab** (`+`) and **new private tab** (lock) buttons sit directly after the last tab and scroll with the tab row.
- **Privacy score pill** in the tab bar opens the privacy dashboard.
- Animated **loading bar** at the top of the chrome when any tab is loading.
- Windows taskbar progress indicator while a page loads.

### Toolbar

- Back, forward, home, reload/stop navigation buttons.
- **Address bar** with globe/lock icon (HTTPS shows a green lock).
- **Bookmark** toggle (gold star when saved).
- **Zoom** controls with live percentage (`Ctrl+` / `Ctrl-` / `Ctrl+0` to reset).
- **Find in page** button.
- **Privacy dashboard** shortcut.
- **Screen-capture protection** toggle (shield button).

### Bookmark bar

- Persistent bar below the toolbar.
- Click a bookmark to navigate; click **×** to remove.
- Empty state hint: `Ctrl+D` to save the current page.
- Internal pages (`newtab.html`, `error.html`, `file://` URLs) cannot be bookmarked.

### Privacy panel

- Modal overlay opened from the tab bar score pill or toolbar privacy button.
- Shows live **privacy score** (0–100), trackers blocked, and permissions denied.
- Toggle individual protections and screen-capture exclusion.
- **Clear browsing data** button wipes cache and storage.
- Opening the panel temporarily hides web content (`BrowserView`) so sensitive pages are not visible behind the overlay.

---

## Tab Browsing

### Regular tabs

| Behavior | Detail |
|----------|--------|
| Session | Shared persistent partition (`persist:browser`) |
| Cookies & storage | Saved between browser restarts |
| Session restore | Normal tab URLs are restored on launch (private tabs excluded) |
| Default icon | Shield icon when no site favicon is available |
| Shortcut | `Ctrl+T` |

When the last tab is closed, a new tab opens automatically. Up to **25 recently closed tab URLs** can be reopened with `Ctrl+Shift+T`.

### Private tabs

| Behavior | Detail |
|----------|--------|
| Session | Isolated in-memory partition per tab (`private:{tab-id}`) |
| Cookies & storage | Not persisted — data is discarded when the tab or window closes |
| Session restore | Never saved or restored |
| Visual style | Purple accent, lock icon, title prefixed with `Private ·` |
| Address bar | Purple focus ring; placeholder reads *Private search or URL* |
| Shortcut | `Ctrl+Shift+N` |

Each private tab is fully isolated from other private tabs and from normal tabs.

### Tab interactions

- Click a tab to switch.
- Close via the **×** button or `Ctrl+W`.
- `Ctrl+Tab` / `Ctrl+Shift+Tab` cycles forward/backward through tabs.
- Links that target `_blank` open in a **new regular tab** automatically.

---

## Navigation & Address Bar

### URL handling

The address bar accepts:

- Full URLs (`https://example.com`)
- Domain-like input (`example.com` → `https://example.com`)
- Search terms (everything else → DuckDuckGo search)
- Empty input → local **new tab page**

Internal pages (`newtab.html`, `error.html`) display an **empty address bar** instead of a `file://` path.

### Home button

Opens the local **new tab page** (`newtab.html`), not an external site.

### New tab page

Branded **Google Chrome** page with:

- DuckDuckGo search box (also accepts URLs)
- Quick links: DuckDuckGo, GitHub, Proton, MDN
- Keyboard shortcut hints

### Error page

Failed navigations (except user-cancelled loads) show a custom `error.html` page with the error code and attempted URL. Dev-server connection retries are handled automatically during development.

---

## Privacy Features

All privacy rules are applied per Electron session via `webRequest` and permission handlers. Every tab session (normal and private) receives the same protection rules when created.

### Tracker blocking

Blocks network requests to a built-in list of known analytics and ad-tracking domains (Google Analytics, Facebook Pixel, DoubleClick, Hotjar, Segment, Taboola, etc.). Subresource requests are blocked; main-frame navigations are not.

Toggle: **Privacy panel → Block trackers**

### Do Not Track

Sends `DNT: 1` on every outgoing request header.

Toggle: **Privacy panel → Do Not Track**

### Permission blocking

Denies sensitive permission requests by default:

- Camera / microphone (`media`)
- Geolocation
- Notifications
- MIDI sysex, pointer lock, fullscreen, open external

Toggle: **Privacy panel → Block sensitive permissions**

### Clear browsing data

One-click wipe of cache and web storage from the privacy panel. Resets blocked-tracker and denied-permission counters.

### Clear on exit

Optional setting to automatically clear cache and storage when the browser closes.

Toggle: **Privacy panel → Clear data on exit**

### Privacy score

Live score shown in the tab bar (0–100), calculated from active protections:

| Protection | Points |
|------------|--------|
| Tracker blocking | 25 |
| Do Not Track | 20 |
| Permission blocking | 25 |
| Screen-capture protection | 30 |

Label reads **Protected** at score ≥ 80, otherwise **Active**.

### HTTPS indicator

Address bar shows a **lock icon** (green) for `https://` pages and a **globe icon** for non-secure pages.

---

## Screen-Capture Protection

Uses Electron's `setContentProtection` API, which maps to Windows `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`.

| Platform | Behavior |
|----------|----------|
| Windows 10 (2004+) / Windows 11 | Window excluded from capture pipelines |
| Older Windows | Captured region appears black |
| macOS | Window sharing restricted via `NSWindowSharingNone` |

Enabled by default on launch. Toggle via the shield button in the toolbar or the privacy panel. On Windows, requires build **19041+** for full exclusion support.

---

## Find in Page

- Open with `Ctrl+F` or the toolbar search button.
- Live search with debounced matching.
- Shows **match count** and current match index.
- **Next / previous** match buttons.
- `Escape` closes the find bar and clears the highlight.

---

## Zoom

- Per-tab zoom from **50% to 300%** (10% steps).
- Toolbar shows live percentage; click it to reset to 100%.
- Shortcuts: `Ctrl+` zoom in, `Ctrl-` zoom out, `Ctrl+0` reset.

---

## Bookmarks

- Save/remove with `Ctrl+D` or the star button in the toolbar.
- Stored in the user data directory (`bookmarks.json`).
- Bookmark bar provides one-click navigation.
- Duplicate URLs are not added twice.

---

## Security Architecture

| Layer | Detail |
|-------|--------|
| Main UI | React renderer with `contextIsolation`, no Node integration, sandbox enabled |
| Web content | Each tab is a separate `BrowserView` with sandbox + context isolation |
| IPC | Typed bridge via `preload.ts` — renderer cannot access Node or Electron directly |
| Partitions | Normal tabs share one persistent session; each private tab gets its own ephemeral session |
| Internal pages | New tab and error pages are local HTML; excluded from session restore and bookmarks |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+Shift+N` | New private tab |
| `Ctrl+W` | Close active tab |
| `Ctrl+Shift+T` | Reopen recently closed tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+L` | Focus address bar |
| `Ctrl+F` | Find in page |
| `Ctrl+D` | Toggle bookmark |
| `Ctrl+R` / `F5` | Reload |
| `Alt+←` | Back |
| `Alt+→` | Forward |
| `Ctrl+` / `Ctrl-` | Zoom in / out |
| `Ctrl+0` | Reset zoom |
| `F12` | Developer tools (active tab) |
| `Escape` | Close find bar or privacy panel |

---

## Privacy Roadmap

Ideas planned or under consideration for future releases:

- **DNS-over-HTTPS** — Encrypted DNS resolution to prevent ISP snooping
- **Fingerprint resistance** — Canvas/WebGL noise injection and reduced API surface
- **Cookie auto-delete** — Third-party cookie blocking with per-site exceptions
- **HTTPS-Only mode** — Upgrade or block insecure HTTP connections
- **Referrer stripping** — Send minimal referrer headers to third parties
- **WebRTC leak protection** — Prevent local IP exposure through STUN
- **Built-in VPN/proxy** — Route traffic through a trusted proxy layer
- **Password manager integration** — Encrypted local credential vault
- **Per-site privacy rules** — Custom tracker/permission rules per domain
- **Tor tab mode** — Optional routing through Tor network
- **Extension sandbox** — Curated privacy extensions with limited permissions
- **Audit log** — Local log of blocked trackers and denied permissions
- **Panic button** — Instantly close all tabs and wipe session data

> **Limitations:** Privacy protections are browser-level defenses, not absolute anonymity. A determined adversary, malware, or physical access can still compromise data. Private tabs isolate sessions but do not route through Tor or VPN by default.

---

## Requirements

- Node.js 20+
- pnpm 10+
- Windows 10 (build 19041+) recommended

## Installation

```bash
pnpm install
```

If Electron fails to launch:

```bash
node node_modules/electron/install.js
```

## Development

```bash
pnpm dev
```

## Production

```bash
pnpm build
pnpm start
```

Create a Windows installer locally:

```bash
pnpm dist
```

Output lands in `release/` (for example `Google Chrome Setup 1.0.0.exe`). The `release/` folder is gitignored.

Place app icons at `build/icon.png` and `build/icon.ico` (used for the window, taskbar, and installer).

## Automated releases

GitHub Actions builds the Windows installer and publishes a [GitHub Release](https://github.com/CodeByStella/13-13-browser/releases) when you push a version tag.

**Full guide:** [docs/WORKFLOW.md](./docs/WORKFLOW.md) — daily development, branches, tagging, and fixing releases.

Workflow file: [`.github/workflows/release.yml`](./.github/workflows/release.yml)

### Publish a release

1. Bump the version in `package.json` (and update [CHANGELOG.md](./CHANGELOG.md) if needed).
2. Commit and push to `main`:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release v1.0.1"
   git push origin main
   ```
3. Create and push a tag matching the version:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

The workflow runs on `windows-latest`, executes `pnpm install` and `pnpm run dist:ci` (build only — no electron-builder publish), then attaches these files to the release:

- `Google Chrome Setup x.y.z.exe` — NSIS installer
- `*.blockmap` — delta/download metadata for electron-updater
- `latest.yml` — required by in-app auto-update (electron-updater)

### Auto-update

Installed builds check [GitHub Releases](https://github.com/CodeByStella/13-13-browser/releases) via `electron-updater`.

**Requirements for updates to work:**

1. The GitHub repository must be **public** (private repos need a machine token that cannot ship in a consumer app).
2. `package.json` → `build.publish.private` must be `false` (so packaged `app-update.yml` uses the public provider).
3. Each version tag release must include `latest.yml`, the `.exe`, and the `.blockmap` (the Release workflow already uploads these).
4. After switching from private → public, users need a **new installer** built with `private: false`. Older installs still carry a private feed config and will keep failing until reinstalled once.

In **About**, use **Check for updates** → **Download** → **Restart to update**.

Release notes are generated automatically from commits since the previous tag.

### Manual build (no release)

To build in CI without creating a GitHub Release, open **Actions → Release → Run workflow** in the repository. The installer is uploaded as a workflow artifact named `windows-installer`.

### Notes

- Tags must use the `v` prefix (e.g. `v1.0.1`, not `1.0.1`).
- Installers are **unsigned** by default; Windows SmartScreen may warn on first run until code signing is configured in CI.
- macOS and Linux builds are not part of the current workflow.

## Project Structure

```
electron/
  main.ts            Window, IPC, privacy init, app icon
  tab-manager.ts     Multi-tab BrowserView management
  privacy.ts         Tracker blocking, DNT, permissions
  privacy-store.ts   Privacy settings persistence
  session-store.ts   Session restore (normal tabs only)
  bookmarks-store.ts Bookmark persistence
  preload.ts         Secure IPC bridge
  shared.ts          URL normalization, tab types, chrome height
src/
  App.tsx            Main app state, keyboard shortcuts
  components/        Tab bar, toolbar, bookmark bar, privacy panel, find bar
  styles/index.css   3D depth design system
public/
  newtab.html        Branded new tab page with DuckDuckGo search
  error.html         Network error page
build/
  icon.png           Source app icon
  icon.ico           Windows icon (taskbar / installer)
```

## Technology Stack

| Component | Version |
|-----------|---------|
| Electron | 36 |
| React | 19 |
| TypeScript | 5 |
| Vite | 6 |

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CodeByStella/13-13-browser&type=Date)](https://star-history.com/#CodeByStella/13-13-browser&Date)

## License

Copyright © 2026 Google Chrome. All rights reserved.

See [LICENSE](./LICENSE) for terms.  
See [docs/PRIVACY_POLICY.md](./docs/PRIVACY_POLICY.md) for data handling practices.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before opening a pull request.

Report security issues privately — see [SECURITY.md](./SECURITY.md).
