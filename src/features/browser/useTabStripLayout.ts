import { useEffect, useRef, useState } from 'react';

const TAB_COMPACT_THRESHOLD = 72;
const TAB_PREFERRED_WIDTH = 240;
const TAB_GAP = 3;
const NEW_TAB_WIDTH = 28;

export function useTabStripLayout(tabCount: number, activeTabId: string | null) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [needsOverflow, setNeedsOverflow] = useState(false);

  useEffect(() => {
    const scroll = scrollRef.current;
    const strip = stripRef.current;
    if (!scroll || !strip) return;

    const update = (): void => {
      const stripWidth = strip.clientWidth;
      const chrome = NEW_TAB_WIDTH + TAB_GAP + 8;
      const perTab =
        tabCount > 0
          ? (stripWidth - chrome - TAB_GAP * Math.max(0, tabCount - 1)) / tabCount
          : TAB_PREFERRED_WIDTH;

      setIsCompact(perTab <= TAB_COMPACT_THRESHOLD);
      setNeedsOverflow(scroll.scrollWidth > scroll.clientWidth + 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [tabCount]);

  useEffect(() => {
    if (!activeTabId || !scrollRef.current) return;
    const active = scrollRef.current.querySelector<HTMLElement>(
      `[data-tab-id="${activeTabId}"]`,
    );
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTabId, tabCount, needsOverflow]);

  return { scrollRef, stripRef, isCompact, needsOverflow };
}
