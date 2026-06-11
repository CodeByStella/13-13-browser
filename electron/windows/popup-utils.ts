import path from 'node:path';

import type { BrowserWindow } from 'electron';

import type { ChromePopupAnchor } from '@shared/types';

import { loadStaticPage, staticRoot, staticPageUrl } from '../lib/dev-static-pages';

export { staticRoot, staticPageUrl, loadStaticPage };

export function preloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

export interface PopupBoundsOptions {
  panelWidth: number;
  panelHeight: number;
  /** Align popup to the left or right edge of the anchor. */
  align?: 'left' | 'right';
}

export function computePopupBounds(
  parent: BrowserWindow,
  anchor: ChromePopupAnchor,
  options: PopupBoundsOptions,
): { x: number; y: number; width: number; height: number } {
  const content = parent.getContentBounds();
  const padding = 8;
  const width = options.panelWidth;
  const height = Math.min(options.panelHeight, content.height - padding * 2);
  const align = options.align ?? 'right';

  let screenX =
    align === 'right'
      ? content.x + anchor.x + anchor.width - width
      : content.x + anchor.x;

  screenX = Math.max(
    content.x + padding,
    Math.min(screenX, content.x + content.width - width - padding),
  );

  let screenY = content.y + anchor.y;
  const maxBottom = content.y + content.height - padding;
  if (screenY + height > maxBottom) {
    const anchorHeight = anchor.height ?? 28;
    screenY = content.y + anchor.y - anchorHeight - 2 - height;
  }
  screenY = Math.max(content.y + padding, screenY);

  return {
    x: Math.round(screenX),
    y: Math.round(screenY),
    width,
    height: Math.round(height),
  };
}

export function computeMenuBoundsAtPoint(
  parent: BrowserWindow,
  anchor: ChromePopupAnchor,
  menuWidth: number,
  menuHeight: number,
): { x: number; y: number; width: number; height: number } {
  const content = parent.getContentBounds();
  const padding = 8;
  const width = menuWidth;
  const height = Math.min(menuHeight, content.height - padding * 2);

  let screenX = content.x + anchor.x;
  let screenY = content.y + anchor.y;

  if (screenX + width > content.x + content.width - padding) {
    screenX = content.x + content.width - width - padding;
  }
  screenX = Math.max(content.x + padding, screenX);

  const anchorHeight = anchor.height ?? 1;
  if (screenY + height > content.y + content.height - padding) {
    screenY = content.y + anchor.y - anchorHeight - 2 - height;
  }
  screenY = Math.max(content.y + padding, screenY);

  return {
    x: Math.round(screenX),
    y: Math.round(screenY),
    width,
    height: Math.round(height),
  };
}

export const POPUP_WEB_PREFERENCES = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
} as const;
