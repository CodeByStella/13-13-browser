export interface ChromePopupAnchor {
  x: number;
  y: number;
  width: number;
  height?: number;
}

export type ChromeMenuIcon =
  | 'private'
  | 'search'
  | 'shield'
  | 'devtools'
  | 'tab'
  | 'duplicate'
  | 'restore'
  | 'reload'
  | 'zoom'
  | 'trash'
  | 'info'
  | 'tray';

export interface ChromeMenuItemPayload {
  type: 'item' | 'separator' | 'header';
  id?: string;
  label: string;
  shortcut?: string;
  icon?: ChromeMenuIcon;
}

export interface BookmarkMenuItemPayload {
  type: 'item' | 'separator' | 'header';
  id?: string;
  label: string;
  danger?: boolean;
  indent?: number;
  favicon?: string;
  promptDefault?: string;
}

export interface AboutInfo {
  name: string;
  version: string;
  tagline: string;
  repository: string;
  license: string;
}
