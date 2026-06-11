export interface TabInfo {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isActive: boolean;
  isSecure: boolean;
  isPrivate: boolean;
}

export interface BrowserState {
  tabs: TabInfo[];
  activeTabId: string | null;
  zoomLevel: number;
}

export interface ContentProtectionState {
  enabled: boolean;
  supported: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

export interface FindResult {
  activeMatch: number;
  matches: number;
}

export interface PrivacySettings {
  blockTrackers: boolean;
  sendDoNotTrack: boolean;
  blockPermissions: boolean;
  clearOnExit: boolean;
}

export interface PrivacyStats {
  trackersBlocked: number;
  permissionsDenied: number;
}

export interface PrivacyState {
  settings: PrivacySettings;
  stats: PrivacyStats;
}
