import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';
import type { ChromeMenuItemPayload, ChromePopupAnchor } from '@shared/types';

import { showPrivacyPanel } from './privacy-panel-window';
import type { TabManager } from '../services/tabs/tab-manager';
import { staticRoot, preloadPath, POPUP_WEB_PREFERENCES } from './popup-utils';

export type { ChromeMenuItemPayload, ChromePopupAnchor };

const MENU_WIDTH = 240;
const ITEM_HEIGHT = 34;
const MENU_PADDING = 8;

let menuWindow: BrowserWindow | null = null;
let menuContext: {
  parent: BrowserWindow;
  tabManager: TabManager | null;
  anchor: ChromePopupAnchor;
} | null = null;
let ipcRegistered = false;

function closeChromeMenu(): void {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.destroy();
  }
  menuWindow = null;
}

function buildToolbarItems(): ChromeMenuItemPayload[] {
  return [
    { id: 'new-private-tab', label: 'New private tab', shortcut: 'Ctrl+Shift+N', icon: 'private' },
    { id: 'open-find', label: 'Find in page', shortcut: 'Ctrl+F', icon: 'search' },
    { id: 'open-privacy', label: 'Privacy dashboard', icon: 'shield' },
    { id: 'toggle-devtools', label: 'Developer tools', shortcut: 'F12', icon: 'devtools' },
  ];
}

function handleToolbarAction(
  id: string,
  parent: BrowserWindow,
  tabManager: TabManager | null,
): void {
  switch (id) {
    case 'new-private-tab':
      tabManager?.createPrivateTab();
      break;
    case 'open-find':
      parent.webContents.send(IPC_EVENTS.CHROME_MENU_ACTION, 'open-find');
      break;
    case 'open-privacy':
      showPrivacyPanel(parent, !!process.env.VITE_DEV_SERVER_URL, menuContext!.anchor);
      break;
    case 'toggle-devtools':
      tabManager?.toggleDevTools();
      break;
    default:
      break;
  }
}

function ensureChromeMenuIpc(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('chrome-menu-select', (event: IpcMainInvokeEvent, id: string) => {
    if (!menuWindow || event.sender !== menuWindow.webContents || !menuContext) return;
    handleToolbarAction(id, menuContext.parent, menuContext.tabManager);
    closeChromeMenu();
  });
}

export function showToolbarChromeMenu(
  parent: BrowserWindow,
  tabManager: TabManager | null,
  anchor: { x: number; y: number; width: number },
  isDev: boolean,
): void {
  ensureChromeMenuIpc();
  menuContext = { parent, tabManager, anchor };
  closeChromeMenu();

  const items = buildToolbarItems();
  const menuHeight = items.length * ITEM_HEIGHT + MENU_PADDING;
  const contentBounds = parent.getContentBounds();
  const screenX = contentBounds.x + anchor.x + anchor.width - MENU_WIDTH;
  const screenY = contentBounds.y + anchor.y;

  menuWindow = new BrowserWindow({
    parent,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    show: false,
    width: MENU_WIDTH,
    height: menuHeight,
    x: Math.round(screenX),
    y: Math.round(screenY),
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: preloadPath(),
      ...POPUP_WEB_PREFERENCES,
    },
  });

  menuWindow.setAlwaysOnTop(true, 'pop-up-menu');

  menuWindow.webContents.on('did-finish-load', () => {
    menuWindow?.webContents.send(IPC_EVENTS.MENU_ITEMS, items);
  });

  menuWindow.on('blur', () => closeChromeMenu());
  menuWindow.on('closed', () => {
    menuWindow = null;
  });

  void menuWindow.loadFile(`${staticRoot(isDev)}/chrome-menu.html`);
  menuWindow.show();
  menuWindow.focus();
}
