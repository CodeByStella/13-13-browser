import { BrowserWindow, session, type Session } from 'electron';
import {
  loadPrivacySettings,
  savePrivacySettings,
  type PrivacySettings,
} from './privacy-store';

export interface PrivacyStats {
  trackersBlocked: number;
  permissionsDenied: number;
}

const TRACKER_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'connect.facebook.net',
  'doubleclick.net',
  'googlesyndication.com',
  'scorecardresearch.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'segment.com',
  'analytics.twitter.com',
  'ads-twitter.com',
  'taboola.com',
  'outbrain.com',
  'amazon-adsystem.com',
  'adnxs.com',
  'criteo.com',
  'quantserve.com',
  'moatads.com',
  'chartbeat.com',
  'newrelic.com',
  'clarity.ms',
];

const configuredSessions = new WeakSet<Session>();

let settings = loadPrivacySettings();
let stats: PrivacyStats = { trackersBlocked: 0, permissionsDenied: 0 };
let mainWindow: BrowserWindow | null = null;

export function initPrivacy(window: BrowserWindow): void {
  mainWindow = window;
  settings = loadPrivacySettings();
  setupSession(session.defaultSession);
}

export function attachPrivacySession(sess: Session): void {
  setupSession(sess);
}

export function getPrivacySettings(): PrivacySettings {
  return { ...settings };
}

export function getPrivacyStats(): PrivacyStats {
  return { ...stats };
}

export function updatePrivacySettings(partial: Partial<PrivacySettings>): PrivacySettings {
  settings = { ...settings, ...partial };
  savePrivacySettings(settings);
  broadcastPrivacyState();
  return { ...settings };
}

export async function clearBrowsingData(): Promise<void> {
  const sessions = [session.defaultSession];
  for (const sess of sessions) {
    await sess.clearStorageData();
    await sess.clearCache();
  }
  stats = { trackersBlocked: 0, permissionsDenied: 0 };
  broadcastPrivacyState();
}

export async function clearOnExitIfEnabled(): Promise<void> {
  if (settings.clearOnExit) {
    await clearBrowsingData();
  }
}

function setupSession(sess: Session): void {
  if (configuredSessions.has(sess)) return;
  configuredSessions.add(sess);

  sess.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    if (!settings.blockTrackers || details.resourceType === 'mainFrame') {
      callback({});
      return;
    }

    try {
      const hostname = new URL(details.url).hostname;
      const blocked = TRACKER_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );
      if (blocked) {
        stats.trackersBlocked += 1;
        broadcastPrivacyState();
        callback({ cancel: true });
        return;
      }
    } catch {
      // ignore malformed URLs
    }
    callback({});
  });

  sess.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, callback) => {
    const headers = { ...details.requestHeaders };
    if (settings.sendDoNotTrack) {
      headers.DNT = '1';
    }
    callback({ requestHeaders: headers });
  });

  sess.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (!settings.blockPermissions) {
      callback(true);
      return;
    }

    const sensitive = [
      'media',
      'geolocation',
      'notifications',
      'midiSysex',
      'pointerLock',
      'fullscreen',
      'openExternal',
      'unknown',
    ];

    if (sensitive.includes(permission)) {
      stats.permissionsDenied += 1;
      broadcastPrivacyState();
      callback(false);
      return;
    }

    callback(true);
  });
}

function broadcastPrivacyState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('privacy-state', {
    settings: getPrivacySettings(),
    stats: getPrivacyStats(),
  });
}

export function broadcastInitialPrivacyState(): void {
  broadcastPrivacyState();
}
