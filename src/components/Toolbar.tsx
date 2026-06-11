import type { ContentProtectionState, TabInfo } from '../types/browser';
import {
  IconBack,
  IconForward,
  IconGlobe,
  IconHome,
  IconLock,
  IconPrivacy,
  IconReload,
  IconSearch,
  IconShield,
  IconStar,
  IconStop,
  IconZoom,
} from './Icons';

interface ToolbarProps {
  activeTab: TabInfo | null;
  addressValue: string;
  protection: ContentProtectionState;
  zoomLevel: number;
  isBookmarked: boolean;
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
}

export function Toolbar({
  activeTab,
  addressValue,
  protection,
  zoomLevel,
  isBookmarked,
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
}: ToolbarProps) {
  const isLoading = activeTab?.isLoading ?? false;
  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <div className="toolbar">
      <div className="nav-controls panel-3d">
        <button
          type="button"
          className="btn-3d"
          onClick={onGoBack}
          disabled={!activeTab?.canGoBack}
          aria-label="Go back"
          title="Back"
        >
          <IconBack />
        </button>
        <button
          type="button"
          className="btn-3d"
          onClick={onGoForward}
          disabled={!activeTab?.canGoForward}
          aria-label="Go forward"
          title="Forward"
        >
          <IconForward />
        </button>
        <button type="button" className="btn-3d" onClick={onGoHome} aria-label="Home" title="Home">
          <IconHome />
        </button>
        <button
          type="button"
          className="btn-3d"
          onClick={isLoading ? onStop : onReload}
          aria-label={isLoading ? 'Stop' : 'Reload'}
          title={isLoading ? 'Stop' : 'Reload'}
        >
          {isLoading ? <IconStop /> : <IconReload />}
        </button>
      </div>

      <form
        className={`address-bar inset-3d ${activeTab?.isPrivate ? 'private' : ''}`}
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
          placeholder={activeTab?.isPrivate ? 'Private search or URL' : 'Search or enter address'}
          spellCheck={false}
          aria-label="Address bar"
        />
      </form>

      <div className="toolbar-actions">
        <button
          type="button"
          className={`btn-3d ${isBookmarked ? 'active-gold' : ''}`}
          onClick={onToggleBookmark}
          aria-label="Bookmark"
          title="Bookmark (Ctrl+D)"
        >
          <IconStar filled={isBookmarked} />
        </button>

        <div className="zoom-group inset-3d">
          <button type="button" className="btn-3d flat" onClick={onZoomOut} aria-label="Zoom out">
            <IconZoom />
          </button>
          <button type="button" className="zoom-label" onClick={onZoomReset}>
            {zoomPercent}%
          </button>
          <button type="button" className="btn-3d flat zoom-in-btn" onClick={onZoomIn} aria-label="Zoom in">
            <IconZoom />
          </button>
        </div>

        <button type="button" className="btn-3d" onClick={onOpenFind} aria-label="Find" title="Find (Ctrl+F)">
          <IconSearch />
        </button>

        <button
          type="button"
          className={`btn-3d privacy-btn ${protection.enabled ? 'active-shield' : ''}`}
          onClick={onOpenPrivacy}
          aria-label="Privacy dashboard"
          title="Privacy dashboard"
        >
          <IconPrivacy />
        </button>

        <button
          type="button"
          className={`btn-3d capture-btn ${protection.enabled ? 'active-shield' : ''}`}
          onClick={onToggleProtection}
          aria-label="Screen capture protection"
          title="Toggle screen capture protection"
        >
          <IconShield active={protection.enabled} />
        </button>
      </div>
    </div>
  );
}
