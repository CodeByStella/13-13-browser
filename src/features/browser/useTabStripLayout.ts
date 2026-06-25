import { useEffect, useRef, useState } from 'react';

import type { TabInfo } from '../../types/browser';

const TAB_COMPACT_THRESHOLD = 72;
const TAB_PREFERRED_WIDTH = 240;
const TAB_GAP = 3;
const NEW_TAB_WIDTH = 28;
const PINNED_TAB_WIDTH = 46;

export function useTabStripLayout(tabs: TabInfo[], activeTabId: string | null) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [needsOverflow, setNeedsOverflow] = useState(false);
  const pinnedCount = tabs.filter((tab) => tab.isPinned).length;
  const unpinnedCount = tabs.length - pinnedCount;

  useEffect(() => {
    const scroll = scrollRef.current;
    const strip = stripRef.current;
    if (!scroll || !strip) return;

    const update = (): void => {
      const stripWidth = strip.clientWidth;
      const chrome = NEW_TAB_WIDTH + TAB_GAP + 8;
      const pinnedWidth =
        pinnedCount > 0
          ? pinnedCount * PINNED_TAB_WIDTH + TAB_GAP * Math.max(0, pinnedCount - 1)
          : 0;
      const unpinnedGaps = TAB_GAP * Math.max(0, unpinnedCount - 1);
      const available = stripWidth - chrome - pinnedWidth - unpinnedGaps;
      const perTab =
        unpinnedCount > 0 ? available / unpinnedCount : TAB_PREFERRED_WIDTH;

      setIsCompact(unpinnedCount > 0 && perTab <= TAB_COMPACT_THRESHOLD);
      setNeedsOverflow(scroll.scrollWidth > scroll.clientWidth + 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [pinnedCount, unpinnedCount]);

  useEffect(() => {
    if (!activeTabId || !scrollRef.current) return;
    const active = scrollRef.current.querySelector<HTMLElement>(
      `[data-tab-id="${activeTabId}"]`,
    );
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTabId, tabs.length, needsOverflow]);

  return { scrollRef, stripRef, isCompact, needsOverflow };
}
