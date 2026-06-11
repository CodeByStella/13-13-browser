import { useCallback, useEffect, useRef, useState } from 'react';

import { findBookmarkByUrl } from '@shared/utils/bookmarks';

import { BrowserChrome } from '../components/chrome/BrowserChrome';
import { useBrowserSubscriptions } from '../features/browser/useBrowserSubscriptions';
import { useAddressBar, useFindInPage } from '../features/browser/useFindInPage';
import { useKeyboardShortcuts } from '../features/browser/useKeyboardShortcuts';

interface RenameTarget {
  id: string;
  title: string;
}

export default function App() {
  const addressRef = useRef<HTMLInputElement>(null);
  const { browserState, protection, privacySettings, maximized, bookmarks } =
    useBrowserSubscriptions();
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);

  const activeTab =
    browserState.tabs.find((tab) => tab.id === browserState.activeTabId) ?? null;

  const isBookmarked = activeTab
    ? !!findBookmarkByUrl(bookmarks, activeTab.url)
    : false;

  const {
    findOpen,
    findQuery,
    findResult,
    findInputRef,
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
    findOpen,
    closeFind,
    addressRef,
  });

  useEffect(() => {
    const unsub = window.browserApi.onBookmarkAdded((payload) => {
      setRenameTarget({ id: payload.id, title: payload.title });
    });
    return unsub;
  }, []);

  const clearRenameTarget = useCallback(() => {
    setRenameTarget(null);
  }, []);

  const toggleBookmark = useCallback(async () => {
    if (!activeTab?.url) return;
    const { addedId } = await window.browserApi.toggleBookmark(
      activeTab.title,
      activeTab.url,
      activeTab.favicon,
    );
    if (addedId) {
      setRenameTarget({ id: addedId, title: activeTab.title });
    }
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
        renameTarget={renameTarget}
        onRenameTargetHandled={clearRenameTarget}
        findOpen={findOpen}
        findQuery={findQuery}
        findResult={findResult}
        findInputRef={findInputRef}
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
        onBookmarkOpenInNewTab={(url) => void window.browserApi.createTab(url)}
        onRemoveBookmark={(id) => void window.browserApi.removeBookmark(id)}
        onCreateBookmarkFolder={(title, parentId) =>
          void window.browserApi.createBookmarkFolder(title, parentId)
        }
        onRenameBookmark={(id, title) => void window.browserApi.renameBookmark(id, title)}
        onMoveBookmark={(id, parentId) => void window.browserApi.moveBookmark(id, parentId)}
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
