import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import TournamentsPageLayout    from '../components/TournamentsDashboard/TournamentsPageLayout'
import TournamentDetailModal    from '../components/TournamentsDashboard/TournamentDetailModal'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const ACTIVE_STATUSES  = ['inscription', 'active']
const HISTORY_STATUSES = ['finished']

function OrganizerDashboard({ profile }) {
  const [tournamentsList,    setTournamentsList]    = useState([])
  const [loading,            setLoading]            = useState(true)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [currentTab,         setCurrentTab]         = useState('info')

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

  function handleSelectTournament(tournament) {
    setSelectedTournament(tournament)
    setCurrentTab('info')
  }

  function handleCloseModal() {
    setSelectedTournament(null)
  }

  function handleTournamentUpdate(updated) {
    setTournamentsList(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
    setSelectedTournament(prev => prev ? { ...prev, ...updated } : prev)
  }

  return (
    <>
      <TournamentsPageLayout
        activeTournaments={activeTournaments}
        historyTournaments={historyTournaments}
        onSelectTournament={handleSelectTournament}
        loading={loading}
        organizerUsername={profile?.username}
      />

      {selectedTournament && (
        <TournamentDetailModal
          tournament={selectedTournament}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onClose={handleCloseModal}
          onUpdate={handleTournamentUpdate}
        />
      )}
    </>
  )
}

function TournamentsPlaceholder({ role }) {
  const isAdmin = role === 'admin'
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: '#E8F4FA', border: '1px solid #D0E5F0' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6BB3D9" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: '#1F2937' }}>Torneos</h2>
      <p className="text-sm max-w-xs" style={{ color: '#6B7280' }}>
        {isAdmin
          ? 'Como administrador puedes gestionar torneos desde el panel de administración.'
          : 'Próximamente podrás ver y unirte a torneos disponibles desde esta sección.'}
      </p>
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
        : <TournamentsPlaceholder role={profile.role} />
      }
    </Layout>
  )
}
