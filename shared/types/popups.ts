export interface ChromePopupAnchor {
  x: number;
  y: number;
  width: number;
  height?: number;
}

export interface ChromeMenuItemPayload {
  id: string;
  label: string;
  shortcut?: string;
  icon?: 'private' | 'search' | 'shield' | 'devtools';
}
