import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import './Alert.css';

const ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
};

/** Inline banner for form-level errors or success messages. */
export default function Alert({ type = 'error', children, onClose }) {
  if (!children) return null;
  const Icon = ICONS[type] || AlertCircle;

  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} className="alert__icon" aria-hidden="true" />
      <div className="alert__content">{children}</div>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
