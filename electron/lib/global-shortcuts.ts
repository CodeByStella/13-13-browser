import { globalShortcut } from 'electron';

import { normalizeAccelerator } from '@shared/utils/hotkey';
import type { AppSettings } from '@shared/types';

let registeredAccelerator: string | null = null;
let toggleHandler: (() => void) | null = null;

export function setGlobalShortcutToggleHandler(handler: () => void): void {
  toggleHandler = handler;
}

export function isHotkeyRegistered(): boolean {
  return registeredAccelerator !== null;
}

export function applyGlobalShortcuts(settings: AppSettings): boolean {
  if (registeredAccelerator) {
    globalShortcut.unregister(registeredAccelerator);
    registeredAccelerator = null;
  }

  if (!settings.hotkeyEnabled) return true;

  const accelerator = normalizeAccelerator(settings.showHideHotkey);
  if (!accelerator) return false;

  const ok = globalShortcut.register(accelerator, () => {
    toggleHandler?.();
  });

  if (ok) {
    registeredAccelerator = accelerator;
  }

  return ok;
}

export function unregisterGlobalShortcuts(): void {
  if (registeredAccelerator) {
    globalShortcut.unregister(registeredAccelerator);
    registeredAccelerator = null;
  }
}
