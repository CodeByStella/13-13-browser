import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export const APP_DISPLAY_NAME = '13.13 Browser';
export const DEVTOOLS_WINDOW_TITLE = `${APP_DISPLAY_NAME} — Developer Tools`;

export function initAppBranding(): void {
  app.setName(APP_DISPLAY_NAME);

  if (process.platform === 'win32') {
    app.setAppUserModelId('app.browser1313.desktop');
  }
}

export function resolveAppIcon(): string | undefined {
  const candidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(app.getAppPath(), 'build/icon.ico'),
    path.join(app.getAppPath(), 'build/icon.png'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

/** Title bar + taskbar icon for detached DevTools windows. */
export function brandDevToolsWindows(): void {
  const icon = resolveAppIcon();

  for (const win of BrowserWindow.getAllWindows()) {
    const url = win.webContents.getURL();
    if (!url.startsWith('devtools://')) continue;

    win.setTitle(DEVTOOLS_WINDOW_TITLE);
    if (icon) win.setIcon(icon);
  }
}
