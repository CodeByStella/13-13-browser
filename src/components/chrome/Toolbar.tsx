import { useRef } from 'react';

import { isManageableSiteUrl } from '@shared/utils/url';
import type { TabInfo } from '@shared/types';
import {
  IconBack,
  IconForward,
  IconGlobe,
  IconHome,
  IconLock,
  IconMore,
  IconReload,
  IconSearch,
  IconSitePermissions,
  IconStar,
  IconStop,
  IconZoom,
} from '../ui/Icons';
import { PrivacyShieldButton } from './PrivacyShieldButton';

interface ToolbarProps {
  activeTab: TabInfo | null;
  addressValue: string;
  privacyScore: number;
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
  onToggleBookmark: () => void;
  onOpenFind: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function Toolbar({
  activeTab,
  addressValue,
  privacyScore,
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
  onToggleBookmark,
  onOpenFind,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: ToolbarProps) {
  const isLoading = activeTab?.isLoading ?? false;
  const zoomPercent = Math.round(zoomLevel * 100);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const privacyButtonRef = useRef<HTMLButtonElement>(null);
  const siteButtonRef = useRef<HTMLButtonElement>(null);
  const canManageSite = isManageableSiteUrl(activeTab?.url ?? '');

  const openNativeMenu = (): void => {
    const button = menuButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    void window.browserApi.showToolbarMenu({
      x: Math.round(rect.left),
      y: Math.round(rect.bottom + 2),
      width: Math.round(rect.width),
    });
  };

  const openPrivacyPanel = (): void => {
    const button = privacyButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    void window.browserApi.showPrivacyPanel(
      {
        x: Math.round(rect.left),
        y: Math.round(rect.bottom + 2),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      true,
    );
  };

  const openSitePermissions = (): void => {
    const button = siteButtonRef.current;
    if (!button || !canManageSite) return;

    const rect = button.getBoundingClientRect();
    void window.browserApi.showSitePermissions(
      {
        x: Math.round(rect.left),
        y: Math.round(rect.bottom + 2),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      true,
    );
  };

  return (
    <div className="toolbar">
      <div className="toolbar-nav">
        <button
          type="button"
          className="chrome-btn"
          onClick={onGoBack}
          disabled={!activeTab?.canGoBack}
          aria-label="Go back"
          title="Back"
        >
          <IconBack />
        </button>
        <button
          type="button"
          className="chrome-btn"
          onClick={onGoForward}
          disabled={!activeTab?.canGoForward}
          aria-label="Go forward"
          title="Forward"
        >
          <IconForward />
        </button>
        <button type="button" className="chrome-btn" onClick={onGoHome} aria-label="Home" title="Home">
          <IconHome />
        </button>
        <button
          type="button"
          className="chrome-btn"
          onClick={isLoading ? onStop : onReload}
          aria-label={isLoading ? 'Stop' : 'Reload'}
          title={isLoading ? 'Stop' : 'Reload'}
        >
          {isLoading ? <IconStop /> : <IconReload />}
        </button>
      </div>

      <form
        className={`address-bar ${activeTab?.isPrivate ? 'private' : ''}`}
        onSubmit={(event) => {
          event.preventDefault();
          onNavigate();
        }}
      >
        <button
          ref={siteButtonRef}
          type="button"
          className={`address-site-btn ${canManageSite ? 'interactive' : ''} ${activeTab?.isSecure ? 'secure' : ''}`}
          onClick={openSitePermissions}
          disabled={!canManageSite}
          title={canManageSite ? 'Site permissions' : 'Site permissions unavailable'}
          aria-label="Site permissions"
        >
          {canManageSite ? (
            <IconSitePermissions active={activeTab?.isSecure} />
          ) : activeTab?.isSecure ? (
            <IconLock />
          ) : (
            <IconGlobe />
          )}
        </button>
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

        <div className="address-bar-actions">
          <button
            type="button"
            className={`address-inline-btn ${isBookmarked ? 'active-gold' : ''}`}
            onClick={onToggleBookmark}
            aria-label="Bookmark"
            title="Bookmark (Ctrl+D)"
          >
            <IconStar filled={isBookmarked} />
          </button>

          <div className="address-zoom-group">
            <button type="button" className="address-inline-btn" onClick={onZoomOut} aria-label="Zoom out">
              <IconZoom sign="out" />
            </button>
            <button type="button" className="address-zoom-label" onClick={onZoomReset}>
              {zoomPercent}%
            </button>
            <button type="button" className="address-inline-btn" onClick={onZoomIn} aria-label="Zoom in">
              <IconZoom sign="in" />
            </button>
          </div>

          <button
            type="button"
            className="address-inline-btn"
            onClick={onOpenFind}
            aria-label="Find"
            title="Find (Ctrl+F)"
          >
            <IconSearch />
          </button>
        </div>
      </form>

      <PrivacyShieldButton ref={privacyButtonRef} score={privacyScore} onClick={openPrivacyPanel} />

      <div className="toolbar-menu">
        <button
          ref={menuButtonRef}
          type="button"
          className="chrome-btn"
          onClick={openNativeMenu}
          aria-label="Browser menu"
          aria-haspopup="menu"
          title="Menu"
        >
          <IconMore />
        </button>
      </div>
    </div>
  );
}
