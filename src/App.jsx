import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute       from './components/ProtectedRoute'
import AuthPage             from './pages/AuthPage'
import OnboardingPage       from './pages/OnboardingPage'
import DashboardPage        from './pages/DashboardPage'
import CreateTournamentPage from './pages/CreateTournamentPage'
import OrganizerHubPage     from './pages/OrganizerHubPage'
import ResultsInputPage     from './pages/ResultsInputPage'
import AdminPanelPage       from './pages/AdminPanelPage'
import TournamentsPage      from './pages/TournamentsPage'
import Layout               from './components/Layout'
import SplashPage, { SPLASH_KEY } from './pages/SplashPage'

function AppLoader() {
  return (
    <div className="min-h-screen bg-base-950 flex flex-col items-center justify-center gap-5">
      <div className="relative w-14 h-14">
        <svg
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: '1.2s' }}
          viewBox="0 0 56 56"
          fill="none"
        >
          <circle cx="28" cy="28" r="25" stroke="#212424" strokeWidth="2.5"/>
          <path d="M28 3 A25 25 0 0 1 53 28" stroke="#6BB3D9" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <circle cx="12" cy="12" r="9" stroke="#2a2e2e" strokeWidth="1.5"/>
            <path d="M5 12 Q12 5 19 12 Q12 19 5 12Z" fill="#6BB3D9" opacity="0.8"/>
          </svg>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-ink-primary text-sm font-medium tracking-wide">Frontón HGV</p>
        <p className="text-ink-muted text-xs tracking-widest uppercase animate-pulse">Verificando sesión</p>
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
  const { initializing } = useAuth()
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem(SPLASH_KEY) === '1'
  )

  if (initializing) return <AppLoader />

  return (
    <BrowserRouter>
      {!splashDone && <SplashPage onDone={() => setSplashDone(true)} />}
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
