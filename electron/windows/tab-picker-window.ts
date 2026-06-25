import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type { ChromePopupAnchor, TabPickerItemPayload } from '@shared/types';

import type { TabManager } from '../services/tabs/tab-manager';
import {
  computeMenuBoundsAtPoint,
  loadStaticPage,
  POPUP_WEB_PREFERENCES,
  preloadPath,
} from './popup-utils';

const MENU_WIDTH = 320;
const ITEM_HEIGHT = 36;
const MENU_PADDING = 6;
const SEARCH_HEIGHT = 44;
const MAX_VISIBLE_ITEMS = 8;

let pickerWindow: BrowserWindow | null = null;
let pickerContext: {
  parent: BrowserWindow;
  tabManager: TabManager | null;
  isDev: boolean;
} | null = null;
let ipcRegistered = false;

function closeTabPicker(): void {
  if (pickerContext?.parent && !pickerContext.parent.isDestroyed()) {
    pickerContext.parent.webContents.send(IPC_EVENTS.TAB_PICKER_CLOSED);
  }
  if (pickerWindow && !pickerWindow.isDestroyed()) {
    pickerWindow.destroy();
  }
  pickerWindow = null;
}

export function isTabPickerOpen(): boolean {
  return pickerWindow !== null && !pickerWindow.isDestroyed();
}

function buildTabItems(tabManager: TabManager | null): TabPickerItemPayload[] {
  if (!tabManager) return [];

  return tabManager.getState().tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    favicon: tab.favicon,
    isLoading: tab.isLoading,
    isActive: tab.isActive,
    isPrivate: tab.isPrivate,
    isPinned: tab.isPinned,
  }));
}

function computePickerHeight(tabCount: number): number {
  const visible = Math.min(Math.max(tabCount, 1), MAX_VISIBLE_ITEMS);
  return MENU_PADDING * 2 + SEARCH_HEIGHT + visible * ITEM_HEIGHT;
}

function ensureTabPickerIpc(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle(IPC.TAB_PICKER_SELECT, (event: IpcMainInvokeEvent, tabId: string) => {
    if (!pickerWindow || event.sender !== pickerWindow.webContents || !pickerContext) return;
    pickerContext.tabManager?.switchTab(tabId);
    closeTabPicker();
  });

  ipcMain.handle(IPC.TAB_PICKER_CLOSE, (event) => {
    if (!pickerWindow || event.sender !== pickerWindow.webContents) return;
    closeTabPicker();
  });
}

export function showTabPicker(
  parent: BrowserWindow,
  tabManager: TabManager | null,
  anchor: ChromePopupAnchor,
  isDev: boolean,
  options?: { toggle?: boolean },
): boolean {
  ensureTabPickerIpc();

  if (pickerWindow && !pickerWindow.isDestroyed()) {
    if (options?.toggle) {
      closeTabPicker();
      return false;
    }
    closeTabPicker();
  }

  const tabs = buildTabItems(tabManager);
  const menuHeight = computePickerHeight(tabs.length);
  const bounds = computeMenuBoundsAtPoint(parent, anchor, MENU_WIDTH, menuHeight);

  pickerContext = { parent, tabManager, isDev };

  pickerWindow = new BrowserWindow({
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

  pickerWindow.setAlwaysOnTop(true, 'pop-up-menu');

  pickerWindow.webContents.on('did-finish-load', () => {
    pickerWindow?.webContents.send(IPC_EVENTS.TAB_PICKER_DATA, tabs);
  });

  pickerWindow.on('blur', () => closeTabPicker());
  pickerWindow.on('closed', () => {
    pickerWindow = null;
    pickerContext = null;
  });

  loadStaticPage(pickerWindow.webContents, isDev, 'tab-picker.html');
  pickerWindow.show();
  pickerWindow.focus();
  return true;
}
