import {
  BrowserView,
  BrowserWindow,
  shell,
  type WebContents,
} from 'electron';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import {
  CHROME_HEIGHT,
  DEFAULT_HOME_URL,
  isSecureUrl,
  normalizeUrl,
  type BrowserState,
  type TabInfo,
} from './shared';

interface Tab {
  id: string;
  view: BrowserView;
  favicon?: string;
}

export class TabManager {
  private window: BrowserWindow;
  private tabs = new Map<string, Tab>();
  private activeTabId: string | null = null;
  private readonly newTabPageUrl: string;

  constructor(window: BrowserWindow, isDev: boolean) {
    this.window = window;
    this.newTabPageUrl = isDev
      ? `${process.env.VITE_DEV_SERVER_URL}newtab.html`
      : `file://${path.join(__dirname, '../dist/newtab.html').replace(/\\/g, '/')}`;
  }

  getNewTabPageUrl(): string {
    return this.newTabPageUrl;
  }

  createTab(url?: string): string {
    const id = randomUUID();
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    this.attachViewEvents(id, view);
    this.tabs.set(id, { id, view });

    if (this.activeTabId) {
      this.window.removeBrowserView(this.getActiveTab()!.view);
    }

    this.activeTabId = id;
    this.window.addBrowserView(view);
    this.layoutActiveView();
    view.webContents.loadURL(url ?? this.newTabPageUrl);

    this.broadcastState();
    return id;
  }

  closeTab(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab) return;

    const wasActive = this.activeTabId === id;
    this.window.removeBrowserView(tab.view);
    tab.view.webContents.close();
    this.tabs.delete(id);

    if (this.tabs.size === 0) {
      this.createTab();
      return;
    }

    if (wasActive) {
      const nextId = [...this.tabs.keys()].at(-1)!;
      this.switchTab(nextId);
    } else {
      this.broadcastState();
    }
  }

  switchTab(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab || this.activeTabId === id) return;

    const current = this.getActiveTab();
    if (current) {
      this.window.removeBrowserView(current.view);
    }

    this.activeTabId = id;
    this.window.addBrowserView(tab.view);
    this.layoutActiveView();
    this.broadcastState();
  }

  navigateActive(rawUrl: string): string {
    const tab = this.getActiveTab();
    if (!tab) return rawUrl;

    const url = normalizeUrl(rawUrl, this.newTabPageUrl);
    tab.view.webContents.loadURL(url);
    return url;
  }

  goHome(): void {
    const tab = this.getActiveTab();
    tab?.view.webContents.loadURL(DEFAULT_HOME_URL);
  }

  goBack(): void {
    const wc = this.getActiveWebContents();
    if (wc?.canGoBack()) wc.goBack();
  }

  goForward(): void {
    const wc = this.getActiveWebContents();
    if (wc?.canGoForward()) wc.goForward();
  }

  reload(): void {
    this.getActiveWebContents()?.reload();
  }

  stop(): void {
    this.getActiveWebContents()?.stop();
  }

  duplicateTab(id: string): string {
    const tab = this.tabs.get(id);
    if (!tab) return this.createTab();
    return this.createTab(tab.view.webContents.getURL());
  }

  layout(): void {
    this.layoutActiveView();
  }

  getState(): BrowserState {
    return {
      tabs: [...this.tabs.values()].map((tab) => this.toTabInfo(tab)),
      activeTabId: this.activeTabId,
    };
  }

  private getActiveTab(): Tab | undefined {
    if (!this.activeTabId) return undefined;
    return this.tabs.get(this.activeTabId);
  }

  private getActiveWebContents(): WebContents | undefined {
    return this.getActiveTab()?.view.webContents;
  }

  private layoutActiveView(): void {
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

  private attachViewEvents(id: string, view: BrowserView): void {
    const wc = view.webContents;

    wc.setWindowOpenHandler(({ url }) => {
      this.createTab(url);
      return { action: 'deny' };
    });

    const notify = (): void => {
      if (this.activeTabId === id) {
        this.broadcastState();
      } else {
        this.broadcastState();
      }
    };

    wc.on('did-start-loading', notify);
    wc.on('did-stop-loading', notify);
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
    wc.on('did-fail-load', (_event, _code, _desc, _url, isMainFrame) => {
      if (isMainFrame) notify();
    });
  }

  private toTabInfo(tab: Tab): TabInfo {
    const wc = tab.view.webContents;
    const url = wc.getURL();
    return {
      id: tab.id,
      title: wc.getTitle() || 'New Tab',
      url,
      isLoading: wc.isLoading(),
      canGoBack: wc.canGoBack(),
      canGoForward: wc.canGoForward(),
      isActive: tab.id === this.activeTabId,
      isSecure: isSecureUrl(url),
      favicon: tab.favicon,
    };
  }

  private broadcastState(): void {
    if (this.window.isDestroyed()) return;
    this.window.webContents.send('browser-state', this.getState());
  }
}
