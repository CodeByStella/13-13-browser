import { BrowserWindow, ipcMain } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';
import type { ChromePopupAnchor, SitePermissionKey, SitePermissionValue } from '@shared/types';

import {
  getSitePermissionsSnapshot,
  isManageableSiteUrl,
  updateSitePermission,
} from '../services/permissions/site-permissions';
import {
  computePopupBounds,
  loadStaticPage,
  POPUP_WEB_PREFERENCES,
  preloadPath,
} from './popup-utils';

export type { ChromePopupAnchor };

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 360;
let siteWindow: BrowserWindow | null = null;
let lastAnchor: ChromePopupAnchor | null = null;
let activeOrigin = '';
let ipcRegistered = false;

function computePanelBounds(
  parent: BrowserWindow,
  anchor: ChromePopupAnchor,
): { x: number; y: number; width: number; height: number } {
  return computePopupBounds(parent, anchor, {
    panelWidth: PANEL_WIDTH,
    panelHeight: PANEL_HEIGHT,
    align: 'left',
  });
}
function syncSiteWindowBounds(parent: BrowserWindow): void {
  if (!siteWindow || siteWindow.isDestroyed() || !lastAnchor) return;
  siteWindow.setBounds(computePanelBounds(parent, lastAnchor));
}

export function closeSitePermissionsPanel(): void {
  lastAnchor = null;
  activeOrigin = '';

  if (siteWindow && !siteWindow.isDestroyed()) {
    siteWindow.destroy();
  }
  siteWindow = null;
}

function sendPanelSnapshot(): void {
  if (!siteWindow || siteWindow.isDestroyed() || !activeOrigin) return;

  const snapshot = getSitePermissionsSnapshot(activeOrigin);
  if (!snapshot) return;

  siteWindow.webContents.send(IPC_EVENTS.SITE_PERMISSIONS_DATA, snapshot);
}

function ensureSitePermissionsIpc(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('site-permissions-close', () => {
    closeSitePermissionsPanel();
  });

  ipcMain.handle(
    'site-permissions-set',
    (event, key: SitePermissionKey, value: SitePermissionValue) => {
      if (!siteWindow || event.sender !== siteWindow.webContents || !activeOrigin) return null;
      return updateSitePermission(activeOrigin, key, value);
    },
  );
}

export function showSitePermissionsPanel(
  parent: BrowserWindow,
  isDev: boolean,
  anchor: ChromePopupAnchor,
  url: string,
  options?: { toggle?: boolean },
): void {
  if (!isManageableSiteUrl(url)) return;

  ensureSitePermissionsIpc();

  if (siteWindow && !siteWindow.isDestroyed()) {
    if (options?.toggle) {
      closeSitePermissionsPanel();
      return;
    }
    closeSitePermissionsPanel();
  }

  const snapshot = getSitePermissionsSnapshot(url);
  if (!snapshot) return;

  activeOrigin = snapshot.origin;
  lastAnchor = anchor;
  const bounds = computePanelBounds(parent, anchor);

  siteWindow = new BrowserWindow({
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

  siteWindow.setAlwaysOnTop(true, 'pop-up-menu');

  const onParentBoundsChange = (): void => syncSiteWindowBounds(parent);
  parent.on('resize', onParentBoundsChange);
  parent.on('move', onParentBoundsChange);

  siteWindow.on('blur', () => closeSitePermissionsPanel());
  siteWindow.on('closed', () => {
    parent.removeListener('resize', onParentBoundsChange);
    parent.removeListener('move', onParentBoundsChange);
    lastAnchor = null;
    activeOrigin = '';
    siteWindow = null;
  });

  siteWindow.webContents.on('did-finish-load', () => {
    sendPanelSnapshot();
  });

  loadStaticPage(siteWindow.webContents, isDev, 'site-permissions.html');
  siteWindow.show();
  siteWindow.focus();
}
