import './ProgressRing.css';

/**
 * Circular progress indicator showing a 0-100 value in the middle.
 *  color: optional stroke color (defaults to the brand color)
 */
export default function ProgressRing({ value, size = 120, stroke = 10, label, color }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          style={color ? { stroke: `color-mix(in srgb, ${color} 14%, #ffffff)` } : undefined}
        />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={color ? { stroke: color } : undefined}
        />
      </svg>
      <span className="progress-ring__label" style={{ fontSize: Math.round(size * 0.22) }}>
        {clamped}
        <small>%</small>
      </span>
    </div>
  );
}
