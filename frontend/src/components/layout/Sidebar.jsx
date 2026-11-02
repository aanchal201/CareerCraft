import { Link, NavLink } from 'react-router-dom';
import { Briefcase, FileText, Globe, LayoutDashboard, ScanSearch, UserRound, X } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import useProfile from '../../hooks/useProfile';
import './Sidebar.css';

const MAIN_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/analyzer', label: 'Resume Analyzer', icon: ScanSearch },
  { to: '/portfolios', label: 'Portfolio', icon: Globe },
];

// Shown disabled until their phase is built
const UPCOMING_NAV = [
  { label: 'Job Tracker', icon: Briefcase },
];

/** Left navigation. Fixed on desktop, slide-in drawer on tablet/mobile. */
export default function Sidebar({ onClose }) {
  const { profile } = useProfile();
  const completion = profile?.completion.percentage ?? 0;

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar__header">
        <Logo to="/dashboard" />
        <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {MAIN_NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <p className="sidebar__section-label">Coming soon</p>
        <ul className="sidebar__list">
          {UPCOMING_NAV.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span className="sidebar__link is-disabled" aria-disabled="true">
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
                <span className="sidebar__soon">Soon</span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {profile && (
        <Link to="/profile" className="sidebar__completion">
          <div className="sidebar__completion-head">
            <span>Profile strength</span>
            <strong>{completion}%</strong>
          </div>
          <div className="sidebar__completion-bar">
            <span style={{ width: `${completion}%` }} />
          </div>
          <span className="sidebar__completion-hint">
            {completion === 100 ? 'Your profile is complete' : 'Complete your profile'}
          </span>
        </Link>
      )}
    </aside>
  );
}
