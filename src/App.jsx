import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute       from './components/ProtectedRoute'
import BrandLoader          from './components/BrandLoader'
import AuthPage             from './pages/AuthPage'
import OnboardingPage       from './pages/OnboardingPage'
import DashboardPage        from './pages/DashboardPage'
import CreateTournamentPage from './pages/CreateTournamentPage'
import OrganizerHubPage     from './pages/OrganizerHubPage'
import ResultsInputPage     from './pages/ResultsInputPage'
import AdminPanelPage       from './pages/AdminPanelPage'
import TournamentsPage          from './pages/TournamentsPage'
import ActiveTournamentPage     from './pages/ActiveTournamentPage'
import TournamentManagePage     from './pages/TournamentManagePage'
import Layout               from './components/Layout'
import SplashPage, { SPLASH_KEY } from './pages/SplashPage'

function AppLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5"
         style={{ background: '#1E2024' }}>
      <BrandLoader size={48} />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium tracking-wide" style={{ color: '#E5E7EB' }}>Frontón HGV</p>
        <p className="text-xs tracking-widest uppercase" style={{ color: '#6B7280', animation: 'pulse 2s ease-in-out infinite' }}>Verificando sesión</p>
      </div>
    </div>
  )
}

const PlaceholderPage = ({ title }) => (
  <Layout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-2">
      <p className="text-ink-secondary text-sm font-medium">{title}</p>
      <p className="text-ink-muted text-xs opacity-50">Disponible en próximas fases</p>
    </div>
  </Layout>
)

function OrganizerRoute({ children }) {
  const { session, profile, isOnboardingComplete } = useAuth()
  if (!session) return <Navigate to="/auth" replace />
  if (!isOnboardingComplete) return <Navigate to="/onboarding" replace />
  if (profile?.role !== 'organizer') return <Navigate to="/dashboard" replace />
  return children
}

function AdminRoute({ children }) {
  const { session, profile, isOnboardingComplete } = useAuth()
  if (!session) return <Navigate to="/auth" replace />
  if (!isOnboardingComplete) return <Navigate to="/onboarding" replace />
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { session, isOnboardingComplete } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/onboarding"
        element={
          !session
            ? <Navigate to="/auth" replace />
            : isOnboardingComplete
              ? <Navigate to="/dashboard" replace />
              : <OnboardingPage />
        }
      />

      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      }/>

      <Route path="/tournaments" element={
        <ProtectedRoute><TournamentsPage /></ProtectedRoute>
      }/>

      <Route path="/standings" element={
        <ProtectedRoute><PlaceholderPage title="Clasificación" /></ProtectedRoute>
      }/>

      <Route path="/profile" element={
        <ProtectedRoute><PlaceholderPage title="Perfil" /></ProtectedRoute>
      }/>

      <Route path="/tournament/:id/active" element={
        <OrganizerRoute><ActiveTournamentPage /></OrganizerRoute>
      }/>

      <Route path="/tournament/:id/manage" element={
        <OrganizerRoute><TournamentManagePage /></OrganizerRoute>
      }/>

      <Route path="/tournaments/create" element={
        <OrganizerRoute><CreateTournamentPage /></OrganizerRoute>
      }/>

      <Route path="/organizer/hub" element={
        <OrganizerRoute><OrganizerHubPage /></OrganizerRoute>
      }/>

      <Route path="/results/input" element={
        <OrganizerRoute><ResultsInputPage /></OrganizerRoute>
      }/>

      <Route path="/admin" element={
        <AdminRoute><AdminPanelPage /></AdminRoute>
      }/>

      <Route
        path="/"
        element={
          !session
            ? <Navigate to="/auth" replace />
            : isOnboardingComplete
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/onboarding" replace />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppShell() {
  const { initializing, showPostLoginSplash, setShowPostLoginSplash } = useAuth()
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem(SPLASH_KEY) === '1'
  )

  if (initializing) return <AppLoader />

  return (
    <BrowserRouter>
      {!splashDone && <SplashPage onDone={() => setSplashDone(true)} />}
      {showPostLoginSplash && <SplashPage onDone={() => setShowPostLoginSplash(false)} />}
      <AppRoutes />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
