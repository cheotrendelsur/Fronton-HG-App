import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  {
    id: 'organizer',
    emoji: '🎯',
    title: 'Organizador',
    description: 'Creo y gestiono torneos, fijo horarios y administro resultados.',
  },
  {
    id: 'player',
    emoji: '🎾',
    title: 'Jugador',
    description: 'Participo en torneos, consulto mi agenda y mis resultados.',
  },
]

export default function OnboardingPage() {
  const { completeOnboarding, session, isOnboardingComplete } = useAuth()
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState(null)
  const [username, setUsername]         = useState('')
  const [error, setError]               = useState('')
  const [busy, setBusy]                 = useState(false)

  // Si el onboarding ya está completo, redirigir
  if (isOnboardingComplete) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedRole) { setError('Por favor selecciona un rol.'); return }
    if (!username.trim()) { setError('El nombre de usuario es obligatorio.'); return }
    if (username.trim().length < 3) { setError('El nombre de usuario debe tener al menos 3 caracteres.'); return }

    setError('')
    setBusy(true)
    try {
      await completeOnboarding(username.trim().toLowerCase(), selectedRole)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // Detectar username duplicado (unique constraint de Supabase)
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setError('Ese nombre de usuario ya está en uso. Elige otro.')
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-white">¡Bienvenido!</h1>
          <p className="text-stone-400 mt-2">
            Hola, <span className="text-amber-400">{session?.user?.email}</span>. <br />
            Cuéntanos un poco sobre ti para comenzar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Selección de rol */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
              ¿Cuál es tu rol?
            </p>
            <div className="grid grid-cols-2 gap-4">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    selectedRole === role.id
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10'
                      : 'border-stone-700 bg-stone-900 hover:border-stone-600'
                  }`}
                >
                  {selectedRole === role.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-3xl mb-3">{role.emoji}</div>
                  <div className="font-bold text-white text-sm">{role.title}</div>
                  <div className="text-stone-400 text-xs mt-1 leading-relaxed">{role.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Nombre de usuario
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-medium">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="tunombre"
                maxLength={30}
                className="w-full bg-stone-900 border border-stone-700 text-white placeholder-stone-500 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              />
            </div>
            <p className="text-stone-500 text-xs mt-2">Solo letras, números y guiones bajos. Sin espacios.</p>
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
            disabled={busy || !selectedRole || !username.trim()}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold py-3.5 rounded-xl transition-colors duration-200 text-sm tracking-wide shadow-lg shadow-amber-400/20"
          >
            {busy ? 'Guardando...' : 'Comenzar →'}
          </button>
        </form>
      </div>
    </div>
  )
}