/** User-facing label for an Electron accelerator string. */
export function formatHotkeyLabel(
  accelerator: string,
  platform: NodeJS.Platform = typeof process !== 'undefined' ? process.platform : 'win32',
): string {
  if (!accelerator) return 'None';

  const isMac =
    platform === 'darwin' ||
    (typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform));
  const parts = accelerator.split('+').map((part) => {
    switch (part) {
      case 'CommandOrControl':
        return isMac ? '⌘' : 'Ctrl';
      case 'Command':
        return '⌘';
      case 'Control':
        return 'Ctrl';
      case 'Alt':
        return isMac ? '⌥' : 'Alt';
      case 'Shift':
        return 'Shift';
      case 'Plus':
        return '+';
      default:
        return part.length === 1 ? part.toUpperCase() : part;
    }
  });

  return parts.join(isMac ? '' : '+');
}

/** Normalize a raw accelerator for Electron `globalShortcut.register`. */
export function normalizeAccelerator(raw: string): string {
  return raw
    .trim()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === 'ctrl' || lower === 'control' || lower === 'cmdorctrl' || lower === 'commandorcontrol') {
        return 'CommandOrControl';
      }
      if (lower === 'cmd' || lower === 'command') return 'Command';
      if (lower === 'alt' || lower === 'option') return 'Alt';
      if (lower === 'shift') return 'Shift';
      if (part.length === 1) return part.toUpperCase();
      return part;
    })
    .join('+');
}
