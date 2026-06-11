import { app, BrowserWindow } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';

import { createMainWindow } from './app/create-main-window';
import { initAppContext } from './app/context';
import { initAppBranding } from './lib/app-branding';
import { setGlobalShortcutToggleHandler, unregisterGlobalShortcuts } from './lib/global-shortcuts';
import { attachKeyboardShortcuts } from './lib/keyboard-shortcuts';
import { initAppSettings } from './services/app-settings/app-settings';
import {
  destroyTray,
  initTray,
  markAppQuitting,
  showMainWindow,
  toggleWindowVisibility,
} from './services/tray/tray-manager';
import { getBookmarksService, registerAllIpc } from './ipc/register';

// DevTools tries Autofill.* CDP methods that Electron's Chromium build omits.
// Harmless, but logged as LOG_ERROR — raise minimum severity to suppress the noise.
app.commandLine.appendSwitch('log-level', '3');

initAppBranding();

async function bootstrap(): Promise<void> {
  let mainWindow: BrowserWindow | null = null;
  let stopDevReload: (() => void) | undefined;

  registerAllIpc((bookmarks) => {
    mainWindow?.webContents.send(IPC_EVENTS.BOOKMARKS_UPDATED, bookmarks);
  });

  const handles = await createMainWindow();
  mainWindow = handles.mainWindow;
  stopDevReload = handles.stopDevReload;

  mainWindow.on('closed', () => {
    stopDevReload?.();
    stopDevReload = undefined;
    mainWindow = null;
  });

  initAppContext(
    handles.buildContext(getBookmarksService().getAll(), () => {
      mainWindow?.webContents.send(IPC_EVENTS.BOOKMARKS_UPDATED, getBookmarksService().getAll());
    }),
  );

  attachKeyboardShortcuts(handles.mainWindow.webContents);
  initTray(handles.mainWindow);
}

app.on('before-quit', () => {
  markAppQuitting();
  unregisterGlobalShortcuts();
  destroyTray();
});

app.whenReady().then(() => {
  setGlobalShortcutToggleHandler(toggleWindowVisibility);
  initAppSettings();
  void bootstrap();

  app.on('activate', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) {
      void bootstrap();
      return;
    }
    showMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
