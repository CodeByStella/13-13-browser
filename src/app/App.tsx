import { useCallback, useRef } from 'react';

import { BrowserChrome } from '../components/chrome/BrowserChrome';
import { useBrowserSubscriptions } from '../features/browser/useBrowserSubscriptions';
import { useAddressBar, useFindInPage } from '../features/browser/useFindInPage';
import { useKeyboardShortcuts } from '../features/browser/useKeyboardShortcuts';

export default function App() {
  const addressRef = useRef<HTMLInputElement>(null);
  const { browserState, protection, privacySettings, maximized, bookmarks } =
    useBrowserSubscriptions();

  const activeTab =
    browserState.tabs.find((tab) => tab.id === browserState.activeTabId) ?? null;

  const isBookmarked = activeTab
    ? bookmarks.some((bookmark) => bookmark.url === activeTab.url)
    : false;

  const {
    findOpen,
    findQuery,
    findResult,
    setFindQuery,
    closeFind,
    openFind,
  } = useFindInPage();

  const {
    addressValue,
    setAddressValue,
    onAddressFocus,
    onAddressBlur,
    handleNavigate,
  } = useAddressBar(activeTab, addressRef);

  useKeyboardShortcuts({
    browserState,
    activeTab,
    findOpen,
    closeFind,
    openFind,
    addressRef,
  });

  const toggleBookmark = useCallback(async () => {
    if (!activeTab?.url) return;
    await window.browserApi.toggleBookmark(activeTab.title, activeTab.url);
  }, [activeTab]);

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
        onAddressFocus={onAddressFocus}
        onAddressBlur={onAddressBlur}
        onNavigate={() => void handleNavigate()}
        onGoBack={() => void window.browserApi.goBack()}
        onGoForward={() => void window.browserApi.goForward()}
        onGoHome={() => void window.browserApi.goHome()}
        onReload={() => void window.browserApi.reload()}
        onStop={() => void window.browserApi.stop()}
        onToggleBookmark={() => void toggleBookmark()}
        onOpenFind={openFind}
        onZoomIn={() => void window.browserApi.zoomIn()}
        onZoomOut={() => void window.browserApi.zoomOut()}
        onZoomReset={() => void window.browserApi.zoomReset()}
        onNewTab={() => void window.browserApi.createTab()}
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
    </div>
  );
}
