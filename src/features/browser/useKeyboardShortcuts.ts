import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  findOpen: boolean;
  closeFind: () => void;
  addressRef: React.RefObject<HTMLInputElement | null>;
}

/** Chrome UI actions forwarded from main-process shortcuts (BrowserView focus). */
export function useKeyboardShortcuts({
  findOpen,
  closeFind,
  addressRef,
}: KeyboardShortcutOptions): void {
  useEffect(() => {
    const unsub = window.browserApi.onChromeMenuAction((action) => {
      if (action === 'focus-address-bar') {
        addressRef.current?.focus();
        addressRef.current?.select();
        return;
      }
      if (action === 'close-find' && findOpen) {
        closeFind();
      }
    });
    return unsub;
  }, [addressRef, closeFind, findOpen]);
}
