import { randomUUID } from 'node:crypto';

import type { BookmarkNode } from '@shared/types';
import {
  collectDescendantIds,
  findBookmarkByUrl,
  isBookmarkItem,
  isFolderItem,
} from '@shared/utils/bookmarks';

import { loadBookmarks, saveBookmarks } from '../stores/bookmarks-store';

export class BookmarksService {
  private nodes: BookmarkNode[] = loadBookmarks();

  constructor(private readonly onChange: (bookmarks: BookmarkNode[]) => void) {}

  getAll(): BookmarkNode[] {
    return this.nodes;
  }

  replace(nodes: BookmarkNode[]): BookmarkNode[] {
    this.nodes = nodes;
    saveBookmarks(this.nodes);
    this.onChange(this.nodes);
    return this.nodes;
  }

  createFolder(title: string, parentId: string | null = null): BookmarkNode[] {
    const name = title.trim() || 'New folder';
    if (parentId && !this.nodes.some((item) => item.id === parentId && isFolderItem(item))) {
      return this.nodes;
    }

    this.nodes = [
      ...this.nodes,
      {
        id: randomUUID(),
        type: 'folder',
        title: name,
        parentId,
        createdAt: Date.now(),
      },
    ];
    saveBookmarks(this.nodes);
    this.onChange(this.nodes);
    return this.nodes;
  }

  add(title: string, url: string, parentId: string | null = null, favicon?: string): string | null {
    if (!url || url.startsWith('file://')) return null;
    if (findBookmarkByUrl(this.nodes, url)) return null;
    if (parentId && !this.nodes.some((item) => item.id === parentId && isFolderItem(item))) {
      return null;
    }

    const id = randomUUID();
    this.nodes = [
      ...this.nodes,
      {
        id,
        type: 'bookmark',
        title: title || url,
        url,
        ...(favicon ? { favicon } : {}),
        parentId,
        createdAt: Date.now(),
      },
    ];
    saveBookmarks(this.nodes);
    this.onChange(this.nodes);
    return id;
  }

  rename(id: string, title: string): BookmarkNode[] {
    const name = title.trim();
    if (!name) return this.nodes;

    this.nodes = this.nodes.map((item) =>
      item.id === id ? { ...item, title: name } : item,
    );
    saveBookmarks(this.nodes);
    this.onChange(this.nodes);
    return this.nodes;
  }

  move(id: string, parentId: string | null): BookmarkNode[] {
    const item = this.nodes.find((node) => node.id === id);
    if (!item) return this.nodes;

    if (parentId === id) return this.nodes;
    if (parentId && collectDescendantIds(this.nodes, id).has(parentId)) return this.nodes;
    if (parentId && !this.nodes.some((node) => node.id === parentId && isFolderItem(node))) {
      return this.nodes;
    }

    this.nodes = this.nodes.map((node) =>
      node.id === id ? { ...node, parentId } : node,
    );
    saveBookmarks(this.nodes);
    this.onChange(this.nodes);
    return this.nodes;
  }

  remove(id: string): BookmarkNode[] {
    const removeIds = collectDescendantIds(this.nodes, id);
    this.nodes = this.nodes.filter((item) => !removeIds.has(item.id));
    saveBookmarks(this.nodes);
    this.onChange(this.nodes);
    return this.nodes;
  }

  toggle(title: string, url: string, favicon?: string): { addedId: string | null } {
    const existing = findBookmarkByUrl(this.nodes, url);
    if (existing) {
      this.remove(existing.id);
      return { addedId: null };
    }
    return { addedId: this.add(title, url, null, favicon) };
  }
}
