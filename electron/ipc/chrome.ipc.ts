import { ipcMain, shell } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';

import { getAppContext } from '../app/context';
import {
  hideToTray,
  shouldCloseToTray,
  shouldMinimizeToTray,
} from '../services/tray/tray-manager';
import { getContentProtectionState } from '../services/privacy/content-protection';
import {
  clearBrowsingData,
  getPrivacySettings,
  getPrivacyStats,
  updatePrivacySettings,
} from '../services/privacy/privacy';
import {
  showBookmarkContextMenu,
  showBookmarkFolderMenu,
  showBookmarkRenamePrompt,
} from '../windows/bookmark-menu-window';
import { showToolbarChromeMenu } from '../windows/chrome-menu-window';
import {
  closePrivacyPanel,
  refreshPrivacyPanelIfOpen,
  showPrivacyPanel,
} from '../windows/privacy-panel-window';
import {
  closeSitePermissionsPanel,
  showSitePermissionsPanel,
} from '../windows/site-permissions-window';

export function registerChromeIpc(): void {
  ipcMain.handle(IPC.SHOW_TOOLBAR_MENU, (_event, anchor: { x: number; y: number; width: number }) => {
    const mainWindow = getAppContext().getMainWindow();
    if (!mainWindow) return;
    showToolbarChromeMenu(
      mainWindow,
      getAppContext().getTabManager(),
      anchor,
      getAppContext().isDev(),
    );
  });

  ipcMain.handle(
    IPC.SHOW_PRIVACY_PANEL,
    (_event, anchor: { x: number; y: number; width: number; height?: number }, toggle?: boolean) => {
      const mainWindow = getAppContext().getMainWindow();
      if (!mainWindow) return;
      closeSitePermissionsPanel();
      showPrivacyPanel(mainWindow, getAppContext().isDev(), anchor, { toggle });
    },
  );

  ipcMain.handle(
    IPC.SHOW_SITE_PERMISSIONS,
    (_event, anchor: { x: number; y: number; width: number; height?: number }, toggle?: boolean) => {
      const mainWindow = getAppContext().getMainWindow();
      const tabManager = getAppContext().getTabManager();
      if (!mainWindow || !tabManager) return;
      closePrivacyPanel();
      showSitePermissionsPanel(
        mainWindow,
        getAppContext().isDev(),
        anchor,
        tabManager.getActiveTabUrl(),
        { toggle },
      );
    },
  );

  ipcMain.handle(
    IPC.SHOW_BOOKMARK_CONTEXT_MENU,
    (
      _event,
      anchor: { x: number; y: number; width: number; height?: number },
      targetId: string | null,
    ) => {
      const mainWindow = getAppContext().getMainWindow();
      if (!mainWindow) return;
      showBookmarkContextMenu(
        mainWindow,
        getAppContext().getTabManager(),
        anchor,
        targetId,
        getAppContext().isDev(),
      );
    },
  );

  ipcMain.handle(
    IPC.SHOW_BOOKMARK_FOLDER_MENU,
    (
      _event,
      anchor: { x: number; y: number; width: number; height?: number },
      folderId: string,
    ) => {
      const mainWindow = getAppContext().getMainWindow();
      if (!mainWindow) return;
      showBookmarkFolderMenu(
        mainWindow,
        getAppContext().getTabManager(),
        anchor,
        folderId,
        getAppContext().isDev(),
      );
    },
  );

  ipcMain.handle(
    IPC.SHOW_BOOKMARK_RENAME,
    (
      _event,
      anchor: { x: number; y: number; width: number; height?: number },
      bookmarkId: string,
      defaultTitle: string,
    ) => {
      const mainWindow = getAppContext().getMainWindow();
      if (!mainWindow) return;
      showBookmarkRenamePrompt(
        mainWindow,
        anchor,
        bookmarkId,
        defaultTitle,
        getAppContext().isDev(),
      );
    },
  );

  ipcMain.handle(IPC.OPEN_EXTERNAL, (_event, url: string) => {
    void shell.openExternal(url);
  });
}

export function registerPrivacyIpc(): void {
  ipcMain.handle(IPC.SET_CONTENT_PROTECTION, (_event, enabled: boolean) => {
    const mainWindow = getAppContext().getMainWindow();
    if (!mainWindow) return { enabled: false, supported: false };

    getAppContext().applyContentProtection(enabled);
    const state = getContentProtectionState();
    mainWindow.webContents.send(IPC_EVENTS.CONTENT_PROTECTION_STATE, state);
    refreshPrivacyPanelIfOpen(mainWindow);
    return state;
  });

  ipcMain.handle(IPC.GET_CONTENT_PROTECTION, () => getContentProtectionState());

  ipcMain.handle(IPC.GET_PRIVACY_STATE, () => ({
    settings: getPrivacySettings(),
    stats: getPrivacyStats(),
  }));

  ipcMain.handle(IPC.UPDATE_PRIVACY_SETTINGS, (_event, partial) => updatePrivacySettings(partial));
  ipcMain.handle(IPC.CLEAR_BROWSING_DATA, async () => {
    await clearBrowsingData();
    getAppContext().getTabManager()?.reloadAllNormalTabs();
  });
}

export function registerWindowIpc(): void {
  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => {
    if (shouldMinimizeToTray()) {
      hideToTray();
      return;
    }
    getAppContext().getMainWindow()?.minimize();
  });
  ipcMain.handle(IPC.WINDOW_TOGGLE_MAXIMIZE, () => {
    const mainWindow = getAppContext().getMainWindow();
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle(IPC.WINDOW_CLOSE, () => {
    const mainWindow = getAppContext().getMainWindow();
    if (!mainWindow) return;
    if (shouldCloseToTray()) {
      hideToTray();
      return;
    }
    mainWindow.close();
  });
  ipcMain.handle(IPC.WINDOW_IS_MAXIMIZED, () => getAppContext().getMainWindow()?.isMaximized() ?? false);
}
