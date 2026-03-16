import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  organizer: { label: 'Organizador', emoji: '🎯' },
  player:    { label: 'Jugador',     emoji: '🎾' },
}

export default function DashboardPage() {
  const { profile, signOut } = useAuth()
  const roleInfo = ROLE_LABELS[profile?.role] || {}

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Navbar */}
      <header className="border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-lg">🏆</div>
          <span className="font-bold text-white tracking-tight">RacketTourneys</span>
        </div>
        <button
          onClick={signOut}
          className="text-stone-400 hover:text-white text-sm transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-6">{roleInfo.emoji}</div>
        <h2 className="text-2xl font-bold mb-2">
          Hola, <span className="text-amber-400">@{profile?.username}</span>
        </h2>
        <p className="text-stone-400 mb-8">
          Tu cuenta está lista. Rol: <span className="text-white font-medium">{roleInfo.label}</span>
        </p>
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-left">
          <p className="text-stone-400 text-sm text-center">
            ✅ Fase 1 completada — la lógica de torneos llegará en la Fase 2.
          </p>
        </div>
      </main>
    </div>
  )
}