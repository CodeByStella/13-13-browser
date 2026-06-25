import { ipcMain } from 'electron';

import { IPC } from '@shared/ipc/channels';

import {
  checkForUpdates,
  downloadUpdate,
  getUpdateState,
  installUpdate,
} from '../services/update/app-updater';

export function registerUpdateIpc(): void {
  ipcMain.handle(IPC.GET_UPDATE_STATE, () => getUpdateState());
  ipcMain.handle(IPC.CHECK_FOR_UPDATES, () => checkForUpdates());
  ipcMain.handle(IPC.DOWNLOAD_UPDATE, () => downloadUpdate());
  ipcMain.handle(IPC.INSTALL_UPDATE, () => {
    installUpdate();
  });
}
