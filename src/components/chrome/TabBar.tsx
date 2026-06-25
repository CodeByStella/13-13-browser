import { useEffect, useRef, useState } from 'react';

import type { TabInfo } from '../../types/browser';
import { useTabStripLayout } from '../../features/browser/useTabStripLayout';
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
  const activeTabId = tabs.find((tab) => tab.isActive)?.id ?? null;
  const { scrollRef, stripRef, isCompact } = useTabStripLayout(tabs, activeTabId);
  const [tabPickerOpen, setTabPickerOpen] = useState(false);
  const tabSearchBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const unsub = window.browserApi.onTabPickerClosed(() => setTabPickerOpen(false));
    return unsub;
  }, []);

  const openTabPicker = (): void => {
    const button = tabSearchBtnRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    void window.browserApi
      .showTabPicker(
        {
          x: Math.round(rect.left),
          y: Math.round(rect.bottom + 2),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        true,
      )
      .then(setTabPickerOpen);
  };

  return (
    <div className="tab-bar titlebar-drag">
      <div className="tab-search-wrap titlebar-no-drag">
        <button
          ref={tabSearchBtnRef}
          type="button"
          className={`tab-search-btn ${tabPickerOpen ? 'open' : ''}`}
          aria-label="Search tabs"
          aria-expanded={tabPickerOpen}
          title="Search tabs"
          onClick={openTabPicker}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="tab-strip titlebar-drag" ref={stripRef}>
        <div className="tab-list">
          <div
            className="tab-list-scroll"
            ref={scrollRef}
            role="tablist"
          >
            {tabs.map((tab) => (
              <div
                key={tab.id}
                data-tab-id={tab.id}
                role="tab"
                aria-selected={tab.isActive}
                className={`tab ${tab.isActive ? 'active' : ''} ${tab.isLoading ? 'loading' : ''} ${tab.isPrivate ? 'private' : ''} ${tab.isPinned ? 'pinned' : ''} ${!tab.isPinned && isCompact ? 'compact' : ''} titlebar-no-drag`}
                onClick={() => onSwitchTab(tab.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  void window.browserApi.showTabContextMenu(tab.id, {
                    x: event.clientX,
                    y: event.clientY,
                    width: 0,
                  });
                }}
                onMouseDown={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    onCloseTab(tab.id);
                  }
                }}
                title={tab.title}
              >
                {tab.isActive && (
                  <>
                    <span className="tab-curve tab-curve-left" aria-hidden="true" />
                    <span className="tab-curve tab-curve-right" aria-hidden="true" />
                  </>
                )}
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
