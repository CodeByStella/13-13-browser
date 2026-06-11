export const SITE_PERMISSION_KEYS = [
  'camera',
  'microphone',
  'geolocation',
  'notifications',
] as const;

export type SitePermissionKey = (typeof SITE_PERMISSION_KEYS)[number];
export type SitePermissionValue = 'default' | 'allow' | 'block';

export interface SitePermissionsSnapshot {
  origin: string;
  hostname: string;
  permissions: Record<SitePermissionKey, SitePermissionValue>;
  globalBlockEnabled: boolean;
}
