import { useEffect, useRef } from 'react';

import type { PrivacySettings } from '@shared/types';
import { computePrivacyScore } from '@shared/utils/privacy-score';
import type {
  Bookmark,
  ContentProtectionState,
  TabInfo,
} from '@shared/types';
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
  renameTarget: { id: string; title: string } | null;
  onRenameTargetHandled: () => void;
  findOpen: boolean;
  findQuery: string;
  findResult: { activeMatch: number; matches: number };
  findInputRef: React.RefObject<HTMLInputElement | null>;
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
  onToggleBookmark: () => void;
  onOpenFind: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onNewTab: () => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onBookmarkNavigate: (url: string) => void;
  onBookmarkOpenInNewTab: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
  onCreateBookmarkFolder: (title: string, parentId?: string | null) => void;
  onRenameBookmark: (id: string, title: string) => void;
  onMoveBookmark: (id: string, parentId: string | null) => void;
  onFindQueryChange: (value: string) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onCloseFind: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onCloseWindow: () => void;
}

function computeScore(settings: PrivacySettings, protection: boolean): number {
  return computePrivacyScore(settings, protection);
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
    renameTarget,
    onRenameTargetHandled,
    findOpen,
    findQuery,
    findResult,
    findInputRef,
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
    onToggleBookmark,
    onOpenFind,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onNewTab,
    onSwitchTab,
    onCloseTab,
    onBookmarkNavigate,
    onBookmarkOpenInNewTab,
    onRemoveBookmark,
    onCreateBookmarkFolder,
    onRenameBookmark,
    onMoveBookmark,
    onFindQueryChange,
    onFindNext,
    onFindPrev,
    onCloseFind,
    onMinimize,
    onToggleMaximize,
    onCloseWindow,
  } = props;

  const anyLoading = tabs.some((tab) => tab.isLoading);
  const privacyScore = computeScore(privacySettings, protection.enabled);

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
        maximized={maximized}
        onNewTab={onNewTab}
        onSwitchTab={onSwitchTab}
        onCloseTab={onCloseTab}
        onMinimize={onMinimize}
        onToggleMaximize={onToggleMaximize}
        onCloseWindow={onCloseWindow}
      />

      <Toolbar
        activeTab={activeTab}
        addressValue={addressValue}
        privacyScore={privacyScore}
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
        onToggleBookmark={onToggleBookmark}
        onOpenFind={onOpenFind}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
      />

      <BookmarkBar
        bookmarks={bookmarks}
        activeUrl={activeTab?.url ?? ''}
        renameTarget={renameTarget}
        onRenameTargetHandled={onRenameTargetHandled}
        onNavigate={onBookmarkNavigate}
        onOpenInNewTab={onBookmarkOpenInNewTab}
      />

      {findOpen && (
        <FindBar
          query={findQuery}
          result={findResult}
          inputRef={findInputRef}
          onQueryChange={onFindQueryChange}
          onNext={onFindNext}
          onPrev={onFindPrev}
          onClose={onCloseFind}
        />
      )}
    </header>
  );
}
