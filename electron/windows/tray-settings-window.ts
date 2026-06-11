import { BrowserWindow, ipcMain } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type { AppSettings, ChromePopupAnchor } from '@shared/types';

import {
  getTraySettingsSnapshot,
  updateAppSettings,
} from '../services/app-settings/app-settings';
import {
  computePopupBounds,
  loadStaticPage,
  POPUP_WEB_PREFERENCES,
  preloadPath,
} from './popup-utils';

const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 430;

let settingsWindow: BrowserWindow | null = null;
let lastAnchor: ChromePopupAnchor | null = null;
let ipcRegistered = false;

function computePanelBounds(
  parent: BrowserWindow,
  anchor: ChromePopupAnchor,
): { x: number; y: number; width: number; height: number } {
  return computePopupBounds(parent, anchor, {
    panelWidth: PANEL_WIDTH,
    panelHeight: PANEL_HEIGHT,
    align: 'right',
  });
}

function syncBounds(parent: BrowserWindow): void {
  if (!settingsWindow || settingsWindow.isDestroyed() || !lastAnchor) return;
  settingsWindow.setBounds(computePanelBounds(parent, lastAnchor));
}

function sendSnapshot(): void {
  if (!settingsWindow || settingsWindow.isDestroyed()) return;
  settingsWindow.webContents.send(IPC_EVENTS.TRAY_SETTINGS_DATA, getTraySettingsSnapshot());
}

export function closeTraySettingsPanel(): void {
  lastAnchor = null;
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.destroy();
  }
  settingsWindow = null;
}

export function isTraySettingsPanelOpen(): boolean {
  return settingsWindow !== null && !settingsWindow.isDestroyed();
}

function ensureTraySettingsIpc(parent: BrowserWindow): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle(IPC.TRAY_SETTINGS_CLOSE, () => {
    closeTraySettingsPanel();
  });

  ipcMain.handle(
    IPC.TRAY_SETTINGS_UPDATE,
    (event, partial: Partial<AppSettings>) => {
      if (!settingsWindow || event.sender !== settingsWindow.webContents) {
        return getTraySettingsSnapshot();
      }
      updateAppSettings(partial);
      const snapshot = getTraySettingsSnapshot();
      sendSnapshot();
      return snapshot;
    },
  );
}

export function showTraySettingsPanel(
  parent: BrowserWindow,
  isDev: boolean,
  anchor: ChromePopupAnchor,
): void {
  ensureTraySettingsIpc(parent);

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    closeTraySettingsPanel();
  }

  lastAnchor = anchor;
  const bounds = computePanelBounds(parent, anchor);

  settingsWindow = new BrowserWindow({
    parent,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    show: false,
    ...bounds,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: preloadPath(),
      ...POPUP_WEB_PREFERENCES,
    },
  });

  settingsWindow.setAlwaysOnTop(true, 'pop-up-menu');

  const onParentBoundsChange = (): void => syncBounds(parent);
  parent.on('resize', onParentBoundsChange);
  parent.on('move', onParentBoundsChange);

  settingsWindow.on('blur', () => {
    setTimeout(() => {
      if (!settingsWindow || settingsWindow.isDestroyed()) return;
      if (settingsWindow.isFocused()) return;
      closeTraySettingsPanel();
    }, 120);
  });

  settingsWindow.on('closed', () => {
    parent.removeListener('resize', onParentBoundsChange);
    parent.removeListener('move', onParentBoundsChange);
    lastAnchor = null;
    settingsWindow = null;
  });

  settingsWindow.webContents.on('did-finish-load', () => {
    sendSnapshot();
  });

  loadStaticPage(settingsWindow.webContents, isDev, 'tray-settings.html');
  settingsWindow.show();
  settingsWindow.focus();
}
