import './EmptyState.css';

/** Friendly placeholder for empty lists and error states. */
export default function EmptyState({ icon: Icon, title, text, action, tone = 'neutral' }) {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      {Icon && (
        <span className="empty-state__icon">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {text && <p className="empty-state__text">{text}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
