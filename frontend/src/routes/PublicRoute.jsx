import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import FullPageLoader from '../components/common/FullPageLoader.jsx';

/**
 * For pages like /login and /register: only logged-OUT users may see them.
 *
 * As soon as a user logs in or registers, isAuthenticated becomes true and
 * this component redirects them - either back to the protected page they
 * originally tried to open (saved by ProtectedRoute), or to /dashboard.
 */
export default function PublicRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader label="Loading…" />;

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
