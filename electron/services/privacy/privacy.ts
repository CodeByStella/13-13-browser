import { BrowserWindow, session, type Session, type WebContents } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';
import type { PrivacySettings, PrivacyStats } from '@shared/types';

import { getAppContext } from '../../app/context';
import {
  loadPrivacySettings,
  savePrivacySettings,
} from '../../stores/privacy-store';
import {
  attachSitePermissions,
  bindPrivacySettingsProvider,
  extractRequestOrigin,
  isSensitivePermission,
  resolveSitePermission,
} from '../permissions/site-permissions';
import { initContentProtectionFromSettings, setContentProtectionPreference } from './content-protection';
import { backupNewTabShortcutsBeforeClear } from '../newtab/newtab-shortcuts-sync';
import { applySessionUserAgent, patchBrowserRequestHeaders } from '../../lib/browser-user-agent';

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
const privacyStateTargets = new Set<WebContents>();

export function registerPrivacyStateTarget(webContents: WebContents): () => void {
  privacyStateTargets.add(webContents);
  return () => {
    privacyStateTargets.delete(webContents);
  };
}

export function initPrivacy(window: BrowserWindow): void {
  mainWindow = window;
  settings = loadPrivacySettings();
  initContentProtectionFromSettings();
  bindPrivacySettingsProvider(() => settings);
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
  if (typeof partial.screenCaptureProtection === 'boolean') {
    setContentProtectionPreference(partial.screenCaptureProtection, { persist: false });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setContentProtection(partial.screenCaptureProtection);
    }
  }
  broadcastPrivacyState();
  return { ...settings };
}

function browserSessions(): Session[] {
  return [session.defaultSession, session.fromPartition('persist:browser')];
}

export async function clearBrowsingData(): Promise<void> {
  await backupNewTabShortcutsBeforeClear(
    () => getAppContext().getTabManager()?.getNormalTabWebContents() ?? [],
  );

  for (const sess of browserSessions()) {
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

  applySessionUserAgent(sess);
  attachSitePermissions(sess);

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
    const headers = patchBrowserRequestHeaders({ ...details.requestHeaders });
    if (settings.sendDoNotTrack) {
      headers.DNT = '1';
    }
    callback({ requestHeaders: headers as Record<string, string> });
  });

  sess.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const origin = extractRequestOrigin(details);
    const allowed = resolveSitePermission(origin, permission);

    if (!allowed && isSensitivePermission(permission)) {
      stats.permissionsDenied += 1;
      broadcastPrivacyState();
    }

    callback(allowed);
  });
}

function broadcastPrivacyState(): void {
  const payload = {
    settings: getPrivacySettings(),
    stats: getPrivacyStats(),
  };

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_EVENTS.PRIVACY_STATE, payload);
  }

  for (const target of privacyStateTargets) {
    if (!target.isDestroyed()) {
      target.send(IPC_EVENTS.PRIVACY_STATE, payload);
    }
  }
}

export function broadcastInitialPrivacyState(): void {
  broadcastPrivacyState();
}
