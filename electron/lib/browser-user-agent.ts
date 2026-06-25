import { app, session, type Session } from 'electron';

/** Chrome-like UA without Electron / app package tokens that trip site blocklists. */
export function buildChromeUserAgent(): string {
  const chromeVersion = process.versions.chrome;
  const platform =
    process.platform === 'win32'
      ? 'Windows NT 10.0; Win64; x64'
      : process.platform === 'darwin'
        ? 'Macintosh; Intel Mac OS X 10_15_7'
        : 'X11; Linux x86_64';

  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

export function applySessionUserAgent(sess: Session): void {
  const ua = buildChromeUserAgent();
  if (sess.getUserAgent() !== ua) {
    sess.setUserAgent(ua);
  }
}

/** Call before windows / BrowserViews are created. */
export function initBrowserUserAgent(): void {
  app.userAgentFallback = buildChromeUserAgent();
  applySessionUserAgent(session.defaultSession);
}
