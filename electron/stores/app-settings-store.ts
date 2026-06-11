import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_APP_SETTINGS, type AppSettings } from '@shared/types';

export type { AppSettings };
export { DEFAULT_APP_SETTINGS };

const FILE = 'app-settings.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE);
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    return { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(raw) as AppSettings) };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(settings, null, 2), 'utf-8');
}
