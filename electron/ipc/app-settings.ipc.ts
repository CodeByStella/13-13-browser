import { ipcMain } from 'electron';

import { IPC } from '@shared/ipc/channels';

import {
  getAppSettings,
  getTraySettingsSnapshot,
  updateAppSettings,
} from '../services/app-settings/app-settings';
import { hideToTray } from '../services/tray/tray-manager';

export function registerAppSettingsIpc(): void {
  ipcMain.handle(IPC.GET_APP_SETTINGS, () => getAppSettings());
  ipcMain.handle(IPC.UPDATE_APP_SETTINGS, (_event, partial) => updateAppSettings(partial));
  ipcMain.handle(IPC.GET_TRAY_SETTINGS_SNAPSHOT, () => getTraySettingsSnapshot());
  ipcMain.handle(IPC.HIDE_TO_TRAY, () => {
    hideToTray();
  });
}
