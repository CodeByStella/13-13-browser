import {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  shell,
} from 'electron';
import path from 'node:path';
import os from 'node:os';

const CHROME_HEIGHT = 72;
const DEFAULT_URL = 'https://duckduckgo.com';

let mainWindow: BrowserWindow | null = null;
let browserView: BrowserView | null = null;

function supportsExcludeFromCapture(): boolean {
  if (process.platform !== 'win32') return true;
  const release = os.release();
  const parts = release.split('.');
  const build = Number(parts[2]);
  return build >= 19041;
}

function applyContentProtection(win: BrowserWindow, enabled: boolean): void {
  win.setContentProtection(enabled);
}

function layoutBrowserView(): void {
  if (!mainWindow || !browserView) return;

  const [width, height] = mainWindow.getContentSize();
  browserView.setBounds({
    x: 0,
    y: CHROME_HEIGHT,
    width,
    height: Math.max(0, height - CHROME_HEIGHT),
  });
}

function sendNavigationState(): void {
  if (!mainWindow || !browserView) return;

  const webContents = browserView.webContents;
  mainWindow.webContents.send('navigation-state', {
    url: webContents.getURL(),
    title: webContents.getTitle(),
    canGoBack: webContents.canGoBack(),
    canGoForward: webContents.canGoForward(),
    isLoading: webContents.isLoading(),
  });
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_URL;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const looksLikeDomain =
    trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.includes('/');
  if (looksLikeDomain) return `https://${trimmed}`;

  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

function createBrowserView(): BrowserView {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const wc = view.webContents;

  wc.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  wc.on('did-start-loading', sendNavigationState);
  wc.on('did-stop-loading', sendNavigationState);
  wc.on('did-navigate', sendNavigationState);
  wc.on('did-navigate-in-page', sendNavigationState);
  wc.on('page-title-updated', sendNavigationState);
  wc.on('did-fail-load', (_event, _code, _desc, _url, isMainFrame) => {
    if (isMainFrame) sendNavigationState();
  });

  return view;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    title: '13.13 Browser',
    backgroundColor: '#0f1117',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  browserView = createBrowserView();
  mainWindow.setBrowserView(browserView);
  layoutBrowserView();

  mainWindow.on('resize', layoutBrowserView);
  mainWindow.on('maximize', layoutBrowserView);
  mainWindow.on('unmaximize', layoutBrowserView);

  applyContentProtection(mainWindow, true);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  browserView.webContents.loadURL(DEFAULT_URL);

  mainWindow.webContents.on('did-finish-load', () => {
    sendNavigationState();
    mainWindow?.webContents.send('content-protection-state', {
      enabled: mainWindow?.isContentProtected() ?? false,
      supported: supportsExcludeFromCapture(),
    });
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle('navigate', (_event, rawUrl: string) => {
    const url = normalizeUrl(rawUrl);
    browserView?.webContents.loadURL(url);
    return url;
  });

  ipcMain.handle('go-back', () => {
    if (browserView?.webContents.canGoBack()) {
      browserView.webContents.goBack();
    }
  });

  ipcMain.handle('go-forward', () => {
    if (browserView?.webContents.canGoForward()) {
      browserView.webContents.goForward();
    }
  });

  ipcMain.handle('reload', () => {
    browserView?.webContents.reload();
  });

  ipcMain.handle('stop', () => {
    browserView?.webContents.stop();
  });

  ipcMain.handle('get-navigation-state', () => {
    if (!browserView) return null;
    const wc = browserView.webContents;
    return {
      url: wc.getURL(),
      title: wc.getTitle(),
      canGoBack: wc.canGoBack(),
      canGoForward: wc.canGoForward(),
      isLoading: wc.isLoading(),
    };
  });

  ipcMain.handle('set-content-protection', (_event, enabled: boolean) => {
    if (!mainWindow) return false;
    applyContentProtection(mainWindow, enabled);
    const state = {
      enabled: mainWindow.isContentProtected(),
      supported: supportsExcludeFromCapture(),
    };
    mainWindow.webContents.send('content-protection-state', state);
    return state;
  });

  ipcMain.handle('get-content-protection', () => {
    return {
      enabled: mainWindow?.isContentProtected() ?? false,
      supported: supportsExcludeFromCapture(),
    };
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
