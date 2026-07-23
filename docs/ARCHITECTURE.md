# Architecture

This document describes the high-level architecture of Google Chrome for
contributors and security reviewers.

## Overview

Google Chrome is an Electron desktop application with two distinct rendering
layers:

1. **Browser chrome** — React UI in the main window (`BrowserWindow`) for tabs,
   toolbar, bookmarks, and privacy controls
2. **Web content** — Each tab loads pages in an isolated `BrowserView` stacked
   below the chrome

```
┌─────────────────────────────────────────────────────────┐
│  BrowserWindow (React chrome — src/)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Tab bar · Toolbar · Bookmark bar · Find bar       │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ BrowserView (active tab web content)              │  │
│  │ y-offset = CHROME_HEIGHT (dynamic)                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Process model

| Component | Process | Technology |
|-----------|---------|------------|
| Main process | Electron main | `electron/main.ts`, `tab-manager.ts`, `privacy.ts` |
| Chrome UI | Renderer (sandboxed) | React 19 + Vite |
| Tab content | Separate `BrowserView` per tab | Chromium (Electron) |

IPC between the chrome renderer and main process flows through `preload.ts`
using `contextBridge` — the renderer never receives raw Node or Electron APIs.

## Tab management

`TabManager` (`electron/tab-manager.ts`) owns all tabs:

- Creates and destroys `BrowserView` instances
- Tracks tab order, active tab, favicons, loading state
- Layouts the active view below the chrome using `CHROME_HEIGHT`
- Broadcasts state to the UI via `browser-state` IPC events

### Session partitions

| Tab type | Partition | Persistence |
|----------|-----------|-------------|
| Normal | `persist:browser` | Cookies/cache persist; URLs saved in session restore |
| Private | `private:{uuid}` | In-memory only; discarded on tab/window close |

## Privacy engine

`electron/privacy.ts` configures each Electron `Session`:

- **`onBeforeRequest`** — Cancels requests to known tracker domains (non-main-frame)
- **`onBeforeSendHeaders`** — Adds `DNT: 1` when enabled
- **`setPermissionRequestHandler`** — Denies sensitive permissions when enabled

Settings persist in `privacy-settings.json` under user data.

## Data persistence

All application data is stored locally:

| File | Location | Contents |
|------|----------|----------|
| `bookmarks.json` | User data dir | Saved bookmarks |
| `session.json` | User data dir | Normal tab URLs + active index |
| `privacy-settings.json` | User data dir | Privacy toggles |
| Chromium profile | `persist:browser` partition | Site cookies, cache, storage |

Private tab partitions are not written to `session.json`.

## Chrome height synchronization

The React chrome measures its height with `ResizeObserver` and sends it to the
main process via `set-chrome-height`. `TabManager` repositions the active
`BrowserView` whenever the chrome resizes (bookmarks, find bar, etc.).

## Static pages

| Page | Path | Purpose |
|------|------|---------|
| New tab | `public/newtab.html` | Branded start page with search |
| Error | `public/error.html` | Failed load feedback |

These load via `file://` URLs. Internal pages are hidden from the address bar
and excluded from bookmarks and session restore.

## URL normalization

`normalizeUrl()` in `electron/shared.ts`:

- Empty → new tab page
- `http(s)://` → used as-is
- Domain-like input → `https://` prefix
- Otherwise → DuckDuckGo search query

## Screen-capture protection

`setContentProtection()` on the main window maps to OS APIs that exclude the
window from capture pipelines where supported (see README).

## Build pipeline

```
src/ + electron/  →  Vite  →  dist/ + dist-electron/
                              →  electron-builder  →  release/ (Windows NSIS)
```

Development uses `vite-plugin-electron` with a dev server on port 5173.

## Security boundaries

```
┌──────────────┐     IPC (preload)     ┌──────────────┐
│ React chrome │ ◄──────────────────► │ Main process │
│  sandboxed   │                       │  Node.js     │
└──────────────┘                       └──────┬───────┘
                                            │
                                     BrowserView × N
                                     sandboxed, no Node
```

Contributors must preserve these boundaries. See [SECURITY.md](../SECURITY.md)
and [CONTRIBUTING.md](../CONTRIBUTING.md).

## Related documentation

- [README.md](../README.md) — Feature overview
- [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) — Data handling
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Development guide
