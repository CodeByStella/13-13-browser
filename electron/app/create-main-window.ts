import { BrowserWindow } from 'electron';
import path from 'node:path';

import { IPC_EVENTS } from '@shared/ipc/channels';
import type { Bookmark } from '@shared/types';

import { applyWindowIcon, resolveAppIconImage } from '../lib/app-branding';

import { getContentProtectionState, isContentProtectionEnabled, setContentProtectionPreference } from '../services/privacy/content-protection';
import { loadSession } from '../stores/session-store';
import { normalizeDevServerUrl, waitForDevServer } from '../lib/dev-server';
import { startDevReloadWatcher } from '../lib/dev-reload';
import {
  broadcastInitialPrivacyState,
  clearOnExitIfEnabled,
  initPrivacy,
} from '../services/privacy/privacy';
import { getBookmarksService } from '../ipc/bookmarks.ipc';
import { TabManager } from '../services/tabs/tab-manager';
import {
  hideToTray,
  isAppQuitting,
  setTrayMainWindow,
  shouldCloseToTray,
} from '../services/tray/tray-manager';
import type { AppContext } from './context';

function applyContentProtection(win: BrowserWindow, enabled: boolean): void {
  setContentProtectionPreference(enabled);
  win.setContentProtection(enabled);
}

export interface MainWindowHandles {
  mainWindow: BrowserWindow;
  tabManager: TabManager;
  buildContext: (bookmarks: Bookmark[], broadcastBookmarks: () => void) => AppContext;
  stopDevReload?: () => void;
}

export async function createMainWindow(): Promise<MainWindowHandles> {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !!devServerUrl;
  const icon = resolveAppIconImage();

  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 720,
    minHeight: 520,
    title: '13.13 Browser',
    backgroundColor: '#2b2b2b',
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

  mainWindow.once('ready-to-show', () => applyWindowIcon(mainWindow));

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
  mainWindow.on('close', (event) => {
    if (!isAppQuitting() && shouldCloseToTray()) {
      event.preventDefault();
      tabManager.persistSession();
      void clearOnExitIfEnabled();
      hideToTray();
      return;
    }
    tabManager.persistSession();
    void clearOnExitIfEnabled();
  });

  setTrayMainWindow(mainWindow);

  applyContentProtection(mainWindow, isContentProtectionEnabled());

  let tabsInitialized = false;
  const initTabs = (): void => {
    if (tabsInitialized) return;
    tabsInitialized = true;

    const session = loadSession();
    if (session) {
      tabManager.restoreSession(session);
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

  const stopDevReload = isDev ? startDevReloadWatcher(mainWindow, tabManager) : undefined;

  return {
    mainWindow,
    tabManager,
    stopDevReload,
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
