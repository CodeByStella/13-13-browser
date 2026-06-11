import { app, BrowserWindow, ipcMain, shell } from "electron";

import fs from "node:fs";
import path from "node:path";

import { randomUUID } from "node:crypto";

import { loadBookmarks, saveBookmarks, type Bookmark } from "./bookmarks-store";

import { normalizeDevServerUrl, waitForDevServer } from "./dev-server";

import { loadSession } from "./session-store";

import {
  isDevServerUrl,
  setChromeHeight,
  supportsExcludeFromCapture,
} from "./shared";

import { TabManager } from "./tab-manager";
import {
  broadcastInitialPrivacyState,
  clearBrowsingData,
  clearOnExitIfEnabled,
  getPrivacySettings,
  getPrivacyStats,
  initPrivacy,
  updatePrivacySettings,
} from "./privacy";

let mainWindow: BrowserWindow | null = null;

let tabManager: TabManager | null = null;

let bookmarks: Bookmark[] = [];

function applyContentProtection(win: BrowserWindow, enabled: boolean): void {
  win.setContentProtection(enabled);
}

function broadcastBookmarks(): void {
  mainWindow?.webContents.send("bookmarks-updated", bookmarks);
}

function sanitizeSessionTabs(tabs: string[]): string[] {
  return tabs.filter(
    (url) => !isDevServerUrl(url) && !url.startsWith("file://"),
  );
}

function resolveAppIcon(): string | undefined {
  const candidates = [
    path.join(__dirname, "../build/icon.ico"),
    path.join(__dirname, "../build/icon.png"),
    path.join(app.getAppPath(), "build/icon.ico"),
    path.join(app.getAppPath(), "build/icon.png"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function createWindow(): Promise<void> {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  const isDev = !!devServerUrl;
  const icon = resolveAppIcon();

  mainWindow = new BrowserWindow({
    width: 1360,

    height: 860,

    minWidth: 720,

    minHeight: 520,

    title: "13.13 Browser",

    backgroundColor: "#0a0c10",

    frame: false,

    autoHideMenuBar: true,

    show: false,

    ...(icon ? { icon } : {}),

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,
    },
  });

  tabManager = new TabManager(mainWindow, isDev);
  bookmarks = loadBookmarks();
  initPrivacy(mainWindow);

  mainWindow.on("resize", () => tabManager?.layout());

  mainWindow.on("maximize", () => {
    tabManager?.layout();
    mainWindow?.webContents.send("window-maximized", true);
  });

  mainWindow.on("unmaximize", () => {
    tabManager?.layout();
    mainWindow?.webContents.send("window-maximized", false);
  });

  mainWindow.on("close", () => {
    tabManager?.persistSession();
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
      tabManager?.restoreSession({
        tabs: restored,
        activeIndex: session!.activeIndex,
      });
    } else {
      tabManager?.createTab();
    }

    broadcastBookmarks();
    broadcastInitialPrivacyState();

    mainWindow?.webContents.send("content-protection-state", {
      enabled: mainWindow?.isContentProtected() ?? false,

      supported: supportsExcludeFromCapture(),
    });

    mainWindow?.show();

    if (mainWindow) {
      mainWindow.webContents.send("window-maximized", mainWindow.isMaximized());
    }
  };

  mainWindow.webContents.on("did-finish-load", initTabs);

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, _desc, _url, isMainFrame) => {
      if (!isMainFrame || !isDev || !devServerUrl) return;

      if (errorCode !== -102) return;

      void (async () => {
        const url = normalizeDevServerUrl(devServerUrl);
        await waitForDevServer(url);
        await mainWindow?.loadURL(url);
      })();
    },
  );

  if (isDev && devServerUrl) {
    const url = normalizeDevServerUrl(devServerUrl);
    await waitForDevServer(url);
    await mainWindow.loadURL(url);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle("navigate", (_event, rawUrl: string) => {
    return tabManager?.navigateActive(rawUrl) ?? rawUrl;
  });

  ipcMain.handle("go-home", () => tabManager?.goHome());

  ipcMain.handle("go-back", () => tabManager?.goBack());

  ipcMain.handle("go-forward", () => tabManager?.goForward());

  ipcMain.handle("reload", () => tabManager?.reload());

  ipcMain.handle("stop", () => tabManager?.stop());

  ipcMain.handle(
    "get-browser-state",
    () =>
      tabManager?.getState() ?? { tabs: [], activeTabId: null, zoomLevel: 1 },
  );

  ipcMain.handle("create-tab", (_event, url?: string) =>
    tabManager?.createTab(url),
  );
  ipcMain.handle("create-private-tab", (_event, url?: string) =>
    tabManager?.createPrivateTab(url),
  );

  ipcMain.handle("close-tab", (_event, id: string) => tabManager?.closeTab(id));

  ipcMain.handle("switch-tab", (_event, id: string) =>
    tabManager?.switchTab(id),
  );

  ipcMain.handle("duplicate-tab", (_event, id: string) =>
    tabManager?.duplicateTab(id),
  );

  ipcMain.handle("reopen-closed-tab", () => tabManager?.reopenClosedTab());

  ipcMain.handle("zoom-in", () => tabManager?.zoomIn() ?? 1);

  ipcMain.handle("zoom-out", () => tabManager?.zoomOut() ?? 1);

  ipcMain.handle("zoom-reset", () => tabManager?.zoomReset() ?? 1);

  ipcMain.handle("get-zoom", () => tabManager?.getZoom() ?? 1);

  ipcMain.handle("find-in-page", (_event, text: string, forward?: boolean) => {
    tabManager?.findInPage(text, forward);
  });

  ipcMain.handle("find-next", (_event, forward?: boolean) => {
    tabManager?.findNext(forward);
  });

  ipcMain.handle("stop-find-in-page", () => tabManager?.stopFindInPage());

  ipcMain.handle("toggle-devtools", () => tabManager?.toggleDevTools());

  ipcMain.handle("get-bookmarks", () => bookmarks);

  ipcMain.handle("add-bookmark", (_event, title: string, url: string) => {
    if (!url || url.startsWith("file://")) return bookmarks;

    const existing = bookmarks.find((b) => b.url === url);

    if (existing) return bookmarks;

    bookmarks = [
      { id: randomUUID(), title: title || url, url, createdAt: Date.now() },

      ...bookmarks,
    ];

    saveBookmarks(bookmarks);

    broadcastBookmarks();

    return bookmarks;
  });

  ipcMain.handle("remove-bookmark", (_event, id: string) => {
    bookmarks = bookmarks.filter((b) => b.id !== id);

    saveBookmarks(bookmarks);

    broadcastBookmarks();

    return bookmarks;
  });

  ipcMain.handle("toggle-bookmark", (_event, title: string, url: string) => {
    const existing = bookmarks.find((b) => b.url === url);

    if (existing) {
      bookmarks = bookmarks.filter((b) => b.id !== existing.id);
    } else if (url && !url.startsWith("file://")) {
      bookmarks = [
        { id: randomUUID(), title: title || url, url, createdAt: Date.now() },

        ...bookmarks,
      ];
    }

    saveBookmarks(bookmarks);

    broadcastBookmarks();

    return bookmarks;
  });

  ipcMain.handle("set-chrome-height", (_event, height: number) => {
    setChromeHeight(height);

    tabManager?.layout();
  });

  ipcMain.handle("set-web-content-hidden", (_event, hidden: boolean) => {
    tabManager?.setWebContentHidden(hidden);
  });

  ipcMain.handle("open-external", (_event, url: string) => {
    void shell.openExternal(url);
  });

  ipcMain.handle("set-content-protection", (_event, enabled: boolean) => {
    if (!mainWindow) return { enabled: false, supported: false };

    applyContentProtection(mainWindow, enabled);

    const state = {
      enabled: mainWindow.isContentProtected(),

      supported: supportsExcludeFromCapture(),
    };

    mainWindow.webContents.send("content-protection-state", state);

    return state;
  });

  ipcMain.handle("get-content-protection", () => ({
    enabled: mainWindow?.isContentProtected() ?? false,
    supported: supportsExcludeFromCapture(),
  }));

  ipcMain.handle("get-privacy-state", () => ({
    settings: getPrivacySettings(),
    stats: getPrivacyStats(),
  }));

  ipcMain.handle("update-privacy-settings", (_event, partial) =>
    updatePrivacySettings(partial),
  );

  ipcMain.handle("clear-browsing-data", () => clearBrowsingData());

  ipcMain.handle("window-minimize", () => mainWindow?.minimize());

  ipcMain.handle("window-toggle-maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });

  ipcMain.handle("window-close", () => mainWindow?.close());

  ipcMain.handle(
    "window-is-maximized",
    () => mainWindow?.isMaximized() ?? false,
  );
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("app.browser1313.desktop");
  }

  registerIpcHandlers();

  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
