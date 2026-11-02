import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Button from '../common/Button.jsx';
import './EntryCard.css';

/**
 * Displays one education / experience / certification entry.
 * `entry` = { title, subtitle, meta: [{ icon, text }], description, link: { href, label } }
 */
export default function EntryCard({ icon: Icon, entry, onEdit, onDelete }) {
  return (
    <article className="entry-card">
      {Icon && (
        <span className="entry-card__icon" aria-hidden="true">
          <Icon size={20} />
        </span>
      )}

      <div className="entry-card__body">
        <h3 className="entry-card__title">{entry.title}</h3>
        {entry.subtitle && <p className="entry-card__subtitle">{entry.subtitle}</p>}

        {entry.meta?.length > 0 && (
          <ul className="entry-card__meta">
            {entry.meta.map(({ icon: MetaIcon, text }) => (
              <li key={text}>
                {MetaIcon && <MetaIcon size={14} aria-hidden="true" />}
                {text}
              </li>
            ))}
          </ul>
        )}

        {entry.description && <p className="entry-card__description">{entry.description}</p>}

        {entry.link && (
          <a className="entry-card__link" href={entry.link.href} target="_blank" rel="noopener noreferrer">
            {entry.link.label} <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="entry-card__actions">
        <Button size="sm" variant="ghost" iconOnly icon={Pencil} onClick={onEdit} aria-label={`Edit ${entry.title}`} />
        <Button size="sm" variant="ghost" iconOnly icon={Trash2} onClick={onDelete} aria-label={`Delete ${entry.title}`} />
      </div>
    </article>
  );
}
