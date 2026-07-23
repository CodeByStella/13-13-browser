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

/** True when the user (About dialog) requested a check — errors must surface. */
let explicitCheck = false;
/** In-flight check promise so concurrent calls share one request. */
let checkInFlight: Promise<UpdateState> | null = null;

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

function formatUpdateError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);

  if (
    /404/.test(text) ||
    /releases\.atom/i.test(text) ||
    /HttpError:\s*404/i.test(text) ||
    /Cannot find latest/i.test(text)
  ) {
    return 'Could not reach GitHub Releases. Make sure the repository is public and a release with latest.yml exists.';
  }

  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|net::/i.test(text)) {
    return 'Network error while checking for updates. Try again when you are online.';
  }

  if (/ENOENT|latest\.yml/i.test(text)) {
    return 'Update metadata (latest.yml) is missing from the latest GitHub Release.';
  }

  return text || 'Update check failed.';
}

export function initAppUpdater(): void {
  if (initialized) return;
  initialized = true;

  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('checking-for-update', () => {
    patchState({
      status: 'checking',
      version: undefined,
      percent: undefined,
      message: undefined,
    });
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
      message: undefined,
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
      // Background / silent checks stay quiet — About stays idle until the user asks.
      if (state.status === 'checking' || state.status === 'error') {
        patchState({ status: 'idle', message: undefined, percent: undefined });
      }
      return;
    }

    patchState({
      status: 'error',
      message: formatUpdateError(error),
      percent: undefined,
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

  const silent = options?.silent === true;
  if (!silent) {
    explicitCheck = true;
  }

  // Don't interrupt an active download / ready install.
  if (state.status === 'downloading' || state.status === 'downloaded') {
    return getUpdateState();
  }

  // Join an in-flight check (e.g. silent startup check + About click).
  if (checkInFlight) {
    return checkInFlight;
  }

  checkInFlight = (async () => {
    try {
      if (!silent || state.status === 'idle' || state.status === 'error') {
        patchState({
          status: 'checking',
          version: undefined,
          percent: undefined,
          message: undefined,
        });
      }

      await autoUpdater.checkForUpdates();
    } catch (error) {
      if (explicitCheck) {
        patchState({
          status: 'error',
          message: formatUpdateError(error),
          percent: undefined,
        });
        explicitCheck = false;
      } else if (state.status === 'checking') {
        patchState({ status: 'idle', message: undefined, percent: undefined });
      }
    } finally {
      checkInFlight = null;
    }

    return getUpdateState();
  })();

  return checkInFlight;
}

export async function downloadUpdate(): Promise<UpdateState> {
  if (!app.isPackaged || state.status !== 'available') {
    return getUpdateState();
  }

  patchState({
    status: 'downloading',
    percent: 0,
    message: undefined,
  });

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    patchState({
      status: 'error',
      message: formatUpdateError(error),
      percent: undefined,
    });
  }

  return getUpdateState();
}

export function installUpdate(): void {
  if (!app.isPackaged || state.status !== 'downloaded') return;
  // Force relaunch after install so Windows NSIS updates apply cleanly.
  autoUpdater.quitAndInstall(false, true);
}
