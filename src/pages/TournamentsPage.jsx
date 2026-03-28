import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import TournamentsPageLayout from '../components/TournamentsDashboard/TournamentsPageLayout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const ACTIVE_STATUSES  = ['inscription', 'active']
const HISTORY_STATUSES = ['finished']

export default function TournamentsPage() {
  const { profile } = useAuth()
  const [tournamentsList,    setTournamentsList]    = useState([])
  const [loading,            setLoading]            = useState(true)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [currentTab,         setCurrentTab]         = useState('info')

  const loadTournaments = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, location, status, start_date, end_date, inscription_fee, categories(id, name, max_couples), sports(name)')
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

  return (
    <Layout>
      <TournamentsPageLayout
        activeTournaments={activeTournaments}
        historyTournaments={historyTournaments}
        onSelectTournament={handleSelectTournament}
        loading={loading}
        organizerUsername={profile?.username}
      />
    </Layout>
  )
}
