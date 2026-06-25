import { registerAppSettingsIpc } from './app-settings.ipc';
import { initBookmarksService, registerBookmarksIpc, getBookmarksService } from './bookmarks.ipc';
import { registerChromeIpc, registerPrivacyIpc, registerWindowIpc } from './chrome.ipc';
import { registerTabsIpc } from './tabs.ipc';
import { registerUpdateIpc } from './update.ipc';
import type { Bookmark } from '@shared/types';

export function registerAllIpc(onBookmarksChange: (bookmarks: Bookmark[]) => void): void {
  initBookmarksService(onBookmarksChange);
  registerTabsIpc();
  registerBookmarksIpc();
  registerChromeIpc();
  registerPrivacyIpc();
  registerAppSettingsIpc();
  registerUpdateIpc();
  registerWindowIpc();
}

export { getBookmarksService };
