import { Check } from 'lucide-react';
import './Checkbox.css';

/** Styled checkbox with a label. Behaves like a normal <input type="checkbox">. */
export default function Checkbox({ label, className = '', ...inputProps }) {
  return (
    <label className={`checkbox ${className}`}>
      <input type="checkbox" className="checkbox__input" {...inputProps} />
      <span className="checkbox__box" aria-hidden="true">
        <Check size={14} strokeWidth={3} />
      </span>
      <span className="checkbox__label">{label}</span>
    </label>
  );
}
