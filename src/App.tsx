import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserChrome } from './components/BrowserChrome';
import type { BrowserState, ContentProtectionState, TabInfo } from './types/browser';

export default function App() {
  const [browserState, setBrowserState] = useState<BrowserState>({ tabs: [], activeTabId: null });
  const [addressValue, setAddressValue] = useState('');
  const [addressFocused, setAddressFocused] = useState(false);
  const [protection, setProtection] = useState<ContentProtectionState>({
    enabled: true,
    supported: true,
  });
  const addressRef = useRef<HTMLInputElement>(null);

  const activeTab: TabInfo | null =
    browserState.tabs.find((tab) => tab.id === browserState.activeTabId) ?? null;

  useEffect(() => {
    const api = window.browserApi;

    void api.getBrowserState().then(setBrowserState);
    void api.getContentProtection().then(setProtection);

    const unsubState = api.onBrowserState(setBrowserState);
    const unsubProtection = api.onContentProtectionState(setProtection);

    return () => {
      unsubState();
      unsubProtection();
    };
  }, []);

  useEffect(() => {
    if (activeTab && !addressFocused) {
      setAddressValue(activeTab.url);
    }
  }, [activeTab?.url, addressFocused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key === 'l') {
        event.preventDefault();
        addressRef.current?.focus();
        addressRef.current?.select();
      }
      if (mod && event.key === 't') {
        event.preventDefault();
        void window.browserApi.createTab();
      }
      if (mod && event.key === 'w') {
        event.preventDefault();
        if (browserState.activeTabId) {
          void window.browserApi.closeTab(browserState.activeTabId);
        }
      }
      if (mod && event.key === 'r') {
        event.preventDefault();
        void window.browserApi.reload();
      }
      if (mod && event.key === 'Tab') {
        event.preventDefault();
        const idx = browserState.tabs.findIndex((t) => t.id === browserState.activeTabId);
        if (idx === -1 || browserState.tabs.length === 0) return;
        const next = event.shiftKey
          ? (idx - 1 + browserState.tabs.length) % browserState.tabs.length
          : (idx + 1) % browserState.tabs.length;
        void window.browserApi.switchTab(browserState.tabs[next].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [browserState]);

  const handleNavigate = useCallback(async () => {
    const url = await window.browserApi.navigate(addressValue);
    setAddressValue(url);
    addressRef.current?.blur();
  }, [addressValue]);

  const toggleProtection = useCallback(async () => {
    const next = await window.browserApi.setContentProtection(!protection.enabled);
    setProtection(next);
  }, [protection.enabled]);

  return (
    <BrowserChrome
      tabs={browserState.tabs}
      activeTab={activeTab}
      addressValue={addressValue}
      protection={protection}
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
      onNewTab={() => void window.browserApi.createTab()}
      onSwitchTab={(id) => void window.browserApi.switchTab(id)}
      onCloseTab={(id) => void window.browserApi.closeTab(id)}
    />
  );
}
