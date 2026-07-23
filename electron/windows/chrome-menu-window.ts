import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';
import { formatHotkeyLabel } from '@shared/utils/hotkey';
import type { ChromeMenuItemPayload, ChromePopupAnchor } from '@shared/types';

import { getAppSettings } from '../services/app-settings/app-settings';
import { clearBrowsingData } from '../services/privacy/privacy';
import { hideToTray } from '../services/tray/tray-manager';
import type { TabManager } from '../services/tabs/tab-manager';
import { getBookmarksService } from '../ipc/bookmarks.ipc';
import { showAboutWindow } from './about-window';
import { showPrivacyPanel } from './privacy-panel-window';
import { showTraySettingsPanel } from './tray-settings-window';
import { loadStaticPage, preloadPath, POPUP_WEB_PREFERENCES } from './popup-utils';

export type { ChromeMenuItemPayload, ChromePopupAnchor };

const MENU_WIDTH = 268;
const ITEM_HEIGHT = 32;
const HEADER_HEIGHT = 22;
const SEPARATOR_HEIGHT = 9;
const MENU_PADDING = 6;
const BRAND_HEIGHT = 40;

let menuWindow: BrowserWindow | null = null;
let menuContext: {
  parent: BrowserWindow;
  tabManager: TabManager | null;
  anchor: ChromePopupAnchor;
  isDev: boolean;
} | null = null;
let ipcRegistered = false;

function closeChromeMenu(): void {
  if (menuWindow && !menuWindow.isDestroyed()) {
    menuWindow.destroy();
  }
  menuWindow = null;
}

function buildToolbarItems(): ChromeMenuItemPayload[] {
  const appSettings = getAppSettings();
  const hotkeyShortcut =
    appSettings.hotkeyEnabled && appSettings.showHideHotkey
      ? formatHotkeyLabel(appSettings.showHideHotkey, process.platform)
      : undefined;

  return [
    { type: 'header', label: 'Tabs' },
    { type: 'item', id: 'new-tab', label: 'New tab', shortcut: 'Ctrl+T', icon: 'tab' },
    { type: 'item', id: 'new-private-tab', label: 'New private tab', shortcut: 'Ctrl+Shift+N', icon: 'private' },
    { type: 'item', id: 'duplicate-tab', label: 'Duplicate tab', icon: 'duplicate' },
    { type: 'item', id: 'reopen-closed-tab', label: 'Reopen closed tab', shortcut: 'Ctrl+Shift+T', icon: 'restore' },
    { type: 'separator', label: '' },
    { type: 'header', label: 'Page' },
    { type: 'item', id: 'new-bookmark-folder', label: 'New bookmarks folder', icon: 'folder' },
    { type: 'item', id: 'open-find', label: 'Find in page', shortcut: 'Ctrl+F', icon: 'search' },
    { type: 'item', id: 'reload', label: 'Reload', shortcut: 'Ctrl+R', icon: 'reload' },
    { type: 'item', id: 'zoom-reset', label: 'Reset zoom', shortcut: 'Ctrl+0', icon: 'zoom' },
    { type: 'separator', label: '' },
    { type: 'header', label: 'Privacy' },
    { type: 'item', id: 'open-privacy', label: 'Privacy dashboard', icon: 'shield' },
    { type: 'item', id: 'clear-data', label: 'Clear browsing data', icon: 'trash' },
    { type: 'separator', label: '' },
    { type: 'header', label: 'Background' },
    { type: 'item', id: 'hide-to-tray', label: 'Hide to tray', shortcut: hotkeyShortcut, icon: 'tray' },
    { type: 'item', id: 'tray-settings', label: 'Tray & hotkeys…', icon: 'info' },
    { type: 'separator', label: '' },
    { type: 'header', label: 'Tools' },
    { type: 'item', id: 'toggle-devtools', label: 'Developer tools', shortcut: 'F12', icon: 'devtools' },
    { type: 'separator', label: '' },
    { type: 'item', id: 'about', label: 'About Google Chrome', icon: 'info' },
  ];
}

function computeMenuHeight(items: ChromeMenuItemPayload[]): number {
  let height = MENU_PADDING * 2 + BRAND_HEIGHT;
  for (const item of items) {
    if (item.type === 'header') height += HEADER_HEIGHT;
    else if (item.type === 'separator') height += SEPARATOR_HEIGHT;
    else height += ITEM_HEIGHT;
  }
  return height;
}

function handleToolbarAction(
  id: string,
  parent: BrowserWindow,
  tabManager: TabManager | null,
  isDev: boolean,
): void {
  switch (id) {
    case 'new-tab':
      tabManager?.createTab();
      break;
    case 'new-private-tab':
      tabManager?.createPrivateTab();
      break;
    case 'duplicate-tab': {
      const activeId = tabManager?.getState().activeTabId;
      if (activeId) tabManager?.duplicateTab(activeId);
      break;
    }
    case 'reopen-closed-tab':
      tabManager?.reopenClosedTab();
      break;
    case 'open-find':
      parent.webContents.send(IPC_EVENTS.CHROME_MENU_ACTION, 'open-find');
      break;
    case 'new-bookmark-folder':
      getBookmarksService().createFolder('New folder');
      break;
    case 'reload':
      tabManager?.reload();
      break;
    case 'zoom-reset':
      tabManager?.zoomReset();
      break;
    case 'open-privacy':
      showPrivacyPanel(parent, isDev, menuContext!.anchor);
      break;
    case 'clear-data':
      void clearBrowsingData().then(() => tabManager?.reloadAllNormalTabs());
      break;
    case 'toggle-devtools':
      tabManager?.toggleDevTools();
      break;
    case 'about':
      showAboutWindow(parent, isDev);
      break;
    case 'hide-to-tray':
      hideToTray();
      break;
    case 'tray-settings':
      showTraySettingsPanel(parent, isDev, menuContext!.anchor);
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
    handleToolbarAction(
      id,
      menuContext.parent,
      menuContext.tabManager,
      menuContext.isDev,
    );
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
  menuContext = { parent, tabManager, anchor, isDev };
  closeChromeMenu();

  const items = buildToolbarItems();
  const menuHeight = computeMenuHeight(items);
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

  loadStaticPage(menuWindow.webContents, isDev, 'chrome-menu.html');
  menuWindow.show();
  menuWindow.focus();
}
