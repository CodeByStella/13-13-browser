# Contributing to Google Chrome

Thank you for your interest in contributing. This document explains how to propose changes, report issues, and align with project standards.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project layout](#project-layout)
- [Development workflow](./docs/WORKFLOW.md) — editing, branches, releases
- [Coding standards](#coding-standards)
- [Commit messages](#commit-messages)
- [Pull request process](#pull-request-process)
- [Reporting bugs](#reporting-bugs)
- [Suggesting features](#suggesting-features)
- [Security issues](#security-issues)

## Code of conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold a respectful and inclusive environment.

## Ways to contribute

- Report bugs and regressions
- Suggest features or UX improvements
- Improve documentation
- Fix issues or implement approved features
- Review pull requests
- Expand privacy protections and test coverage

## Development setup

### Prerequisites

- Node.js 20 or later
- pnpm 10 or later
- Windows 10 (build 19041+) recommended for full feature testing

### Install and run

```bash
pnpm install
pnpm dev
```

If Electron fails to download or launch:

```bash
node node_modules/electron/install.js
```

### Production build

```bash
pnpm build
pnpm start
```

### Installer (Windows)

```bash
pnpm dist
```

## Project layout

| Path | Purpose |
|------|---------|
| `electron/` | Main process — window, tabs, IPC, privacy engine |
| `src/` | React UI chrome (tab bar, toolbar, panels) |
| `public/` | Static pages loaded in tabs (`newtab.html`, `error.html`) |
| `build/` | App icons for window, taskbar, and installer |
| `docs/` | Legal and technical documentation |

See [Architecture](./docs/ARCHITECTURE.md) for a deeper overview.

## Coding standards

### General

- Match existing naming, formatting, and patterns in the file you edit
- Keep changes focused — one logical change per pull request when possible
- Prefer clear code over clever abstractions
- Do not add comments for obvious logic; document non-obvious behavior only

### TypeScript

- Maintain strict typing; avoid `any` unless unavoidable at system boundaries
- Share types between main and renderer via `electron/shared.ts` and `src/types/`

### Electron security

- Never enable `nodeIntegration` in renderer or `BrowserView` web preferences
- Keep `contextIsolation` and `sandbox` enabled
- Expose main-process APIs only through `preload.ts` with explicit IPC channels
- Validate and sanitize IPC inputs in the main process

### UI

- Follow the existing 3D depth design tokens in `src/styles/index.css`
- Preserve frameless drag regions (`titlebar-drag` / `titlebar-no-drag`)
- Test keyboard shortcuts listed in [README.md](./README.md)

## Commit messages

Use clear, imperative subject lines:

```
Add bookmark remove confirmation

Fix private tab session leaking into restore

Update privacy policy for clear-on-exit behavior
```

Optional body: explain **why** the change is needed, not every line changed.

## Pull request process

1. Fork the repository and create a branch from the default branch
2. Make your changes with a clear scope
3. Run `pnpm build` and verify the app launches
4. Update documentation if behavior, settings, or data handling changes
5. Open a pull request using the [PR template](./.github/pull_request_template.md)
6. Link related issues and describe how you tested the change

Maintainers may request revisions before merge. Large features should be discussed in an issue first.

## Reporting bugs

Use the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md) and include:

- OS version and Google Chrome version
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots or logs if relevant

## Suggesting features

Use the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md). Explain the problem, proposed solution, and alternatives considered.

## Security issues

**Do not** open public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## Privacy-related changes

Changes that affect data collection, storage, or network behavior must update [docs/PRIVACY_POLICY.md](./docs/PRIVACY_POLICY.md) and be noted in the pull request description.

## Questions

Open a discussion or issue labeled `question` if you are unsure whether a contribution fits the project direction.
