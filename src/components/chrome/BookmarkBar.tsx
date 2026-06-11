import type { Bookmark } from '../../types/browser';

interface BookmarkBarProps {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onRemove: (id: string) => void;
}

export function BookmarkBar({ bookmarks, onNavigate, onRemove }: BookmarkBarProps) {
  if (bookmarks.length === 0) return null;

  return (
    <div className="bookmark-bar">
      {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="bookmark-item">
            <button
              type="button"
              className="bookmark-link"
              onClick={() => onNavigate(bookmark.url)}
              title={bookmark.url}
            >
              {bookmark.title}
            </button>
            <button
              type="button"
              className="bookmark-remove"
              onClick={() => onRemove(bookmark.id)}
              aria-label={`Remove ${bookmark.title} from bookmarks`}
            >
              ×
            </button>
          </div>
      ))}
    </div>
  );
}
