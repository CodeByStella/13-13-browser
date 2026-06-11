import type { WebContents } from 'electron';
import os from 'node:os';

export const CHROME_HEIGHT_BASE = 110;
export const BOOKMARK_BAR_HEIGHT = 28;
export let CHROME_HEIGHT = CHROME_HEIGHT_BASE;

export function setChromeHeight(height: number): void {
  CHROME_HEIGHT = height;
}

export function normalizeUrl(input: string, newTabPageUrl: string): string {
  const trimmed = input.trim();
  if (!trimmed) return newTabPageUrl;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const looksLikeDomain =
    trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.includes('/');
  if (looksLikeDomain) return `https://${trimmed}`;

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
