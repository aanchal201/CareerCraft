import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import '../components/common/Toast.css';

export const ToastContext = createContext(null);

const DURATION_MS = 3500;

/**
 * Small, app-wide notifications ("Education added", "Could not save...").
 * Use via the useToast() hook: const toast = useToast(); toast.success('Saved');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'success') => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, message, type }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2;
          return (
            <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
              <Icon size={18} className="toast__icon" aria-hidden="true" />
              <span className="toast__message">{toast.message}</span>
              <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
