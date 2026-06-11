import { normalizeAccelerator } from '@shared/utils/hotkey';
import type { AppSettings } from '@shared/types';

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
} from '../../stores/app-settings-store';
import { applyGlobalShortcuts, isHotkeyRegistered } from '../../lib/global-shortcuts';

let cached: AppSettings = { ...DEFAULT_APP_SETTINGS };

export function initAppSettings(): AppSettings {
  cached = loadAppSettings();
  applyGlobalShortcuts(cached);
  return cached;
}

export function getAppSettings(): AppSettings {
  return { ...cached };
}

export function updateAppSettings(partial: Partial<AppSettings>): AppSettings {
  if (partial.showHideHotkey) {
    partial = { ...partial, showHideHotkey: normalizeAccelerator(partial.showHideHotkey) };
  }
  cached = { ...cached, ...partial };
  saveAppSettings(cached);
  applyGlobalShortcuts(cached);
  return { ...cached };
}

export function getTraySettingsSnapshot(): {
  settings: AppSettings;
  hotkeyRegistered: boolean;
} {
  return {
    settings: getAppSettings(),
    hotkeyRegistered: isHotkeyRegistered(),
  };
}
