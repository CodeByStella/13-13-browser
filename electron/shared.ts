export interface TabInfo {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isActive: boolean;
  isSecure: boolean;
}

export interface BrowserState {
  tabs: TabInfo[];
  activeTabId: string | null;
}

export interface ContentProtectionState {
  enabled: boolean;
  supported: boolean;
}

export const CHROME_HEIGHT = 104;
export const DEFAULT_HOME_URL = 'https://duckduckgo.com';

export function normalizeUrl(input: string, newTabPageUrl: string): string {
  const trimmed = input.trim();
  if (!trimmed) return newTabPageUrl;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const looksLikeDomain =
    trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.includes('/');
  if (looksLikeDomain) return `https://${trimmed}`;

  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

export function isSecureUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

import os from 'node:os';

export function supportsExcludeFromCapture(): boolean {
  if (process.platform !== 'win32') return true;
  const release = os.release();
  const build = Number(release.split('.')[2]);
  return build >= 19041;
}
