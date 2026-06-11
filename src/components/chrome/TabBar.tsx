import type { TabInfo } from '../../types/browser';
import { IconClose, IconNewTab, IconPrivate, IconShield } from '../ui/Icons';
import { WindowControls } from './WindowControls';

interface TabBarProps {
  tabs: TabInfo[];
  maximized: boolean;
  onNewTab: () => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onCloseWindow: () => void;
}

export function TabBar({
  tabs,
  maximized,
  onNewTab,
  onSwitchTab,
  onCloseTab,
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
        <div className="tab-list">
          <div className="tab-list-scroll" role="tablist">
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

            <button
              type="button"
              className="tab-new titlebar-no-drag"
              onClick={onNewTab}
              aria-label="New tab"
              title="New tab (Ctrl+T)"
            >
              <IconNewTab />
            </button>
          </div>
        </div>

        <div className="tab-bar-spacer titlebar-drag" aria-hidden="true" />
      </div>

      <div className="tab-bar-right titlebar-no-drag">
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
