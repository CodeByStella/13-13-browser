# Security Policy

## Supported versions

Security fixes are provided for the latest release on the default branch.

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security issue in Google Chrome, report it privately to the
project maintainers. Include:

1. A description of the vulnerability and its potential impact
2. Steps to reproduce the issue
3. Affected version or commit hash
4. Any proof-of-concept code or screenshots (if available)
5. Your suggested fix, if you have one

We aim to acknowledge reports within **72 hours** and provide an initial
assessment within **7 days**.

## Disclosure process

1. Reporter submits a private vulnerability report
2. Maintainers confirm and prioritize the issue
3. A fix is developed and tested on a private branch when needed
4. A patched release or advisory is published
5. Reporter is credited in the release notes (unless they prefer anonymity)

## Scope

The following are **in scope**:

- Remote code execution in the main process or renderer
- Sandbox escapes from `BrowserView` or the React shell
- IPC privilege escalation or missing validation
- Privacy feature bypasses (tracker blocking, permission blocking, private tabs)
- Screen-capture protection bypass on supported platforms
- Unsafe handling of bookmarks, session data, or user settings

The following are generally **out of scope**:

- Vulnerabilities in third-party websites you visit through the browser
- Issues requiring physical access to an unlocked machine
- Social engineering attacks against the user
- Denial-of-service caused by visiting malicious web content (unless it crashes
  the browser shell itself)
- Vulnerabilities in upstream Electron/Chromium without a practical exploit path
  in this application (report those upstream, then notify us if a workaround is
  needed)

## Security architecture summary

- Main UI runs in a sandboxed renderer with context isolation
- Web pages load in separate `BrowserView` instances with sandbox enabled
- Node integration is disabled in all web-facing contexts
- IPC is exposed through a narrow preload bridge (`electron/preload.ts`)
- Normal and private tabs use separate Electron session partitions

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.

## Secure development

Contributors must follow the security guidelines in
[CONTRIBUTING.md](./CONTRIBUTING.md). Changes that touch IPC, session
partitions, preload scripts, or permission handlers require extra review.

## Bug bounties

There is no paid bug bounty program at this time. We appreciate responsible
disclosure and will acknowledge researchers in release notes when appropriate.
