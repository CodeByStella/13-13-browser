import { contextBridge, ipcRenderer } from 'electron';

export interface TabInfo {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isActive: boolean;
  isSecure: boolean;
  isPrivate: boolean;
}

export interface BrowserState {
  tabs: TabInfo[];
  activeTabId: string | null;
  zoomLevel: number;
}

export interface ContentProtectionState {
  enabled: boolean;
  supported: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

export interface FindResult {
  activeMatch: number;
  matches: number;
}

export interface PrivacySettings {
  blockTrackers: boolean;
  sendDoNotTrack: boolean;
  blockPermissions: boolean;
  clearOnExit: boolean;
}

export interface PrivacyStats {
  trackersBlocked: number;
  permissionsDenied: number;
}

export interface PrivacyState {
  settings: PrivacySettings;
  stats: PrivacyStats;
}

const browserApi = {
  navigate: (url: string): Promise<string> => ipcRenderer.invoke('navigate', url),
  goHome: (): Promise<void> => ipcRenderer.invoke('go-home'),
  goBack: (): Promise<void> => ipcRenderer.invoke('go-back'),
  goForward: (): Promise<void> => ipcRenderer.invoke('go-forward'),
  reload: (): Promise<void> => ipcRenderer.invoke('reload'),
  stop: (): Promise<void> => ipcRenderer.invoke('stop'),
  getBrowserState: (): Promise<BrowserState> => ipcRenderer.invoke('get-browser-state'),
  createTab: (url?: string): Promise<void> => ipcRenderer.invoke('create-tab', url),
  createPrivateTab: (url?: string): Promise<void> => ipcRenderer.invoke('create-private-tab', url),
  closeTab: (id: string): Promise<void> => ipcRenderer.invoke('close-tab', id),
  switchTab: (id: string): Promise<void> => ipcRenderer.invoke('switch-tab', id),
  duplicateTab: (id: string): Promise<void> => ipcRenderer.invoke('duplicate-tab', id),
  reopenClosedTab: (): Promise<void> => ipcRenderer.invoke('reopen-closed-tab'),
  zoomIn: (): Promise<number> => ipcRenderer.invoke('zoom-in'),
  zoomOut: (): Promise<number> => ipcRenderer.invoke('zoom-out'),
  zoomReset: (): Promise<number> => ipcRenderer.invoke('zoom-reset'),
  getZoom: (): Promise<number> => ipcRenderer.invoke('get-zoom'),
  findInPage: (text: string, forward?: boolean): Promise<void> =>
    ipcRenderer.invoke('find-in-page', text, forward),
  findNext: (forward?: boolean): Promise<void> => ipcRenderer.invoke('find-next', forward),
  stopFindInPage: (): Promise<void> => ipcRenderer.invoke('stop-find-in-page'),
  toggleDevTools: (): Promise<void> => ipcRenderer.invoke('toggle-devtools'),
  getBookmarks: (): Promise<Bookmark[]> => ipcRenderer.invoke('get-bookmarks'),
  toggleBookmark: (title: string, url: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke('toggle-bookmark', title, url),
  removeBookmark: (id: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke('remove-bookmark', id),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),
  setContentProtection: (enabled: boolean): Promise<ContentProtectionState> =>
    ipcRenderer.invoke('set-content-protection', enabled),
  getContentProtection: (): Promise<ContentProtectionState> =>
    ipcRenderer.invoke('get-content-protection'),
  setChromeHeight: (height: number): Promise<void> =>
    ipcRenderer.invoke('set-chrome-height', height),
  setWebContentHidden: (hidden: boolean): Promise<void> =>
    ipcRenderer.invoke('set-web-content-hidden', hidden),
  getPrivacyState: (): Promise<PrivacyState> => ipcRenderer.invoke('get-privacy-state'),
  updatePrivacySettings: (partial: Partial<PrivacySettings>): Promise<PrivacySettings> =>
    ipcRenderer.invoke('update-privacy-settings', partial),
  clearBrowsingData: (): Promise<void> => ipcRenderer.invoke('clear-browsing-data'),
  windowMinimize: (): Promise<void> => ipcRenderer.invoke('window-minimize'),
  windowToggleMaximize: (): Promise<void> => ipcRenderer.invoke('window-toggle-maximize'),
  windowClose: (): Promise<void> => ipcRenderer.invoke('window-close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized'),
  onBrowserState: (callback: (state: BrowserState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: BrowserState) =>
      callback(state);
    ipcRenderer.on('browser-state', listener);
    return () => ipcRenderer.removeListener('browser-state', listener);
  },
  onContentProtectionState: (
    callback: (state: ContentProtectionState) => void,
  ): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: ContentProtectionState,
    ) => callback(state);
    ipcRenderer.on('content-protection-state', listener);
    return () => ipcRenderer.removeListener('content-protection-state', listener);
  },
  onBookmarksUpdated: (callback: (bookmarks: Bookmark[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, items: Bookmark[]) =>
      callback(items);
    ipcRenderer.on('bookmarks-updated', listener);
    return () => ipcRenderer.removeListener('bookmarks-updated', listener);
  },
  onFindResult: (callback: (result: FindResult) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: FindResult) =>
      callback(result);
    ipcRenderer.on('find-result', listener);
    return () => ipcRenderer.removeListener('find-result', listener);
  },
  onPrivacyState: (callback: (state: PrivacyState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: PrivacyState) =>
      callback(state);
    ipcRenderer.on('privacy-state', listener);
    return () => ipcRenderer.removeListener('privacy-state', listener);
  },
  onWindowMaximized: (callback: (maximized: boolean) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, maximized: boolean) =>
      callback(maximized);
    ipcRenderer.on('window-maximized', listener);
    return () => ipcRenderer.removeListener('window-maximized', listener);
  },
};

contextBridge.exposeInMainWorld('browserApi', browserApi);

export type BrowserApi = typeof browserApi;
