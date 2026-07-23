import { ipcMain, Menu } from 'electron';

import { IPC } from '@shared/ipc/channels';
import type { ChromePopupAnchor } from '@shared/types';

import { getAppContext } from '../app/context';
import { setChromeHeight } from '../lib/shared';

export function registerTabsIpc(): void {
  ipcMain.handle(IPC.NAVIGATE, (_event, rawUrl: string) => {
    const { getTabManager } = getAppContext();
    return getTabManager()?.navigateActive(rawUrl) ?? rawUrl;
  });

  ipcMain.handle(IPC.GO_HOME, () => getAppContext().getTabManager()?.goHome());
  ipcMain.handle(IPC.GO_BACK, () => getAppContext().getTabManager()?.goBack());
  ipcMain.handle(IPC.GO_FORWARD, () => getAppContext().getTabManager()?.goForward());
  ipcMain.handle(IPC.RELOAD, () => getAppContext().getTabManager()?.reload());
  ipcMain.handle(IPC.STOP, () => getAppContext().getTabManager()?.stop());

  ipcMain.handle(IPC.GET_BROWSER_STATE, () => {
    const tabManager = getAppContext().getTabManager();
    return tabManager?.getState() ?? { tabs: [], activeTabId: null, zoomLevel: 1 };
  });

  ipcMain.handle(IPC.CREATE_TAB, (_event, url?: string) =>
    getAppContext().getTabManager()?.createTab(url),
  );
  ipcMain.handle(IPC.CREATE_PRIVATE_TAB, (_event, url?: string) =>
    getAppContext().getTabManager()?.createPrivateTab(url),
  );
  ipcMain.handle(IPC.CLOSE_TAB, (_event, id: string) =>
    getAppContext().getTabManager()?.closeTab(id),
  );
  ipcMain.handle(IPC.SWITCH_TAB, (_event, id: string) =>
    getAppContext().getTabManager()?.switchTab(id),
  );
  ipcMain.handle(IPC.DUPLICATE_TAB, (_event, id: string) =>
    getAppContext().getTabManager()?.duplicateTab(id),
  );
  ipcMain.handle(IPC.REOPEN_CLOSED_TAB, () => getAppContext().getTabManager()?.reopenClosedTab());
  ipcMain.handle(IPC.TOGGLE_PIN_TAB, (_event, id: string) =>
    getAppContext().getTabManager()?.togglePinTab(id),
  );
  ipcMain.handle(IPC.MOVE_TAB, (_event, id: string, toIndex: number) =>
    getAppContext().getTabManager()?.moveTab(id, toIndex),
  );
  ipcMain.handle(
    IPC.SHOW_TAB_CONTEXT_MENU,
    (_event, tabId: string, anchor: ChromePopupAnchor) => {
      const mainWindow = getAppContext().getMainWindow();
      const tabManager = getAppContext().getTabManager();
      if (!mainWindow || !tabManager) return;

      const tab = tabManager.getState().tabs.find((entry) => entry.id === tabId);
      if (!tab) return;

      const menu = Menu.buildFromTemplate([
        {
          label: tab.isPinned ? 'Unpin tab' : 'Pin tab',
          enabled: !tab.isPrivate,
          click: () => tabManager.togglePinTab(tabId),
        },
        { type: 'separator' },
        {
          label: 'Close tab',
          click: () => tabManager.closeTab(tabId),
        },
      ]);

      menu.popup({
        window: mainWindow,
        x: Math.round(anchor.x),
        y: Math.round(anchor.y),
      });
    },
  );

  ipcMain.handle(IPC.ZOOM_IN, () => getAppContext().getTabManager()?.zoomIn() ?? 1);
  ipcMain.handle(IPC.ZOOM_OUT, () => getAppContext().getTabManager()?.zoomOut() ?? 1);
  ipcMain.handle(IPC.ZOOM_RESET, () => getAppContext().getTabManager()?.zoomReset() ?? 1);
  ipcMain.handle(IPC.GET_ZOOM, () => getAppContext().getTabManager()?.getZoom() ?? 1);

  ipcMain.handle(IPC.FIND_IN_PAGE, (_event, text: string, forward?: boolean) => {
    getAppContext().getTabManager()?.findInPage(text, forward);
  });
  ipcMain.handle(IPC.FIND_NEXT, (_event, forward?: boolean) => {
    getAppContext().getTabManager()?.findNext(forward);
  });
  ipcMain.handle(IPC.STOP_FIND_IN_PAGE, () => getAppContext().getTabManager()?.stopFindInPage());
  ipcMain.handle(IPC.TOGGLE_DEVTOOLS, () => getAppContext().getTabManager()?.toggleDevTools());

  ipcMain.handle(IPC.SET_CHROME_HEIGHT, (_event, height: number) => {
    setChromeHeight(height);
    getAppContext().getTabManager()?.layout();
  });

  ipcMain.handle(IPC.SET_WEB_CONTENT_HIDDEN, (_event, hidden: boolean) => {
    getAppContext().getTabManager()?.setWebContentHidden(hidden);
  });
}
