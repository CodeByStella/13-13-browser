import { contextBridge, ipcRenderer } from 'electron';

export interface NavigationState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

export interface ContentProtectionState {
  enabled: boolean;
  supported: boolean;
}

const browserApi = {
  navigate: (url: string): Promise<string> => ipcRenderer.invoke('navigate', url),
  goBack: (): Promise<void> => ipcRenderer.invoke('go-back'),
  goForward: (): Promise<void> => ipcRenderer.invoke('go-forward'),
  reload: (): Promise<void> => ipcRenderer.invoke('reload'),
  stop: (): Promise<void> => ipcRenderer.invoke('stop'),
  getNavigationState: (): Promise<NavigationState | null> =>
    ipcRenderer.invoke('get-navigation-state'),
  setContentProtection: (enabled: boolean): Promise<ContentProtectionState> =>
    ipcRenderer.invoke('set-content-protection', enabled),
  getContentProtection: (): Promise<ContentProtectionState> =>
    ipcRenderer.invoke('get-content-protection'),
  onNavigationState: (callback: (state: NavigationState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: NavigationState) =>
      callback(state);
    ipcRenderer.on('navigation-state', listener);
    return () => ipcRenderer.removeListener('navigation-state', listener);
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
