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
}

export interface BrowserState {
  tabs: TabInfo[];
  activeTabId: string | null;
}

export interface ContentProtectionState {
  enabled: boolean;
  supported: boolean;
}
