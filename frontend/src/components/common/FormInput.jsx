import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './FormInput.css';

/**
 * Labeled form control with optional leading icon, inline error, hint text,
 * and a show/hide toggle for password fields.
 *
 *  as="input"    (default) - any input type, including password/month/email
 *  as="textarea" - multi-line text; pass rows. With maxLength + showCount
 *                  a character counter is shown.
 *  as="select"   - pass options=[{ value, label }]
 */
export default function FormInput({
  label,
  as = 'input',
  type = 'text',
  icon: Icon,
  error,
  hint,
  id,
  options = [],
  showCount = false,
  optional = false,
  className = '',
  ...inputProps
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = as === 'input' && type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const controlClass = [
    'field__input',
    as === 'textarea' ? 'field__input--textarea' : '',
    as === 'select' ? 'field__input--select' : '',
    Icon ? 'field__input--with-icon' : '',
    isPassword ? 'field__input--with-toggle' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const sharedProps = {
    id: inputId,
    className: controlClass,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    ...inputProps,
  };

  let control;
  if (as === 'textarea') {
    control = <textarea rows={4} {...sharedProps} />;
  } else if (as === 'select') {
    control = (
      <select {...sharedProps}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = <input type={inputType} {...sharedProps} />;
  }

  const currentLength = typeof inputProps.value === 'string' ? inputProps.value.length : 0;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="field__label">
          {label}
          {optional && <span className="field__optional">Optional</span>}
        </label>
      )}

      <div className="field__control">
        {Icon && <Icon className="field__icon" size={18} aria-hidden="true" />}
        {control}
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      <div className="field__footer">
        {error ? (
          <p id={errorId} className="field__error" role="alert">
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="field__hint">
              {hint}
            </p>
          )
        )}
        {showCount && inputProps.maxLength && (
          <span className="field__count">
            {currentLength}/{inputProps.maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
