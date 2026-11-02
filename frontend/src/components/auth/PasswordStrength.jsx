import { getPasswordStrength } from '../../utils/validators';
import './PasswordStrength.css';

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

/** 4-segment strength meter shown under the password field. */
export default function PasswordStrength({ password }) {
  if (!password) return null;
  const score = getPasswordStrength(password);

  return (
    <div className={`strength strength--${score}`} aria-live="polite">
      <div className="strength__bars">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={step <= score ? 'is-active' : ''} />
        ))}
      </div>
      <span className="strength__label">{LABELS[score]}</span>
    </div>
  );
}
