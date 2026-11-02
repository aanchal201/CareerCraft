import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormInput from '../common/FormInput.jsx';
import Checkbox from '../common/Checkbox.jsx';
import Alert from '../common/Alert.jsx';
import PortfolioTemplatePicker from './PortfolioTemplatePicker.jsx';
import portfolioService from '../../api/portfolioService';
import { getErrorMessage, getFieldErrors } from '../../api/axios';

const INITIAL = { name: '', templateId: 'minimal', prefillFromProfile: true };

/** "New portfolio" dialog: name, template, and whether to copy the profile in. */
export default function CreatePortfolioModal({ open, onClose }) {
  const navigate = useNavigate();
  const formId = useId();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(INITIAL);
      setErrors({});
      setFormError('');
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setErrors({ name: 'Give your portfolio a name' });
      return;
    }

    setCreating(true);
    setFormError('');
    try {
      const portfolio = await portfolioService.create({ ...form, name });
      navigate(`/portfolios/${portfolio.id}`);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not create the portfolio.'));
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create a portfolio"
      description="Pick a starting template — you can switch templates, colors and fonts anytime."
      onClose={creating ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={creating}>
            Create portfolio
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {formError && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        <FormInput
          label="Portfolio name"
          name="name"
          placeholder="e.g. Developer portfolio"
          hint="Only you see this name."
          value={form.name}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, name: event.target.value }));
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          error={errors.name}
          maxLength={120}
        />

        <div>
          <p style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Template</p>
          <PortfolioTemplatePicker value={form.templateId} onChange={(templateId) => setForm((prev) => ({ ...prev, templateId }))} />
        </div>

        <Checkbox
          name="prefillFromProfile"
          label="Fill it in from my profile (about, skills, experience, education…)"
          checked={form.prefillFromProfile}
          onChange={(event) => setForm((prev) => ({ ...prev, prefillFromProfile: event.target.checked }))}
        />
      </form>
    </Modal>
  );
}
