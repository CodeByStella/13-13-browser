interface FindBarProps {
  query: string;
  result: { activeMatch: number; matches: number };
  onQueryChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function FindBar({
  query,
  result,
  onQueryChange,
  onNext,
  onPrev,
  onClose,
}: FindBarProps) {
  const label =
    result.matches > 0
      ? `${result.activeMatch} of ${result.matches}`
      : query
        ? 'No matches'
        : '';

  return (
    <div className="find-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.shiftKey ? onPrev() : onNext();
          }
          if (e.key === 'Escape') onClose();
        }}
        placeholder="Find in page"
        spellCheck={false}
        autoFocus
        aria-label="Find in page"
      />
      <span className="find-count">{label}</span>
      <button type="button" className="find-btn" onClick={onPrev} aria-label="Previous match">
        ↑
      </button>
      <button type="button" className="find-btn" onClick={onNext} aria-label="Next match">
        ↓
      </button>
      <button type="button" className="find-btn find-close" onClick={onClose} aria-label="Close find bar">
        ×
      </button>
    </div>
  );
}
