import type { PrivacySettings } from '../types/privacy';

export function computePrivacyScore(settings: PrivacySettings, protectionEnabled: boolean): number {
  return Math.min(
    100,
    (settings.blockTrackers ? 25 : 0) +
      (settings.sendDoNotTrack ? 20 : 0) +
      (settings.blockPermissions ? 25 : 0) +
      (protectionEnabled ? 30 : 0),
  );
}
