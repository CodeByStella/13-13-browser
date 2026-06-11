import type { Session } from 'electron';

import type {
  PrivacySettings,
  SitePermissionKey,
  SitePermissionsSnapshot,
  SitePermissionValue,
} from '@shared/types';
import { isManageableSiteUrl, originFromHttpUrl } from '@shared/utils/url';

import { loadPrivacySettings } from '../../stores/privacy-store';
import {
  SITE_PERMISSION_KEYS,
  getSitePermissionOverride,
  setSitePermissionOverride,
} from '../../stores/site-permissions-store';

export type { SitePermissionKey, SitePermissionValue, SitePermissionsSnapshot };
export { SITE_PERMISSION_KEYS, isManageableSiteUrl };
const configuredSessions = new WeakSet<Session>();

let privacySettingsProvider: () => PrivacySettings = () => loadPrivacySettings();

export function bindPrivacySettingsProvider(provider: () => PrivacySettings): void {
  privacySettingsProvider = provider;
}

function getPrivacySettings(): PrivacySettings {
  return privacySettingsProvider();
}

const SENSITIVE_ELECTRON_PERMISSIONS = new Set([
  'media',
  'geolocation',
  'notifications',
  'midiSysex',
  'pointerLock',
  'fullscreen',
  'openExternal',
  'unknown',
]);

export function getSitePermissionsSnapshot(url: string): SitePermissionsSnapshot | null {
  const origin = originFromHttpUrl(url);
  if (!origin) return null;

  const permissions = Object.fromEntries(
    SITE_PERMISSION_KEYS.map((key) => [key, getSitePermissionOverride(origin, key)]),
  ) as Record<SitePermissionKey, SitePermissionValue>;

  return {
    origin,
    hostname: new URL(origin).hostname,
    permissions,
    globalBlockEnabled: getPrivacySettings().blockPermissions,
  };
}

export function updateSitePermission(
  origin: string,
  key: SitePermissionKey,
  value: SitePermissionValue,
): SitePermissionsSnapshot | null {
  if (!origin) return null;
  setSitePermissionOverride(origin, key, value);
  return getSitePermissionsSnapshot(origin);
}

function resolveSiteKey(
  origin: string,
  key: SitePermissionKey,
  globalBlock: boolean,
): boolean {
  const override = getSitePermissionOverride(origin, key);
  if (override === 'allow') return true;
  if (override === 'block') return false;
  if (globalBlock) return false;
  return true;
}

export function resolveSitePermission(origin: string | undefined, permission: string): boolean {
  if (!origin) return !getPrivacySettings().blockPermissions;

  const globalBlock = getPrivacySettings().blockPermissions;

  if (permission === 'geolocation') {
    return resolveSiteKey(origin, 'geolocation', globalBlock);
  }
  if (permission === 'notifications') {
    return resolveSiteKey(origin, 'notifications', globalBlock);
  }
  if (permission === 'media') {
    const camera = resolveSiteKey(origin, 'camera', globalBlock);
    const microphone = resolveSiteKey(origin, 'microphone', globalBlock);
    return camera || microphone;
  }

  if (!globalBlock) return true;
  return !SENSITIVE_ELECTRON_PERMISSIONS.has(permission);
}

export function resolveDevicePermission(
  origin: string | undefined,
  deviceType: string,
): boolean {
  if (!origin) return !getPrivacySettings().blockPermissions;

  const globalBlock = getPrivacySettings().blockPermissions;
  if (deviceType === 'camera') return resolveSiteKey(origin, 'camera', globalBlock);
  if (deviceType === 'microphone') return resolveSiteKey(origin, 'microphone', globalBlock);
  if (globalBlock) return false;
  return true;
}

export function isSensitivePermission(permission: string): boolean {
  return SENSITIVE_ELECTRON_PERMISSIONS.has(permission);
}

export function extractRequestOrigin(details: {
  requestingUrl?: string;
  securityOrigin?: string;
}): string | undefined {
  if (details.requestingUrl) {
    try {
      return new URL(details.requestingUrl).origin;
    } catch {
      // ignore malformed URLs
    }
  }

  if (details.securityOrigin) {
    try {
      return new URL(details.securityOrigin).origin;
    } catch {
      return details.securityOrigin;
    }
  }

  return undefined;
}

export function attachSitePermissions(sess: Session): void {
  if (configuredSessions.has(sess)) return;
  configuredSessions.add(sess);

  sess.setPermissionCheckHandler((_webContents, permission, requestingOrigin) =>
    resolveSitePermission(requestingOrigin, permission),
  );

  sess.setDevicePermissionHandler((details) =>
    resolveDevicePermission(details.origin, details.deviceType),
  );
}
