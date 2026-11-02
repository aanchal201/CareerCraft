import { Check, LayoutGrid, List, Moon, Sun, AlignLeft, AlignCenter } from 'lucide-react';
import PortfolioTemplatePicker from '../PortfolioTemplatePicker.jsx';
import { PORTFOLIO_COLORS } from '../templates/portfolioRegistry.js';
import { FONT_PAIRINGS, ensureFontPairing } from '../../../utils/fonts';
import { contrastText, isValidHex } from '../../../utils/color';
import './DesignPanel.css';

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="design-panel__field">
      <p className="design-panel__label">{label}</p>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={value === optionValue}
            className={value === optionValue ? 'is-active' : ''}
            onClick={() => onChange(optionValue)}
          >
            {Icon && <Icon size={16} aria-hidden="true" />} {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Template, colors, mode, fonts and layout options. */
export default function DesignPanel({ templateId, design, onTemplateChange, onDesignChange }) {
  const set = (name, value) => onDesignChange({ ...design, [name]: value });
  const isPreset = PORTFOLIO_COLORS.some((c) => c.value === design.primaryColor);

  return (
    <div className="design-panel">
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Template</h2>
        </div>
        <div className="card__body">
          <PortfolioTemplatePicker value={templateId} onChange={onTemplateChange} design={design} thumbWidth={130} />
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Colors</h2>
        </div>
        <div className="card__body design-panel__stack">
          <div className="design-panel__field">
            <p className="design-panel__label">Accent color</p>
            <div className="swatches" role="radiogroup" aria-label="Accent color">
              {PORTFOLIO_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  role="radio"
                  aria-checked={design.primaryColor === color.value}
                  aria-label={color.name}
                  title={color.name}
                  style={{ background: color.value, color: contrastText(color.value) }}
                  onClick={() => set('primaryColor', color.value)}
                >
                  {design.primaryColor === color.value && <Check size={14} strokeWidth={3} />}
                </button>
              ))}
              <label className={`swatches__custom ${!isPreset ? 'is-active' : ''}`} title="Custom color">
                <input
                  type="color"
                  value={isValidHex(design.primaryColor) ? design.primaryColor : '#0f766e'}
                  onChange={(event) => set('primaryColor', event.target.value.toLowerCase())}
                  aria-label="Custom accent color"
                />
                <span>Custom</span>
              </label>
            </div>
          </div>

          <Segmented
            label="Mode"
            value={design.colorMode}
            onChange={(value) => set('colorMode', value)}
            options={[
              { value: 'LIGHT', label: 'Light', icon: Sun },
              { value: 'DARK', label: 'Dark', icon: Moon },
            ]}
          />
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Fonts</h2>
        </div>
        <div className="card__body">
          <div className="font-options" role="radiogroup" aria-label="Font pairing">
            {Object.entries(FONT_PAIRINGS).map(([key, pairing]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={design.fontPairing === key}
                className={design.fontPairing === key ? 'is-active' : ''}
                onMouseEnter={() => ensureFontPairing(key)}
                onFocus={() => ensureFontPairing(key)}
                onClick={() => set('fontPairing', key)}
              >
                <span className="font-options__sample" style={{ fontFamily: pairing.heading }}>
                  Aa
                </span>
                <span className="font-options__name">{pairing.name}</span>
                <span className="font-options__desc">{pairing.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Layout</h2>
        </div>
        <div className="card__body design-panel__stack">
          <Segmented
            label="Hero alignment"
            value={design.heroAlign}
            onChange={(value) => set('heroAlign', value)}
            options={[
              { value: 'LEFT', label: 'Left', icon: AlignLeft },
              { value: 'CENTER', label: 'Center', icon: AlignCenter },
            ]}
          />
          <Segmented
            label="Projects"
            value={design.projectLayout}
            onChange={(value) => set('projectLayout', value)}
            options={[
              { value: 'GRID', label: 'Grid', icon: LayoutGrid },
              { value: 'LIST', label: 'List', icon: List },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
