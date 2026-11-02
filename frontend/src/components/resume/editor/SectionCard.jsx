import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import Button from '../../common/Button.jsx';

/**
 * Collapsible card for one section in the editor. The header holds the
 * section-level controls: show/hide on the resume and move up/down.
 * Personal info passes no controls (it is always shown, always first).
 */
export default function SectionCard({
  icon: Icon,
  title,
  subtitle,
  open,
  onToggle,
  visible = true,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  children,
}) {
  return (
    <section className={`editor-section ${open ? 'is-open' : ''} ${visible ? '' : 'is-hidden'}`}>
      <div className="editor-section__header">
        <button type="button" className="editor-section__toggle" onClick={onToggle} aria-expanded={open}>
          {Icon && (
            <span className="editor-section__icon">
              <Icon size={18} aria-hidden="true" />
            </span>
          )}
          <span className="editor-section__titles">
            <span className="editor-section__title">{title}</span>
            {subtitle && <span className="editor-section__subtitle">{subtitle}</span>}
          </span>
          <ChevronDown size={18} className="editor-section__chevron" aria-hidden="true" />
        </button>

        {onToggleVisible && (
          <div className="editor-section__controls">
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={ArrowUp}
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={`Move ${title} up`}
            />
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={ArrowDown}
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={`Move ${title} down`}
            />
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={visible ? Eye : EyeOff}
              onClick={onToggleVisible}
              aria-label={visible ? `Hide ${title} from resume` : `Show ${title} on resume`}
              aria-pressed={!visible}
              title={visible ? 'Shown on resume — click to hide' : 'Hidden from resume — click to show'}
            />
          </div>
        )}
      </div>

      {open && <div className="editor-section__body">{children}</div>}
    </section>
  );
}
