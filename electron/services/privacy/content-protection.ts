import type { ContentProtectionState } from '@shared/types';

import { supportsExcludeFromCapture } from '../../lib/shared';
import { loadPrivacySettings, savePrivacySettings } from '../../stores/privacy-store';

let enabled = true;

export function initContentProtectionFromSettings(): void {
  enabled = loadPrivacySettings().screenCaptureProtection;
}

export function setContentProtectionPreference(value: boolean, options?: { persist?: boolean }): void {
  enabled = value;
  if (options?.persist === false) return;

  const current = loadPrivacySettings();
  savePrivacySettings({ ...current, screenCaptureProtection: value });
}

export function isContentProtectionEnabled(): boolean {
  return enabled;
}

export function getContentProtectionState(): ContentProtectionState {
  return {
    enabled,
    supported: supportsExcludeFromCapture(),
  };
}
