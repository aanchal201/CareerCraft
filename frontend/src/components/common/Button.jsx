import Spinner from './Spinner.jsx';
import './Button.css';

/**
 * Reusable button.
 *  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 *  size:    'sm' | 'md' | 'lg'
 *  loading: shows a spinner and disables the button
 *  icon / iconRight: optional Lucide icon components
 *  iconOnly: square button with just the icon (pass aria-label!)
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  iconOnly = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
    loading ? 'btn--loading' : '',
    iconOnly ? 'btn--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading ? <Spinner size={iconSize} /> : Icon && <Icon size={iconSize} aria-hidden="true" />}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight size={iconSize} aria-hidden="true" />}
    </button>
  );
}
