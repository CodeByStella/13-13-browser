import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { BookmarkNode } from '@shared/types';
import { getRootItems, isBookmarkItem, isFolderItem } from '@shared/utils/bookmarks';
import { bookmarkLabel, faviconUrl } from '@shared/utils/url';
import {
  IconChevronLeft,
  IconChevronRight,
  IconFolder,
  IconGlobe,
} from '../ui/Icons';

interface BookmarkBarProps {
  bookmarks: BookmarkNode[];
  activeUrl: string;
  renameTarget: { id: string; title: string } | null;
  onRenameTargetHandled: () => void;
  onNavigate: (url: string) => void;
  onOpenInNewTab: (url: string) => void;
}

function BookmarkFavicon({ url, favicon }: { url: string; favicon?: string }) {
  const [failed, setFailed] = useState(false);
  const icon = favicon || faviconUrl(url);

  if (!icon || failed) {
    return (
      <span className="bookmark-favicon bookmark-favicon-fallback" aria-hidden="true">
        <IconGlobe />
      </span>
    );
  }

  return (
    <span className="bookmark-favicon" aria-hidden="true">
      <img src={icon} alt="" onError={() => setFailed(true)} />
    </span>
  );
}

function anchorFromRect(rect: DOMRect): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.bottom + 2),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function anchorFromPoint(x: number, y: number): { x: number; y: number; width: number; height: number } {
  return { x: Math.round(x), y: Math.round(y + 2), width: 1, height: 1 };
}

export function BookmarkBar({
  bookmarks,
  activeUrl,
  renameTarget,
  onRenameTargetHandled,
  onNavigate,
  onOpenInNewTab,
}: BookmarkBarProps) {
  const rootItems = getRootItems(bookmarks);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const folderRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const syncScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  const scrollBy = useCallback((delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const openContextMenu = (event: React.MouseEvent, item: BookmarkNode | null): void => {
    event.preventDefault();
    event.stopPropagation();
    void window.browserApi.showBookmarkContextMenu(
      anchorFromPoint(event.clientX, event.clientY),
      item?.id ?? null,
    );
  };

  const openFolderMenu = (folderId: string): void => {
    const el = folderRefs.current.get(folderId);
    if (!el) return;
    void window.browserApi.showBookmarkFolderMenu(anchorFromRect(el.getBoundingClientRect()), folderId);
  };

  useLayoutEffect(() => {
    syncScroll();
  }, [bookmarks, syncScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', syncScroll, { passive: true });
    const observer = new ResizeObserver(syncScroll);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', syncScroll);
      observer.disconnect();
    };
  }, [syncScroll, bookmarks.length]);

  useLayoutEffect(() => {
    if (!renameTarget) return;

    const chipEl = chipRefs.current.get(renameTarget.id);
    const anchorEl = chipEl ?? barRef.current;
    if (!anchorEl) return;

    chipEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    void window.browserApi.showBookmarkRename(
      anchorFromRect(anchorEl.getBoundingClientRect()),
      renameTarget.id,
      renameTarget.title,
    );
    onRenameTargetHandled();
  }, [renameTarget, bookmarks, onRenameTargetHandled]);

  if (rootItems.length === 0) return null;

  return (
    <div ref={barRef} className="bookmark-bar">
      <div
        className={`bookmark-bar-content ${canScrollLeft ? 'fade-left' : ''} ${canScrollRight ? 'fade-right' : ''}`}
      >
        <div
          ref={scrollRef}
          className="bookmark-scroll"
          role="list"
          onContextMenu={(event) => openContextMenu(event, null)}
        >
          {rootItems.map((item) => {
            if (isFolderItem(item)) {
              return (
                <div
                  key={item.id}
                  ref={(node) => {
                    if (node) folderRefs.current.set(item.id, node);
                    else folderRefs.current.delete(item.id);
                  }}
                  role="listitem"
                  className="bookmark-chip bookmark-folder-chip"
                  onContextMenu={(event) => openContextMenu(event, item)}
                >
                  <button
                    type="button"
                    className="bookmark-chip-link"
                    onClick={() => openFolderMenu(item.id)}
                    aria-haspopup="menu"
                  >
                    <IconFolder className="bookmark-folder-icon" />
                    <span className="bookmark-chip-title">{item.title}</span>
                  </button>
                </div>
              );
            }

            if (!isBookmarkItem(item)) return null;

            const label = bookmarkLabel(item.title, item.url);
            const isActive = item.url === activeUrl;

            return (
              <div
                key={item.id}
                ref={(node) => {
                  if (node) chipRefs.current.set(item.id, node);
                  else chipRefs.current.delete(item.id);
                }}
                role="listitem"
                className={`bookmark-chip ${isActive ? 'active' : ''}`}
                data-bookmark-id={item.id}
                onContextMenu={(event) => openContextMenu(event, item)}
              >
                <button
                  type="button"
                  className="bookmark-chip-link"
                  onClick={() => onNavigate(item.url)}
                  onMouseDown={(event) => {
                    if (event.button === 1) {
                      event.preventDefault();
                      onOpenInNewTab(item.url);
                    }
                  }}
                  title={item.url}
                >
                  <BookmarkFavicon url={item.url} favicon={item.favicon} />
                  <span className="bookmark-chip-title">{label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {(canScrollLeft || canScrollRight) && (
        <div className="bookmark-scroll-controls">
          <button
            type="button"
            className="bookmark-scroll-btn"
            disabled={!canScrollLeft}
            onClick={() => scrollBy(-180)}
            aria-label="Scroll bookmarks left"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            className="bookmark-scroll-btn"
            disabled={!canScrollRight}
            onClick={() => scrollBy(180)}
            aria-label="Scroll bookmarks right"
          >
            <IconChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
