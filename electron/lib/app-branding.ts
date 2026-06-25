import { app, BrowserWindow, nativeImage, type NativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export const APP_DISPLAY_NAME = '13.13 Browser';
export const DEVTOOLS_WINDOW_TITLE = `${APP_DISPLAY_NAME} — Developer Tools`;

const APP_USER_MODEL_ID = 'app.browser1313.desktop';
const DEV_APP_USER_MODEL_ID = 'app.browser1313.desktop.dev';

export function initAppBranding(): void {
  app.setName(APP_DISPLAY_NAME);

  if (process.platform === 'win32') {
    // Dev builds use a separate ID so Windows does not reuse a cached icon from
    // an installed release that shares the production AppUserModelId.
    app.setAppUserModelId(app.isPackaged ? APP_USER_MODEL_ID : DEV_APP_USER_MODEL_ID);
  }
}

function iconCandidates(): string[] {
  const roots = [path.join(__dirname, '..'), app.getAppPath()];
  const names = ['build/icon.png', 'build/icon.ico'];

  const candidates: string[] = [];
  for (const root of roots) {
    for (const name of names) {
      candidates.push(path.join(root, name));
    }
  }
  return candidates;
}

export function resolveAppIcon(): string | undefined {
  const iconPath = iconCandidates().find((candidate) => fs.existsSync(candidate));
  return iconPath ? path.resolve(iconPath) : undefined;
}

export function resolveAppIconImage(): NativeImage | undefined {
  const iconPath = resolveAppIcon();
  if (!iconPath) return undefined;

  let image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) return undefined;

  if (process.platform === 'win32') {
    const { width, height } = image.getSize();
    if (width !== 256 || height !== 256) {
      image = image.resize({ width: 256, height: 256, quality: 'best' });
    }
  }

  return image;
}

export function applyWindowIcon(win: BrowserWindow): void {
  const icon = resolveAppIconImage();
  if (icon) win.setIcon(icon);
}

/** Title bar + taskbar icon for detached DevTools windows. */
export function brandDevToolsWindows(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    const url = win.webContents.getURL();
    if (!url.startsWith('devtools://')) continue;

    win.setTitle(DEVTOOLS_WINDOW_TITLE);
    applyWindowIcon(win);
  }
}
