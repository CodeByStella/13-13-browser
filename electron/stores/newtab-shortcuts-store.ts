import { app } from 'electron';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { NewTabShortcut } from '@shared/types';

const FILE = 'newtab-shortcuts.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE);
}

function normalize(raw: unknown): NewTabShortcut[] {
  if (!Array.isArray(raw)) return [];

  return raw
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
}

export function loadNewTabShortcuts(): NewTabShortcut[] {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveNewTabShortcuts(shortcuts: NewTabShortcut[]): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(normalize(shortcuts), null, 2), 'utf-8');
}
