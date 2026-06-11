export interface PrivacySettings {
  blockTrackers: boolean;
  sendDoNotTrack: boolean;
  blockPermissions: boolean;
  clearOnExit: boolean;
  screenCaptureProtection: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  blockTrackers: true,
  sendDoNotTrack: true,
  blockPermissions: true,
  clearOnExit: false,
  screenCaptureProtection: true,
};

export interface PrivacyStats {
  trackersBlocked: number;
  permissionsDenied: number;
}

export interface PrivacyState {
  settings: PrivacySettings;
  stats: PrivacyStats;
}

export interface PrivacyPanelData extends PrivacyState {
  protectionEnabled: boolean;
  protectionSupported: boolean;
}
