import Spinner from './Spinner.jsx';

/** Centered spinner for a section or page area that is loading. */
export default function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-16) var(--space-4)',
        color: 'var(--color-primary)',
      }}
    >
      <Spinner size={22} label={label} />
      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{label}</span>
    </div>
  );
}
