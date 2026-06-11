import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { WebContents } from 'electron';

import { normalizeDevServerUrl } from './dev-server';

export function staticRoot(isDev: boolean): string {
  return isDev ? path.join(__dirname, '../public') : path.join(__dirname, '../dist');
}

/** In dev, load HTML from the Vite server so edits apply without restarting Electron. */
export function staticPageUrl(isDev: boolean, filename: string): string {
  const devBase = process.env.VITE_DEV_SERVER_URL;
  if (isDev && devBase) {
    return new URL(filename, normalizeDevServerUrl(devBase)).href;
  }
  return pathToFileURL(path.join(staticRoot(isDev), filename)).href;
}

export function loadStaticPage(
  webContents: WebContents,
  isDev: boolean,
  filename: string,
): void {
  void webContents.loadURL(staticPageUrl(isDev, filename));
}
