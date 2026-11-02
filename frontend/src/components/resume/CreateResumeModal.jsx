import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormInput from '../common/FormInput.jsx';
import Checkbox from '../common/Checkbox.jsx';
import Alert from '../common/Alert.jsx';
import TemplatePicker from './TemplatePicker.jsx';
import resumeService from '../../api/resumeService';
import { getErrorMessage, getFieldErrors } from '../../api/axios';

const INITIAL = { title: '', templateId: 'classic', prefillFromProfile: true };

/** "New resume" dialog: name, template, and whether to copy the profile in. */
export default function CreateResumeModal({ open, onClose }) {
  const navigate = useNavigate();
  const formId = useId();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // start fresh each time the dialog opens
  useEffect(() => {
    if (open) {
      setForm(INITIAL);
      setErrors({});
      setFormError('');
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setErrors({ title: 'Give your resume a name' });
      return;
    }
    if (title.length > 120) {
      setErrors({ title: 'Title must be at most 120 characters' });
      return;
    }

    setCreating(true);
    setFormError('');
    try {
      const resume = await resumeService.create({ ...form, title });
      navigate(`/resumes/${resume.id}`);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not create the resume.'));
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create a new resume"
      description="You can change the template and every detail later."
      onClose={creating ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={creating}>
            Create resume
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {formError && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        <FormInput
          label="Resume name"
          name="title"
          placeholder="e.g. Frontend Developer – Product companies"
          hint="Only you see this name. Tip: name it after the role you're targeting."
          value={form.title}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, title: event.target.value }));
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          error={errors.title}
          maxLength={120}
        />

        <div>
          <p style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Template</p>
          <TemplatePicker
            value={form.templateId}
            onChange={(templateId) => setForm((prev) => ({ ...prev, templateId }))}
          />
          {errors.templateId && (
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>
              {errors.templateId}
            </p>
          )}
        </div>

        <Checkbox
          name="prefillFromProfile"
          label="Fill it in from my profile (education, experience, skills…)"
          checked={form.prefillFromProfile}
          onChange={(event) => setForm((prev) => ({ ...prev, prefillFromProfile: event.target.checked }))}
        />
      </form>
    </Modal>
  );
}
