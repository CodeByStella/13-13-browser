import { forwardRef } from 'react';

type PrivacyTier = 'excellent' | 'good' | 'at-risk';

function privacyTier(score: number): PrivacyTier {
  if (score >= 80) return 'excellent';
  if (score >= 50) return 'good';
  return 'at-risk';
}

function statusLabel(tier: PrivacyTier): string {
  switch (tier) {
    case 'excellent':
      return 'SAFE';
    case 'good':
      return 'CAUTION';
    case 'at-risk':
      return 'RISKY';
  }
}

const METER_RADIUS = 9;
const METER_C = 2 * Math.PI * METER_RADIUS;

function ScoreRing({ score }: { score: number }) {
  const progress = (score / 100) * METER_C;

  return (
    <svg className="privacy-shield-meter" viewBox="0 0 22 22" aria-hidden="true">
      <circle className="privacy-shield-meter-track" cx="11" cy="11" r={METER_RADIUS} />
      <circle
        className="privacy-shield-meter-progress"
        cx="11"
        cy="11"
        r={METER_RADIUS}
        strokeDasharray={`${progress} ${METER_C}`}
        transform="rotate(-90 11 11)"
      />
      <text className="privacy-shield-meter-text" x="11" y="12" textAnchor="middle" dominantBaseline="central">
        {score}
      </text>
    </svg>
  );
}

interface PrivacyShieldButtonProps {
  score: number;
  onClick: () => void;
}

export const PrivacyShieldButton = forwardRef<HTMLButtonElement, PrivacyShieldButtonProps>(
  function PrivacyShieldButton({ score, onClick }, ref) {
    const tier = privacyTier(score);
    const label = statusLabel(tier);

    return (
      <button
        ref={ref}
        type="button"
        className={`privacy-shield-trigger privacy-shield-trigger--${tier}`}
        onClick={onClick}
        title={`Privacy shield — ${label} (score ${score}/100)`}
        aria-label={`Privacy dashboard. Privacy score ${score}. ${label}`}
        aria-haspopup="dialog"
      >
        <ScoreRing score={score} />
        <span className="privacy-shield-label">{label}</span>
      </button>
    );
  },
);
