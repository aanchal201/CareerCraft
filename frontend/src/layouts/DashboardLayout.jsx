import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { ProfileProvider } from '../context/ProfileContext.jsx';
import LoadingBlock from '../components/common/LoadingBlock.jsx';
import './DashboardLayout.css';

/** Pages that need the full width (e.g. the resume editor with its live preview). */
const WIDE_PAGES = [/^\/resumes\/[^/]+$/, /^\/portfolios\/[^/]+$/];

/**
 * App shell for every logged-in page: sidebar + top bar + page content.
 * The ProfileProvider here loads the profile once for all child pages.
 * On small screens the sidebar becomes a slide-in drawer.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isWide = WIDE_PAGES.some((pattern) => pattern.test(location.pathname));

  // close the mobile drawer after navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  return (
    <ProfileProvider>
      <div className={`app-shell ${sidebarOpen ? 'app-shell--sidebar-open' : ''}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />

        {sidebarOpen && <div className="app-shell__overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

        <div className="app-shell__main">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className={`app-shell__content ${isWide ? 'app-shell__content--wide' : ''}`}>
            {/* pages are loaded on demand - keep the sidebar visible meanwhile */}
            <Suspense fallback={<LoadingBlock label="Loading…" />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}
