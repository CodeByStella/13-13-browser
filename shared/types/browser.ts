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

export type BookmarkItemType = 'bookmark' | 'folder';

export interface BookmarkNode {
  id: string;
  type: BookmarkItemType;
  title: string;
  url?: string;
  favicon?: string;
  parentId: string | null;
  createdAt: number;
}

/** Flat bookmark list alias used across IPC and UI. */
export type Bookmark = BookmarkNode;

export interface BookmarkToggleResult {
  addedId: string | null;
}

export interface BookmarkAddedPayload {
  id: string;
  title: string;
}

export interface FindResult {
  activeMatch: number;
  matches: number;
}
