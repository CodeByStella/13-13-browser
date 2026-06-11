import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export interface PrivacySettings {
  blockTrackers: boolean;
  sendDoNotTrack: boolean;
  blockPermissions: boolean;
  clearOnExit: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  blockTrackers: true,
  sendDoNotTrack: true,
  blockPermissions: true,
  clearOnExit: false,
};

const FILE = 'privacy-settings.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE);
}

export function loadPrivacySettings(): PrivacySettings {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    return { ...DEFAULT_PRIVACY_SETTINGS, ...(JSON.parse(raw) as PrivacySettings) };
  } catch {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
}

export function savePrivacySettings(settings: PrivacySettings): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(settings, null, 2), 'utf-8');
}
