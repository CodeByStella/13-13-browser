import {
  BrowserView,
  BrowserWindow,
  type WebContents,
} from 'electron';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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
import { saveSession, type SessionData } from '../../stores/session-store';
import { attachPrivacySession } from '../privacy/privacy';

interface Tab {
  id: string;
  view: BrowserView;
  favicon?: string;
  isPrivate: boolean;
}

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

export class TabManager {
  private window: BrowserWindow;
  private tabs = new Map<string, Tab>();
  private tabOrder: string[] = [];
  private activeTabId: string | null = null;
  private closedTabs: string[] = [];
  private webContentHidden = false;
  private readonly newTabPageUrl: string;
  private readonly errorPageUrl: string;

  constructor(window: BrowserWindow, isDev: boolean) {
    this.window = window;
    const staticDir = isDev
      ? path.join(__dirname, '../public')
      : path.join(__dirname, '../dist');

    this.newTabPageUrl = pathToFileURL(path.join(staticDir, 'newtab.html')).href;
    this.errorPageUrl = pathToFileURL(path.join(staticDir, 'error.html')).href;
  }

  restoreSession(session: SessionData): void {
    session.tabs.forEach((url, index) => {
      const id = this.createTab(url, { activate: false });
      if (index === session.activeIndex) {
        this.switchTab(id);
      }
    });

    if (!this.activeTabId && this.tabOrder.length > 0) {
      this.switchTab(this.tabOrder[0]);
    }
  }

  createTab(url?: string, options?: { activate?: boolean; isPrivate?: boolean }): string {
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
    this.tabs.set(id, { id, view, isPrivate });
    this.tabOrder.push(id);

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

    view.webContents.loadURL(url ?? this.newTabPageUrl);
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
      this.window.close();
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

    const url = normalizeUrl(rawUrl, this.newTabPageUrl);
    tab.view.webContents.loadURL(url);
    return this.isInternalPage(url) ? '' : url;
  }

  goHome(): void {
    this.getActiveTab()?.view.webContents.loadURL(this.newTabPageUrl);
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

  toggleDevTools(): void {
    const wc = this.getActiveWebContents();
    if (!wc) return;
    if (wc.isDevToolsOpened()) wc.closeDevTools();
    else wc.openDevTools({ mode: 'detach' });
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
    const tabs = this.tabOrder
      .map((id) => {
        const tab = this.tabs.get(id);
        if (!tab || tab.isPrivate) return null;
        return tab.view.webContents.getURL();
      })
      .filter((url): url is string => !!url && !this.isInternalPage(url));

    if (tabs.length === 0) return;

    const activeIndex = Math.max(0, this.tabOrder.indexOf(this.activeTabId ?? ''));
    saveSession({ tabs, activeIndex: Math.min(activeIndex, tabs.length - 1) });
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
    const rawUrl = tab.view.webContents.getURL();
    return this.isInternalPage(rawUrl) ? '' : rawUrl;
  }

  private setZoom(factor: number): number {
    const wc = this.getActiveWebContents();
    if (!wc) return 1;
    const clamped = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor)) * 100) / 100;
    wc.setZoomFactor(clamped);
    this.broadcastState();
    return clamped;
  }

  private isInternalPage(url: string): boolean {
    if (!url) return false;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'file:') return false;

      const pathname = parsed.pathname.toLowerCase();
      const newTabPath = new URL(this.newTabPageUrl).pathname.toLowerCase();
      const errorPath = new URL(this.errorPageUrl).pathname.toLowerCase();
      return pathname === newTabPath || pathname === errorPath;
    } catch {
      return url.startsWith(this.newTabPageUrl) || url.startsWith(this.errorPageUrl);
    }
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

    wc.setWindowOpenHandler(({ url }) => {
      this.createTab(url);
      return { action: 'deny' };
    });

    const notify = (): void => this.broadcastState();

    wc.on('did-start-loading', () => {
      this.setLoadingProgress(true);
      notify();
    });

    wc.on('did-stop-loading', () => {
      this.setLoadingProgress(false);
      notify();
    });

    wc.on('did-navigate', notify);
    wc.on('did-navigate-in-page', notify);
    wc.on('page-title-updated', notify);

    wc.on('page-favicon-updated', (_event, favicons) => {
      const tabEntry = this.tabs.get(id);
      if (tabEntry && favicons[0]) {
        tabEntry.favicon = favicons[0];
        this.broadcastState();
      }
    });

    wc.on('did-fail-load', (_event, errorCode, _desc, validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      if (validatedURL.startsWith(this.errorPageUrl)) return;

      // Retry when dev server is still starting (connection refused)
      if (errorCode === -102 && isDevServerUrl(validatedURL)) {
        setTimeout(() => wc.loadURL(validatedURL), 500);
        return;
      }

      const params = new URLSearchParams({
        code: String(errorCode),
        url: validatedURL,
      });
      wc.loadURL(`${this.errorPageUrl}?${params.toString()}`);
    });

    wc.on('found-in-page', (_event, result) => {
      if (this.activeTabId !== id) return;
      this.window.webContents.send(IPC_EVENTS.FIND_RESULT, {
        activeMatch: result.activeMatchOrdinal,
        matches: result.matches,
      });
    });
  }

  private toTabInfo(tab: Tab): TabInfo {
    const wc = tab.view.webContents;
    const rawUrl = wc.getURL();
    const url = this.isInternalPage(rawUrl) ? '' : rawUrl;
    return {
      id: tab.id,
      title: wc.getTitle() || 'New Tab',
      url,
      isLoading: wc.isLoading(),
      canGoBack: canGoBack(wc),
      canGoForward: canGoForward(wc),
      isActive: tab.id === this.activeTabId,
      isSecure: isSecureUrl(rawUrl),
      favicon: tab.favicon,
      isPrivate: tab.isPrivate,
    };
  }

  private broadcastState(): void {
    if (this.window.isDestroyed()) return;
    this.window.webContents.send(IPC_EVENTS.BROWSER_STATE, this.getState());
  }
}
