import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import BrandLoader from '../components/BrandLoader'
import ScoreboardPage from '../components/Scoreboard/ScoreboardPage'

export default function ResultsInputPage() {
  const { session } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    async function loadActiveTournament() {
      setLoading(true)
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, status, start_date, end_date, scoring_config')
        .eq('organizer_id', session.user.id)
        .eq('status', 'active')
        .limit(1)
        .single()

      setTournament(data ?? null)
      setLoading(false)
    }

    loadActiveTournament()
  }, [session?.user?.id])

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-6 animate-fade-up">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-base font-semibold" style={{ color: '#1F2937' }}>
            Marcadores
          </h1>
          {tournament && (
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {tournament.name}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <BrandLoader size={40} />
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando...</p>
          </div>
        ) : !tournament ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" style={{ color: '#D1D5DB' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
              No tienes un torneo activo
            </p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Inicia un torneo para poder registrar resultados.
            </p>
          </div>
        ) : (
          <ScoreboardPage tournament={tournament} />
        )}
      </div>
    </Layout>
  )
}
