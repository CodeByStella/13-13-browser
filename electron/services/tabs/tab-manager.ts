import {
  BrowserView,
  BrowserWindow,
  type HandlerDetails,
  type WebContents,
} from 'electron';
import { randomUUID } from 'node:crypto';
import { IPC_EVENTS } from '@shared/ipc/channels';
import {
  CHROME_HEIGHT,
  canGoBack,
  canGoForward,
  isDevServerUrl,
  isSecureUrl,
  normalizeUrl,
  type BrowserState,
  type TabInfo,
} from '../../lib/shared';
import { SNAKE_GAME_ADDRESS, resolveInternalBrowserUrl } from '@shared/utils/internal-urls';
import { staticPageUrl } from '../../lib/dev-static-pages';
import { saveSession, normalizeSessionEntries, type SessionData } from '../../stores/session-store';
import { attachPrivacySession } from '../privacy/privacy';
import { attachKeyboardShortcuts } from '../../lib/keyboard-shortcuts';
import { brandDevToolsWindows, DEVTOOLS_WINDOW_TITLE, applyWindowIcon } from '../../lib/app-branding';
import { installWebContentsCompat } from '../../lib/browser-user-agent';
import {
  isNewTabPageUrl,
  persistShortcutsFromWebContents,
  restoreShortcutsToWebContents,
} from '../newtab/newtab-shortcuts-sync';

interface Tab {
  id: string;
  view: BrowserView;
  favicon?: string;
  isPrivate: boolean;
  isPinned: boolean;
  /** URL being loaded or that failed — shown in chrome while internal page is visible. */
  pendingUrl?: string;
}

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

function parsePopupSize(features?: string): { width: number; height: number } {
  const widthMatch = features?.match(/\bwidth=(\d+)/i);
  const heightMatch = features?.match(/\bheight=(\d+)/i);
  const width = widthMatch ? Number.parseInt(widthMatch[1], 10) : 520;
  const height = heightMatch ? Number.parseInt(heightMatch[1], 10) : 720;
  return {
    width: Math.min(Math.max(width || 520, 360), 1280),
    height: Math.min(Math.max(height || 720, 400), 960),
  };
}

/** OAuth / account login flows need a real window with opener + shared session. */
function shouldAllowAsAuthPopup(details: HandlerDetails): boolean {
  const features = details.features ?? '';
  const hasPopupSize = /\bwidth=\d+/i.test(features) && /\bheight=\d+/i.test(features);
  if (hasPopupSize || details.disposition === 'new-window') {
    return true;
  }

  try {
    const parsed = new URL(details.url);
    const host = parsed.hostname.toLowerCase();
    const path = `${parsed.pathname}${parsed.search}`.toLowerCase();

    if (
      host === 'accounts.google.com' ||
      host.endsWith('.google.com') && /\/(o\/oauth2|signin|AccountChooser)/i.test(path)
    ) {
      return true;
    }

    if (/(^|\.)login\.|signin\.|auth\.|sso\./i.test(host)) return true;
    if (/oauth|openid|saml|callback|authorize/i.test(path)) return true;
    if (host.endsWith('slack.com') && /signin|oauth|workspace/i.test(path)) return true;
  } catch {
    // ignore malformed URLs
  }

  return false;
}

export class TabManager {
  private window: BrowserWindow;
  private tabs = new Map<string, Tab>();
  private tabOrder: string[] = [];
  private activeTabId: string | null = null;
  private closedTabs: string[] = [];
  private webContentHidden = false;
  private readonly newTabPageUrl: string;
  private readonly errorPageUrl: string;
  private readonly newTabFaviconUrl: string;
  private readonly errorFaviconUrl: string;

  constructor(window: BrowserWindow, isDev: boolean) {
    this.window = window;
    this.newTabPageUrl = staticPageUrl(isDev, 'newtab.html');
    this.errorPageUrl = staticPageUrl(isDev, 'error.html');
    this.newTabFaviconUrl = staticPageUrl(isDev, 'newtab-icon.png');
    this.errorFaviconUrl = staticPageUrl(isDev, 'error-icon.svg');
  }

  restoreSession(session: SessionData): void {
    const entries = normalizeSessionEntries(session.tabs);
    const pinned = entries.filter((entry) => entry.pinned);
    const unpinned = entries.filter((entry) => !entry.pinned);
    const ordered = [...pinned, ...unpinned];

    let activeId: string | null = null;
    ordered.forEach((entry, index) => {
      const id = this.createTab(entry.url, { activate: false, pinned: entry.pinned });
      if (index === session.activeIndex) {
        activeId = id;
      }
    });

    if (activeId) {
      this.switchTab(activeId);
    } else if (this.tabOrder.length > 0) {
      this.switchTab(this.tabOrder[0]);
    }
  }

  createTab(
    url?: string,
    options?: { activate?: boolean; isPrivate?: boolean; pinned?: boolean },
  ): string {
    const id = randomUUID();
    const isPrivate = options?.isPrivate ?? false;
    const partition = isPrivate ? `private:${id}` : 'persist:browser';

    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition,
      },
    });

    attachPrivacySession(view.webContents.session);

    this.attachViewEvents(id, view);
    const isPinned = !isPrivate && (options?.pinned ?? false);
    this.tabs.set(id, { id, view, isPrivate, isPinned });
    this.tabOrder.push(id);
    if (isPinned) {
      this.moveTabToPinnedSection(id);
    }

    if (!url || url === this.newTabPageUrl) {
      this.tabs.get(id)!.favicon = this.newTabFaviconUrl;
    }

    const activate = options?.activate !== false;
    if (activate) {
      const current = this.getActiveTab();
      if (current) {
        this.window.removeBrowserView(current.view);
      }
      this.activeTabId = id;
      if (!this.webContentHidden) {
        this.window.addBrowserView(view);
        this.layoutActiveView();
      }
    }

    const target = this.resolveNavigationTarget(url);
    view.webContents.loadURL(target.href);
    const tabEntry = this.tabs.get(id)!;
    if (target.displayUrl) {
      tabEntry.pendingUrl = target.displayUrl;
    } else if (url && !this.isInternalPage(target.href)) {
      tabEntry.pendingUrl = url;
    }
    this.broadcastState();
    return id;
  }

  closeTab(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab) return;

    const url = tab.view.webContents.getURL();
    if (url && !this.isInternalPage(url)) {
      this.closedTabs.push(url);
      if (this.closedTabs.length > 25) this.closedTabs.shift();
    }

    const wasActive = this.activeTabId === id;
    const closedIndex = this.tabOrder.indexOf(id);
    this.window.removeBrowserView(tab.view);
    tab.view.webContents.close();
    this.tabs.delete(id);
    this.tabOrder = this.tabOrder.filter((tabId) => tabId !== id);

    if (this.tabs.size === 0) {
      this.activeTabId = null;
      this.broadcastState();
      this.createTab();
      return;
    }

    if (wasActive) {
      const nextIndex = Math.max(0, Math.min(closedIndex, this.tabOrder.length - 1));
      this.switchTab(this.tabOrder[nextIndex] ?? this.tabOrder.at(-1)!);
    } else {
      this.broadcastState();
    }
  }

  reopenClosedTab(): void {
    const url = this.closedTabs.pop();
    if (url) this.createTab(url);
  }

  switchTab(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab || this.activeTabId === id) return;

    const current = this.getActiveTab();
    if (current) {
      this.window.removeBrowserView(current.view);
    }

    this.activeTabId = id;
    if (!this.webContentHidden) {
      this.window.addBrowserView(tab.view);
      this.layoutActiveView();
    }
    this.broadcastState();
  }

  setWebContentHidden(hidden: boolean): void {
    if (this.webContentHidden === hidden) return;
    this.webContentHidden = hidden;

    const tab = this.getActiveTab();
    if (!tab) return;

    if (hidden) {
      this.window.removeBrowserView(tab.view);
    } else {
      this.window.addBrowserView(tab.view);
      this.layoutActiveView();
    }
  }

  navigateActive(rawUrl: string): string {
    const tab = this.getActiveTab();
    if (!tab) return rawUrl;

    const internal = resolveInternalBrowserUrl(rawUrl, this.errorPageUrl);
    if (internal) {
      tab.pendingUrl = internal.display;
      tab.view.webContents.loadURL(internal.href);
      this.broadcastState();
      return internal.display;
    }

    const url = normalizeUrl(rawUrl, this.newTabPageUrl);
    tab.pendingUrl = this.isInternalPage(url) ? undefined : url;
    tab.view.webContents.loadURL(url);
    this.broadcastState();
    return this.isInternalPage(url) ? '' : url;
  }

  goHome(): void {
    const tab = this.getActiveTab();
    if (!tab) return;
    tab.favicon = this.newTabFaviconUrl;
    tab.view.webContents.loadURL(this.newTabPageUrl);
  }

  goBack(): void {
    const wc = this.getActiveWebContents();
    if (wc && canGoBack(wc)) wc.goBack();
  }

  goForward(): void {
    const wc = this.getActiveWebContents();
    if (wc && canGoForward(wc)) wc.goForward();
  }

  reload(): void {
    this.getActiveWebContents()?.reload();
  }

  reloadAllNormalTabs(): void {
    for (const tab of this.tabs.values()) {
      if (tab.isPrivate) continue;
      const wc = tab.view.webContents;
      if (wc.isDestroyed()) continue;
      if (wc.isLoading()) wc.stop();
      wc.reloadIgnoringCache();
    }
    this.broadcastState();
  }

  stop(): void {
    this.getActiveWebContents()?.stop();
  }

  createPrivateTab(url?: string): string {
    return this.createTab(url, { isPrivate: true });
  }

  duplicateTab(id: string): string {
    const tab = this.tabs.get(id);
    if (!tab) return this.createTab();
    return this.createTab(tab.view.webContents.getURL());
  }

  togglePinTab(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab || tab.isPrivate) return;

    tab.isPinned = !tab.isPinned;
    if (tab.isPinned) {
      this.moveTabToPinnedSection(id);
    } else {
      this.moveTabAfterPinnedSection(id);
    }
    this.persistSession();
    this.broadcastState();
  }

  /** Move a tab to `toIndex` in the tab strip. Pinned/unpinned groups stay separate. */
  moveTab(id: string, toIndex: number): void {
    const tab = this.tabs.get(id);
    if (!tab) return;

    const fromIndex = this.tabOrder.indexOf(id);
    if (fromIndex < 0) return;

    const without = this.tabOrder.filter((tabId) => tabId !== id);
    const pinnedCount = without.filter((tabId) => this.tabs.get(tabId)?.isPinned).length;

    let insertAt = Math.max(0, Math.min(Math.floor(toIndex), without.length));
    if (tab.isPinned) {
      insertAt = Math.max(0, Math.min(insertAt, pinnedCount));
    } else {
      insertAt = Math.max(pinnedCount, Math.min(insertAt, without.length));
    }

    without.splice(insertAt, 0, id);
    if (without.length === this.tabOrder.length && without.every((tabId, i) => tabId === this.tabOrder[i])) {
      return;
    }

    this.tabOrder = without;
    this.persistSession();
    this.broadcastState();
  }

  toggleDevTools(): void {
    const wc = this.getActiveWebContents();
    if (!wc) return;
    if (wc.isDevToolsOpened()) wc.closeDevTools();
    else wc.openDevTools({ mode: 'detach', title: DEVTOOLS_WINDOW_TITLE });
  }

  zoomIn(): number {
    return this.setZoom(this.getZoom() + ZOOM_STEP);
  }

  zoomOut(): number {
    return this.setZoom(this.getZoom() - ZOOM_STEP);
  }

  zoomReset(): number {
    return this.setZoom(1);
  }

  getZoom(): number {
    return this.getActiveWebContents()?.getZoomFactor() ?? 1;
  }

  findInPage(text: string, forward = true): void {
    const wc = this.getActiveWebContents();
    if (!wc || !text) return;
    wc.findInPage(text, { forward, findNext: false });
  }

  findNext(forward = true): void {
    const wc = this.getActiveWebContents();
    if (!wc) return;
    wc.findInPage('', { forward, findNext: true });
  }

  stopFindInPage(): void {
    this.getActiveWebContents()?.stopFindInPage('clearSelection');
    this.window.webContents.send(IPC_EVENTS.FIND_RESULT, { activeMatch: 0, matches: 0 });
  }

  persistSession(): void {
    const entries: { url: string; pinned: boolean }[] = [];
    let activeIndex = 0;

    for (const id of this.tabOrder) {
      const tab = this.tabs.get(id);
      if (!tab || tab.isPrivate) continue;

      const url = tab.view.webContents.getURL();
      if (!url) continue;

      if (tab.isPinned) {
        entries.push({ url, pinned: true });
      } else if (!this.isInternalPage(url)) {
        entries.push({ url, pinned: false });
      } else {
        continue;
      }

      if (id === this.activeTabId) {
        activeIndex = entries.length - 1;
      }
    }

    if (entries.length === 0) return;

    saveSession({
      tabs: entries,
      activeIndex: Math.max(0, Math.min(activeIndex, entries.length - 1)),
    });
  }

  layout(): void {
    this.layoutActiveView();
  }

  getState(): BrowserState {
    return {
      tabs: this.tabOrder
        .map((id) => this.tabs.get(id))
        .filter((tab): tab is Tab => !!tab)
        .map((tab) => this.toTabInfo(tab)),
      activeTabId: this.activeTabId,
      zoomLevel: this.getZoom(),
    };
  }

  getActiveTabUrl(): string {
    const tab = this.getActiveTab();
    if (!tab) return '';
    return this.getDisplayUrl(tab);
  }

  getActivePageInfo(): { title: string; url: string; favicon?: string } | null {
    const tab = this.getActiveTab();
    if (!tab) return null;
    const rawUrl = tab.view.webContents.getURL();
    if (this.isInternalPage(rawUrl)) return null;
    return {
      title: tab.view.webContents.getTitle() || 'New Tab',
      url: rawUrl,
      favicon: tab.favicon,
    };
  }

  private setZoom(factor: number): number {
    const wc = this.getActiveWebContents();
    if (!wc) return 1;
    const clamped = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor)) * 100) / 100;
    wc.setZoomFactor(clamped);
    this.broadcastState();
    return clamped;
  }

  private isNewTabPage(url: string): boolean {
    return this.matchesInternalPage(url, this.newTabPageUrl, 'newtab.html');
  }

  private isErrorPage(url: string): boolean {
    return this.matchesInternalPage(url, this.errorPageUrl, 'error.html');
  }

  private matchesInternalPage(url: string, pageUrl: string, filename: string): boolean {
    if (!url) return false;
    if (url === pageUrl || url.startsWith(`${pageUrl.split('?')[0]}`)) return true;

    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'file:') {
        return parsed.pathname.toLowerCase().endsWith(`/${filename}`);
      }
      if (isDevServerUrl(url)) {
        return parsed.pathname.toLowerCase() === `/${filename}`;
      }
    } catch {
      // ignore malformed URLs
    }

    return false;
  }

  private syncBuiltInFavicon(tab: Tab, url: string): void {
    if (this.isNewTabPage(url)) {
      tab.favicon = this.newTabFaviconUrl;
      return;
    }

    if (this.isErrorPage(url)) {
      tab.favicon = this.errorFaviconUrl;
      return;
    }

    tab.favicon = undefined;
  }

  private getFailedUrlFromErrorPage(url: string): string | null {
    if (!this.isErrorPage(url)) return null;
    try {
      const parsed = new URL(url);
      if (parsed.searchParams.get('mode') === 'game') return null;
      return parsed.searchParams.get('url') || null;
    } catch {
      return null;
    }
  }

  private getInternalDisplayUrl(rawUrl: string): string | null {
    if (!this.isErrorPage(rawUrl)) return null;
    try {
      if (new URL(rawUrl).searchParams.get('mode') === 'game') {
        return SNAKE_GAME_ADDRESS;
      }
    } catch {
      if (rawUrl.includes('mode=game')) return SNAKE_GAME_ADDRESS;
    }
    return null;
  }

  private getDisplayUrl(tab: Tab): string {
    const rawUrl = tab.view.webContents.getURL();
    const internalDisplay = this.getInternalDisplayUrl(rawUrl);
    if (internalDisplay) return internalDisplay;

    const failedUrl = this.getFailedUrlFromErrorPage(rawUrl);
    if (failedUrl) return failedUrl;

    if (this.isInternalPage(rawUrl)) {
      return tab.pendingUrl ?? '';
    }

    // Prefer the in-flight navigation target so the omnibox does not snap back
    // to the previous page URL between Enter and did-navigate.
    if (tab.pendingUrl) return tab.pendingUrl;

    return rawUrl;
  }

  private resolveNavigationTarget(rawUrl?: string): { href: string; displayUrl?: string } {
    if (!rawUrl) {
      return { href: this.newTabPageUrl };
    }

    const internal = resolveInternalBrowserUrl(rawUrl, this.errorPageUrl);
    if (internal) {
      return { href: internal.href, displayUrl: internal.display };
    }

    return { href: normalizeUrl(rawUrl, this.newTabPageUrl) };
  }

  private isInternalPage(url: string): boolean {
    return this.isNewTabPage(url) || this.isErrorPage(url);
  }

  getNormalTabWebContents(): WebContents[] {
    const contents: WebContents[] = [];
    for (const id of this.tabOrder) {
      const tab = this.tabs.get(id);
      if (!tab || tab.isPrivate) continue;
      const wc = tab.view.webContents;
      if (!wc.isDestroyed()) contents.push(wc);
    }
    return contents;
  }

  private getActiveTab(): Tab | undefined {
    if (!this.activeTabId) return undefined;
    return this.tabs.get(this.activeTabId);
  }

  private getActiveWebContents(): WebContents | undefined {
    return this.getActiveTab()?.view.webContents;
  }

  private layoutActiveView(): void {
    if (this.webContentHidden) return;

    const tab = this.getActiveTab();
    if (!tab) return;

    const [width, height] = this.window.getContentSize();
    tab.view.setBounds({
      x: 0,
      y: CHROME_HEIGHT,
      width,
      height: Math.max(0, height - CHROME_HEIGHT),
    });
  }

  private setLoadingProgress(loading: boolean): void {
    if (this.window.isDestroyed()) return;
    this.window.setProgressBar(loading ? 2 : -1);
  }

  private attachViewEvents(id: string, view: BrowserView): void {
    const wc = view.webContents;

    installWebContentsCompat(wc);
    attachKeyboardShortcuts(wc);

    wc.setWindowOpenHandler((details) => {
      if (shouldAllowAsAuthPopup(details)) {
        const size = parsePopupSize(details.features);
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            parent: this.window,
            width: size.width,
            height: size.height,
            autoHideMenuBar: true,
            show: true,
            webPreferences: {
              session: wc.session,
              nodeIntegration: false,
              contextIsolation: true,
              sandbox: true,
            },
          },
        };
      }

      if (details.url && details.url !== 'about:blank') {
        this.createTab(details.url);
      }
      return { action: 'deny' };
    });

    wc.on('did-create-window', (child) => {
      applyWindowIcon(child);
      child.setMenuBarVisibility(false);
      attachPrivacySession(child.webContents.session);
    });

    const notify = (): void => this.broadcastState();

    wc.on('did-start-loading', () => {
      this.setLoadingProgress(true);
      notify();
    });

    wc.on('will-navigate', (_event, url) => {
      const tabEntry = this.tabs.get(id);
      if (!tabEntry || this.isInternalPage(url)) return;
      tabEntry.pendingUrl = url;
      notify();
    });

    wc.on('did-stop-loading', () => {
      this.setLoadingProgress(false);
      if (isNewTabPageUrl(wc.getURL())) {
        void persistShortcutsFromWebContents(wc);
      }
      notify();
    });

    wc.on('did-finish-load', () => {
      if (isNewTabPageUrl(wc.getURL())) {
        void restoreShortcutsToWebContents(wc);
      }
    });

    wc.on('did-navigate', (_event, url) => {
      const tabEntry = this.tabs.get(id);
      if (tabEntry) {
        this.syncBuiltInFavicon(tabEntry, url);
        if (!this.isInternalPage(url)) {
          tabEntry.pendingUrl = undefined;
        }
      }
      notify();
    });

    wc.on('did-navigate-in-page', (_event, url) => {
      const tabEntry = this.tabs.get(id);
      if (tabEntry) {
        this.syncBuiltInFavicon(tabEntry, url);
        if (!this.isInternalPage(url)) {
          tabEntry.pendingUrl = undefined;
        }
      }
      notify();
    });
    wc.on('page-title-updated', notify);

    wc.on('page-favicon-updated', (_event, favicons) => {
      const tabEntry = this.tabs.get(id);
      if (!tabEntry || !favicons[0]) return;

      const currentUrl = wc.getURL();
      if (this.isNewTabPage(currentUrl)) {
        tabEntry.favicon = this.newTabFaviconUrl;
      } else if (this.isErrorPage(currentUrl)) {
        tabEntry.favicon = this.errorFaviconUrl;
      } else {
        tabEntry.favicon = favicons[0];
      }
      this.broadcastState();
    });

    wc.on('did-fail-load', (_event, errorCode, _desc, validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      if (this.isErrorPage(validatedURL)) return;

      // Retry when dev server is still starting (connection refused)
      if (errorCode === -102 && isDevServerUrl(validatedURL)) {
        setTimeout(() => wc.loadURL(validatedURL), 500);
        return;
      }

      const params = new URLSearchParams({
        code: String(errorCode),
        url: validatedURL,
      });
      const tabEntry = this.tabs.get(id);
      if (tabEntry && validatedURL) {
        tabEntry.pendingUrl = validatedURL;
      }
      wc.loadURL(`${this.errorPageUrl}?${params.toString()}`);
    });

    wc.on('found-in-page', (_event, result) => {
      if (this.activeTabId !== id) return;
      this.window.webContents.send(IPC_EVENTS.FIND_RESULT, {
        activeMatch: result.activeMatchOrdinal,
        matches: result.matches,
      });
    });

    wc.on('devtools-opened', () => {
      // Detached DevTools defaults to Electron branding in dev; apply our title/icon.
      setImmediate(() => brandDevToolsWindows());
    });
  }

  private toTabInfo(tab: Tab): TabInfo {
    const wc = tab.view.webContents;
    const rawUrl = wc.getURL();
    const url = this.getDisplayUrl(tab);
    return {
      id: tab.id,
      title: wc.getTitle() || 'New Tab',
      url,
      isLoading: wc.isLoading(),
      canGoBack: canGoBack(wc),
      canGoForward: canGoForward(wc),
      isActive: tab.id === this.activeTabId,
      isSecure: isSecureUrl(this.getFailedUrlFromErrorPage(rawUrl) ?? rawUrl),
      favicon: tab.favicon,
      isPrivate: tab.isPrivate,
      isPinned: tab.isPinned,
    };
  }

  private moveTabInOrder(id: string, index: number): void {
    this.tabOrder = this.tabOrder.filter((tabId) => tabId !== id);
    this.tabOrder.splice(Math.max(0, Math.min(index, this.tabOrder.length)), 0, id);
  }

  private moveTabToPinnedSection(id: string): void {
    const pinnedEnd = this.tabOrder.reduce(
      (count, tabId) => (this.tabs.get(tabId)?.isPinned && tabId !== id ? count + 1 : count),
      0,
    );
    this.moveTabInOrder(id, pinnedEnd);
  }

  private moveTabAfterPinnedSection(id: string): void {
    const firstUnpinned = this.tabOrder.findIndex(
      (tabId) => tabId !== id && !this.tabs.get(tabId)?.isPinned,
    );
    const insertAt = firstUnpinned === -1 ? this.tabOrder.length : firstUnpinned;
    this.moveTabInOrder(id, insertAt);
  }

  private broadcastState(): void {
    if (this.window.isDestroyed()) return;
    this.window.webContents.send(IPC_EVENTS.BROWSER_STATE, this.getState());
  }
}
