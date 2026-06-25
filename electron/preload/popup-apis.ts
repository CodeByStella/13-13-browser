import { ipcRenderer } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type {
  AboutInfo,
  AppSettings,
  BookmarkMenuItemPayload,
  ChromeMenuItemPayload,
  ContentProtectionState,
  PrivacyPanelData,
  PrivacySettings,
  PrivacyState,
  SitePermissionKey,
  SitePermissionsSnapshot,
  SitePermissionValue,
  TabPickerItemPayload,
  TraySettingsPanelData,
  UpdateState,
} from '@shared/types';

export const bookmarkMenuApi = {
  onItems: (callback: (items: BookmarkMenuItemPayload[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, items: BookmarkMenuItemPayload[]) =>
      callback(items);
    ipcRenderer.on(IPC_EVENTS.BOOKMARK_MENU_ITEMS, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.BOOKMARK_MENU_ITEMS, listener);
  },
  onShowRename: (
    callback: (payload: { id: string; defaultTitle: string }) => void,
  ): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: { id: string; defaultTitle: string },
    ) => callback(payload);
    ipcRenderer.on(IPC_EVENTS.BOOKMARK_MENU_SHOW_RENAME, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.BOOKMARK_MENU_SHOW_RENAME, listener);
  },
  select: (id: string): Promise<void> => ipcRenderer.invoke(IPC.BOOKMARK_MENU_SELECT, id),
  beginPrompt: (): Promise<void> => ipcRenderer.invoke(IPC.BOOKMARK_MENU_BEGIN_PROMPT),
  resize: (width: number, height: number): Promise<void> =>
    ipcRenderer.invoke(IPC.BOOKMARK_MENU_RESIZE, width, height),
  close: (): Promise<void> => ipcRenderer.invoke(IPC.BOOKMARK_MENU_CLOSE),
  rename: (id: string, title: string): Promise<void> =>
    ipcRenderer.invoke(IPC.BOOKMARK_MENU_RENAME, id, title),
  createFolder: (parentId: string | null, title: string): Promise<void> =>
    ipcRenderer.invoke(IPC.BOOKMARK_MENU_CREATE_FOLDER, parentId, title),
};

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

export const traySettingsApi = {
  onData: (callback: (data: TraySettingsPanelData) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: TraySettingsPanelData) =>
      callback(data);
    ipcRenderer.on(IPC_EVENTS.TRAY_SETTINGS_DATA, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.TRAY_SETTINGS_DATA, listener);
  },
  update: (partial: Partial<AppSettings>): Promise<TraySettingsPanelData> =>
    ipcRenderer.invoke(IPC.TRAY_SETTINGS_UPDATE, partial),
  hideNow: (): Promise<void> => ipcRenderer.invoke(IPC.HIDE_TO_TRAY),
  close: (): Promise<void> => ipcRenderer.invoke(IPC.TRAY_SETTINGS_CLOSE),
};

export const aboutApi = {
  onData: (callback: (data: AboutInfo) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: AboutInfo) => callback(data);
    ipcRenderer.on(IPC_EVENTS.ABOUT_DATA, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.ABOUT_DATA, listener);
  },
  close: (): Promise<void> => ipcRenderer.invoke(IPC.ABOUT_CLOSE),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  getUpdateState: (): Promise<UpdateState> => ipcRenderer.invoke(IPC.GET_UPDATE_STATE),
  checkForUpdates: (): Promise<UpdateState> => ipcRenderer.invoke(IPC.CHECK_FOR_UPDATES),
  downloadUpdate: (): Promise<UpdateState> => ipcRenderer.invoke(IPC.DOWNLOAD_UPDATE),
  installUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.INSTALL_UPDATE),
  onUpdateState: (callback: (state: UpdateState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: UpdateState) => callback(state);
    ipcRenderer.on(IPC_EVENTS.UPDATE_STATE, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.UPDATE_STATE, listener);
  },
};

export const tabPickerApi = {
  onData: (callback: (tabs: TabPickerItemPayload[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, tabs: TabPickerItemPayload[]) =>
      callback(tabs);
    ipcRenderer.on(IPC_EVENTS.TAB_PICKER_DATA, listener);
    return () => ipcRenderer.removeListener(IPC_EVENTS.TAB_PICKER_DATA, listener);
  },
  select: (tabId: string): Promise<void> => ipcRenderer.invoke(IPC.TAB_PICKER_SELECT, tabId),
  close: (): Promise<void> => ipcRenderer.invoke(IPC.TAB_PICKER_CLOSE),
};

export type {
  AboutInfo,
  BookmarkMenuItemPayload,
  ChromeMenuItemPayload,
  SitePermissionsSnapshot,
  SitePermissionKey,
  SitePermissionValue,
};
