import { Check } from 'lucide-react';
import PortfolioThumbnail from './PortfolioThumbnail.jsx';
import { DEFAULT_DESIGN, PORTFOLIO_TEMPLATES, SAMPLE_PORTFOLIO } from './templates/portfolioRegistry.js';
import '../resume/TemplatePicker.css';

/** Radio-style grid of portfolio templates with live thumbnails. */
export default function PortfolioTemplatePicker({ value, onChange, design = DEFAULT_DESIGN, thumbWidth = 150 }) {
  return (
    <div className="template-picker" role="radiogroup" aria-label="Portfolio template">
      {PORTFOLIO_TEMPLATES.map((template) => {
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
              <PortfolioThumbnail
                templateId={template.id}
                design={design}
                content={SAMPLE_PORTFOLIO}
                width={thumbWidth}
                height={Math.round(thumbWidth * 0.66)}
              />
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
