import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const MENU_PAD = 6;

function getChromeBounds(): DOMRect | null {
  return document.querySelector('.browser-chrome')?.getBoundingClientRect() ?? null;
}

function clampHorizontal(left: number, menuWidth: number, chrome: DOMRect | null): number {
  const min = (chrome?.left ?? 0) + MENU_PAD;
  const max = (chrome?.right ?? window.innerWidth) - menuWidth - MENU_PAD;
  return Math.max(min, Math.min(left, max));
}

function clampVertical(top: number, menuHeight: number, chrome: DOMRect | null): number {
  const min = (chrome?.top ?? 0) + MENU_PAD;
  const max = (chrome?.bottom ?? window.innerHeight) - menuHeight - MENU_PAD;
  return Math.max(min, Math.min(top, max));
}

export type FloatingAnchor =
  | { kind: 'point'; x: number; y: number }
  | { kind: 'element'; rect: DOMRect };

interface ChromeFloatingMenuProps {
  anchor: FloatingAnchor;
  className: string;
  role?: string;
  children: ReactNode;
}

export function ChromeFloatingMenu({
  anchor,
  className,
  role = 'menu',
  children,
}: ChromeFloatingMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const menu = el.getBoundingClientRect();
    const chrome = getChromeBounds();

    let left: number;
    let top: number;

    if (anchor.kind === 'point') {
      left = anchor.x;
      top = anchor.y;

      if (top + menu.height > (chrome?.bottom ?? window.innerHeight) - MENU_PAD) {
        top = anchor.y - menu.height;
      }
    } else {
      left = anchor.rect.left;
      top = anchor.rect.top - menu.height - 4;

      if (top < (chrome?.top ?? 0) + MENU_PAD) {
        top = anchor.rect.bottom + 4;
      }
    }

    setPosition({
      left: clampHorizontal(left, menu.width, chrome),
      top: clampVertical(top, menu.height, chrome),
    });
  }, [
    anchor.kind,
    anchor.kind === 'point' ? anchor.x : anchor.rect.left,
    anchor.kind === 'point' ? anchor.y : anchor.rect.top,
    anchor.kind === 'point' ? 0 : anchor.rect.bottom,
    children,
  ]);

  return createPortal(
    <div
      ref={ref}
      className={className}
      role={role}
      style={{
        position: 'fixed',
        left: position?.left ?? -9999,
        top: position?.top ?? -9999,
        visibility: position ? 'visible' : 'hidden',
        zIndex: 10000,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
