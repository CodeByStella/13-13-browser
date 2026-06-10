# 13.13 Browser

A lightweight desktop web browser built with Electron, TypeScript, React, and Vite. Designed for everyday browsing with built-in protection against screen capture and screenshot tools.

## Overview

13.13 Browser provides a focused browsing experience with a modern interface and OS-level content protection. Web pages render in an isolated `BrowserView`, while the application chrome is built with React for a responsive, maintainable UI.

## Features

- **Web browsing** — Address bar with direct URL entry and DuckDuckGo search integration
- **Navigation controls** — Back, forward, reload, and stop
- **Screen-capture protection** — Enabled by default; toggle from the toolbar
- **Cross-platform foundation** — Electron-based architecture ready for Windows, macOS, and Linux

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
- npm 10 or later
- Windows 10 (build 19041+) recommended for full capture exclusion

## Installation

```bash
npm install
```

If Electron fails to launch with a binary error, run the install script manually:

```bash
node node_modules/electron/install.js
```

## Development

Start the application in development mode with hot reload:

```bash
npm run dev
```

Vite serves the renderer on `http://localhost:5173/` and launches Electron automatically.

## Production

Build the application:

```bash
npm run build
npm start
```

Create a Windows installer:

```bash
npm run dist
```

Output is written to the `release/` directory.

## Project Structure

```
electron/
  main.ts       Main process — window management, BrowserView, IPC
  preload.ts    Secure bridge between main and renderer
src/
  App.tsx       Application state and event handlers
  components/   Browser chrome UI
dist/           Compiled renderer (production)
dist-electron/  Compiled main and preload (production)
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
