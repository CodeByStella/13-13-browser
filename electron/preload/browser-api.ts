import { ipcRenderer } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type {
  Bookmark,
  BrowserState,
  ContentProtectionState,
  FindResult,
  PrivacySettings,
  PrivacyState,
} from '@shared/types';

export const browserApi = {
  navigate: (url: string): Promise<string> => ipcRenderer.invoke(IPC.NAVIGATE, url),
  goHome: (): Promise<void> => ipcRenderer.invoke(IPC.GO_HOME),
  goBack: (): Promise<void> => ipcRenderer.invoke(IPC.GO_BACK),
  goForward: (): Promise<void> => ipcRenderer.invoke(IPC.GO_FORWARD),
  reload: (): Promise<void> => ipcRenderer.invoke(IPC.RELOAD),
  stop: (): Promise<void> => ipcRenderer.invoke(IPC.STOP),
  getBrowserState: (): Promise<BrowserState> => ipcRenderer.invoke(IPC.GET_BROWSER_STATE),
  createTab: (url?: string): Promise<void> => ipcRenderer.invoke(IPC.CREATE_TAB, url),
  createPrivateTab: (url?: string): Promise<void> => ipcRenderer.invoke(IPC.CREATE_PRIVATE_TAB, url),
  closeTab: (id: string): Promise<void> => ipcRenderer.invoke(IPC.CLOSE_TAB, id),
  switchTab: (id: string): Promise<void> => ipcRenderer.invoke(IPC.SWITCH_TAB, id),
  duplicateTab: (id: string): Promise<void> => ipcRenderer.invoke(IPC.DUPLICATE_TAB, id),
  reopenClosedTab: (): Promise<void> => ipcRenderer.invoke(IPC.REOPEN_CLOSED_TAB),
  zoomIn: (): Promise<number> => ipcRenderer.invoke(IPC.ZOOM_IN),
  zoomOut: (): Promise<number> => ipcRenderer.invoke(IPC.ZOOM_OUT),
  zoomReset: (): Promise<number> => ipcRenderer.invoke(IPC.ZOOM_RESET),
  getZoom: (): Promise<number> => ipcRenderer.invoke(IPC.GET_ZOOM),
  findInPage: (text: string, forward?: boolean): Promise<void> =>
    ipcRenderer.invoke(IPC.FIND_IN_PAGE, text, forward),
  findNext: (forward?: boolean): Promise<void> => ipcRenderer.invoke(IPC.FIND_NEXT, forward),
  stopFindInPage: (): Promise<void> => ipcRenderer.invoke(IPC.STOP_FIND_IN_PAGE),
  toggleDevTools: (): Promise<void> => ipcRenderer.invoke(IPC.TOGGLE_DEVTOOLS),
  getBookmarks: (): Promise<Bookmark[]> => ipcRenderer.invoke(IPC.GET_BOOKMARKS),
  toggleBookmark: (title: string, url: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC.TOGGLE_BOOKMARK, title, url),
  removeBookmark: (id: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC.REMOVE_BOOKMARK, id),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  setContentProtection: (enabled: boolean): Promise<ContentProtectionState> =>
    ipcRenderer.invoke(IPC.SET_CONTENT_PROTECTION, enabled),
  getContentProtection: (): Promise<ContentProtectionState> =>
    ipcRenderer.invoke(IPC.GET_CONTENT_PROTECTION),
  setChromeHeight: (height: number): Promise<void> =>
    ipcRenderer.invoke(IPC.SET_CHROME_HEIGHT, height),
  setWebContentHidden: (hidden: boolean): Promise<void> =>
    ipcRenderer.invoke(IPC.SET_WEB_CONTENT_HIDDEN, hidden),
  showToolbarMenu: (anchor: { x: number; y: number; width: number }): Promise<void> =>
    ipcRenderer.invoke(IPC.SHOW_TOOLBAR_MENU, anchor),
  showPrivacyPanel: (
    anchor: { x: number; y: number; width: number; height?: number },
    toggle?: boolean,
  ): Promise<void> => ipcRenderer.invoke(IPC.SHOW_PRIVACY_PANEL, anchor, toggle),
  showSitePermissions: (
    anchor: { x: number; y: number; width: number; height?: number },
    toggle?: boolean,
  ): Promise<void> => ipcRenderer.invoke(IPC.SHOW_SITE_PERMISSIONS, anchor, toggle),
  getPrivacyState: (): Promise<PrivacyState> => ipcRenderer.invoke(IPC.GET_PRIVACY_STATE),
  updatePrivacySettings: (partial: Partial<PrivacySettings>): Promise<PrivacySettings> =>
    ipcRenderer.invoke(IPC.UPDATE_PRIVACY_SETTINGS, partial),
  clearBrowsingData: (): Promise<void> => ipcRenderer.invoke(IPC.CLEAR_BROWSING_DATA),
  windowMinimize: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
  windowToggleMaximize: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_TOGGLE_MAXIMIZE),
  windowClose: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC.WINDOW_IS_MAXIMIZED),
  onBrowserState: (callback: (state: BrowserState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: BrowserState) => callback(state);
    ipcRenderer.on(IPC_EVENTS.BROWSER_STATE, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.BROWSER_STATE, listener);
  },
  onContentProtectionState: (
    callback: (state: ContentProtectionState) => void,
  ): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: ContentProtectionState) =>
      callback(state);
    ipcRenderer.on(IPC_EVENTS.CONTENT_PROTECTION_STATE, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.CONTENT_PROTECTION_STATE, listener);
  },
  onBookmarksUpdated: (callback: (bookmarks: Bookmark[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, items: Bookmark[]) => callback(items);
    ipcRenderer.on(IPC_EVENTS.BOOKMARKS_UPDATED, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.BOOKMARKS_UPDATED, listener);
  },
  onFindResult: (callback: (result: FindResult) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: FindResult) => callback(result);
    ipcRenderer.on(IPC_EVENTS.FIND_RESULT, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.FIND_RESULT, listener);
  },
  onPrivacyState: (callback: (state: PrivacyState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: PrivacyState) => callback(state);
    ipcRenderer.on(IPC_EVENTS.PRIVACY_STATE, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.PRIVACY_STATE, listener);
  },
  onWindowMaximized: (callback: (maximized: boolean) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, maximized: boolean) => callback(maximized);
    ipcRenderer.on(IPC_EVENTS.WINDOW_MAXIMIZED, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.WINDOW_MAXIMIZED, listener);
  },
  onChromeMenuAction: (callback: (action: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on(IPC_EVENTS.CHROME_MENU_ACTION, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.CHROME_MENU_ACTION, listener);
  },
};

export type BrowserApi = typeof browserApi;
