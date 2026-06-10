import type { TabInfo } from '../types/browser';
import { IconClose, IconPlus } from './Icons';

interface TabBarProps {
  tabs: TabInfo[];
  onNewTab: () => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export function TabBar({ tabs, onNewTab, onSwitchTab, onCloseTab }: TabBarProps) {
  return (
    <div className="tab-bar">
      <div className="tab-list" role="tablist">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.isActive}
            className={`tab ${tab.isActive ? 'active' : ''} ${tab.isLoading ? 'loading' : ''}`}
            onClick={() => onSwitchTab(tab.id)}
            onMouseDown={(event) => {
              if (event.button === 1) {
                event.preventDefault();
                onCloseTab(tab.id);
              }
            }}
          >
            <span className="tab-favicon">
              {tab.favicon ? (
                <img src={tab.favicon} alt="" />
              ) : (
                <span className="tab-favicon-fallback" />
              )}
            </span>
            <span className="tab-title">{tab.title}</span>
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
      </div>
      <button type="button" className="tab-new" onClick={onNewTab} aria-label="New tab">
        <IconPlus />
      </button>
    </div>
  );
}
