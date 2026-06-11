import fs from 'node:fs';
import path from 'node:path';

import type { BrowserWindow } from 'electron';

import type { TabManager } from '../services/tabs/tab-manager';

const DEBOUNCE_MS = 180;

export function startDevReloadWatcher(
  mainWindow: BrowserWindow,
  tabManager: TabManager,
): () => void {
  const publicDir = path.join(__dirname, '../public');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const reload = (): void => {
    if (mainWindow.isDestroyed()) return;

    if (!mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.reloadIgnoringCache();
    }

    tabManager.reloadAllNormalTabs();
  };

  const scheduleReload = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(reload, DEBOUNCE_MS);
  };

  let watcher: fs.FSWatcher | null = null;

  try {
    watcher = fs.watch(publicDir, { recursive: true }, (_event, filename) => {
      if (!filename || !String(filename).endsWith('.html')) return;
      scheduleReload();
    });
  } catch {
    // Fallback when recursive watch is unavailable.
    watcher = fs.watch(publicDir, scheduleReload);
  }

  return () => {
    if (timer) clearTimeout(timer);
    watcher?.close();
  };
}
