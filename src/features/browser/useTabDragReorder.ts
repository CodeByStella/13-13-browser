import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { TabInfo } from '../../types/browser';

const DRAG_THRESHOLD_PX = 6;
const EDGE_SCROLL_PX = 36;
const EDGE_SCROLL_SPEED = 14;
const INSERT_HYSTERESIS_PX = 12;

interface Slot {
  id: string;
  left: number;
  width: number;
  mid: number;
}

interface DragSession {
  id: string;
  pinned: boolean;
  pointerId: number;
  startX: number;
  originOrder: string[];
  groupIds: string[];
  slots: Slot[];
  fromIndex: number;
  insertIndex: number;
  moved: boolean;
  scrollEl: HTMLElement | null;
  scrollLeft0: number;
}

function orderFromTabs(tabs: TabInfo[]): string[] {
  return tabs.map((tab) => tab.id);
}

function tabsInOrder(tabs: TabInfo[], order: string[]): TabInfo[] {
  const byId = new Map(tabs.map((tab) => [tab.id, tab]));
  return order.map((id) => byId.get(id)).filter((tab): tab is TabInfo => tab != null);
}

function measureGroupSlots(groupIds: string[]): Slot[] {
  return groupIds.map((id) => {
    const el = document.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`);
    if (!el) return { id, left: 0, width: 0, mid: 0 };
    const rect = el.getBoundingClientRect();
    return { id, left: rect.left, width: rect.width, mid: rect.left + rect.width / 2 };
  });
}

function shiftSlotsForScroll(slots: Slot[], deltaScroll: number): Slot[] {
  if (deltaScroll === 0) return slots;
  return slots.map((slot) => ({
    ...slot,
    left: slot.left - deltaScroll,
    mid: slot.mid - deltaScroll,
  }));
}

/** Final index within the group for the dragged tab (0..groupLength-1). */
function computeInsertIndex(
  clientX: number,
  slots: Slot[],
  draggedId: string,
  currentInsert: number,
): number {
  const others = slots.filter((slot) => slot.id !== draggedId);
  let insertAt = others.length;

  for (let i = 0; i < others.length; i += 1) {
    if (clientX < others[i].mid) {
      insertAt = i;
      break;
    }
  }

  if (insertAt === currentInsert) return currentInsert;

  // Hysteresis: require the pointer to cross past the midpoint before flipping.
  if (insertAt > currentInsert) {
    const boundary = others[currentInsert];
    if (boundary && clientX < boundary.mid + INSERT_HYSTERESIS_PX) return currentInsert;
  } else {
    const boundary = others[insertAt];
    if (boundary && clientX > boundary.mid - INSERT_HYSTERESIS_PX) return currentInsert;
  }

  return insertAt;
}

function buildShiftMap(
  groupIds: string[],
  fromIndex: number,
  insertIndex: number,
  dragWidth: number,
  dragDeltaX: number,
): Record<string, number> {
  const shifts: Record<string, number> = {};

  groupIds.forEach((id, index) => {
    if (index === fromIndex) {
      shifts[id] = dragDeltaX;
      return;
    }

    let shift = 0;
    if (fromIndex < insertIndex) {
      if (index > fromIndex && index <= insertIndex) shift = -dragWidth;
    } else if (fromIndex > insertIndex) {
      if (index >= insertIndex && index < fromIndex) shift = dragWidth;
    }
    shifts[id] = shift;
  });

  return shifts;
}

function buildFinalOrder(
  originOrder: string[],
  tabs: TabInfo[],
  draggedId: string,
  pinned: boolean,
  insertIndex: number,
): string[] {
  const groupIds = originOrder.filter((id) => {
    const tab = tabs.find((entry) => entry.id === id);
    return tab != null && tab.isPinned === pinned;
  });
  const without = groupIds.filter((id) => id !== draggedId);
  const nextGroup = [...without];
  nextGroup.splice(Math.max(0, Math.min(insertIndex, nextGroup.length)), 0, draggedId);

  const pinnedIds = originOrder.filter((id) => tabs.find((tab) => tab.id === id)?.isPinned);
  const unpinnedIds = originOrder.filter((id) => {
    const tab = tabs.find((entry) => entry.id === id);
    return tab != null && !tab.isPinned;
  });

  return pinned
    ? [...nextGroup, ...unpinnedIds.filter((id) => id !== draggedId)]
    : [...pinnedIds.filter((id) => id !== draggedId), ...nextGroup];
}

export function useTabDragReorder(tabs: TabInfo[]) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragShifts, setDragShifts] = useState<Record<string, number>>({});
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const tabsRef = useRef(tabs);
  const suppressClickRef = useRef(false);

  tabsRef.current = tabs;

  const displayTabs = pendingOrder == null ? tabs : tabsInOrder(tabs, pendingOrder);

  useEffect(() => {
    if (pendingOrder == null) return;
    const live = orderFromTabs(tabs);
    if (
      live.length === pendingOrder.length &&
      live.every((id, index) => id === pendingOrder[index])
    ) {
      setPendingOrder(null);
      return;
    }
    const liveIds = new Set(live);
    if (pendingOrder.length !== live.length || pendingOrder.some((id) => !liveIds.has(id))) {
      setPendingOrder(null);
    }
  }, [tabs, pendingOrder]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent): void => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      if (!session.moved) {
        if (Math.abs(event.clientX - session.startX) < DRAG_THRESHOLD_PX) return;
        session.moved = true;
        suppressClickRef.current = true;
        setDraggingId(session.id);
      }

      const scrollEl = session.scrollEl;
      if (scrollEl) {
        const bounds = scrollEl.getBoundingClientRect();
        if (event.clientX < bounds.left + EDGE_SCROLL_PX) {
          scrollEl.scrollLeft = Math.max(0, scrollEl.scrollLeft - EDGE_SCROLL_SPEED);
        } else if (event.clientX > bounds.right - EDGE_SCROLL_PX) {
          scrollEl.scrollLeft = Math.min(
            scrollEl.scrollWidth - scrollEl.clientWidth,
            scrollEl.scrollLeft + EDGE_SCROLL_SPEED,
          );
        }
      }

      const scrollDelta = (scrollEl?.scrollLeft ?? session.scrollLeft0) - session.scrollLeft0;
      const slots = shiftSlotsForScroll(session.slots, scrollDelta);
      const insertIndex = computeInsertIndex(
        event.clientX,
        slots,
        session.id,
        session.insertIndex,
      );
      session.insertIndex = insertIndex;

      const dragWidth = session.slots[session.fromIndex]?.width ?? 0;
      const dragDeltaX = event.clientX - session.startX - scrollDelta;
      const nextShifts = buildShiftMap(
        session.groupIds,
        session.fromIndex,
        insertIndex,
        dragWidth,
        dragDeltaX,
      );
      setDragShifts(nextShifts);
    };

    const finish = (event: PointerEvent): void => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      const didDrag = session.moved;
      const insertIndex = session.insertIndex;
      const fromIndex = session.fromIndex;
      const originOrder = session.originOrder;
      const draggedId = session.id;
      const pinned = session.pinned;

      sessionRef.current = null;
      setDraggingId(null);
      setDragShifts({});

      if (!didDrag) return;
      if (insertIndex === fromIndex) return;

      const finalOrder = buildFinalOrder(
        originOrder,
        tabsRef.current,
        draggedId,
        pinned,
        insertIndex,
      );
      const toIndex = finalOrder.indexOf(draggedId);
      const originIndex = originOrder.indexOf(draggedId);
      if (toIndex < 0 || toIndex === originIndex) return;

      setPendingOrder(finalOrder);
      void window.browserApi.moveTab(draggedId, toIndex);
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

    const originOrder = orderFromTabs(tabsRef.current);
    const groupIds = originOrder.filter((id) => {
      const entry = tabsRef.current.find((item) => item.id === id);
      return entry != null && entry.isPinned === tab.isPinned;
    });
    const fromIndex = groupIds.indexOf(tab.id);
    if (fromIndex < 0) return;

    const tabEl = event.currentTarget;
    const scrollEl = tabEl.closest('.tab-list-scroll') as HTMLElement | null;

    try {
      tabEl.setPointerCapture(event.pointerId);
    } catch {
      // Ignore capture failures; window listeners still handle the gesture.
    }

    suppressClickRef.current = false;
    setPendingOrder(null);
    sessionRef.current = {
      id: tab.id,
      pinned: tab.isPinned,
      pointerId: event.pointerId,
      startX: event.clientX,
      originOrder,
      groupIds,
      slots: measureGroupSlots(groupIds),
      fromIndex,
      insertIndex: fromIndex,
      moved: false,
      scrollEl,
      scrollLeft0: scrollEl?.scrollLeft ?? 0,
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
    dragShifts,
    beginDrag,
    consumeClickSuppression,
  };
}
