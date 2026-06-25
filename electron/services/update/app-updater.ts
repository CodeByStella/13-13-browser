import { app, type WebContents } from 'electron';
import { autoUpdater } from 'electron-updater';

import { IPC_EVENTS } from '@shared/ipc/channels';
import type { UpdateState } from '@shared/types';

let state: UpdateState = {
  status: app.isPackaged ? 'idle' : 'unsupported',
  currentVersion: app.getVersion(),
};
let aboutTarget: WebContents | null = null;
let initialized = false;

let explicitCheck = false;

function broadcast(next: UpdateState): void {
  state = next;
  if (aboutTarget && !aboutTarget.isDestroyed()) {
    aboutTarget.send(IPC_EVENTS.UPDATE_STATE, state);
  }
}

function patchState(partial: Partial<UpdateState>): void {
  broadcast({ ...state, ...partial });
}

export function getUpdateState(): UpdateState {
  return { ...state };
}

export function registerAboutUpdateTarget(webContents: WebContents): void {
  aboutTarget = webContents;
  webContents.once('destroyed', () => {
    if (aboutTarget === webContents) aboutTarget = null;
  });
  if (!webContents.isDestroyed()) {
    webContents.send(IPC_EVENTS.UPDATE_STATE, state);
  }
}

export function initAppUpdater(): void {
  if (initialized) return;
  initialized = true;

  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    patchState({ status: 'checking', version: undefined, percent: undefined, message: undefined });
  });

  autoUpdater.on('update-available', (info) => {
    explicitCheck = false;
    patchState({
      status: 'available',
      version: info.version,
      percent: undefined,
      message: undefined,
    });
  });

  autoUpdater.on('update-not-available', () => {
    explicitCheck = false;
    patchState({
      status: 'not-available',
      version: undefined,
      percent: undefined,
      message: undefined,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    patchState({
      status: 'downloading',
      percent: Math.round(progress.percent),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    patchState({
      status: 'downloaded',
      version: info.version,
      percent: 100,
      message: undefined,
    });
  });

  autoUpdater.on('error', (error) => {
    if (!explicitCheck) {
      patchState({ status: 'idle', message: undefined });
      explicitCheck = false;
      return;
    }
    patchState({
      status: 'error',
      message: error.message,
    });
    explicitCheck = false;
  });

  setTimeout(() => {
    void checkForUpdates({ silent: true });
  }, 8000);
}

export async function checkForUpdates(options?: { silent?: boolean }): Promise<UpdateState> {
  if (!app.isPackaged) {
    return getUpdateState();
  }

  if (state.status === 'checking' || state.status === 'downloading') {
    return getUpdateState();
  }

  explicitCheck = !options?.silent;

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    if (explicitCheck) {
      patchState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Update check failed',
      });
    }
    explicitCheck = false;
  }

  return getUpdateState();
}

export async function downloadUpdate(): Promise<UpdateState> {
  if (!app.isPackaged || state.status !== 'available') {
    return getUpdateState();
  }

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    patchState({
      status: 'error',
      message: error instanceof Error ? error.message : 'Download failed',
    });
  }

  return getUpdateState();
}

export function installUpdate(): void {
  if (!app.isPackaged || state.status !== 'downloaded') return;
  autoUpdater.quitAndInstall();
}
