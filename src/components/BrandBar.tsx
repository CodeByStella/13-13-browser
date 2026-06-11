import { WindowControls } from './WindowControls';

interface BrandBarProps {
  privacyScore: number;
  trackersBlocked: number;
  maximized: boolean;
  onOpenPrivacy: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function BrandBar({
  privacyScore,
  trackersBlocked,
  maximized,
  onOpenPrivacy,
  onMinimize,
  onToggleMaximize,
  onClose,
}: BrandBarProps) {
  return (
    <div className="brand-bar titlebar-drag">
      <div className="brand-logo">
        <span className="brand-mark">13</span>
        <span className="brand-dot">.</span>
        <span className="brand-mark accent">13</span>
        <span className="brand-tag">Privacy Browser</span>
      </div>

      <div className="brand-bar-spacer titlebar-drag" />

      <div className="brand-bar-actions titlebar-no-drag">
        <button type="button" className="privacy-pill" onClick={onOpenPrivacy}>
          <span className="pill-ring" style={{ '--score': privacyScore } as React.CSSProperties}>
            <span className="pill-score">{privacyScore}</span>
          </span>
          <span className="pill-text">
            Privacy {privacyScore >= 80 ? 'Protected' : 'Active'}
            {trackersBlocked > 0 && ` · ${trackersBlocked} blocked`}
          </span>
        </button>

        <WindowControls
          maximized={maximized}
          onMinimize={onMinimize}
          onToggleMaximize={onToggleMaximize}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
