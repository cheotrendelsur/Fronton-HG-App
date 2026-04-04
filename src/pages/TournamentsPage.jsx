import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import TournamentsPageLayout from '../components/TournamentsDashboard/TournamentsPageLayout'
import TournamentWidget from '../components/TournamentsDashboard/TournamentWidget'
import InscriptionFlowModal from '../components/Player/inscription/InscriptionFlowModal'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const ACTIVE_STATUSES  = ['inscription', 'active']
const HISTORY_STATUSES = ['finished']

function OrganizerDashboard({ profile }) {
  const [tournamentsList, setTournamentsList] = useState([])
  const [loading,         setLoading]         = useState(true)

  const loadTournaments = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, location, status, start_date, end_date, inscription_fee, scoring_config, description, categories(id, name, max_couples), sports(name)')
      .eq('organizer_id', profile.id)
      .order('created_at', { ascending: false })
    if (!error && data) setTournamentsList(data)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments])

  const activeTournaments  = tournamentsList.filter(t => ACTIVE_STATUSES.includes(t.status))
  const historyTournaments = tournamentsList.filter(t => HISTORY_STATUSES.includes(t.status))

  return (
    <TournamentsPageLayout
      activeTournaments={activeTournaments}
      historyTournaments={historyTournaments}
      loading={loading}
      organizerUsername={profile?.username}
    />
  )
}

function PlayerTournamentsView({ profile }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTournament, setSelectedTournament] = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, location, status, start_date, end_date, inscription_fee, scoring_config, description, categories(id, name, max_couples), sports(name)')
        .in('status', ['inscription', 'active'])
        .order('start_date', { ascending: true })

      if (!error && data) {
        // Inscription first, then active
        data.sort((a, b) => {
          if (a.status === 'inscription' && b.status !== 'inscription') return -1
          if (a.status !== 'inscription' && b.status === 'inscription') return 1
          return 0
        })
        setTournaments(data)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
      {/* Section title */}
      <h2 style={{
        fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: '#6B7280', marginBottom: '12px',
      }}>
        Torneos disponibles
      </h2>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="shimmer" style={{ height: '120px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <path d="M8 21H16M12 17V21M6 3H18V10C18 13.31 15.31 16 12 16C8.69 16 6 13.31 6 10V3Z"/>
            <path d="M6 5H3V8C3 9.66 4.34 11 6 11"/>
            <path d="M18 5H21V8C21 9.66 19.66 11 18 11"/>
          </svg>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
            No hay torneos activos
          </p>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
            Los torneos en fase de inscripcion apareceran aqui
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tournaments.map((t, i) => (
            <div key={t.id} className="player-stagger-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <TournamentWidget
                tournament={t}
                readonly={t.status !== 'inscription'}
              />
              {t.status === 'inscription' && (
                <button
                  onClick={() => setSelectedTournament(t)}
                  aria-label={`Solicitar inscripcion en ${t.name}`}
                  style={{
                    width: '100%', marginTop: '-8px',
                    background: '#6BB3D9', color: '#FFFFFF',
                    border: 'none', borderRadius: '0 0 16px 16px',
                    padding: '10px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 200ms',
                    boxShadow: '0 0 12px rgba(107,179,217,0.15)',
                  }}
                >
                  Solicitar Inscripcion
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inscription modal */}
      {selectedTournament && (
        <InscriptionFlowModal
          tournament={selectedTournament}
          playerId={profile?.id}
          onClose={() => setSelectedTournament(null)}
          onSuccess={() => setSelectedTournament(null)}
        />
      )}
    </div>
  )
}

export default function TournamentsPage() {
  const { profile, initializing } = useAuth()

  if (initializing || !profile) return null

  return (
    <Layout>
      {profile.role === 'organizer'
        ? <OrganizerDashboard profile={profile} />
        : <PlayerTournamentsView profile={profile} />
      }
    </Layout>
  )
}
