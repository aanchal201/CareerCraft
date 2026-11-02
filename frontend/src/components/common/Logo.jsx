import { Link } from 'react-router-dom';
import './Logo.css';

/** CareerCraft brand mark + wordmark. variant="light" for dark backgrounds. */
export default function Logo({ variant = 'dark', to = '/' }) {
  return (
    <Link to={to} className={`logo logo--${variant}`} aria-label="CareerCraft home">
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#0F766E" />
        <path d="M10 9h9l4 4v10a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z" fill="#fff" />
        <path d="M12.5 15h7M12.5 18h7M12.5 21h4" stroke="#0F766E" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="23" cy="9" r="3" fill="#F2B84B" />
      </svg>
      <span className="logo__text">CareerCraft</span>
    </Link>
  );
}
