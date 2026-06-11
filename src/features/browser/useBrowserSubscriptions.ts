import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_PRIVACY_SETTINGS } from '@shared/types';
import type {
  Bookmark,
  BrowserState,
  ContentProtectionState,
  PrivacySettings,
  PrivacyState,
  PrivacyStats,
} from '@shared/types';

export function useBrowserSubscriptions() {
  const [browserState, setBrowserState] = useState<BrowserState>({
    tabs: [],
    activeTabId: null,
    zoomLevel: 1,
  });
  const [protection, setProtection] = useState<ContentProtectionState>({
    enabled: true,
    supported: true,
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [privacyStats, setPrivacyStats] = useState<PrivacyStats>({
    trackersBlocked: 0,
    permissionsDenied: 0,
  });
  const [maximized, setMaximized] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const applyPrivacyState = useCallback((state: PrivacyState) => {
    setPrivacySettings(state.settings);
    setPrivacyStats(state.stats);
  }, []);

  useEffect(() => {
    const api = window.browserApi;

    void api.getBrowserState().then(setBrowserState);
    void api.getContentProtection().then(setProtection);
    void api.getBookmarks().then(setBookmarks);
    void api.getPrivacyState().then(applyPrivacyState);
    void api.windowIsMaximized().then(setMaximized);

    const unsubState = api.onBrowserState(setBrowserState);
    const unsubProtection = api.onContentProtectionState(setProtection);
    const unsubBookmarks = api.onBookmarksUpdated(setBookmarks);
    const unsubPrivacy = api.onPrivacyState(applyPrivacyState);
    const unsubMaximized = api.onWindowMaximized(setMaximized);

    return () => {
      unsubState();
      unsubProtection();
      unsubBookmarks();
      unsubPrivacy();
      unsubMaximized();
    };
  }, [applyPrivacyState]);

  return {
    browserState,
    protection,
    privacySettings,
    privacyStats,
    maximized,
    bookmarks,
  };
}
