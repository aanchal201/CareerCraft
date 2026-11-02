import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, CloudUpload, FileDown, Maximize2, Palette } from 'lucide-react';
import Button from '../../common/Button.jsx';
import Spinner from '../../common/Spinner.jsx';
import { ACCENT_COLORS, TEMPLATES } from '../templates/templateRegistry.js';

const STATUS_LABELS = {
  saved: 'Saved',
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  error: 'Not saved',
};

/** Top bar of the editor: back, title, template, color, save status, preview, PDF download. */
export default function EditorToolbar({
  doc,
  status,
  saveError,
  onBack,
  onSave,
  onDownload,
  onPreview,
  onFieldChange,
}) {
  const [colorsOpen, setColorsOpen] = useState(false);
  const colorRef = useRef(null);

  useEffect(() => {
    if (!colorsOpen) return undefined;
    const close = (event) => {
      if (!colorRef.current?.contains(event.target)) setColorsOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setColorsOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [colorsOpen]);

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar__left">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
          Resumes
        </Button>
        <input
          className="editor-toolbar__title"
          value={doc.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          maxLength={120}
          aria-label="Resume name"
          placeholder="Untitled resume"
        />
      </div>

      <div className="editor-toolbar__right">
        <div className="editor-toolbar__templates" role="radiogroup" aria-label="Template">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={doc.templateId === template.id}
              className={doc.templateId === template.id ? 'is-active' : ''}
              onClick={() => onFieldChange('templateId', template.id)}
            >
              {template.name}
            </button>
          ))}
        </div>

        <div className="editor-toolbar__color" ref={colorRef}>
          <button
            type="button"
            className="editor-toolbar__color-button"
            onClick={() => setColorsOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={colorsOpen}
            aria-label="Accent color"
            title="Accent color"
          >
            <Palette size={16} aria-hidden="true" />
            <span className="editor-toolbar__swatch" style={{ background: doc.accentColor }} />
          </button>
          {colorsOpen && (
            <div className="editor-toolbar__palette" role="radiogroup" aria-label="Accent color">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  role="radio"
                  aria-checked={doc.accentColor === color.value}
                  aria-label={color.name}
                  title={color.name}
                  style={{ background: color.value }}
                  onClick={() => {
                    onFieldChange('accentColor', color.value);
                    setColorsOpen(false);
                  }}
                >
                  {doc.accentColor === color.value && <Check size={14} strokeWidth={3} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className={`editor-toolbar__status is-${status}`} title={status === 'error' ? saveError : undefined}>
          {status === 'saving' && <Spinner size={14} />}
          {status === 'saved' && <Check size={14} />}
          {status === 'error' && <AlertCircle size={14} />}
          {STATUS_LABELS[status]}
        </span>

        <Button
          size="sm"
          variant="secondary"
          icon={CloudUpload}
          onClick={onSave}
          disabled={status === 'saved' || status === 'saving'}
        >
          Save
        </Button>

        <Button
          size="sm"
          variant="ghost"
          iconOnly
          icon={Maximize2}
          onClick={onPreview}
          aria-label="Full-page preview"
          title="Full-page preview"
        />

        <Button size="sm" icon={FileDown} onClick={onDownload}>
          Download PDF
        </Button>
      </div>

      {status === 'error' && saveError && (
        <p className="editor-toolbar__error" role="alert">
          {saveError}
        </p>
      )}
    </div>
  );
}
