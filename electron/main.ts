import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
} from 'electron';
import path from 'node:path';
import { supportsExcludeFromCapture } from './shared';
import { TabManager } from './tab-manager';

let mainWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;

function applyContentProtection(win: BrowserWindow, enabled: boolean): void {
  win.setContentProtection(enabled);
}

function createWindow(): void {
  const isDev = !!process.env.VITE_DEV_SERVER_URL;

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 720,
    minHeight: 520,
    title: '13.13 Browser',
    backgroundColor: '#0a0c10',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  tabManager = new TabManager(mainWindow, isDev);

  mainWindow.on('resize', () => tabManager?.layout());
  mainWindow.on('maximize', () => tabManager?.layout());
  mainWindow.on('unmaximize', () => tabManager?.layout());

  applyContentProtection(mainWindow, true);

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    tabManager?.createTab();
    mainWindow?.webContents.send('content-protection-state', {
      enabled: mainWindow?.isContentProtected() ?? false,
      supported: supportsExcludeFromCapture(),
    });
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle('navigate', (_event, rawUrl: string) => {
    return tabManager?.navigateActive(rawUrl) ?? rawUrl;
  });

  ipcMain.handle('go-home', () => tabManager?.goHome());
  ipcMain.handle('go-back', () => tabManager?.goBack());
  ipcMain.handle('go-forward', () => tabManager?.goForward());
  ipcMain.handle('reload', () => tabManager?.reload());
  ipcMain.handle('stop', () => tabManager?.stop());

  ipcMain.handle('get-browser-state', () => tabManager?.getState() ?? { tabs: [], activeTabId: null });

  ipcMain.handle('create-tab', (_event, url?: string) => tabManager?.createTab(url));
  ipcMain.handle('close-tab', (_event, id: string) => tabManager?.closeTab(id));
  ipcMain.handle('switch-tab', (_event, id: string) => tabManager?.switchTab(id));
  ipcMain.handle('duplicate-tab', (_event, id: string) => tabManager?.duplicateTab(id));

  ipcMain.handle('open-external', (_event, url: string) => {
    void shell.openExternal(url);
  });

  ipcMain.handle('set-content-protection', (_event, enabled: boolean) => {
    if (!mainWindow) return { enabled: false, supported: false };
    applyContentProtection(mainWindow, enabled);
    const state = {
      enabled: mainWindow.isContentProtected(),
      supported: supportsExcludeFromCapture(),
    };
    mainWindow.webContents.send('content-protection-state', state);
    return state;
  });

  ipcMain.handle('get-content-protection', () => ({
    enabled: mainWindow?.isContentProtected() ?? false,
    supported: supportsExcludeFromCapture(),
  }));
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
