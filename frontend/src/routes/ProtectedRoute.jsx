import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import FullPageLoader from '../components/common/FullPageLoader.jsx';

/**
 * Renders child routes only for authenticated users.
 * Otherwise redirects to /login and remembers where the user wanted to go.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
