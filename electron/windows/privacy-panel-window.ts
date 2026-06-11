import { BrowserWindow, ipcMain } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';
import type { ChromePopupAnchor, PrivacySettings } from '@shared/types';

import {
  clearBrowsingData,
  getPrivacySettings,
  getPrivacyStats,
  registerPrivacyStateTarget,
  updatePrivacySettings,
} from '../services/privacy/privacy';
import {
  getContentProtectionState,
  isContentProtectionEnabled,
  setContentProtectionPreference,
} from '../services/privacy/content-protection';
import {
  computePopupBounds,
  POPUP_WEB_PREFERENCES,
  preloadPath,
  staticRoot,
} from './popup-utils';

export type { ChromePopupAnchor };

const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 548;
let privacyWindow: BrowserWindow | null = null;
let unregisterPrivacyTarget: (() => void) | null = null;
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
function syncPrivacyWindowBounds(parent: BrowserWindow): void {
  if (!privacyWindow || privacyWindow.isDestroyed() || !lastAnchor) return;
  privacyWindow.setBounds(computePanelBounds(parent, lastAnchor));
}

export function closePrivacyPanel(): void {
  unregisterPrivacyTarget?.();
  unregisterPrivacyTarget = null;
  lastAnchor = null;

  if (privacyWindow && !privacyWindow.isDestroyed()) {
    privacyWindow.destroy();
  }
  privacyWindow = null;
}

export function isPrivacyPanelOpen(): boolean {
  return privacyWindow !== null && !privacyWindow.isDestroyed();
}

function sendPanelSnapshot(): void {
  if (!privacyWindow || privacyWindow.isDestroyed()) return;

  privacyWindow.webContents.send(IPC_EVENTS.PRIVACY_PANEL_DATA, {
    settings: getPrivacySettings(),
    stats: getPrivacyStats(),
    protectionEnabled: isContentProtectionEnabled(),
    protectionSupported: getContentProtectionState().supported,
  });
}

function ensurePrivacyPanelIpc(parent: BrowserWindow): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('privacy-panel-close', () => {
    closePrivacyPanel();
  });

  ipcMain.handle(
    'privacy-panel-update-setting',
    (_event, key: keyof PrivacySettings, value: boolean) => {
      if (!privacyWindow || _event.sender !== privacyWindow.webContents) return null;
      return updatePrivacySettings({ [key]: value });
    },
  );

  ipcMain.handle('privacy-panel-toggle-protection', (event) => {
    if (!privacyWindow || event.sender !== privacyWindow.webContents) {
      return { enabled: false, supported: false };
    }

    const next = !isContentProtectionEnabled();
    setContentProtectionPreference(next);
    parent.setContentProtection(next);

    const state = getContentProtectionState();

    parent.webContents.send(IPC_EVENTS.CONTENT_PROTECTION_STATE, state);
    if (privacyWindow && !privacyWindow.isDestroyed()) {
      privacyWindow.webContents.send(IPC_EVENTS.PRIVACY_PANEL_PROTECTION, state);
    }
    return state;
  });

  ipcMain.handle('privacy-panel-clear-data', async (event) => {
    if (!privacyWindow || event.sender !== privacyWindow.webContents) return;
    await clearBrowsingData();
    sendPanelSnapshot();
  });
}

export function refreshPrivacyPanelIfOpen(_parent: BrowserWindow): void {
  if (!privacyWindow || privacyWindow.isDestroyed()) return;
  sendPanelSnapshot();
}

export function showPrivacyPanel(
  parent: BrowserWindow,
  isDev: boolean,
  anchor: ChromePopupAnchor,
  options?: { toggle?: boolean },
): void {
  ensurePrivacyPanelIpc(parent);

  if (privacyWindow && !privacyWindow.isDestroyed()) {
    if (options?.toggle) {
      closePrivacyPanel();
      return;
    }
    closePrivacyPanel();
  }

  lastAnchor = anchor;
  const bounds = computePanelBounds(parent, anchor);

  privacyWindow = new BrowserWindow({
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
    },  });

  privacyWindow.setAlwaysOnTop(true, 'pop-up-menu');

  const onParentBoundsChange = (): void => syncPrivacyWindowBounds(parent);
  parent.on('resize', onParentBoundsChange);
  parent.on('move', onParentBoundsChange);

  privacyWindow.on('blur', () => closePrivacyPanel());
  privacyWindow.on('closed', () => {
    parent.removeListener('resize', onParentBoundsChange);
    parent.removeListener('move', onParentBoundsChange);
    unregisterPrivacyTarget?.();
    unregisterPrivacyTarget = null;
    lastAnchor = null;
    privacyWindow = null;
  });

  privacyWindow.webContents.on('did-finish-load', () => {
    sendPanelSnapshot();
  });

  unregisterPrivacyTarget = registerPrivacyStateTarget(privacyWindow.webContents);

  void privacyWindow.loadFile(`${staticRoot(isDev)}/privacy-panel.html`);
  privacyWindow.show();
  privacyWindow.focus();
}
