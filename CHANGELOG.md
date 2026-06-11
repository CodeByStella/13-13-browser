# Changelog

All notable changes to 13.13 Browser are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation set: privacy policy, contributing guide, code of conduct, security policy, architecture overview

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
[1.0.0]: CHANGELOG.md#100---2026-06-11
