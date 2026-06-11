import type { PrivacySettings, PrivacyStats } from '../types/browser';
import { IconClose, IconShield } from './Icons';

interface PrivacyPanelProps {
  open: boolean;
  settings: PrivacySettings;
  stats: PrivacyStats;
  protectionEnabled: boolean;
  onClose: () => void;
  onUpdateSetting: (key: keyof PrivacySettings, value: boolean) => void;
  onClearData: () => void;
  onToggleProtection: () => void;
}

const TOGGLES: { key: keyof PrivacySettings; label: string; desc: string }[] = [
  {
    key: 'blockTrackers',
    label: 'Block trackers',
    desc: 'Stop known analytics and ad-tracking requests',
  },
  {
    key: 'sendDoNotTrack',
    label: 'Do Not Track',
    desc: 'Send DNT: 1 header with every request',
  },
  {
    key: 'blockPermissions',
    label: 'Block sensitive permissions',
    desc: 'Deny camera, mic, location, and notifications by default',
  },
  {
    key: 'clearOnExit',
    label: 'Clear data on exit',
    desc: 'Wipe cache and storage when the browser closes',
  },
];

export function PrivacyPanel({
  open,
  settings,
  stats,
  protectionEnabled,
  onClose,
  onUpdateSetting,
  onClearData,
  onToggleProtection,
}: PrivacyPanelProps) {
  if (!open) return null;

  const score = Math.min(
    100,
    (settings.blockTrackers ? 25 : 0) +
      (settings.sendDoNotTrack ? 20 : 0) +
      (settings.blockPermissions ? 25 : 0) +
      (protectionEnabled ? 30 : 0),
  );

  return (
    <div
      className="privacy-overlay"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <aside
        className="privacy-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Privacy dashboard"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="privacy-panel-header">
        <div className="privacy-panel-title">
          <IconShield active />
          <div>
            <h2>Privacy Shield</h2>
            <p>Your protection dashboard</p>
          </div>
        </div>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
      </div>

      <div className="privacy-panel-body">
        <div className="privacy-score-card">
          <div className="score-ring" style={{ '--score': score } as React.CSSProperties}>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-details">
            <strong>Privacy score</strong>
            <span>{score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs attention'}</span>
          </div>
        </div>

        <div className="privacy-stats">
          <div className="stat-card">
            <span className="stat-num">{stats.trackersBlocked}</span>
            <span className="stat-label">Trackers blocked</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.permissionsDenied}</span>
            <span className="stat-label">Permissions denied</span>
          </div>
        </div>

        <div className="privacy-toggles">
          {TOGGLES.map(({ key, label, desc }) => (
            <label key={key} className="privacy-toggle-row">
              <div>
                <span className="toggle-label">{label}</span>
                <span className="toggle-desc">{desc}</span>
              </div>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => onUpdateSetting(key, e.target.checked)}
              />
            </label>
          ))}

          <label className="privacy-toggle-row">
            <div>
              <span className="toggle-label">Screen capture protection</span>
              <span className="toggle-desc">Hide window from screenshots and screen recording</span>
            </div>
            <input
              type="checkbox"
              checked={protectionEnabled}
              onChange={onToggleProtection}
            />
          </label>
        </div>

        <button type="button" className="clear-data-btn" onClick={onClearData}>
          Clear browsing data now
        </button>
      </div>
      </aside>
    </div>
  );
}
