import { Suspense, lazy } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/hooks/useToast';
import { AdminSessionProvider } from '@/hooks/useAdminSession';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';
import { LoadingState } from '@/components/ui/States';
import { loadedBiodata } from '@/utils/biodata';
import PublicBiodataPage, { InvalidBiodataPage } from '@/pages/PublicBiodataPage';

/* The dashboard is a separate bundle: visitors to the public biodata never
   download the editor, the forms or the GitHub client. */
const AdminGate = lazy(() => import('@/components/admin/AdminGate'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const PersonalPage = lazy(() => import('@/pages/admin/PersonalPage'));
const FamilyPage = lazy(() => import('@/pages/admin/FamilyPage'));
const MaternalPage = lazy(() => import('@/pages/admin/MaternalPage'));
const EducationPage = lazy(() => import('@/pages/admin/EducationPage'));
const CareerPage = lazy(() => import('@/pages/admin/CareerPage'));
const HobbiesPage = lazy(() => import('@/pages/admin/HobbiesPage'));
const ContactPage = lazy(() => import('@/pages/admin/ContactPage'));
const PhotoPage = lazy(() => import('@/pages/admin/PhotoPage'));
const AppearancePage = lazy(() => import('@/pages/admin/AppearancePage'));
const PreviewPage = lazy(() => import('@/pages/admin/PreviewPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const { data: biodata, issues } = loadedBiodata;

/** Theme defaults come from the JSON; falls back if the file is unreadable. */
const theme = biodata?.theme ?? { mode: 'light' as const, accent: 'champagne' as const, animations: true };

const router = createBrowserRouter([
  {
    path: '/',
    element: biodata ? <PublicBiodataPage biodata={biodata} /> : <InvalidBiodataPage issues={issues} />,
  },
  {
    path: '/admin',
    // The session provider lives here, not at the root, so the public page
    // never issues an /api/admin/session request.
    element: (
      <AdminSessionProvider>
        <AdminGate />
      </AdminSessionProvider>
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
      { path: 'appearance', element: <AppearancePage /> },
      { path: 'preview', element: <PreviewPage /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultMode={theme.mode} accent={theme.accent} animations={theme.animations}>
        <ToastProvider>
          <Suspense fallback={<LoadingState message="Loading…" />}>
            <RouterProvider router={router} />
          </Suspense>
          <Toaster />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
