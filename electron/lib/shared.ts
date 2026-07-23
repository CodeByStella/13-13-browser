import type { WebContents } from 'electron';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { isLocalFilePath } from '@shared/utils/url';

export const CHROME_HEIGHT_BASE = 110;
export const BOOKMARK_BAR_HEIGHT = 28;
export let CHROME_HEIGHT = CHROME_HEIGHT_BASE;

export function setChromeHeight(height: number): void {
  CHROME_HEIGHT = height;
}

function localFilePathToUrl(input: string): string {
  let filePath = input.trim().replace(/^["']|["']$/g, '');
  if (/^file:\/\//i.test(filePath)) return filePath;

  if (filePath.startsWith('~')) {
    filePath = path.join(os.homedir(), filePath.slice(1).replace(/^[/\\]+/, ''));
  }

  return pathToFileURL(path.resolve(filePath)).href;
}

export function normalizeUrl(input: string, newTabPageUrl: string): string {
  const trimmed = input.trim();
  if (!trimmed) return newTabPageUrl;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (isLocalFilePath(trimmed)) {
    return localFilePathToUrl(trimmed);
  }

  // Host, host:port, or host/path/query/hash — not a search query.
  const hostPart = trimmed.split(/[/?#]/)[0];
  const looksLikeHost =
    Boolean(hostPart) &&
    !trimmed.includes(' ') &&
    (hostPart.includes('.') ||
      /^localhost(?::\d+)?$/i.test(hostPart) ||
      /^[\d.]+(?::\d+)?$/.test(hostPart));
  if (looksLikeHost) return `https://${trimmed}`;

  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

export { isSecureUrl } from '@shared/utils/url';

export function canGoBack(wc: WebContents): boolean {
  return wc.navigationHistory.canGoBack();
}

export function canGoForward(wc: WebContents): boolean {
  return wc.navigationHistory.canGoForward();
}

export function isDevServerUrl(url: string): boolean {
  try {
    const { hostname, port } = new URL(url);
    return (hostname === 'localhost' || hostname === '127.0.0.1') && port === '5173';
  } catch {
    return false;
  }
}

export function supportsExcludeFromCapture(): boolean {
  if (process.platform !== 'win32') return true;
  const release = os.release();
  const build = Number(release.split('.')[2]);
  return build >= 19041;
}

// Re-export shared types for backward compatibility within electron/.
export type {
  TabInfo,
  BrowserState,
  ContentProtectionState,
} from '@shared/types';
