import { useEffect } from 'react';

import type { BrowserState, TabInfo } from '@shared/types';

interface KeyboardShortcutOptions {
  browserState: BrowserState;
  activeTab: TabInfo | null;
  findOpen: boolean;
  closeFind: () => void;
  openFind: () => void;
  addressRef: React.RefObject<HTMLInputElement | null>;
}

export function useKeyboardShortcuts({
  browserState,
  activeTab,
  findOpen,
  closeFind,
  openFind,
  addressRef,
}: KeyboardShortcutOptions): void {
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
        openFind();
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
      if (key === 'escape' && findOpen) {
        event.preventDefault();
        closeFind();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, browserState, closeFind, findOpen, openFind, addressRef]);
}
