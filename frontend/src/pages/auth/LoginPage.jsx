import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import FormInput from '../../components/common/FormInput.jsx';
import Button from '../../components/common/Button.jsx';
import Alert from '../../components/common/Alert.jsx';
import useAuth from '../../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../../api/axios';
import { validateLoginForm } from '../../utils/validators';
import './AuthForm.css';

const INITIAL_FORM = { email: '', password: '' };

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // clear the field's error as soon as the user edits it
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (formError) setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      // On success, PublicRoute sees isAuthenticated=true and redirects.
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error, 'Login failed. Please try again.'));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue building your career toolkit."
      footer={
        <>
          New to CareerCraft? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Alert type="error" onClose={() => setFormError('')}>
          {formError}
        </Alert>

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
          autoFocus
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          iconRight={ArrowRight}
          className="auth-form__submit"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
