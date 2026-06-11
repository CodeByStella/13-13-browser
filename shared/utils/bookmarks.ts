import type { BookmarkNode } from '@shared/types';

export function isBookmarkItem(
  item: BookmarkNode,
): item is BookmarkNode & { type: 'bookmark'; url: string } {
  return item.type === 'bookmark' && !!item.url;
}

export function isFolderItem(item: BookmarkNode): item is BookmarkNode & { type: 'folder' } {
  return item.type === 'folder';
}

export function getRootItems(items: BookmarkNode[]): BookmarkNode[] {
  return items.filter((item) => item.parentId === null);
}

export function getChildren(items: BookmarkNode[], parentId: string): BookmarkNode[] {
  return items.filter((item) => item.parentId === parentId);
}

export function findBookmarkByUrl(items: BookmarkNode[], url: string): BookmarkNode | undefined {
  return items.find((item) => isBookmarkItem(item) && item.url === url);
}

export function collectDescendantIds(items: BookmarkNode[], id: string): Set<string> {
  const ids = new Set<string>([id]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const item of items) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    }
  }

  return ids;
}

export function listFolderOptions(
  items: BookmarkNode[],
  excludeId?: string,
): BookmarkNode[] {
  const exclude = excludeId ? collectDescendantIds(items, excludeId) : new Set<string>();
  return items.filter(
    (item) => isFolderItem(item) && !exclude.has(item.id),
  );
}
