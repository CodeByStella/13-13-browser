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
  const { scrollRef, stripRef, isCompact, needsOverflow } = useTabStripLayout(tabs.length, activeTabId);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overflowOpen) return;

    const onPointerDown = (event: MouseEvent): void => {
      if (!overflowRef.current?.contains(event.target as Node)) {
        setOverflowOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOverflowOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [overflowOpen]);

  return (
    <div className="tab-bar titlebar-drag">
      <div className="tab-bar-logo titlebar-drag">
        <div className="brand-logo">
          <span className="brand-mark">13</span>
          <span className="brand-dot">.</span>
          <span className="brand-mark accent">13</span>
        </div>
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
                className={`tab ${tab.isActive ? 'active' : ''} ${tab.isLoading ? 'loading' : ''} ${tab.isPrivate ? 'private' : ''} ${isCompact ? 'compact' : ''} titlebar-no-drag`}
                onClick={() => onSwitchTab(tab.id)}
                onMouseDown={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    onCloseTab(tab.id);
                  }
                }}
                title={tab.title}
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

        {needsOverflow && (
          <div className="tab-overflow-wrap titlebar-no-drag" ref={overflowRef}>
            <button
              type="button"
              className={`tab-overflow-btn ${overflowOpen ? 'open' : ''}`}
              aria-label="All tabs"
              aria-expanded={overflowOpen}
              title={`All tabs (${tabs.length})`}
              onClick={() => setOverflowOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              <span className="tab-overflow-count">{tabs.length}</span>
            </button>

            {overflowOpen && (
              <div className="tab-overflow-menu" role="menu">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="menuitem"
                    className={`tab-overflow-item ${tab.isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSwitchTab(tab.id);
                      setOverflowOpen(false);
                    }}
                  >
                    <span className="tab-overflow-favicon">
                      {tab.isPrivate ? (
                        <IconPrivate className="tab-private-icon" />
                      ) : tab.favicon ? (
                        <img src={tab.favicon} alt="" />
                      ) : (
                        <IconShield active className="tab-guard-icon" />
                      )}
                    </span>
                    <span className="tab-overflow-label">
                      {tab.isPrivate ? `Private · ${tab.title}` : tab.title}
                    </span>
                    {tab.isLoading && <span className="tab-overflow-loading" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
