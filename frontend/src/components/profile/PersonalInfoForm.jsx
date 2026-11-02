import { useEffect, useMemo, useState } from 'react';
import { Code, Globe, Link2, Mail, MapPin, Phone, User } from 'lucide-react';
import FormInput from '../common/FormInput.jsx';
import Button from '../common/Button.jsx';
import Alert from '../common/Alert.jsx';
import profileService from '../../api/profileService';
import { getErrorMessage, getFieldErrors } from '../../api/axios';
import useProfile from '../../hooks/useProfile';
import useToast from '../../hooks/useToast';
import { validatePersonalInfo } from '../../utils/validators';
import './ProfileForms.css';

const FIELDS = ['fullName', 'headline', 'phone', 'location', 'about', 'linkedinUrl', 'githubUrl', 'websiteUrl'];

/** Converts the API's personal info into form state (nulls -> empty strings). */
function toForm(personal) {
  return Object.fromEntries(FIELDS.map((field) => [field, personal[field] ?? '']));
}

export default function PersonalInfoForm({ personal }) {
  const { save } = useProfile();
  const toast = useToast();
  // Keyed on the field VALUES, so unrelated profile updates (e.g. a new photo)
  // don't wipe edits the user hasn't saved yet.
  const initialKey = JSON.stringify(toForm(personal));
  const initial = useMemo(() => JSON.parse(initialKey), [initialKey]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // when the saved profile changes (e.g. after saving), reset the form to it
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const isDirty = FIELDS.some((field) => form[field] !== initial[field]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleDiscard() {
    setForm(initial);
    setErrors({});
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validatePersonalInfo(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = Object.fromEntries(FIELDS.map((field) => [field, form[field].trim()]));
      await save(() => profileService.updatePersonal(payload));
      toast.success('Personal info saved');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not save your changes.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Alert type="error" onClose={() => setFormError('')}>
            {formError}
          </Alert>
        </div>
      )}

      <div className="form-grid">
        <FormInput
          label="Full name"
          name="fullName"
          icon={User}
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          autoComplete="name"
        />
        <FormInput
          label="Email"
          name="email"
          icon={Mail}
          value={personal.email}
          readOnly
          hint="Email changes aren't supported yet."
        />

        <FormInput
          className="form-grid__full"
          label="Professional headline"
          name="headline"
          placeholder="e.g. Final-year CS student · Aspiring full-stack developer"
          value={form.headline}
          onChange={handleChange}
          error={errors.headline}
          maxLength={120}
          optional
        />

        <FormInput
          label="Phone"
          name="phone"
          type="tel"
          icon={Phone}
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          autoComplete="tel"
          optional
        />
        <FormInput
          label="Location"
          name="location"
          icon={MapPin}
          placeholder="Mumbai, India"
          value={form.location}
          onChange={handleChange}
          error={errors.location}
          optional
        />

        <FormInput
          className="form-grid__full"
          as="textarea"
          rows={5}
          label="About you"
          name="about"
          placeholder="A few sentences about who you are, what you do, and what you're looking for."
          value={form.about}
          onChange={handleChange}
          error={errors.about}
          maxLength={2000}
          showCount
          optional
        />

        <FormInput
          label="LinkedIn"
          name="linkedinUrl"
          type="url"
          icon={Link2}
          placeholder="https://linkedin.com/in/your-name"
          value={form.linkedinUrl}
          onChange={handleChange}
          error={errors.linkedinUrl}
          optional
        />
        <FormInput
          label="GitHub"
          name="githubUrl"
          type="url"
          icon={Code}
          placeholder="https://github.com/your-name"
          value={form.githubUrl}
          onChange={handleChange}
          error={errors.githubUrl}
          optional
        />
        <FormInput
          className="form-grid__full"
          label="Website"
          name="websiteUrl"
          type="url"
          icon={Globe}
          placeholder="https://your-site.com"
          value={form.websiteUrl}
          onChange={handleChange}
          error={errors.websiteUrl}
          optional
        />
      </div>

      <div className="form-actions">
        <span className="form-actions__status">{isDirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <Button variant="secondary" onClick={handleDiscard} disabled={!isDirty || saving}>
          Discard
        </Button>
        <Button type="submit" loading={saving} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
