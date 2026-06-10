# 13.13 Browser

A lightweight desktop web browser built with Electron, TypeScript, React, and Vite. Designed for everyday browsing with built-in protection against screen capture and screenshot tools.

## Overview

13.13 Browser provides a focused browsing experience with a modern interface and OS-level content protection. Web pages render in an isolated `BrowserView`, while the application chrome is built with React for a responsive, maintainable UI.

## Features

- **Multi-tab browsing** — Create, switch, and close tabs with favicon support
- **New tab page** — Branded start page with search and quick links
- **Address bar** — Direct URL entry, DuckDuckGo search, and HTTPS security indicator
- **Navigation controls** — Back, forward, home, reload, and stop
- **Keyboard shortcuts** — `Ctrl+T` new tab, `Ctrl+W` close, `Ctrl+L` address bar, `Ctrl+Tab` cycle tabs
- **Screen-capture protection** — Enabled by default; toggle from the toolbar
- **Cross-platform foundation** — Electron-based architecture ready for Windows, macOS, and Linux

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close active tab |
| `Ctrl+L` | Focus address bar |
| `Ctrl+R` | Reload page |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |

## Screen-Capture Protection

13.13 Browser uses Electron's `setContentProtection` API, which maps to the Windows `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)` flag. When enabled:

| Platform | Behavior |
|----------|----------|
| Windows 10 (2004+) / Windows 11 | Window is excluded from capture pipelines entirely |
| Older Windows | Captured region appears as a black rectangle |
| macOS | Window sharing is restricted via `NSWindowSharingNone` |

The window renders normally on your display. Third-party tools such as OBS, Snipping Tool, and Zoom screen share cannot capture its contents while protection is active.

> **Limitations:** This is an operating-system deterrent, not cryptographic protection. Content may still be captured via a physical camera, kernel-level tooling, or explicit user actions such as copy and paste.

## Requirements

- Node.js 20 or later
- pnpm 10 or later
- Windows 10 (build 19041+) recommended for full capture exclusion

## Installation

```bash
pnpm install
```

If Electron fails to launch with a binary error, run the install script manually:

```bash
node node_modules/electron/install.js
```

## Development

Start the application in development mode with hot reload:

```bash
pnpm dev
```

Vite serves the renderer on `http://localhost:5173/` and launches Electron automatically.

## Production

Build the application:

```bash
pnpm build
pnpm start
```

Create a Windows installer:

```bash
pnpm dist
```

Output is written to the `release/` directory.

## Project Structure

```
electron/
  main.ts         Main process — window, IPC, content protection
  tab-manager.ts  Multi-tab BrowserView management
  preload.ts      Secure bridge between main and renderer
  shared.ts       Shared utilities and constants
src/
  App.tsx         Application state, keyboard shortcuts
  components/     Tab bar, toolbar, icons
  types/          TypeScript interfaces
public/
  newtab.html     Built-in new tab page
dist/             Compiled renderer (production)
dist-electron/    Compiled main and preload (production)
```

## Technology Stack

| Component | Version |
|-----------|---------|
| Electron | 36 |
| React | 19 |
| TypeScript | 5 |
| Vite | 6 |

## License

Private — all rights reserved.
