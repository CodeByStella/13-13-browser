import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import {
  SITE_PERMISSION_KEYS,
  type SitePermissionKey,
  type SitePermissionValue,
} from '@shared/types';

export { SITE_PERMISSION_KEYS };
export type { SitePermissionKey, SitePermissionValue };

type SitePermissionStore = Record<string, Partial<Record<SitePermissionKey, SitePermissionValue>>>;

const FILE = 'site-permissions.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE);
}

let cache: SitePermissionStore | null = null;

function loadStore(): SitePermissionStore {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    cache = JSON.parse(raw) as SitePermissionStore;
  } catch {
    cache = {};
  }
  return cache;
}

function persistStore(): void {
  if (!cache) return;
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(cache, null, 2), 'utf-8');
}

export function getSitePermissionOverride(
  origin: string,
  key: SitePermissionKey,
): SitePermissionValue {
  const value = loadStore()[origin]?.[key];
  return value ?? 'default';
}

export function setSitePermissionOverride(
  origin: string,
  key: SitePermissionKey,
  value: SitePermissionValue,
): SitePermissionValue {
  const store = loadStore();
  if (!store[origin]) store[origin] = {};

  if (value === 'default') {
    delete store[origin][key];
    if (Object.keys(store[origin]).length === 0) {
      delete store[origin];
    }
  } else {
    store[origin][key] = value;
  }

  persistStore();
  return getSitePermissionOverride(origin, key);
}
