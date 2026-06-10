import type { ContentProtectionState, NavigationState } from '../App';

interface BrowserChromeProps {
  navigation: NavigationState;
  addressValue: string;
  protection: ContentProtectionState;
  onAddressChange: (value: string) => void;
  onAddressKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onNavigate: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onToggleProtection: () => void;
}

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconForward() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconReload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12a9 9 0 10-2.64 6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

function IconShield({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={active ? 'shield-active' : ''}>
      <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" />
    </svg>
  );
}

export function BrowserChrome({
  navigation,
  addressValue,
  protection,
  onAddressChange,
  onAddressKeyDown,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
  onToggleProtection,
}: BrowserChromeProps) {
  return (
    <header className="browser-chrome">
      <div className="chrome-row">
        <div className="nav-controls">
          <button
            type="button"
            className="icon-button"
            onClick={onGoBack}
            disabled={!navigation.canGoBack}
            aria-label="Go back"
          >
            <IconBack />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onGoForward}
            disabled={!navigation.canGoForward}
            aria-label="Go forward"
          >
            <IconForward />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={navigation.isLoading ? onStop : onReload}
            aria-label={navigation.isLoading ? 'Stop loading' : 'Reload page'}
          >
            {navigation.isLoading ? <IconStop /> : <IconReload />}
          </button>
        </div>

        <form
          className="address-bar"
          onSubmit={(event) => {
            event.preventDefault();
            onNavigate();
          }}
        >
          <input
            type="text"
            value={addressValue}
            onChange={(event) => onAddressChange(event.target.value)}
            onKeyDown={onAddressKeyDown}
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
              ? 'Screenshot protection is ON — click to disable'
              : 'Screenshot protection is OFF — click to enable'
          }
          aria-pressed={protection.enabled}
          aria-label="Toggle screenshot protection"
        >
          <IconShield active={protection.enabled} />
          <span>{protection.enabled ? 'Protected' : 'Unprotected'}</span>
        </button>
      </div>

      <div className="status-row">
        <span className="page-title">{navigation.title || 'New tab'}</span>
        <span className="protection-note">
          {protection.enabled
            ? protection.supported
              ? 'Hidden from screen capture (Windows 10 2004+)'
              : 'Capture shows black window on older Windows'
            : 'Screen capture allowed'}
        </span>
      </div>
    </header>
  );
}
