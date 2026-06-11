import type { TabInfo } from '../types/browser';
import { IconClose, IconPlus, IconPrivate, IconShield } from './Icons';
import { WindowControls } from './WindowControls';

interface TabBarProps {
  tabs: TabInfo[];
  privacyScore: number;
  maximized: boolean;
  onNewTab: () => void;
  onNewPrivateTab: () => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onOpenPrivacy: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onCloseWindow: () => void;
}

export function TabBar({
  tabs,
  privacyScore,
  maximized,
  onNewTab,
  onNewPrivateTab,
  onSwitchTab,
  onCloseTab,
  onOpenPrivacy,
  onMinimize,
  onToggleMaximize,
  onCloseWindow,
}: TabBarProps) {
  return (
    <div className="tab-bar titlebar-drag">
      <div className="tab-bar-logo titlebar-drag">
        <div className="brand-logo">
          <span className="brand-mark">13</span>
          <span className="brand-dot">.</span>
          <span className="brand-mark accent">13</span>
        </div>
      </div>

      <div className="tab-strip">
        <div className="tab-list" role="tablist">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tab"
              aria-selected={tab.isActive}
              className={`tab ${tab.isActive ? 'active' : ''} ${tab.isLoading ? 'loading' : ''} ${tab.isPrivate ? 'private' : ''} titlebar-no-drag`}
              onClick={() => onSwitchTab(tab.id)}
              onMouseDown={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                  onCloseTab(tab.id);
                }
              }}
            >
              <span className="tab-favicon">
                {tab.isPrivate ? (
                  <IconPrivate className="tab-private-icon" />
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" />
                ) : (
                  <IconShield active className="tab-guard-icon" />
                )}
              </span>
              <span className="tab-title">{tab.isPrivate ? `Private · ${tab.title}` : tab.title}</span>
              <button
                type="button"
                className="tab-close"
                aria-label={`Close ${tab.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                <IconClose />
              </button>
            </div>
          ))}

          <div className="tab-actions titlebar-no-drag">
            <button
              type="button"
              className="tab-new private"
              onClick={onNewPrivateTab}
              aria-label="New private tab"
              title="New private tab (Ctrl+Shift+N)"
            >
              <IconPrivate />
            </button>
            <button type="button" className="tab-new" onClick={onNewTab} aria-label="New tab">
              <IconPlus />
            </button>
          </div>
        </div>

        <div className="tab-bar-spacer titlebar-drag" aria-hidden="true" />
      </div>

      <div className="tab-bar-right titlebar-no-drag">
        <button
          type="button"
          className="tab-privacy-btn"
          onClick={onOpenPrivacy}
          title="Privacy dashboard"
          aria-label="Privacy dashboard"
        >
          <IconShield active={privacyScore >= 50} />
          <span>{privacyScore}</span>
        </button>

        <WindowControls
          maximized={maximized}
          onMinimize={onMinimize}
          onToggleMaximize={onToggleMaximize}
          onClose={onCloseWindow}
        />
      </div>
    </div>
  );
}
