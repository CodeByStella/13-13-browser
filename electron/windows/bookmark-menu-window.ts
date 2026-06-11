import { BrowserWindow, clipboard, ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron';

import { IPC, IPC_EVENTS } from '@shared/ipc/channels';
import type { BookmarkMenuItemPayload, BookmarkNode, ChromePopupAnchor } from '@shared/types';
import {
  getChildren,
  isBookmarkItem,
  isFolderItem,
  listFolderOptions,
} from '@shared/utils/bookmarks';
import { bookmarkLabel } from '@shared/utils/url';

import { getBookmarksService } from '../ipc/bookmarks.ipc';
import type { TabManager } from '../services/tabs/tab-manager';
import {
  computeMenuBoundsAtPoint,
  loadStaticPage,
  POPUP_WEB_PREFERENCES,
  preloadPath,
} from './popup-utils';

const MENU_WIDTH = 240;
const PROMPT_WIDTH = 260;
const PROMPT_HEIGHT = 120;
const ITEM_HEIGHT = 32;
const HEADER_HEIGHT = 22;
const SEPARATOR_HEIGHT = 9;
const MENU_PADDING = 6;
const MENU_BORDER = 2;
const HEIGHT_BUFFER = 8;

let menuWindow: BrowserWindow | null = null;
let menuBlurHandler: (() => void) | null = null;
let activeMenuSender: WebContents | null = null;
let menuContext: {
  parent: BrowserWindow;
  tabManager: TabManager | null;
  anchor: ChromePopupAnchor;
  isDev: boolean;
} | null = null;
let ipcRegistered = false;

function closeBookmarkMenu(): void {
  if (menuWindow && !menuWindow.isDestroyed()) {
    if (menuBlurHandler) {
      menuWindow.removeListener('blur', menuBlurHandler);
      menuBlurHandler = null;
    }
    menuWindow.destroy();
  }
  menuWindow = null;
  activeMenuSender = null;
}

function suspendMenuBlurClose(): void {
  if (menuWindow && menuBlurHandler) {
    menuWindow.removeListener('blur', menuBlurHandler);
    menuBlurHandler = null;
  }
}

function computeMenuHeight(items: BookmarkMenuItemPayload[]): number {
  let height = MENU_PADDING * 2 + MENU_BORDER + HEIGHT_BUFFER;
  for (const item of items) {
    if (item.type === 'header') height += HEADER_HEIGHT;
    else if (item.type === 'separator') height += SEPARATOR_HEIGHT;
    else height += ITEM_HEIGHT;
  }
  return height;
}

function applyMenuBounds(width: number, height: number): void {
  if (!menuWindow || !menuContext) return;
  const bounds = computeMenuBoundsAtPoint(menuContext.parent, menuContext.anchor, width, height);
  menuWindow.setBounds(bounds);
}

function buildMoveToItems(
  nodes: BookmarkNode[],
  itemId: string,
  excludeFolder?: string,
): BookmarkMenuItemPayload[] {
  const folders = listFolderOptions(nodes, excludeFolder).filter((folder) => folder.id !== itemId);
  if (folders.length === 0) return [];

  return [
    { type: 'separator', label: '' },
    { type: 'header', label: 'Move to' },
    ...folders.map((folder) => ({
      type: 'item' as const,
      id: `move:${itemId}:${folder.id}`,
      label: folder.title,
      indent: 1,
    })),
    {
      type: 'item',
      id: `move:${itemId}:root`,
      label: 'Bookmarks bar',
      indent: 1,
    },
  ];
}

function buildContextMenuItems(targetId: string | null, nodes: BookmarkNode[]): BookmarkMenuItemPayload[] {
  if (!targetId) {
    return [{ type: 'item', id: 'new-folder:root', label: 'New folder' }];
  }

  const item = nodes.find((node) => node.id === targetId);
  if (!item) return [];

  if (isFolderItem(item)) {
    return [
      { type: 'item', id: `new-folder:${item.id}`, label: 'New subfolder' },
      { type: 'item', id: `rename:${item.id}`, label: 'Rename folder', promptDefault: item.title },
      ...buildMoveToItems(nodes, item.id, item.id),
      { type: 'separator', label: '' },
      { type: 'item', id: `remove:${item.id}`, label: 'Delete folder', danger: true },
    ];
  }

  if (!isBookmarkItem(item)) return [];

  return [
    { type: 'item', id: `navigate:${item.url}`, label: 'Open' },
    { type: 'item', id: `open-tab:${item.url}`, label: 'Open in new tab' },
    { type: 'item', id: `copy:${item.url}`, label: 'Copy link' },
    { type: 'item', id: `rename:${item.id}`, label: 'Rename', promptDefault: item.title },
    ...buildMoveToItems(nodes, item.id),
    { type: 'separator', label: '' },
    { type: 'item', id: `remove:${item.id}`, label: 'Remove', danger: true },
  ];
}

function buildFolderMenuItems(folderId: string, nodes: BookmarkNode[]): BookmarkMenuItemPayload[] {
  const children = getChildren(nodes, folderId);
  if (children.length === 0) {
    return [{ type: 'item', id: 'noop', label: 'Empty folder' }];
  }

  return children.map((child) => {
    if (isFolderItem(child)) {
      return {
        type: 'item' as const,
        id: `open-folder:${child.id}`,
        label: child.title,
      };
    }

    if (!isBookmarkItem(child)) {
      return { type: 'item', id: 'noop', label: 'Untitled' };
    }

    return {
      type: 'item' as const,
      id: `navigate:${child.url}`,
      label: bookmarkLabel(child.title, child.url),
      favicon: child.favicon,
    };
  });
}

function handleMenuAction(id: string): void {
  if (id === 'noop' || !menuContext) return;

  const { parent, tabManager, anchor, isDev } = menuContext;
  const bookmarks = getBookmarksService();

  if (id.startsWith('navigate:')) {
    tabManager?.navigateActive(id.slice('navigate:'.length));
    return;
  }

  if (id.startsWith('open-tab:')) {
    tabManager?.createTab(id.slice('open-tab:'.length));
    return;
  }

  if (id.startsWith('open-folder:')) {
    const folderId = id.slice('open-folder:'.length);
    closeBookmarkMenu();
    showBookmarkFolderMenu(parent, tabManager, anchor, folderId, isDev);
    return;
  }

  if (id.startsWith('copy:')) {
    clipboard.writeText(id.slice('copy:'.length));
    return;
  }

  if (id.startsWith('remove:')) {
    bookmarks.remove(id.slice('remove:'.length));
    return;
  }

  if (id.startsWith('move:')) {
    const [, itemId, parentKey] = id.split(':');
    if (itemId) {
      bookmarks.move(itemId, parentKey === 'root' ? null : parentKey ?? null);
    }
    return;
  }
}

function ensureBookmarkMenuIpc(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle(IPC.BOOKMARK_MENU_SELECT, (event: IpcMainInvokeEvent, id: string) => {
    if (!menuWindow || event.sender !== menuWindow.webContents || !menuContext) return;

    if (id.startsWith('rename:') || id.startsWith('new-folder:')) {
      return;
    }

    handleMenuAction(id);
    closeBookmarkMenu();
  });

  ipcMain.handle(IPC.BOOKMARK_MENU_BEGIN_PROMPT, (event: IpcMainInvokeEvent) => {
    if (!menuWindow || event.sender !== menuWindow.webContents) return;
    suspendMenuBlurClose();
    menuWindow.focus();
  });

  ipcMain.handle(IPC.BOOKMARK_MENU_RESIZE, (event: IpcMainInvokeEvent, width: number, height: number) => {
    if (!menuWindow || event.sender !== menuWindow.webContents || !menuContext) return;
    applyMenuBounds(Math.max(MENU_WIDTH, Math.round(width)), Math.round(height) + HEIGHT_BUFFER);
  });

  ipcMain.handle(IPC.BOOKMARK_MENU_CLOSE, (event: IpcMainInvokeEvent) => {
    if (activeMenuSender !== event.sender) return;
    closeBookmarkMenu();
  });

  ipcMain.handle(IPC.BOOKMARK_MENU_RENAME, (event, id: string, title: string) => {
    if (!menuContext || activeMenuSender !== event.sender) return;
    const trimmed = title.trim();
    if (trimmed) {
      getBookmarksService().rename(id, trimmed);
    }
    closeBookmarkMenu();
  });

  ipcMain.handle(IPC.BOOKMARK_MENU_CREATE_FOLDER, (event, parentId: string | null, title: string) => {
    if (!menuContext || activeMenuSender !== event.sender) return;
    const trimmed = title.trim();
    if (trimmed) {
      getBookmarksService().createFolder(trimmed, parentId);
    }
    closeBookmarkMenu();
  });
}

function openBookmarkMenu(
  parent: BrowserWindow,
  tabManager: TabManager | null,
  anchor: ChromePopupAnchor,
  items: BookmarkMenuItemPayload[],
  isDev: boolean,
): void {
  ensureBookmarkMenuIpc();
  menuContext = { parent, tabManager, anchor, isDev };
  closeBookmarkMenu();

  const menuHeight = computeMenuHeight(items);
  const bounds = computeMenuBoundsAtPoint(parent, anchor, MENU_WIDTH, menuHeight);

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
    ...bounds,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: preloadPath(),
      ...POPUP_WEB_PREFERENCES,
    },
  });

  menuWindow.setAlwaysOnTop(true, 'pop-up-menu');
  activeMenuSender = menuWindow.webContents;

  menuWindow.webContents.on('did-finish-load', () => {
    menuWindow?.webContents.send(IPC_EVENTS.BOOKMARK_MENU_ITEMS, items);
  });

  menuWindow.on('blur', (menuBlurHandler = () => closeBookmarkMenu()));
  menuWindow.on('closed', () => {
    menuWindow = null;
  });

  loadStaticPage(menuWindow.webContents, isDev, 'bookmark-menu.html');
  menuWindow.show();
  menuWindow.focus();
}

export function showBookmarkContextMenu(
  parent: BrowserWindow,
  tabManager: TabManager | null,
  anchor: ChromePopupAnchor,
  targetId: string | null,
  isDev: boolean,
): void {
  const items = buildContextMenuItems(targetId, getBookmarksService().getAll());
  if (items.length === 0) return;
  openBookmarkMenu(parent, tabManager, anchor, items, isDev);
}

export function showBookmarkFolderMenu(
  parent: BrowserWindow,
  tabManager: TabManager | null,
  anchor: ChromePopupAnchor,
  folderId: string,
  isDev: boolean,
): void {
  const items = buildFolderMenuItems(folderId, getBookmarksService().getAll());
  openBookmarkMenu(parent, tabManager, anchor, items, isDev);
}

export function showBookmarkRenamePrompt(
  parent: BrowserWindow,
  anchor: ChromePopupAnchor,
  bookmarkId: string,
  defaultTitle: string,
  isDev: boolean,
): void {
  ensureBookmarkMenuIpc();
  menuContext = { parent, tabManager: null, anchor, isDev };
  closeBookmarkMenu();

  const bounds = computeMenuBoundsAtPoint(parent, anchor, PROMPT_WIDTH, PROMPT_HEIGHT);

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
    ...bounds,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: preloadPath(),
      ...POPUP_WEB_PREFERENCES,
    },
  });

  menuWindow.setAlwaysOnTop(true, 'pop-up-menu');
  activeMenuSender = menuWindow.webContents;

  menuWindow.webContents.on('did-finish-load', () => {
    menuWindow?.webContents.send(IPC_EVENTS.BOOKMARK_MENU_SHOW_RENAME, {
      id: bookmarkId,
      defaultTitle,
    });
  });

  menuWindow.on('blur', (menuBlurHandler = () => closeBookmarkMenu()));
  menuWindow.on('closed', () => {
    menuWindow = null;
  });

  loadStaticPage(menuWindow.webContents, isDev, 'bookmark-menu.html');
  menuWindow.show();
  menuWindow.focus();
}
