import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import Button from '../../common/Button.jsx';
import FieldRenderer from './FieldRenderer.jsx';
import { SECTION_CONFIG } from './sectionConfig.js';
import { createEmptyItem } from '../../../utils/resume';
import '../../profile/ProfileForms.css';

/**
 * Generic editor for a list section (experience, education, projects…).
 *  - add / remove / reorder items
 *  - each item collapses to a one-line summary (compact sections like
 *    skills and languages show their fields inline instead)
 * Calls onChange(newItems) with a new array - never mutates.
 *
 * By default it uses the resume section definitions. Other editors (the
 * portfolio builder) pass their own `config` and `createItem`.
 */
export default function ListEditor({ sectionKey, items, onChange, config: configProp, createItem }) {
  const config = configProp || SECTION_CONFIG[sectionKey];
  const makeItem = createItem || (() => createEmptyItem(sectionKey));
  const [openId, setOpenId] = useState(null);

  function updateItem(index, name, value) {
    onChange(items.map((item, i) => (i === index ? { ...item, [name]: value } : item)));
  }

  function moveItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    const item = makeItem();
    onChange([...items, item]);
    setOpenId(item.id);
  }

  const reorderButtons = (index) => (
    <>
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        icon={ArrowUp}
        onClick={() => moveItem(index, -1)}
        disabled={index === 0}
        aria-label="Move up"
      />
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        icon={ArrowDown}
        onClick={() => moveItem(index, 1)}
        disabled={index === items.length - 1}
        aria-label="Move down"
      />
      <Button size="sm" variant="ghost" iconOnly icon={Trash2} onClick={() => removeItem(index)} aria-label="Remove" />
    </>
  );

  return (
    <div className="list-editor">
      {items.length === 0 && <p className="list-editor__empty">Nothing here yet.</p>}

      {config.compact ? (
        <ul className="list-editor__compact">
          {items.map((item, index) => (
            <li key={item.id} className="list-editor__row">
              {config.fields.map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  item={item}
                  idPrefix={item.id}
                  onChange={(name, value) => updateItem(index, name, value)}
                />
              ))}
              <div className="list-editor__row-actions">{reorderButtons(index)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="list-editor__items">
          {items.map((item, index) => {
            const isOpen = openId === item.id;
            const subtitle = config.itemSubtitle?.(item);
            return (
              <li key={item.id} className={`list-item ${isOpen ? 'is-open' : ''}`}>
                <div className="list-item__header">
                  <button
                    type="button"
                    className="list-item__toggle"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown size={16} className="list-item__chevron" aria-hidden="true" />
                    <span className="list-item__titles">
                      <span className="list-item__title">{config.itemTitle(item)}</span>
                      {subtitle && <span className="list-item__subtitle">{subtitle}</span>}
                    </span>
                  </button>
                  <div className="list-item__actions">{reorderButtons(index)}</div>
                </div>

                {isOpen && (
                  <div className="list-item__body form-grid">
                    {config.fields.map((field) => (
                      <FieldRenderer
                        key={field.name}
                        field={field}
                        item={item}
                        idPrefix={item.id}
                        onChange={(name, value) => updateItem(index, name, value)}
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Button size="sm" variant="secondary" icon={Plus} onClick={addItem} className="list-editor__add">
        {config.addLabel}
      </Button>
    </div>
  );
}
