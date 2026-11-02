import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import Avatar from '../common/Avatar.jsx';
import Logo from '../common/Logo.jsx';
import useAuth from '../../hooks/useAuth';
import './Topbar.css';

/** Top bar: menu button (mobile), and the user menu with logout. */
export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // close the dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu-button" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="topbar__mobile-logo">
        <Logo to="/dashboard" />
      </div>

      <div className="topbar__user" ref={menuRef}>
        <button
          type="button"
          className="topbar__user-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Avatar name={user?.fullName} avatarPath={user?.avatarPath} size={34} />
          <span className="topbar__user-text">
            <span className="topbar__user-name">{user?.fullName}</span>
            <span className="topbar__user-email">{user?.email}</span>
          </span>
          <ChevronDown size={16} className="topbar__chevron" aria-hidden="true" />
        </button>

        {menuOpen && (
          <div className="topbar__dropdown" role="menu">
            <Link to="/profile" className="topbar__dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
              <UserRound size={17} /> My profile
            </Link>
            <button type="button" className="topbar__dropdown-item" role="menuitem" onClick={handleLogout}>
              <LogOut size={17} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
