import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import type { BookmarkNode } from '@shared/types';

const FILE = 'bookmarks.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE);
}

function migrateLegacy(raw: unknown): BookmarkNode[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    if (!item || typeof item !== 'object') return null;

    const record = item as Record<string, unknown>;
    if (record.type === 'folder' || record.type === 'bookmark') {
      return {
        id: String(record.id),
        type: record.type,
        title: String(record.title ?? 'Untitled'),
        url: record.url ? String(record.url) : undefined,
        favicon: record.favicon ? String(record.favicon) : undefined,
        parentId: record.parentId ? String(record.parentId) : null,
        createdAt: Number(record.createdAt ?? Date.now()),
      } satisfies BookmarkNode;
    }

    if (typeof record.url === 'string') {
      return {
        id: String(record.id),
        type: 'bookmark',
        title: String(record.title ?? record.url),
        url: record.url,
        favicon: record.favicon ? String(record.favicon) : undefined,
        parentId: null,
        createdAt: Number(record.createdAt ?? Date.now()),
      } satisfies BookmarkNode;
    }

    return null;
  }).filter((item): item is BookmarkNode => !!item);
}

export function loadBookmarks(): BookmarkNode[] {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    return migrateLegacy(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: BookmarkNode[]): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(bookmarks, null, 2), 'utf-8');
}
