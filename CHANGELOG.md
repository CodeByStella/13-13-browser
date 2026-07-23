# Changelog

All notable changes to Google Chrome are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-07-24

### Changed

- **Chromium engine** — upgrade Electron to 43.2.0 (Chromium 150) for current site version gates
- **Browser identity** — sanitize the real Chromium user agent (strip Electron / app tokens); keep native Client Hints; remove CDP identity injection

### Fixed

- **Site login** — allow real OAuth / account-login popups with a shared session (Slack and similar); soften Google-auth request headers (no DNT on Google auth hosts)
- **Auto-update** — public GitHub Releases feed with installer names matching `latest.yml` (from 2.0.4 / 2.0.5)

### Also includes (from 2.0.4)

- Chrome-style new tab page, omnibox host display, improved tab drag-and-drop
- About donate link, privacy shield user icon

## [2.0.5] - 2026-07-23

### Fixed

- **Auto-update downloads** — installer artifact names now match `latest.yml` (`Google-Chrome-Setup-*.exe`) so electron-updater can download releases

## [2.0.4] - 2026-07-23

### Fixed

- **Auto-update** — use the public GitHub Releases provider (repo is public); clearer About update errors; more reliable check / download / restart flow
- **Address bar** — show host-only URLs when idle, expand to full URL while editing; keep pending navigation URL so the omnibox does not snap back; treat `host/path` as a URL not a search
- **Tab reorder** — Chrome-like drag with floating tab, sibling slide, and less flicker

### Changed

- **New tab page** — flat Chrome-style layout with wallpaper, pill search, circular shortcuts, and in-bar Search / AI icons
- **About** — Donate link via NOWPayments
- **Privacy shield** — user icon inside the score ring

## [2.0.3] - 2026-06-25

### Fixed

- **Site compatibility (Chrome 137+ gates)** — report Chrome major version 137 in the user agent and Client Hints while Electron 36 still ships Chromium 136; sync `navigator.userAgent` in-page so version checks match request headers. v1.0.0 and v2.0.0 used the same engine; the regression on 2.0.0 was mainly the default Electron UA appending `Google Chrome/2.0.0`, which some sites misread as browser version `2` instead of the real `Chrome/136` token

## [2.0.2] - 2026-06-25

### Fixed

- **Site compatibility (follow-up)** — align `Sec-CH-UA` request headers with the Chrome user agent, disable client-hint fingerprint mismatches, and inject standard `window.chrome` / `navigator.webdriver` shims before page scripts run

## [2.0.1] - 2026-06-25

### Fixed

- **Site compatibility** — use a Chrome-like user agent on all tab sessions so sites no longer reject the browser as unsupported (Electron token removed from `User-Agent`)
- **Auto-update on private GitHub repo** — CI builds now embed release credentials (`GH_TOKEN`) so in-app update checks can reach private releases; clearer error message when update check fails

## [2.0.0] - 2026-06-25

### Added

#### Browsing
- **Pin tabs** — pin/unpin via tab context menu; pinned tabs stay fixed at the left with icon-only width
- **Tab search picker** — filter and switch open tabs from a dropdown anchored to the tab bar
- **Tab context menu** — right-click a tab for pin/unpin and close actions
- **Session restore** — pinned tab order and pin state are saved and restored on restart
- **Direct snake game URL** — open the built-in Pixel Snake game from the address bar with `chrome://snake`

#### New tab page
- **Persistent quick links** — customizable shortcuts saved to disk (`newtab-shortcuts.json`) and synced with page storage
- Shortcuts are backed up before **Clear browsing data** so quick links are not lost

#### Updates
- **Auto-update** via `electron-updater` with GitHub release publishing
- **About dialog** update controls — check for updates, download progress, and install when ready
- Silent background update check on startup (packaged builds only)

#### UI
- Chrome-like **flat dark theme** for popup pages (`chrome-theme.css`) shared across about, tab picker, privacy panel, bookmark menu, and other overlays
- Tab bar **search button** and Chrome-style **active-tab curves**
- Pinned tab visual treatment (compact, favicon-first layout)
- Updated app icon and improved Windows icon handling (256 px resize, separate dev `AppUserModelId`)

#### Documentation
- [Development and release workflow guide](./docs/WORKFLOW.md) — daily editing, branches, tagging, CI releases, and tag recovery

### Changed
- Tab strip layout calculates width separately for pinned and unpinned tabs
- Session store format now records a `pinned` flag per tab (migrates legacy URL-only sessions)
- Main window background color aligned with the flat Chrome theme (`#2b2b2b`)
- Error page styling updated to match the shared flat theme; game-only layout when opened via `chrome://snake`
- Tray and DevTools windows use native image icons for sharper rendering on Windows

## [1.0.0] - 2026-06-11

### Added

#### Browsing
- Multi-tab browsing with scrollable tab bar and 3D-styled tabs
- Private tabs with isolated ephemeral sessions (`Ctrl+Shift+N`)
- Session restore for normal tabs on restart
- Reopen closed tab (`Ctrl+Shift+T`, up to 25 URLs)
- Branded new tab page with DuckDuckGo search and quick links
- Custom error page for failed navigations
- Home button opens local new tab page
- Middle-click to close tabs
- Per-tab zoom (50%–300%)
- Find in page with match counter
- Bookmarks with bookmark bar (`Ctrl+D`)
- Developer tools per tab (`F12`)

#### Privacy
- Tracker blocking for known analytics/ad domains
- Do Not Track (`DNT: 1`) header support
- Sensitive permission blocking (camera, mic, location, notifications)
- Privacy dashboard with live score and statistics
- Clear browsing data and optional clear-on-exit
- HTTPS lock indicator in address bar

#### Security & platform
- Frameless custom chrome with drag regions and window controls
- Screen-capture protection via `setContentProtection`
- Sandboxed renderer and `BrowserView` instances
- Context-isolated IPC bridge through preload script
- Separate session partitions for normal vs. private tabs

#### UI
- Google Chrome brand mark in tab bar
- Privacy score pill in tab bar
- Animated loading bar and taskbar progress indicator
- Custom app icon support (`build/icon.ico`)

### Security
- No built-in telemetry or usage analytics
- Internal pages excluded from address bar display, bookmarks, and session restore

---

[Unreleased]: CHANGELOG.md#unreleased
[2.0.0]: CHANGELOG.md#200---2026-06-25
[1.0.0]: CHANGELOG.md#100---2026-06-11
