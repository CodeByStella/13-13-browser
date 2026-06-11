import { ipcRenderer } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type {
  ChromeMenuItemPayload,
  ContentProtectionState,
  PrivacyPanelData,
  PrivacySettings,
  PrivacyState,
  SitePermissionKey,
  SitePermissionsSnapshot,
  SitePermissionValue,
} from '@shared/types';

export const chromeMenuApi = {
  onItems: (callback: (items: ChromeMenuItemPayload[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, items: ChromeMenuItemPayload[]) =>
      callback(items);
    ipcRenderer.on(IPC_EVENTS.MENU_ITEMS, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.MENU_ITEMS, listener);
  },
  select: (id: string): Promise<void> => ipcRenderer.invoke(IPC.CHROME_MENU_SELECT, id),
};

export const privacyPanelApi = {
  onData: (callback: (data: PrivacyPanelData) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: PrivacyPanelData) => callback(data);
    ipcRenderer.on(IPC_EVENTS.PRIVACY_PANEL_DATA, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.PRIVACY_PANEL_DATA, listener);
  },
  onState: (callback: (state: PrivacyState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: PrivacyState) => callback(state);
    ipcRenderer.on(IPC_EVENTS.PRIVACY_STATE, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.PRIVACY_STATE, listener);
  },
  onProtection: (callback: (state: ContentProtectionState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: ContentProtectionState) =>
      callback(state);
    ipcRenderer.on(IPC_EVENTS.PRIVACY_PANEL_PROTECTION, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.PRIVACY_PANEL_PROTECTION, listener);
  },
  updateSetting: (key: keyof PrivacySettings, value: boolean): Promise<PrivacySettings> =>
    ipcRenderer.invoke(IPC.PRIVACY_PANEL_UPDATE_SETTING, key, value),
  toggleProtection: (): Promise<ContentProtectionState> =>
    ipcRenderer.invoke(IPC.PRIVACY_PANEL_TOGGLE_PROTECTION),
  clearData: (): Promise<void> => ipcRenderer.invoke(IPC.PRIVACY_PANEL_CLEAR_DATA),
  close: (): Promise<void> => ipcRenderer.invoke(IPC.PRIVACY_PANEL_CLOSE),
};

export const sitePermissionsApi = {
  onData: (callback: (data: SitePermissionsSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: SitePermissionsSnapshot) =>
      callback(data);
    ipcRenderer.on(IPC_EVENTS.SITE_PERMISSIONS_DATA, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.SITE_PERMISSIONS_DATA, listener);
  },
  setPermission: (
    key: SitePermissionKey,
    value: SitePermissionValue,
  ): Promise<SitePermissionsSnapshot | null> =>
    ipcRenderer.invoke(IPC.SITE_PERMISSIONS_SET, key, value),
  close: (): Promise<void> => ipcRenderer.invoke(IPC.SITE_PERMISSIONS_CLOSE),
};

export type { ChromeMenuItemPayload, SitePermissionsSnapshot, SitePermissionKey, SitePermissionValue };
