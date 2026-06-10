import type { ContentProtectionState, TabInfo } from '../types/browser';
import { TabBar } from './TabBar';
import { Toolbar } from './Toolbar';

interface BrowserChromeProps {
  tabs: TabInfo[];
  activeTab: TabInfo | null;
  addressValue: string;
  protection: ContentProtectionState;
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
  onNewTab: () => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export function BrowserChrome({
  tabs,
  activeTab,
  addressValue,
  protection,
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
  onNewTab,
  onSwitchTab,
  onCloseTab,
}: BrowserChromeProps) {
  const anyLoading = tabs.some((tab) => tab.isLoading);

  return (
    <header className="browser-chrome">
      {anyLoading && <div className="loading-bar" aria-hidden="true" />}

      <TabBar
        tabs={tabs}
        onNewTab={onNewTab}
        onSwitchTab={onSwitchTab}
        onCloseTab={onCloseTab}
      />

      <Toolbar
        activeTab={activeTab}
        addressValue={addressValue}
        protection={protection}
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
      />

      <div className="status-row">
        <span className="page-title">{activeTab?.title || 'New Tab'}</span>
        <span className="protection-note">
          {protection.enabled
            ? protection.supported
              ? 'Protected from screen capture'
              : 'Capture shows black window on older Windows'
            : 'Screen capture allowed'}
        </span>
      </div>
    </header>
  );
}
