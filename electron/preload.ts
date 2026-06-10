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
}

export interface BrowserState {
  tabs: TabInfo[];
  activeTabId: string | null;
}

export interface ContentProtectionState {
  enabled: boolean;
  supported: boolean;
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
  closeTab: (id: string): Promise<void> => ipcRenderer.invoke('close-tab', id),
  switchTab: (id: string): Promise<void> => ipcRenderer.invoke('switch-tab', id),
  duplicateTab: (id: string): Promise<void> => ipcRenderer.invoke('duplicate-tab', id),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),
  setContentProtection: (enabled: boolean): Promise<ContentProtectionState> =>
    ipcRenderer.invoke('set-content-protection', enabled),
  getContentProtection: (): Promise<ContentProtectionState> =>
    ipcRenderer.invoke('get-content-protection'),
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
};

contextBridge.exposeInMainWorld('browserApi', browserApi);

export type BrowserApi = typeof browserApi;
