import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import type { Bookmark } from '@shared/types';

export type { Bookmark };

const FILE = 'bookmarks.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE);
}

export function loadBookmarks(): Bookmark[] {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(bookmarks, null, 2), 'utf-8');
}
