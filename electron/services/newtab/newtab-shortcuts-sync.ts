import type { WebContents } from 'electron';
import { randomUUID } from 'node:crypto';

import type { NewTabShortcut } from '@shared/types';

import {
  loadNewTabShortcuts,
  saveNewTabShortcuts,
} from '../../stores/newtab-shortcuts-store';

export const NEWTAB_SHORTCUTS_STORAGE_KEY = 'newtab-shortcuts';

export function isNewTabPageUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return pathname.endsWith('/newtab.html') || pathname.endsWith('newtab.html');
  } catch {
    return url.includes('newtab.html');
  }
}

function parseShortcuts(raw: string | null): NewTabShortcut[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const url = typeof record.url === 'string' ? record.url.trim() : '';
        if (!url) return null;
        return {
          id: typeof record.id === 'string' && record.id ? record.id : randomUUID(),
          title: String(record.title ?? ''),
          url,
          favicon: record.favicon ? String(record.favicon) : undefined,
        } satisfies NewTabShortcut;
      })
      .filter((item): item is NewTabShortcut => !!item);
  } catch {
    return [];
  }
}

export async function readShortcutsFromWebContents(
  webContents: WebContents,
): Promise<NewTabShortcut[]> {
  if (webContents.isDestroyed()) return [];
  const raw = await webContents.executeJavaScript(
    `localStorage.getItem(${JSON.stringify(NEWTAB_SHORTCUTS_STORAGE_KEY)})`,
    true,
  );
  return parseShortcuts(typeof raw === 'string' ? raw : null);
}

export async function writeShortcutsToWebContents(
  webContents: WebContents,
  shortcuts: NewTabShortcut[],
): Promise<void> {
  if (webContents.isDestroyed()) return;
  await webContents.executeJavaScript(
    `localStorage.setItem(${JSON.stringify(NEWTAB_SHORTCUTS_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(shortcuts))})`,
    true,
  );
}

export async function persistShortcutsFromWebContents(
  webContents: WebContents,
): Promise<void> {
  if (!isNewTabPageUrl(webContents.getURL())) return;
  const shortcuts = await readShortcutsFromWebContents(webContents);
  if (shortcuts.length > 0) {
    saveNewTabShortcuts(shortcuts);
  }
}

export async function restoreShortcutsToWebContents(
  webContents: WebContents,
): Promise<void> {
  if (!isNewTabPageUrl(webContents.getURL())) return;
  const stored = loadNewTabShortcuts();
  if (stored.length === 0) return;
  await writeShortcutsToWebContents(webContents, stored);
  await webContents.executeJavaScript('window.__syncNewTabShortcuts?.()', true);
}

export async function backupNewTabShortcutsBeforeClear(
  getWebContents: () => WebContents[],
): Promise<void> {
  let merged = loadNewTabShortcuts();

  for (const webContents of getWebContents()) {
    if (webContents.isDestroyed() || !isNewTabPageUrl(webContents.getURL())) continue;
    const fromPage = await readShortcutsFromWebContents(webContents);
    if (fromPage.length > merged.length) {
      merged = fromPage;
    }
  }

  if (merged.length > 0) {
    saveNewTabShortcuts(merged);
  }
}
