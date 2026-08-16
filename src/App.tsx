import { Suspense, lazy } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/hooks/useToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { LoadingState } from '@/components/ui/States';
import PublicBiodataPage from '@/pages/PublicBiodataPage';

/* The admin dashboard is a separate bundle: visitors to the public biodata
   never download the editor, forms or validation code. */
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const PersonalPage = lazy(() => import('@/pages/admin/PersonalPage'));
const FamilyPage = lazy(() => import('@/pages/admin/FamilyPage'));
const MaternalPage = lazy(() => import('@/pages/admin/MaternalPage'));
const EducationPage = lazy(() => import('@/pages/admin/EducationPage'));
const CareerPage = lazy(() => import('@/pages/admin/CareerPage'));
const HobbiesPage = lazy(() => import('@/pages/admin/HobbiesPage'));
const ContactPage = lazy(() => import('@/pages/admin/ContactPage'));
const PhotoPage = lazy(() => import('@/pages/admin/PhotoPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/**
 * A data router (rather than <BrowserRouter>) is required for `useBlocker`,
 * which is what warns an admin before they navigate away from unsaved edits.
 */
const router = createBrowserRouter([
  // Public — no authentication required
  { path: '/', element: <PublicBiodataPage /> },
  { path: '/login', element: <LoginPage /> },

  // Protected admin dashboard
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'personal', element: <PersonalPage /> },
      { path: 'family', element: <FamilyPage /> },
      { path: 'maternal', element: <MaternalPage /> },
      { path: 'education', element: <EducationPage /> },
      { path: 'career', element: <CareerPage /> },
      { path: 'hobbies', element: <HobbiesPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'photo', element: <PhotoPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            {/* AuthProvider uses no router hooks, so it can wrap the router. */}
            <AuthProvider>
              <Suspense fallback={<LoadingState message="Loading…" />}>
                <RouterProvider router={router} />
              </Suspense>
              <Toaster />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
