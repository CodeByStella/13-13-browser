import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import { IPC_EVENTS } from '@shared/ipc/channels';
import type { Bookmark } from '@shared/types';

import { getContentProtectionState, setContentProtectionPreference } from '../services/privacy/content-protection';
import { normalizeDevServerUrl, waitForDevServer } from '../lib/dev-server';
import {
  broadcastInitialPrivacyState,
  clearOnExitIfEnabled,
  initPrivacy,
} from '../services/privacy/privacy';
import { getBookmarksService } from '../ipc/bookmarks.ipc';
import { loadSession } from '../stores/session-store';
import { isDevServerUrl } from '../lib/shared';
import { TabManager } from '../services/tabs/tab-manager';
import type { AppContext } from './context';

function resolveAppIcon(): string | undefined {
  const candidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(app.getAppPath(), 'build/icon.ico'),
    path.join(app.getAppPath(), 'build/icon.png'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function sanitizeSessionTabs(tabs: string[]): string[] {
  return tabs.filter((url) => !isDevServerUrl(url) && !url.startsWith('file://'));
}

function applyContentProtection(win: BrowserWindow, enabled: boolean): void {
  setContentProtectionPreference(enabled);
  win.setContentProtection(enabled);
}

export interface MainWindowHandles {
  mainWindow: BrowserWindow;
  tabManager: TabManager;
  buildContext: (bookmarks: Bookmark[], broadcastBookmarks: () => void) => AppContext;
}

export async function createMainWindow(): Promise<MainWindowHandles> {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !!devServerUrl;
  const icon = resolveAppIcon();

  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 720,
    minHeight: 520,
    title: '13.13 Browser',
    backgroundColor: '#0a0c10',
    frame: false,
    autoHideMenuBar: true,
    show: false,
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const tabManager = new TabManager(mainWindow, isDev);
  initPrivacy(mainWindow);

  mainWindow.on('resize', () => tabManager.layout());
  mainWindow.on('maximize', () => {
    tabManager.layout();
    mainWindow.webContents.send(IPC_EVENTS.WINDOW_MAXIMIZED, true);
  });
  mainWindow.on('unmaximize', () => {
    tabManager.layout();
    mainWindow.webContents.send(IPC_EVENTS.WINDOW_MAXIMIZED, false);
  });
  mainWindow.on('close', () => {
    tabManager.persistSession();
    void clearOnExitIfEnabled();
  });

  applyContentProtection(mainWindow, true);

  let tabsInitialized = false;
  const initTabs = (): void => {
    if (tabsInitialized) return;
    tabsInitialized = true;

    const session = loadSession();
    const restored = session ? sanitizeSessionTabs(session.tabs) : [];

    if (restored.length > 0) {
      tabManager.restoreSession({ tabs: restored, activeIndex: session!.activeIndex });
    } else {
      tabManager.createTab();
    }

    broadcastInitialPrivacyState();
    mainWindow.webContents.send(IPC_EVENTS.CONTENT_PROTECTION_STATE, getContentProtectionState());
    mainWindow.webContents.send(IPC_EVENTS.BOOKMARKS_UPDATED, getBookmarksService().getAll());
    mainWindow.show();
    mainWindow.webContents.send(IPC_EVENTS.WINDOW_MAXIMIZED, mainWindow.isMaximized());
  };

  mainWindow.webContents.on('did-finish-load', initTabs);
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, _desc, _url, isMainFrame) => {
    if (!isMainFrame || !isDev || !devServerUrl) return;
    if (errorCode !== -102) return;
    void (async () => {
      const url = normalizeDevServerUrl(devServerUrl);
      await waitForDevServer(url);
      await mainWindow.loadURL(url);
    })();
  });

  if (isDev && devServerUrl) {
    const url = normalizeDevServerUrl(devServerUrl);
    await waitForDevServer(url);
    await mainWindow.loadURL(url);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return {
    mainWindow,
    tabManager,
    buildContext: (bookmarks, broadcastBookmarks) => ({
      getMainWindow: () => mainWindow,
      getTabManager: () => tabManager,
      getBookmarks: () => bookmarks,
      broadcastBookmarks,
      isDev: () => isDev,
      applyContentProtection: (enabled) => applyContentProtection(mainWindow, enabled),
    }),
  };
}
