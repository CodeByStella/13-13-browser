import type { Input, WebContents } from 'electron';

import { IPC_EVENTS } from '@shared/ipc/channels';

import type { AppContext } from '../app/context';
import { getAppContext } from '../app/context';
import { getBookmarksService } from '../ipc/bookmarks.ipc';

function appContext(): AppContext | null {
  try {
    return getAppContext();
  } catch {
    return null;
  }
}

function mod(input: Input): boolean {
  return input.control || input.meta;
}

function isLetterKey(input: Input, letter: string): boolean {
  const upper = letter.toUpperCase();
  return input.code === `Key${upper}` || input.key.toLowerCase() === letter.toLowerCase();
}

/** Shift may be absent from modifiers on Windows; uppercase key implies Shift. */
function shiftHeld(input: Input, letter: string): boolean {
  return input.shiftKey || input.key === letter.toUpperCase();
}

function focusMainWindow(): void {
  appContext()?.getMainWindow()?.focus();
}

function sendChromeAction(action: string): void {
  const ctx = appContext();
  ctx?.getMainWindow()?.focus();
  ctx?.getMainWindow()?.webContents.send(IPC_EVENTS.CHROME_MENU_ACTION, action);
}

function dispatchShortcut(input: Input): boolean {
  if (input.type !== 'keyDown') return false;

  const ctx = appContext();
  const tabManager = ctx?.getTabManager();
  if (!tabManager) return false;

  const withMod = mod(input);
  const key = input.key;
  const lower = key.toLowerCase();

  if (withMod && lower === 'l') {
    sendChromeAction('focus-address-bar');
    return true;
  }

  // Shift combos first — key codes + uppercase letter (shiftKey is unreliable on Windows).
  if (withMod && isLetterKey(input, 'n') && shiftHeld(input, 'n')) {
    focusMainWindow();
    tabManager.createPrivateTab();
    return true;
  }

  if (withMod && isLetterKey(input, 't') && shiftHeld(input, 't')) {
    focusMainWindow();
    tabManager.reopenClosedTab();
    return true;
  }

  if (withMod && isLetterKey(input, 't') && !shiftHeld(input, 't')) {
    focusMainWindow();
    tabManager.createTab();
    return true;
  }

  if (withMod && lower === 'w') {
    const activeId = tabManager.getState().activeTabId;
    if (activeId) tabManager.closeTab(activeId);
    return true;
  }

  if (withMod && lower === 'r') {
    tabManager.reload();
    return true;
  }

  if (withMod && lower === 'f') {
    sendChromeAction('open-find');
    return true;
  }

  if (withMod && lower === 'd') {
    focusMainWindow();
    const page = tabManager.getActivePageInfo();
    if (page?.url) {
      try {
        const { addedId } = getBookmarksService().toggle(page.title, page.url, page.favicon);
        if (addedId) {
          ctx?.getMainWindow()?.webContents.send(IPC_EVENTS.BOOKMARK_ADDED, {
            id: addedId,
            title: page.title,
          });
        }
      } catch {
        // Bookmarks service not ready yet.
      }
    }
    return true;
  }

  if (withMod && key === 'Tab') {
    const { tabs, activeTabId } = tabManager.getState();
    if (tabs.length === 0) return true;
    const idx = tabs.findIndex((tab) => tab.id === activeTabId);
    if (idx === -1) return true;
    const next = input.shiftKey
      ? (idx - 1 + tabs.length) % tabs.length
      : (idx + 1) % tabs.length;
    tabManager.switchTab(tabs[next]!.id);
    return true;
  }

  if (withMod && (lower === '=' || key === '+' || key === 'Plus')) {
    tabManager.zoomIn();
    return true;
  }

  if (withMod && (lower === '-' || key === 'Minus')) {
    tabManager.zoomOut();
    return true;
  }

  if (withMod && lower === '0') {
    tabManager.zoomReset();
    return true;
  }

  if (key === 'F12') {
    tabManager.toggleDevTools();
    return true;
  }

  if (key === 'F5') {
    tabManager.reload();
    return true;
  }

  if (input.altKey && key === 'ArrowLeft') {
    tabManager.goBack();
    return true;
  }

  if (input.altKey && key === 'ArrowRight') {
    tabManager.goForward();
    return true;
  }

  if (key === 'Escape') {
    sendChromeAction('close-find');
    return false;
  }

  return false;
}

export function attachKeyboardShortcuts(webContents: WebContents): void {
  webContents.on('before-input-event', (event, input) => {
    if (dispatchShortcut(input)) {
      event.preventDefault();
    }
  });
}
