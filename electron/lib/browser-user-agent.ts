import { app, session, type Session, type WebContents } from 'electron';

/**
 * Sites increasingly gate on Chrome 137+ while Electron 36 ships Chromium 136.
 * v1.0.0 and v2.0.0 both used the same engine; v2 only changed the app token in
 * the default Electron UA (`13.13 Browser/2.0.0`), which some detectors treat as
 * the browser version (2 < 137). We report at least this major in UA + Client Hints.
 */
const MIN_REPORTED_CHROME_MAJOR = 137;

function effectiveChromeVersion(): string {
  const actual = process.versions.chrome;
  const [major, ...rest] = actual.split('.');
  const majorNum = Number.parseInt(major ?? '0', 10);
  if (majorNum >= MIN_REPORTED_CHROME_MAJOR) return actual;
  return [String(MIN_REPORTED_CHROME_MAJOR), ...rest].join('.');
}

function chromeMajorVersion(): string {
  return effectiveChromeVersion().split('.')[0] ?? String(MIN_REPORTED_CHROME_MAJOR);
}

function platformToken(): string {
  if (process.platform === 'win32') return 'Windows NT 10.0; Win64; x64';
  if (process.platform === 'darwin') return 'Macintosh; Intel Mac OS X 10_15_7';
  return 'X11; Linux x86_64';
}

function platformClientHint(): string {
  if (process.platform === 'win32') return '"Windows"';
  if (process.platform === 'darwin') return '"macOS"';
  return '"Linux"';
}

function escapeForInjectedScript(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildCompatInjectScript(): string {
  const ua = escapeForInjectedScript(buildChromeUserAgent());

  return `(() => {
  const ua = '${ua}';
  try {
    Object.defineProperty(navigator, 'userAgent', { get: () => ua, configurable: true });
    const appVersion = ua.startsWith('Mozilla/') ? ua.slice(8) : ua;
    Object.defineProperty(navigator, 'appVersion', { get: () => appVersion, configurable: true });
  } catch (_) {}

  try {
    if (navigator.webdriver) {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    }
  } catch (_) {}

  if (!window.chrome) {
    window.chrome = {
      runtime: {},
      loadTimes: function () { return {}; },
      csi: function () { return {}; },
    };
  }
})();`;
}

/** Chrome-like UA without Electron / app package tokens. */
export function buildChromeUserAgent(): string {
  const chromeVersion = effectiveChromeVersion();
  return `Mozilla/5.0 (${platformToken()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/** Align request headers with the spoofed Chrome user agent. */
export function patchBrowserRequestHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  const major = chromeMajorVersion();
  const next: Record<string, string | string[] | undefined> = { ...headers };

  next['User-Agent'] = buildChromeUserAgent();
  next['Sec-CH-UA'] = `"Chromium";v="${major}", "Google Chrome";v="${major}", "Not.A/Brand";v="99"`;
  next['Sec-CH-UA-Mobile'] = '?0';
  next['Sec-CH-UA-Platform'] = platformClientHint();

  delete next['Sec-CH-UA-Full-Version'];
  delete next['Sec-CH-UA-Full-Version-List'];

  return next;
}

export function applySessionUserAgent(sess: Session): void {
  const ua = buildChromeUserAgent();
  if (sess.getUserAgent() !== ua) {
    sess.setUserAgent(ua);
  }
}

/** Call before app.ready — sets fallback UA and Chromium switches. */
export function initBrowserUserAgent(): void {
  app.commandLine.appendSwitch('disable-features', 'UserAgentClientHint');
  app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
  app.userAgentFallback = buildChromeUserAgent();
}

/** Apply to the default session once app is ready. */
export function applyDefaultSessionUserAgent(): void {
  applySessionUserAgent(session.defaultSession);
}

const compatInstalled = new WeakSet<WebContents>();

/** Inject chrome / webdriver shims before page scripts run. */
export function installWebContentsCompat(webContents: WebContents): void {
  if (compatInstalled.has(webContents)) return;
  compatInstalled.add(webContents);

  webContents.once('destroyed', () => {
    compatInstalled.delete(webContents);
  });

  const run = (): void => {
    if (webContents.isDestroyed()) return;

    const source = buildCompatInjectScript();
    const dbg = webContents.debugger;
    if (dbg.isAttached()) return;

    try {
      dbg.attach('1.3');
      void dbg
        .sendCommand('Page.addScriptToEvaluateOnNewDocument', {
          source,
        })
        .finally(() => {
          if (!webContents.isDestroyed() && dbg.isAttached()) {
            dbg.detach();
          }
        });
    } catch {
      void webContents.executeJavaScript(source, true).catch(() => undefined);
    }
  };

  webContents.on('did-start-navigation', (_event, _url, _inPlace, isMainFrame) => {
    if (isMainFrame) run();
  });
}
