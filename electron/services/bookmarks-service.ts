import { randomUUID } from 'node:crypto';

import type { Bookmark } from '@shared/types';

import { loadBookmarks, saveBookmarks } from '../stores/bookmarks-store';

export class BookmarksService {
  private bookmarks: Bookmark[] = loadBookmarks();

  constructor(private readonly onChange: (bookmarks: Bookmark[]) => void) {}

  getAll(): Bookmark[] {
    return this.bookmarks;
  }

  replace(bookmarks: Bookmark[]): Bookmark[] {
    this.bookmarks = bookmarks;
    saveBookmarks(this.bookmarks);
    this.onChange(this.bookmarks);
    return this.bookmarks;
  }

  add(title: string, url: string): Bookmark[] {
    if (!url || url.startsWith('file://')) return this.bookmarks;
    if (this.bookmarks.some((bookmark) => bookmark.url === url)) return this.bookmarks;

    this.bookmarks = [
      { id: randomUUID(), title: title || url, url, createdAt: Date.now() },
      ...this.bookmarks,
    ];
    saveBookmarks(this.bookmarks);
    this.onChange(this.bookmarks);
    return this.bookmarks;
  }

  remove(id: string): Bookmark[] {
    this.bookmarks = this.bookmarks.filter((bookmark) => bookmark.id !== id);
    saveBookmarks(this.bookmarks);
    this.onChange(this.bookmarks);
    return this.bookmarks;
  }

  toggle(title: string, url: string): Bookmark[] {
    const existing = this.bookmarks.find((bookmark) => bookmark.url === url);
    if (existing) return this.remove(existing.id);
    return this.add(title, url);
  }
}
