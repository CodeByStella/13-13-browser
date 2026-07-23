import { ipcRenderer } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type {
  AppSettings,
  Bookmark,
  BookmarkAddedPayload,
  BookmarkToggleResult,
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
  togglePinTab: (id: string): Promise<void> => ipcRenderer.invoke(IPC.TOGGLE_PIN_TAB, id),
  moveTab: (id: string, toIndex: number): Promise<void> =>
    ipcRenderer.invoke(IPC.MOVE_TAB, id, toIndex),
  showTabContextMenu: (
    tabId: string,
    anchor: { x: number; y: number; width: number; height?: number },
  ): Promise<void> => ipcRenderer.invoke(IPC.SHOW_TAB_CONTEXT_MENU, tabId, anchor),
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
  toggleBookmark: (title: string, url: string, favicon?: string): Promise<BookmarkToggleResult> =>
    ipcRenderer.invoke(IPC.TOGGLE_BOOKMARK, title, url, favicon),
  removeBookmark: (id: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC.REMOVE_BOOKMARK, id),
  createBookmarkFolder: (title: string, parentId?: string | null): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC.CREATE_BOOKMARK_FOLDER, title, parentId ?? null),
  renameBookmark: (id: string, title: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC.RENAME_BOOKMARK, id, title),
  moveBookmark: (id: string, parentId: string | null): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC.MOVE_BOOKMARK, id, parentId),
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
  showBookmarkContextMenu: (
    anchor: { x: number; y: number; width: number; height?: number },
    targetId: string | null,
  ): Promise<void> => ipcRenderer.invoke(IPC.SHOW_BOOKMARK_CONTEXT_MENU, anchor, targetId),
  showBookmarkFolderMenu: (
    anchor: { x: number; y: number; width: number; height?: number },
    folderId: string,
  ): Promise<void> => ipcRenderer.invoke(IPC.SHOW_BOOKMARK_FOLDER_MENU, anchor, folderId),
  showBookmarkRename: (
    anchor: { x: number; y: number; width: number; height?: number },
    bookmarkId: string,
    defaultTitle: string,
  ): Promise<void> =>
    ipcRenderer.invoke(IPC.SHOW_BOOKMARK_RENAME, anchor, bookmarkId, defaultTitle),
  showTabPicker: (
    anchor: { x: number; y: number; width: number; height?: number },
    toggle?: boolean,
  ): Promise<boolean> => ipcRenderer.invoke(IPC.SHOW_TAB_PICKER, anchor, toggle),
  onTabPickerClosed: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on(IPC_EVENTS.TAB_PICKER_CLOSED, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.TAB_PICKER_CLOSED, listener);
  },
  getPrivacyState: (): Promise<PrivacyState> => ipcRenderer.invoke(IPC.GET_PRIVACY_STATE),
  updatePrivacySettings: (partial: Partial<PrivacySettings>): Promise<PrivacySettings> =>
    ipcRenderer.invoke(IPC.UPDATE_PRIVACY_SETTINGS, partial),
  clearBrowsingData: (): Promise<void> => ipcRenderer.invoke(IPC.CLEAR_BROWSING_DATA),
  windowMinimize: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
  windowToggleMaximize: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_TOGGLE_MAXIMIZE),
  windowClose: (): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC.WINDOW_IS_MAXIMIZED),
  getAppSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.GET_APP_SETTINGS),
  updateAppSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.UPDATE_APP_SETTINGS, partial),
  hideToTray: (): Promise<void> => ipcRenderer.invoke(IPC.HIDE_TO_TRAY),
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
  onBookmarkAdded: (callback: (payload: BookmarkAddedPayload) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: BookmarkAddedPayload) =>
      callback(payload);
    ipcRenderer.on(IPC_EVENTS.BOOKMARK_ADDED, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.BOOKMARK_ADDED, listener);
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
