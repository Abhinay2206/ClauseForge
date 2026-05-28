import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/layouts/DashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';
import GlobalLoader from '@/components/GlobalLoader';
import PageLoader from '@/components/PageLoader';
import { useDocumentPolling } from '@/hooks/useDocumentPolling';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const UploadPage = lazy(() => import('@/pages/UploadPage'));
const AnalysisPage = lazy(() => import('@/pages/AnalysisPage'));
const RiskPage = lazy(() => import('@/pages/RiskPage'));
const ComparisonPage = lazy(() => import('@/pages/ComparisonPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ReportPage = lazy(() => import('@/pages/ReportPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminDocumentsPage = lazy(() => import('@/pages/admin/AdminDocumentsPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminSecurityPage = lazy(() => import('@/pages/admin/AdminSecurityPage'));
const AdminSystemPage = lazy(() => import('@/pages/admin/AdminSystemPage'));


/**
 * Protected route wrapper - redirects to / if not authenticated.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Public route wrapper - redirects authenticated users to their default page.
 * Admin roles go to /admin, regular users go to /dashboard.
 */
function RequireGuest({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (isAuthenticated) {
    const adminRoles = ['admin', 'moderator', 'support'];
    const target = user && adminRoles.includes(user.role) ? '/admin' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

/**
 * Admin route wrapper - requires admin/moderator/support role.
 * Redirects to /dashboard if authenticated but not an admin.
 */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const adminRoles = ['admin', 'moderator', 'support'];
  if (!user || !adminRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Automatically updates the browser tab title based on the current route.
 */
function RouteTitleUpdater() {
  const location = useLocation();
  
  useEffect(() => {
    const path = location.pathname;
    let title = 'ClauseForge';
    
    if (path === '/') title = 'ClauseForge | AI Contract Analysis';
    else if (path.startsWith('/login')) title = 'Login | ClauseForge';
    else if (path.startsWith('/signup')) title = 'Sign Up | ClauseForge';
    else if (path.startsWith('/dashboard')) title = 'Dashboard | ClauseForge';
    else if (path.startsWith('/upload')) title = 'Upload Document | ClauseForge';
    else if (path.startsWith('/analysis')) title = 'Analysis | ClauseForge';
    else if (path.startsWith('/risk')) title = 'Risk Assessment | ClauseForge';
    else if (path.startsWith('/compare')) title = 'Compare | ClauseForge';
    else if (path.startsWith('/chat')) title = 'Chat | ClauseForge';
    else if (path.startsWith('/report')) title = 'Report | ClauseForge';
    else if (path.startsWith('/profile')) title = 'Profile | ClauseForge';
    // Admin routes
    else if (path === '/admin') title = 'Admin Dashboard | ClauseForge';
    else if (path.startsWith('/admin/users')) title = 'User Management | Admin';
    else if (path.startsWith('/admin/documents')) title = 'Documents | Admin';
    else if (path.startsWith('/admin/analytics')) title = 'Analytics | Admin';
    else if (path.startsWith('/admin/security')) title = 'Security | Admin';
    else if (path.startsWith('/admin/system')) title = 'System Health | Admin';
    else if (path.startsWith('/admin/')) {
        const sub = path.replace('/admin/', '');
        title = `${sub.charAt(0).toUpperCase() + sub.slice(1)} | Admin`;
    }
    
    document.title = title;
  }, [location]);

  return null;
}

export default function App() {
  useDocumentPolling();

  return (
    <BrowserRouter>
      <RouteTitleUpdater />
      <PageLoader />
      <Suspense fallback={<GlobalLoader message="Loading ClauseForge..." fullScreen={true} />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/signup" element={<RequireGuest><SignupPage /></RequireGuest>} />

          {/* Protected user routes - inside DashboardLayout */}
          <Route
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Suspense fallback={<GlobalLoader message="Loading dashboard..." fullScreen={false} />}><DashboardPage /></Suspense>} />
            <Route path="/upload" element={<Suspense fallback={<GlobalLoader message="Loading uploader..." fullScreen={false} />}><UploadPage /></Suspense>} />
            <Route path="/analysis" element={<Suspense fallback={<GlobalLoader message="Loading AI analysis..." fullScreen={false} />}><AnalysisPage /></Suspense>} />
            <Route path="/risk" element={<Suspense fallback={<GlobalLoader message="Loading risk assessment..." fullScreen={false} />}><RiskPage /></Suspense>} />
            <Route path="/compare" element={<Suspense fallback={<GlobalLoader message="Loading comparison tool..." fullScreen={false} />}><ComparisonPage /></Suspense>} />
            <Route path="/chat" element={<Suspense fallback={<GlobalLoader message="Loading AI assistant..." fullScreen={false} />}><ChatPage /></Suspense>} />
            <Route path="/report" element={<Suspense fallback={<GlobalLoader message="Loading reports..." fullScreen={false} />}><ReportPage /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<GlobalLoader message="Loading profile..." fullScreen={false} />}><ProfilePage /></Suspense>} />
          </Route>

          {/* Admin routes - inside AdminLayout, role-protected */}
          <Route
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route path="/admin" element={<Suspense fallback={<GlobalLoader message="Loading admin dashboard..." fullScreen={false} />}><AdminDashboardPage /></Suspense>} />
            <Route path="/admin/users" element={<Suspense fallback={<GlobalLoader message="Loading user management..." fullScreen={false} />}><AdminUsersPage /></Suspense>} />
            <Route path="/admin/documents" element={<Suspense fallback={<GlobalLoader message="Loading documents..." fullScreen={false} />}><AdminDocumentsPage /></Suspense>} />
            <Route path="/admin/analytics" element={<Suspense fallback={<GlobalLoader message="Loading analytics..." fullScreen={false} />}><AdminAnalyticsPage /></Suspense>} />
            <Route path="/admin/security" element={<Suspense fallback={<GlobalLoader message="Loading security center..." fullScreen={false} />}><AdminSecurityPage /></Suspense>} />
            <Route path="/admin/system" element={<Suspense fallback={<GlobalLoader message="Loading system health..." fullScreen={false} />}><AdminSystemPage /></Suspense>} />
            
            {/* Workspace tools rendered inside Admin Layout for admins */}
            <Route path="/admin/workspace" element={<Suspense fallback={<GlobalLoader message="Loading documents..." fullScreen={false} />}><DashboardPage /></Suspense>} />
            <Route path="/admin/upload" element={<Suspense fallback={<GlobalLoader message="Loading uploader..." fullScreen={false} />}><UploadPage /></Suspense>} />
            <Route path="/admin/analysis" element={<Suspense fallback={<GlobalLoader message="Loading AI analysis..." fullScreen={false} />}><AnalysisPage /></Suspense>} />
            <Route path="/admin/risk" element={<Suspense fallback={<GlobalLoader message="Loading risk assessment..." fullScreen={false} />}><RiskPage /></Suspense>} />
            <Route path="/admin/compare" element={<Suspense fallback={<GlobalLoader message="Loading comparison tool..." fullScreen={false} />}><ComparisonPage /></Suspense>} />
            <Route path="/admin/chat" element={<Suspense fallback={<GlobalLoader message="Loading AI assistant..." fullScreen={false} />}><ChatPage /></Suspense>} />
            <Route path="/admin/report" element={<Suspense fallback={<GlobalLoader message="Loading reports..." fullScreen={false} />}><ReportPage /></Suspense>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Suspense fallback={<GlobalLoader message="Loading..." fullScreen={true} />}><NotFoundPage /></Suspense>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
