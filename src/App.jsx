import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage       from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage  from './pages/DashboardPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Requiere sesión activa (onboarding pendiente) */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Requiere sesión + onboarding completo */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Raíz → redirigir según estado */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}