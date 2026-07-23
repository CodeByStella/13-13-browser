import { app, session, type Session, type WebContents } from 'electron';

/**
 * Strip Electron / app-package tokens from Chromium's native UA.
 * Prefer sanitizing the real engine UA over inventing one — Client Hints stay
 * aligned with the shipped Chromium build.
 */
export function sanitizeChromeUserAgent(ua: string): string {
  return ua
    .replace(/\sElectron\/\S+/gi, '')
    .replace(/\sGoogle Chrome\/\S+/gi, '')
    .replace(/\sgoogle-chrome\/\S+/gi, '')
    .replace(/\s+Safari\//i, ' Safari/')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function resolveCleanUserAgent(sess?: Session): string {
  const source =
    sess?.getUserAgent() ||
    app.userAgentFallback ||
    `Mozilla/5.0 (${platformToken()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
  return sanitizeChromeUserAgent(source);
}

function platformToken(): string {
  if (process.platform === 'win32') return 'Windows NT 10.0; Win64; x64';
  if (process.platform === 'darwin') return 'Macintosh; Intel Mac OS X 10_15_7';
  return 'X11; Linux x86_64';
}

/** Chrome-like UA without Electron / app package tokens. */
export function buildChromeUserAgent(): string {
  return resolveCleanUserAgent();
}

/**
 * Keep the network User-Agent aligned with the session UA.
 * Do not forge Sec-CH-UA* — Chromium must emit Client Hints that match the
 * real engine version.
 */
export function patchBrowserRequestHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  return {
    ...headers,
    'User-Agent': buildChromeUserAgent(),
  };
}

export function applySessionUserAgent(sess: Session): void {
  const ua = resolveCleanUserAgent(sess);
  if (sess.getUserAgent() !== ua) {
    sess.setUserAgent(ua);
  }
}

/** Call before app.ready — Chromium switches only (UA applied on ready). */
export function initBrowserUserAgent(): void {
  // Hide the automation-controlled flag without disabling native Client Hints.
  app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
}

/** Apply to default + browsing sessions once app is ready. */
export function applyDefaultSessionUserAgent(): void {
  const clean = sanitizeChromeUserAgent(session.defaultSession.getUserAgent());
  app.userAgentFallback = clean;
  applySessionUserAgent(session.defaultSession);
  applySessionUserAgent(session.fromPartition('persist:browser'));
}

/**
 * Kept for call sites. Identity is applied via sanitized session UA + native
 * Client Hints. CDP injection is intentionally not used (automation signal).
 */
export function installWebContentsCompat(_webContents: WebContents): void {
  // no-op
}
