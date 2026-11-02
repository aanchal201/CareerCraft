import { Check } from 'lucide-react';
import ResumeThumbnail from './ResumeThumbnail.jsx';
import { SAMPLE_CONTENT, TEMPLATES } from './templates/templateRegistry.js';
import './TemplatePicker.css';

/** Grid of template cards with real thumbnails; behaves like a radio group. */
export default function TemplatePicker({ value, onChange, accentColor = '#0f766e' }) {
  return (
    <div className="template-picker" role="radiogroup" aria-label="Resume template">
      {TEMPLATES.map((template) => {
        const selected = template.id === value;
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`template-picker__option ${selected ? 'is-selected' : ''}`}
            onClick={() => onChange(template.id)}
          >
            <span className="template-picker__thumb">
              <ResumeThumbnail templateId={template.id} accentColor={accentColor} content={SAMPLE_CONTENT} width={150} />
              {selected && (
                <span className="template-picker__check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="template-picker__name">{template.name}</span>
            <span className="template-picker__description">{template.description}</span>
          </button>
        );
      })}
    </div>
  );
}
