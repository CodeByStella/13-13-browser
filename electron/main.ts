import { app, BrowserWindow } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';

import { createMainWindow } from './app/create-main-window';
import { initAppContext } from './app/context';
import { getBookmarksService, registerAllIpc } from './ipc/register';

async function bootstrap(): Promise<void> {
  let mainWindow: BrowserWindow | null = null;

  registerAllIpc((bookmarks) => {
    mainWindow?.webContents.send(IPC_EVENTS.BOOKMARKS_UPDATED, bookmarks);
  });

  const handles = await createMainWindow();
  mainWindow = handles.mainWindow;

  initAppContext(
    handles.buildContext(getBookmarksService().getAll(), () => {
      mainWindow?.webContents.send(IPC_EVENTS.BOOKMARKS_UPDATED, getBookmarksService().getAll());
    }),
  );
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('app.browser1313.desktop');
  }

  void bootstrap();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void bootstrap();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
