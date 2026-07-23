# Development & release workflow

This guide describes how to edit the codebase day to day, manage branches, and ship releases for **Google Chrome**.

For coding standards and pull request etiquette, see [CONTRIBUTING.md](../CONTRIBUTING.md). For architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Table of contents

- [Daily development](#daily-development)
- [What to edit](#what-to-edit)
- [Hot reload behavior](#hot-reload-behavior)
- [Branch workflow](#branch-workflow)
- [Committing changes](#committing-changes)
- [Local production builds](#local-production-builds)
- [Automated releases](#automated-releases)
- [Fixing a failed or wrong release](#fixing-a-failed-or-wrong-release)
- [Release artifacts explained](#release-artifacts-explained)
- [Quick reference](#quick-reference)

---

## Daily development

### Start the dev server

```bash
pnpm install
pnpm dev
```

This launches:

- **Vite** — React chrome UI at `http://127.0.0.1:5173`
- **Electron** — main process and `BrowserView` tabs

### Stop

Press `Ctrl+C` in the terminal running `pnpm dev`.

### Verify a production build locally

```bash
pnpm build
pnpm start
```

Run this before opening a pull request or tagging a release.

---

## What to edit

| You want to change… | Edit here |
|---------------------|-----------|
| Tab bar, toolbar, bookmark bar, React chrome | `src/components/chrome/`, `src/styles/index.css` |
| App state, keyboard shortcuts (renderer) | `src/app/App.tsx`, `src/features/browser/` |
| Main process logic (tabs, privacy, tray) | `electron/services/` |
| IPC handlers | `electron/ipc/` |
| Preload / renderer API | `electron/preload/` |
| Shared types & channel names | `shared/types/`, `shared/ipc/channels.ts` |
| New tab page, error page, popup HTML | `public/*.html` |
| App icons | `build/icon.ico`, `build/icon.png` |

When adding a feature that crosses main ↔ renderer, follow the checklist in [STRUCTURE.md](./STRUCTURE.md).

---

## Hot reload behavior

During `pnpm dev`:

| Change location | What happens |
|-----------------|--------------|
| `src/` (React, CSS) | Hot reload in the chrome UI |
| `electron/` (main process) | Electron restarts automatically |
| `public/*.html` | Chrome and normal tabs reload |

Popup windows (privacy panel, chrome menu, etc.) may need to be closed and reopened after HTML edits.

---

## Branch workflow

### Default branch

`main` is the integration branch. It should always build and represent the latest shippable state.

### Recommended flow

```text
main
 └── feature/my-change     ← short-lived branch for one feature or fix
 └── fix/address-bar-bug
```

1. **Update `main`**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/short-description
   ```

3. **Edit, commit, push**
   ```bash
   git add .
   git commit -m "feat: add tray hotkey settings panel"
   git push -u origin feature/short-description
   ```

4. **Open a pull request** on GitHub into `main`.

5. **After merge**, delete the feature branch (optional):
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/short-description
   git push origin --delete feature/short-description
   ```

### Direct commits to `main`

Small solo maintenance (docs, one-line fixes) may go directly to `main`. Prefer branches for anything non-trivial so history stays reviewable.

### Branch naming

| Prefix | Use for |
|--------|---------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Tooling, deps, release prep |
| `docs/` | Documentation only |

---

## Committing changes

Use clear, imperative messages:

```text
feat: add system tray hide and global hotkey

fix: keep address bar URL visible while loading

chore: release v1.0.1

docs: add development workflow guide
```

Optional body: explain **why**, not every file touched.

Before committing:

```bash
pnpm build
```

Ensure the app starts with `pnpm start` if you changed runtime behavior.

---

## Local production builds

Build the app without packaging:

```bash
pnpm build
pnpm start
```

Build the **Windows installer** locally:

```bash
pnpm dist
```

Output is written to `release/` (gitignored), for example:

```text
release/Google Chrome Setup 1.0.0.exe
```

CI uses `pnpm run dist:ci`, which is the same build but skips electron-builder’s GitHub publish step (`--publish never`).

---

## Automated releases

Releases are built by GitHub Actions when you push a **version tag**.

Workflow: [`.github/workflows/release.yml`](../.github/workflows/release.yml)

### Step-by-step: ship `v1.0.1`

1. **Bump version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Update [CHANGELOG.md](../CHANGELOG.md)** — move items from `[Unreleased]` into a new `## [1.0.1]` section.

3. **Commit and push to `main`**
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release v1.0.1"
   git push origin main
   ```

4. **Create the tag on the current commit** (must include the version bump):
   ```bash
   git tag -a v1.0.1 -m "Release v1.0.1"
   git push origin v1.0.1
   ```

5. **Watch the workflow** — GitHub → **Actions** → **Release**.

6. **Download the installer** from [GitHub Releases](https://github.com/CodeByStella/13-13-browser/releases) when the job succeeds.

### Tag rules

- Tags **must** start with `v` → `v1.0.1`, not `1.0.1`.
- The tag must point to a commit that contains the matching `package.json` version.
- The tag commit must include `.github/workflows/release.yml` (the workflow runs from the tagged commit).

### Manual CI build (no GitHub Release)

GitHub → **Actions** → **Release** → **Run workflow**.

The installer is uploaded as a workflow artifact named `windows-installer`. Useful for testing CI without creating a release.

---

## Fixing a failed or wrong release

### Tag points to the wrong commit

If you pushed `v1.0.0` before a CI fix landed, the tag still references the old commit. **Moving the tag** is required — re-pushing without retagging does nothing useful.

```bash
# Ensure main is up to date and includes the fix
git checkout main
git pull origin main

# Move the tag to current HEAD
git tag -fa v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0 --force
```

Verify:

```bash
git log -1 --oneline v1.0.0
```

The shown commit should match your latest release-ready commit.

### Delete and recreate a tag

```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### CI failed during build

1. Fix the issue on `main` and push.
2. Move the tag to the fixed commit (see above).
3. Optionally delete the broken GitHub Release and let the workflow create a fresh one, or edit the release manually.

---

## Release artifacts explained

| File | Purpose |
|------|---------|
| `Google Chrome Setup x.y.z.exe` | Windows NSIS installer — **give this to users** |
| `*.exe.blockmap` | Block hashes for delta updates (used by electron-updater) |
| `latest.yml` | Update metadata for in-app auto-update (`electron-updater`) |

For manual downloads from GitHub Releases, only the `.exe` is required. Blockmap and `latest.yml` are required for About → Check for updates.

The repository must be **public** for auto-update to work without embedding a GitHub token. `package.json` → `build.publish.private` is `false` so packaged builds use the public GitHub provider.

Installers are **unsigned** by default. Windows SmartScreen may warn until code signing is configured.

---

## Quick reference

```bash
# Develop
pnpm dev

# Production smoke test
pnpm build && pnpm start

# Local installer
pnpm dist

# Feature branch
git checkout -b feature/my-change
git push -u origin feature/my-change

# Release
# (after bumping package.json + CHANGELOG.md)
git commit -m "chore: release v1.0.1"
git push origin main
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# Re-point tag after a fix
git tag -fa v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1 --force
```
