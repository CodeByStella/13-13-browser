import { ipcMain } from 'electron';

import { IPC } from '@shared/ipc/channels';

import { BookmarksService } from '../services/bookmarks-service';

let bookmarksService: BookmarksService | null = null;

export function initBookmarksService(onChange: (bookmarks: ReturnType<BookmarksService['getAll']>) => void): void {
  bookmarksService = new BookmarksService(onChange);
}

export function getBookmarksService(): BookmarksService {
  if (!bookmarksService) {
    throw new Error('BookmarksService has not been initialized');
  }
  return bookmarksService;
}

export function registerBookmarksIpc(): void {
  ipcMain.handle(IPC.GET_BOOKMARKS, () => getBookmarksService().getAll());
  ipcMain.handle(IPC.ADD_BOOKMARK, (_event, title: string, url: string, parentId?: string | null, favicon?: string) => {
    getBookmarksService().add(title, url, parentId ?? null, favicon);
    return getBookmarksService().getAll();
  });
  ipcMain.handle(IPC.REMOVE_BOOKMARK, (_event, id: string) => getBookmarksService().remove(id));
  ipcMain.handle(IPC.TOGGLE_BOOKMARK, (_event, title: string, url: string, favicon?: string) =>
    getBookmarksService().toggle(title, url, favicon),
  );
  ipcMain.handle(
    IPC.CREATE_BOOKMARK_FOLDER,
    (_event, title: string, parentId?: string | null) =>
      getBookmarksService().createFolder(title, parentId ?? null),
  );
  ipcMain.handle(IPC.RENAME_BOOKMARK, (_event, id: string, title: string) =>
    getBookmarksService().rename(id, title),
  );
  ipcMain.handle(
    IPC.MOVE_BOOKMARK,
    (_event, id: string, parentId: string | null) => getBookmarksService().move(id, parentId),
  );
}
