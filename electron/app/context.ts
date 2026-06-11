import type { Bookmark } from '@shared/types';
import type { TabManager } from '../services/tabs/tab-manager';

export interface AppContext {
  getMainWindow(): import('electron').BrowserWindow | null;
  getTabManager(): TabManager | null;
  getBookmarks(): Bookmark[];
  broadcastBookmarks(): void;
  isDev(): boolean;
  applyContentProtection(enabled: boolean): void;
}

let context: AppContext | null = null;

export function initAppContext(appContext: AppContext): void {
  context = appContext;
}

export function getAppContext(): AppContext {
  if (!context) {
    throw new Error('AppContext has not been initialized');
  }
  return context;
}
