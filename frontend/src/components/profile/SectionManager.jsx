import { useCallback, useId, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import EmptyState from '../common/EmptyState.jsx';
import Alert from '../common/Alert.jsx';
import EntryCard from './EntryCard.jsx';
import { getErrorMessage, getFieldErrors } from '../../api/axios';
import useToast from '../../hooks/useToast';
import './SectionManager.css';
import './ProfileForms.css';

/**
 * Reusable "list + add/edit modal + delete confirmation" for profile sections.
 * Education, Experience and Certifications all use it with their own config,
 * so the add/edit/delete behaviour is written once.
 *
 * Config props:
 *  itemName      e.g. "education entry" (used in titles and toasts)
 *  icon          Lucide icon for the cards
 *  toForm(item)  item (or null for "new") -> form state
 *  toPayload(f)  form state -> API request body
 *  validate(f)   form state -> { field: message }
 *  describe(i)   item -> EntryCard content
 *  renderFields({ form, errors, onChange }) -> the form fields
 *  onCreate(payload), onUpdate(id, payload), onDelete(id) -> promises
 */
export default function SectionManager({
  title,
  description,
  items,
  itemName,
  icon,
  emptyTitle,
  emptyText,
  toForm,
  toPayload,
  validate,
  describe,
  renderFields,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const toast = useToast();
  const formId = useId();

  const [editing, setEditing] = useState(null); // null = closed, { item } = open (item null => new)
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function openEditor(item) {
    setEditing({ item });
    setForm(toForm(item));
    setErrors({});
    setFormError('');
  }

  const closeEditor = useCallback(() => {
    if (!submitting) setEditing(null);
  }, [submitting]);

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = toPayload(form);
      if (editing.item) {
        await onUpdate(editing.item.id, payload);
        toast.success(`${capitalize(itemName)} updated`);
      } else {
        await onCreate(payload);
        toast.success(`${capitalize(itemName)} added`);
      }
      setEditing(null);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not save. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      toast.success(`${capitalize(itemName)} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete. Please try again.'));
    } finally {
      setDeleting(false);
    }
  }

  const isEditing = Boolean(editing?.item);

  return (
    <section className="card section-manager">
      <div className="card__header">
        <div>
          <h2 className="card__title">{title}</h2>
          {description && <p className="card__subtitle">{description}</p>}
        </div>
        {items.length > 0 && (
          <Button size="sm" icon={Plus} onClick={() => openEditor(null)}>
            Add
          </Button>
        )}
      </div>

      <div className="card__body">
        {items.length === 0 ? (
          <EmptyState
            icon={icon}
            title={emptyTitle}
            text={emptyText}
            action={
              <Button icon={Plus} onClick={() => openEditor(null)}>
                Add {itemName}
              </Button>
            }
          />
        ) : (
          <div className="section-manager__list">
            {items.map((item) => (
              <EntryCard
                key={item.id}
                icon={icon}
                entry={describe(item)}
                onEdit={() => openEditor(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        title={isEditing ? `Edit ${itemName}` : `Add ${itemName}`}
        onClose={closeEditor}
        footer={
          <>
            <Button variant="secondary" onClick={closeEditor} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={submitting}>
              {isEditing ? 'Save changes' : 'Add'}
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} noValidate className="form-stack">
          {formError && (
            <Alert type="error" onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}
          {editing && renderFields({ form, errors, onChange: handleChange })}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete this ${itemName}?`}
        message={deleteTarget ? `“${describe(deleteTarget).title}” will be permanently removed from your profile.` : ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
