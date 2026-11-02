import { scoreTone } from '../../utils/score';

/** Small colored pill with a score, e.g. in the history list. */
export default function ScoreBadge({ score, label }) {
  const { color } = scoreTone(score);
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        height: 26,
        padding: '0 8px',
        borderRadius: 999,
        background: `color-mix(in srgb, ${color} 12%, #ffffff)`,
        color,
        fontSize: 13,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {score}
    </span>
  );
}
