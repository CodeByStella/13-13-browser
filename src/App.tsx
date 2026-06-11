import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserChrome } from './components/BrowserChrome';
import { PrivacyPanel } from './components/PrivacyPanel';
import type {
  Bookmark,
  BrowserState,
  ContentProtectionState,
  FindResult,
  PrivacySettings,
  PrivacyState,
  PrivacyStats,
  TabInfo,
} from './types/browser';

const DEFAULT_PRIVACY: PrivacySettings = {
  blockTrackers: true,
  sendDoNotTrack: true,
  blockPermissions: true,
  clearOnExit: false,
};

export default function App() {
  const [browserState, setBrowserState] = useState<BrowserState>({
    tabs: [],
    activeTabId: null,
    zoomLevel: 1,
  });
  const [addressValue, setAddressValue] = useState('');
  const [addressFocused, setAddressFocused] = useState(false);
  const [protection, setProtection] = useState<ContentProtectionState>({
    enabled: true,
    supported: true,
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [privacyStats, setPrivacyStats] = useState<PrivacyStats>({
    trackersBlocked: 0,
    permissionsDenied: 0,
  });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResult, setFindResult] = useState<FindResult>({ activeMatch: 0, matches: 0 });
  const addressRef = useRef<HTMLInputElement>(null);
  const findDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const activeTab: TabInfo | null =
    browserState.tabs.find((tab) => tab.id === browserState.activeTabId) ?? null;

  const isBookmarked = activeTab
    ? bookmarks.some((b) => b.url === activeTab.url)
    : false;

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
    const unsubFind = api.onFindResult(setFindResult);
    const unsubPrivacy = api.onPrivacyState(applyPrivacyState);
    const unsubMaximized = api.onWindowMaximized(setMaximized);

    return () => {
      unsubState();
      unsubProtection();
      unsubBookmarks();
      unsubFind();
      unsubPrivacy();
      unsubMaximized();
    };
  }, [applyPrivacyState]);

  useEffect(() => {
    void window.browserApi.setWebContentHidden(privacyOpen);
    return () => {
      void window.browserApi.setWebContentHidden(false);
    };
  }, [privacyOpen]);

  useEffect(() => {
    if (activeTab && !addressFocused) {
      setAddressValue(activeTab.url);
    }
  }, [activeTab?.url, addressFocused]);

  useEffect(() => {
    if (!findOpen) return;
    clearTimeout(findDebounce.current);
    findDebounce.current = setTimeout(() => {
      if (findQuery) {
        void window.browserApi.findInPage(findQuery, true);
      } else {
        void window.browserApi.stopFindInPage();
      }
    }, 150);
    return () => clearTimeout(findDebounce.current);
  }, [findQuery, findOpen]);

  const closeFind = useCallback(() => {
    setFindOpen(false);
    setFindQuery('');
    setFindResult({ activeMatch: 0, matches: 0 });
    void window.browserApi.stopFindInPage();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (mod && key === 'l') {
        event.preventDefault();
        addressRef.current?.focus();
        addressRef.current?.select();
      }
      if (mod && key === 't' && !event.shiftKey) {
        event.preventDefault();
        void window.browserApi.createTab();
      }
      if (mod && event.shiftKey && key === 'n') {
        event.preventDefault();
        void window.browserApi.createPrivateTab();
      }
      if (mod && key === 'w') {
        event.preventDefault();
        if (browserState.activeTabId) {
          void window.browserApi.closeTab(browserState.activeTabId);
        }
      }
      if (mod && key === 'r') {
        event.preventDefault();
        void window.browserApi.reload();
      }
      if (mod && key === 'f') {
        event.preventDefault();
        setFindOpen(true);
      }
      if (mod && key === 'd') {
        event.preventDefault();
        if (activeTab?.url) {
          void window.browserApi.toggleBookmark(activeTab.title, activeTab.url);
        }
      }
      if (mod && key === 'tab') {
        event.preventDefault();
        const idx = browserState.tabs.findIndex((t) => t.id === browserState.activeTabId);
        if (idx === -1 || browserState.tabs.length === 0) return;
        const next = event.shiftKey
          ? (idx - 1 + browserState.tabs.length) % browserState.tabs.length
          : (idx + 1) % browserState.tabs.length;
        void window.browserApi.switchTab(browserState.tabs[next].id);
      }
      if (mod && event.shiftKey && key === 't') {
        event.preventDefault();
        void window.browserApi.reopenClosedTab();
      }
      if (mod && (key === '=' || key === '+')) {
        event.preventDefault();
        void window.browserApi.zoomIn();
      }
      if (mod && key === '-') {
        event.preventDefault();
        void window.browserApi.zoomOut();
      }
      if (mod && key === '0') {
        event.preventDefault();
        void window.browserApi.zoomReset();
      }
      if (key === 'f12') {
        event.preventDefault();
        void window.browserApi.toggleDevTools();
      }
      if (key === 'f5') {
        event.preventDefault();
        void window.browserApi.reload();
      }
      if (event.altKey && key === 'arrowleft') {
        event.preventDefault();
        void window.browserApi.goBack();
      }
      if (event.altKey && key === 'arrowright') {
        event.preventDefault();
        void window.browserApi.goForward();
      }
      if (key === 'escape') {
        if (findOpen) {
          event.preventDefault();
          closeFind();
        } else if (privacyOpen) {
          event.preventDefault();
          setPrivacyOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [browserState, activeTab, findOpen, privacyOpen, closeFind]);

  const handleNavigate = useCallback(async (rawUrl?: string) => {
    const target = rawUrl ?? addressValue;
    const url = await window.browserApi.navigate(target);
    setAddressValue(url);
    addressRef.current?.blur();
  }, [addressValue]);

  const toggleProtection = useCallback(async () => {
    const next = await window.browserApi.setContentProtection(!protection.enabled);
    setProtection(next);
  }, [protection.enabled]);

  const toggleBookmark = useCallback(async () => {
    if (!activeTab?.url) return;
    await window.browserApi.toggleBookmark(activeTab.title, activeTab.url);
  }, [activeTab]);

  const updatePrivacySetting = useCallback(async (key: keyof PrivacySettings, value: boolean) => {
    const next = await window.browserApi.updatePrivacySettings({ [key]: value });
    setPrivacySettings(next);
  }, []);

  const clearBrowsingData = useCallback(async () => {
    await window.browserApi.clearBrowsingData();
    const state = await window.browserApi.getPrivacyState();
    applyPrivacyState(state);
  }, [applyPrivacyState]);

  return (
    <div className="app-shell">
      <BrowserChrome
        tabs={browserState.tabs}
        activeTab={activeTab}
        addressValue={addressValue}
        protection={protection}
        privacySettings={privacySettings}
        maximized={maximized}
        zoomLevel={browserState.zoomLevel}
        bookmarks={bookmarks}
        isBookmarked={isBookmarked}
        findOpen={findOpen}
        findQuery={findQuery}
        findResult={findResult}
        addressRef={addressRef}
        onAddressChange={setAddressValue}
        onAddressFocus={() => setAddressFocused(true)}
        onAddressBlur={() => setAddressFocused(false)}
        onNavigate={() => void handleNavigate()}
        onGoBack={() => void window.browserApi.goBack()}
        onGoForward={() => void window.browserApi.goForward()}
        onGoHome={() => void window.browserApi.goHome()}
        onReload={() => void window.browserApi.reload()}
        onStop={() => void window.browserApi.stop()}
        onToggleProtection={() => void toggleProtection()}
        onToggleBookmark={() => void toggleBookmark()}
        onOpenFind={() => setFindOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onZoomIn={() => void window.browserApi.zoomIn()}
        onZoomOut={() => void window.browserApi.zoomOut()}
        onZoomReset={() => void window.browserApi.zoomReset()}
        onNewTab={() => void window.browserApi.createTab()}
        onNewPrivateTab={() => void window.browserApi.createPrivateTab()}
        onSwitchTab={(id) => void window.browserApi.switchTab(id)}
        onCloseTab={(id) => void window.browserApi.closeTab(id)}
        onBookmarkNavigate={(url) => void handleNavigate(url)}
        onRemoveBookmark={(id) => void window.browserApi.removeBookmark(id)}
        onFindQueryChange={setFindQuery}
        onFindNext={() => void window.browserApi.findNext(true)}
        onFindPrev={() => void window.browserApi.findNext(false)}
        onCloseFind={closeFind}
        onMinimize={() => void window.browserApi.windowMinimize()}
        onToggleMaximize={() => void window.browserApi.windowToggleMaximize()}
        onCloseWindow={() => void window.browserApi.windowClose()}
      />

      <PrivacyPanel
        open={privacyOpen}
        settings={privacySettings}
        stats={privacyStats}
        protectionEnabled={protection.enabled}
        onClose={() => setPrivacyOpen(false)}
        onUpdateSetting={(key, value) => void updatePrivacySetting(key, value)}
        onClearData={() => void clearBrowsingData()}
        onToggleProtection={() => void toggleProtection()}
      />
    </div>
  );
}
