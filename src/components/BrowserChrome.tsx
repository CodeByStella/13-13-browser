import { useEffect, useRef } from 'react';
import type {
  Bookmark,
  ContentProtectionState,
  PrivacySettings,
  TabInfo,
} from '../types/browser';
import { BookmarkBar } from './BookmarkBar';
import { FindBar } from './FindBar';
import { TabBar } from './TabBar';
import { Toolbar } from './Toolbar';

interface BrowserChromeProps {
  tabs: TabInfo[];
  activeTab: TabInfo | null;
  addressValue: string;
  protection: ContentProtectionState;
  privacySettings: PrivacySettings;
  maximized: boolean;
  zoomLevel: number;
  bookmarks: Bookmark[];
  isBookmarked: boolean;
  findOpen: boolean;
  findQuery: string;
  findResult: { activeMatch: number; matches: number };
  addressRef: React.RefObject<HTMLInputElement | null>;
  onAddressChange: (value: string) => void;
  onAddressFocus: () => void;
  onAddressBlur: () => void;
  onNavigate: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoHome: () => void;
  onReload: () => void;
  onStop: () => void;
  onToggleProtection: () => void;
  onToggleBookmark: () => void;
  onOpenFind: () => void;
  onOpenPrivacy: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onNewTab: () => void;
  onNewPrivateTab: () => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onBookmarkNavigate: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
  onFindQueryChange: (value: string) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onCloseFind: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onCloseWindow: () => void;
}

function computePrivacyScore(settings: PrivacySettings, protection: boolean): number {
  return Math.min(
    100,
    (settings.blockTrackers ? 25 : 0) +
      (settings.sendDoNotTrack ? 20 : 0) +
      (settings.blockPermissions ? 25 : 0) +
      (protection ? 30 : 0),
  );
}

export function BrowserChrome(props: BrowserChromeProps) {
  const chromeRef = useRef<HTMLElement>(null);
  const {
    tabs,
    activeTab,
    addressValue,
    protection,
    privacySettings,
    maximized,
    zoomLevel,
    bookmarks,
    isBookmarked,
    findOpen,
    findQuery,
    findResult,
    addressRef,
    onAddressChange,
    onAddressFocus,
    onAddressBlur,
    onNavigate,
    onGoBack,
    onGoForward,
    onGoHome,
    onReload,
    onStop,
    onToggleProtection,
    onToggleBookmark,
    onOpenFind,
    onOpenPrivacy,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onNewTab,
    onNewPrivateTab,
    onSwitchTab,
    onCloseTab,
    onBookmarkNavigate,
    onRemoveBookmark,
    onFindQueryChange,
    onFindNext,
    onFindPrev,
    onCloseFind,
    onMinimize,
    onToggleMaximize,
    onCloseWindow,
  } = props;

  const anyLoading = tabs.some((tab) => tab.isLoading);
  const privacyScore = computePrivacyScore(privacySettings, protection.enabled);

  useEffect(() => {
    const el = chromeRef.current;
    if (!el) return;

    const syncHeight = (): void => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      void window.browserApi.setChromeHeight(height);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={chromeRef} className="browser-chrome">
      {anyLoading && <div className="loading-bar" aria-hidden="true" />}

      <TabBar
        tabs={tabs}
        privacyScore={privacyScore}
        maximized={maximized}
        onNewTab={onNewTab}
        onNewPrivateTab={onNewPrivateTab}
        onSwitchTab={onSwitchTab}
        onCloseTab={onCloseTab}
        onOpenPrivacy={onOpenPrivacy}
        onMinimize={onMinimize}
        onToggleMaximize={onToggleMaximize}
        onCloseWindow={onCloseWindow}
      />

      <Toolbar
        activeTab={activeTab}
        addressValue={addressValue}
        protection={protection}
        zoomLevel={zoomLevel}
        isBookmarked={isBookmarked}
        addressRef={addressRef}
        onAddressChange={onAddressChange}
        onAddressFocus={onAddressFocus}
        onAddressBlur={onAddressBlur}
        onNavigate={onNavigate}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        onGoHome={onGoHome}
        onReload={onReload}
        onStop={onStop}
        onToggleProtection={onToggleProtection}
        onToggleBookmark={onToggleBookmark}
        onOpenFind={onOpenFind}
        onOpenPrivacy={onOpenPrivacy}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
      />

      <BookmarkBar
        bookmarks={bookmarks}
        onNavigate={onBookmarkNavigate}
        onRemove={onRemoveBookmark}
      />

      {findOpen && (
        <FindBar
          query={findQuery}
          result={findResult}
          onQueryChange={onFindQueryChange}
          onNext={onFindNext}
          onPrev={onFindPrev}
          onClose={onCloseFind}
        />
      )}
    </header>
  );
}
