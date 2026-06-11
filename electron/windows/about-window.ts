import { BrowserWindow, ipcMain, app } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type { AboutInfo } from '@shared/types';

import { POPUP_WEB_PREFERENCES, loadStaticPage, preloadPath } from './popup-utils';

let aboutWindow: BrowserWindow | null = null;
let ipcRegistered = false;

function aboutInfo(): AboutInfo {
  return {
    name: '13.13 Browser',
    version: app.getVersion(),
    tagline: 'Built for the best user privacy — strong defaults for tracking, permissions, and your data.',
    repository: 'https://github.com/CodeByStella/13-13-browser',
    license: 'MIT',
  };
}

function closeAboutWindow(): void {
  if (aboutWindow && !aboutWindow.isDestroyed()) {
    aboutWindow.destroy();
  }
  aboutWindow = null;
}

function ensureAboutIpc(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle(IPC.ABOUT_CLOSE, (event) => {
    if (!aboutWindow || event.sender !== aboutWindow.webContents) return;
    closeAboutWindow();
  });
}

export function showAboutWindow(parent: BrowserWindow, isDev: boolean): void {
  ensureAboutIpc();
  closeAboutWindow();

  const width = 360;
  const height = 420;
  const parentBounds = parent.getBounds();
  const x = Math.round(parentBounds.x + (parentBounds.width - width) / 2);
  const y = Math.round(parentBounds.y + (parentBounds.height - height) / 2);

  aboutWindow = new BrowserWindow({
    parent,
    modal: true,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    show: false,
    width,
    height,
    x,
    y,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: preloadPath(),
      ...POPUP_WEB_PREFERENCES,
    },
  });

  aboutWindow.setAlwaysOnTop(true, 'pop-up-menu');

  aboutWindow.webContents.on('did-finish-load', () => {
    aboutWindow?.webContents.send(IPC_EVENTS.ABOUT_DATA, aboutInfo());
  });

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });

  loadStaticPage(aboutWindow.webContents, isDev, 'about.html');
  aboutWindow.show();
  aboutWindow.focus();
}
