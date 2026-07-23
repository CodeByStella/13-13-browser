import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { TabInfo } from '../../types/browser';

const DRAG_THRESHOLD_PX = 5;

interface DragSession {
  id: string;
  pinned: boolean;
  startX: number;
  pointerId: number;
  moved: boolean;
  originOrder: string[];
}

function orderFromTabs(tabs: TabInfo[]): string[] {
  return tabs.map((tab) => tab.id);
}

function tabsInOrder(tabs: TabInfo[], order: string[]): TabInfo[] {
  const byId = new Map(tabs.map((tab) => [tab.id, tab]));
  return order.map((id) => byId.get(id)).filter((tab): tab is TabInfo => tab != null);
}

function computeDropOrder(
  tabs: TabInfo[],
  currentOrder: string[],
  draggedId: string,
  pinned: boolean,
  clientX: number,
): string[] {
  const groupIds = currentOrder.filter((id) => {
    const tab = tabs.find((entry) => entry.id === id);
    return tab != null && tab.isPinned === pinned;
  });

  const withoutDragged = groupIds.filter((id) => id !== draggedId);
  let insertAt = withoutDragged.length;

  for (let i = 0; i < withoutDragged.length; i += 1) {
    const id = withoutDragged[i];
    const el = document.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (clientX < rect.left + rect.width / 2) {
      insertAt = i;
      break;
    }
  }

  const nextGroup = [...withoutDragged];
  nextGroup.splice(insertAt, 0, draggedId);

  const pinnedIds = currentOrder.filter((id) => tabs.find((tab) => tab.id === id)?.isPinned);
  const unpinnedIds = currentOrder.filter((id) => {
    const tab = tabs.find((entry) => entry.id === id);
    return tab != null && !tab.isPinned;
  });

  return pinned
    ? [...nextGroup, ...unpinnedIds.filter((id) => id !== draggedId)]
    : [...pinnedIds.filter((id) => id !== draggedId), ...nextGroup];
}

export function useTabDragReorder(tabs: TabInfo[]) {
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const dragOrderRef = useRef<string[] | null>(null);
  const tabsRef = useRef(tabs);
  const suppressClickRef = useRef(false);

  tabsRef.current = tabs;
  dragOrderRef.current = dragOrder;

  const displayTabs = dragOrder == null ? tabs : tabsInOrder(tabs, dragOrder);

  useEffect(() => {
    if (dragOrder == null) return;
    const liveIds = new Set(tabs.map((tab) => tab.id));
    if (dragOrder.length !== tabs.length || dragOrder.some((id) => !liveIds.has(id))) {
      setDragOrder(null);
      setDraggingId(null);
      sessionRef.current = null;
    }
  }, [tabs, dragOrder]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent): void => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      if (!session.moved) {
        if (Math.abs(event.clientX - session.startX) < DRAG_THRESHOLD_PX) return;
        session.moved = true;
        suppressClickRef.current = true;
        setDraggingId(session.id);
        dragOrderRef.current = session.originOrder;
        setDragOrder(session.originOrder);
      }

      const currentOrder = dragOrderRef.current ?? session.originOrder;
      const nextOrder = computeDropOrder(
        tabsRef.current,
        currentOrder,
        session.id,
        session.pinned,
        event.clientX,
      );

      if (nextOrder.every((id, i) => id === currentOrder[i])) return;
      dragOrderRef.current = nextOrder;
      setDragOrder(nextOrder);
    };

    const finish = (event: PointerEvent): void => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      const didDrag = session.moved;
      const finalOrder = dragOrderRef.current;
      sessionRef.current = null;
      dragOrderRef.current = null;
      setDraggingId(null);
      setDragOrder(null);

      if (!didDrag || !finalOrder) return;

      const toIndex = finalOrder.indexOf(session.id);
      const fromIndex = session.originOrder.indexOf(session.id);
      if (toIndex < 0 || toIndex === fromIndex) return;
      void window.browserApi.moveTab(session.id, toIndex);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, []);

  const beginDrag = (tab: TabInfo, event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement | null)?.closest('.tab-close')) return;

    suppressClickRef.current = false;
    sessionRef.current = {
      id: tab.id,
      pinned: tab.isPinned,
      startX: event.clientX,
      pointerId: event.pointerId,
      moved: false,
      originOrder: orderFromTabs(tabsRef.current),
    };
  };

  const consumeClickSuppression = (): boolean => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  };

  return {
    displayTabs,
    draggingId,
    beginDrag,
    consumeClickSuppression,
  };
}
