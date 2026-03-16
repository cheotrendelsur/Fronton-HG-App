import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { signIn, signUp, session, isOnboardingComplete } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  // Si ya hay sesión activa, redirigir
  if (session) {
    navigate(isOnboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'register') {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      // La redirección la maneja el listener de AuthContext + ProtectedRoute
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 rounded-2xl mb-4 shadow-lg shadow-amber-400/20">
            <span className="text-3xl">🏆</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            RacketTourneys
          </h1>
          <p className="text-stone-400 mt-1 text-sm">
            Gestión de torneos de deportes de raqueta
          </p>
        </div>

        {/* Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-stone-800 rounded-xl p-1 mb-8">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
                className="w-full bg-stone-800 border border-stone-700 text-white placeholder-stone-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-stone-800 border border-stone-700 text-white placeholder-stone-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold py-3 rounded-xl transition-colors duration-200 text-sm tracking-wide shadow-lg shadow-amber-400/20"
            >
              {busy
                ? 'Procesando...'
                : mode === 'login' ? 'Entrar' : 'Crear cuenta'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}