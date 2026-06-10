import type { ContentProtectionState, TabInfo } from '../types/browser';
import {
  IconBack,
  IconForward,
  IconGlobe,
  IconHome,
  IconLock,
  IconReload,
  IconShield,
  IconStop,
} from './Icons';

interface ToolbarProps {
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
}

export function Toolbar({
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
}: ToolbarProps) {
  const isLoading = activeTab?.isLoading ?? false;

  return (
    <div className="toolbar">
      <div className="nav-controls">
        <button
          type="button"
          className="icon-button"
          onClick={onGoBack}
          disabled={!activeTab?.canGoBack}
          aria-label="Go back"
          title="Back"
        >
          <IconBack />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onGoForward}
          disabled={!activeTab?.canGoForward}
          aria-label="Go forward"
          title="Forward"
        >
          <IconForward />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onGoHome}
          aria-label="Home"
          title="Home"
        >
          <IconHome />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={isLoading ? onStop : onReload}
          aria-label={isLoading ? 'Stop loading' : 'Reload page'}
          title={isLoading ? 'Stop' : 'Reload'}
        >
          {isLoading ? <IconStop /> : <IconReload />}
        </button>
      </div>

      <form
        className="address-bar"
        onSubmit={(event) => {
          event.preventDefault();
          onNavigate();
        }}
      >
        <span className={`address-icon ${activeTab?.isSecure ? 'secure' : ''}`}>
          {activeTab?.isSecure ? <IconLock /> : <IconGlobe />}
        </span>
        <input
          ref={addressRef}
          type="text"
          value={addressValue}
          onChange={(event) => onAddressChange(event.target.value)}
          onFocus={onAddressFocus}
          onBlur={onAddressBlur}
          placeholder="Search or enter address"
          spellCheck={false}
          aria-label="Address bar"
        />
      </form>

      <button
        type="button"
        className={`protection-toggle ${protection.enabled ? 'active' : ''}`}
        onClick={onToggleProtection}
        title={
          protection.enabled
            ? 'Screen capture protection enabled'
            : 'Screen capture protection disabled'
        }
        aria-pressed={protection.enabled}
        aria-label="Toggle screen capture protection"
      >
        <IconShield active={protection.enabled} />
      </button>
    </div>
  );
}
