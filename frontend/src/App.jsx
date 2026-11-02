import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicRoute from './routes/PublicRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import FullPageLoader from './components/common/FullPageLoader.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Each page below is downloaded only when it's first opened (code splitting),
// so the login screen and public portfolios load fast. Small, always-needed
// pages (login, register, 404) stay in the main bundle.
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.jsx'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage.jsx'));
const ResumesPage = lazy(() => import('./pages/resumes/ResumesPage.jsx'));
const ResumeEditorPage = lazy(() => import('./pages/resumes/ResumeEditorPage.jsx'));
const ResumePreviewPage = lazy(() => import('./pages/resumes/ResumePreviewPage.jsx'));
const AnalyzerPage = lazy(() => import('./pages/analyzer/AnalyzerPage.jsx'));
const AnalysisResultPage = lazy(() => import('./pages/analyzer/AnalysisResultPage.jsx'));
const PortfoliosPage = lazy(() => import('./pages/portfolios/PortfoliosPage.jsx'));
const PortfolioEditorPage = lazy(() => import('./pages/portfolios/PortfolioEditorPage.jsx'));
const PublicPortfolioPage = lazy(() => import('./pages/public/PublicPortfolioPage.jsx'));

/**
 * Route map.
 *  - PublicRoute:     only for logged-OUT users (logged-in users are sent to /dashboard)
 *  - ProtectedRoute:  only for logged-IN users  (others are sent to /login)
 *  - DashboardLayout: sidebar + top bar shell shared by all app pages
 *  - /p/:slug:        published portfolios - open to everyone, logged in or not
 */
export default function App() {
  return (
    <Suspense fallback={<FullPageLoader label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {/* full-screen page without the sidebar */}
          <Route path="/resumes/:id/preview" element={<ResumePreviewPage />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/resumes" element={<ResumesPage />} />
            <Route path="/resumes/:id" element={<ResumeEditorPage />} />
            <Route path="/analyzer" element={<AnalyzerPage />} />
            <Route path="/analyzer/:id" element={<AnalysisResultPage />} />
            <Route path="/portfolios" element={<PortfoliosPage />} />
            <Route path="/portfolios/:id" element={<PortfolioEditorPage />} />
          </Route>
        </Route>

        {/* public portfolio websites (Phase 7) */}
        <Route path="/p/:slug" element={<PublicPortfolioPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
