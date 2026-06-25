# Changelog

All notable changes to 13.13 Browser are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-06-25

### Added

#### Browsing
- **Pin tabs** — pin/unpin via tab context menu; pinned tabs stay fixed at the left with icon-only width
- **Tab search picker** — filter and switch open tabs from a dropdown anchored to the tab bar
- **Tab context menu** — right-click a tab for pin/unpin and close actions
- **Session restore** — pinned tab order and pin state are saved and restored on restart
- **Direct snake game URL** — open the built-in Pixel Snake game from the address bar with `1313://snake`

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
- Error page styling updated to match the shared flat theme; game-only layout when opened via `1313://snake`
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
- 13.13 brand mark in tab bar
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
