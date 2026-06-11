import { app, BrowserWindow, Menu, Tray } from 'electron';

import { APP_DISPLAY_NAME, resolveAppIcon } from '../../lib/app-branding';
import { getAppSettings } from '../app-settings/app-settings';
import { closePrivacyPanel } from '../../windows/privacy-panel-window';
import { closeSitePermissionsPanel } from '../../windows/site-permissions-window';
import { closeTraySettingsPanel } from '../../windows/tray-settings-window';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let quitting = false;

export function setTrayMainWindow(window: BrowserWindow): void {
  mainWindow = window;
}

export function isAppQuitting(): boolean {
  return quitting;
}

export function markAppQuitting(): void {
  quitting = true;
}

export function initTray(window: BrowserWindow): void {
  mainWindow = window;
  const iconPath = resolveAppIcon();
  if (!iconPath) return;

  if (tray) {
    tray.destroy();
    tray = null;
  }

  tray = new Tray(iconPath);
  tray.setToolTip(APP_DISPLAY_NAME);
  rebuildTrayMenu();

  tray.on('click', () => {
    toggleWindowVisibility();
  });
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

export function shouldMinimizeToTray(): boolean {
  return getAppSettings().minimizeToTray;
}

export function shouldCloseToTray(): boolean {
  return getAppSettings().closeToTray;
}

function closePopups(): void {
  closePrivacyPanel();
  closeSitePermissionsPanel();
  closeTraySettingsPanel();
}

function rebuildTrayMenu(): void {
  if (!tray) return;

  const visible =
    !!mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.isVisible() &&
    !mainWindow.isMinimized();

  const menu = Menu.buildFromTemplate([
    {
      label: `Show ${APP_DISPLAY_NAME}`,
      click: () => showMainWindow(),
      enabled: !visible,
    },
    {
      label: 'Hide to tray',
      click: () => hideToTray(),
      enabled: visible,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => quitFromTray(),
    },
  ]);

  tray.setContextMenu(menu);
}

export function hideToTray(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  closePopups();
  mainWindow.hide();
  rebuildTrayMenu();
}

export function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  rebuildTrayMenu();
}

export function toggleWindowVisibility(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const visible = mainWindow.isVisible() && !mainWindow.isMinimized();
  if (visible) hideToTray();
  else showMainWindow();
}

export function quitFromTray(): void {
  quitting = true;
  app.quit();
}
