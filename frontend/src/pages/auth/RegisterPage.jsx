import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import PasswordStrength from '../../components/auth/PasswordStrength.jsx';
import FormInput from '../../components/common/FormInput.jsx';
import Button from '../../components/common/Button.jsx';
import Alert from '../../components/common/Alert.jsx';
import useAuth from '../../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../../api/axios';
import { validateRegisterForm } from '../../utils/validators';
import './AuthForm.css';

const INITIAL_FORM = { fullName: '', email: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (formError) setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // Registration also logs the user in; PublicRoute redirects to /dashboard.
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error, 'Registration failed. Please try again.'));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building resumes and portfolios in minutes."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Alert type="error" onClose={() => setFormError('')}>
          {formError}
        </Alert>

        <FormInput
          label="Full name"
          name="fullName"
          icon={User}
          placeholder="Asha Verma"
          autoComplete="name"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          autoFocus
        />

        <FormInput
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint="Use 8+ characters with at least one letter and one number."
        />
        <PasswordStrength password={form.password} />

        <FormInput
          label="Confirm password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          iconRight={ArrowRight}
          className="auth-form__submit"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="auth-form__note">Your password is encrypted and never stored in plain text.</p>
      </form>
    </AuthLayout>
  );
}
