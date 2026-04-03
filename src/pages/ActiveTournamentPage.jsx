import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import BrandLoader from '../components/BrandLoader'
import InscritosView from '../components/TournamentActive/InscritosView'
import ClasificacionView from '../components/TournamentActive/ClasificacionView'
import CanchasView from '../components/TournamentActive/CanchasView'

export default function ActiveTournamentPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [tournament, setTournament]     = useState(null)
  const [categories, setCategories]     = useState([])
  const [teams, setTeams]               = useState([])
  const [groups, setGroups]             = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [matches, setMatches]           = useState([])
  const [courts, setCourts]             = useState([])
  const [activeSetbacks, setActiveSetbacks] = useState({})
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('inscritos')

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)

    // Fetch tournament + categories
    const { data: t } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date, end_date, categories(id, name, max_couples)')
      .eq('id', id)
      .single()

    if (!t) {
      navigate('/tournaments', { replace: true })
      return
    }

    setTournament(t)
    setCategories(t.categories ?? [])

    // Fetch approved registrations with player names
    const { data: regs } = await supabase
      .from('tournament_registrations')
      .select(`
        id, team_name, category_id, status,
        player1:profiles!tournament_registrations_player1_id_fkey(username),
        player2:profiles!tournament_registrations_player2_id_fkey(username)
      `)
      .eq('tournament_id', id)
      .eq('status', 'approved')

    const enrichedRegs = (regs ?? []).map(r => ({
      ...r,
      player1_name: r.player1?.username ?? '?',
      player2_name: r.player2?.username ?? '?',
    }))
    setTeams(enrichedRegs)

    // Fetch groups
    const { data: grps } = await supabase
      .from('tournament_groups')
      .select('*')
      .eq('tournament_id', id)
      .order('group_number')

    setGroups(grps ?? [])

    // Fetch group members with registration data
    const groupIds = (grps ?? []).map(g => g.id)
    if (groupIds.length > 0) {
      const { data: members } = await supabase
        .from('tournament_group_members')
        .select(`
          id, group_id, registration_id, draw_position,
          matches_played, matches_won, matches_lost,
          sets_won, sets_lost, games_won, games_lost,
          registration:tournament_registrations(
            id, team_name,
            player1:profiles!tournament_registrations_player1_id_fkey(username),
            player2:profiles!tournament_registrations_player2_id_fkey(username)
          )
        `)
        .in('group_id', groupIds)
        .order('draw_position')

      const enrichedMembers = (members ?? []).map(m => ({
        ...m,
        team_name: m.registration?.team_name ?? '—',
        player1_name: m.registration?.player1?.username ?? '?',
        player2_name: m.registration?.player2?.username ?? '?',
      }))
      setGroupMembers(enrichedMembers)
    }

    // Fetch matches (includes court join for schedule display)
    const { data: mts } = await supabase
      .from('tournament_matches')
      .select(`
        id, tournament_id, category_id, group_id, phase,
        match_number, team1_id, team2_id, status,
        score_team1, score_team2, winner_id,
        scheduled_date, scheduled_time, estimated_duration_minutes, court_id,
        team1:tournament_registrations!tournament_matches_team1_id_fkey(team_name),
        team2:tournament_registrations!tournament_matches_team2_id_fkey(team_name),
        court:courts(id, name)
      `)
      .eq('tournament_id', id)
      .order('match_number')

    const enrichedMatches = (mts ?? []).map(m => ({
      ...m,
      team1_name: m.team1?.team_name ?? 'Equipo 1',
      team2_name: m.team2?.team_name ?? 'Equipo 2',
    }))
    setMatches(enrichedMatches)

    // Fetch courts for this tournament
    const { data: crts } = await supabase
      .from('courts')
      .select('id, name, available_from, available_to, break_start, break_end')
      .eq('tournament_id', id)
      .order('name')
    setCourts(crts ?? [])

    // Fetch active setbacks for all courts of this tournament
    const { data: setbacks } = await supabase
      .from('court_setbacks')
      .select('*')
      .eq('tournament_id', id)
      .eq('status', 'active')
    const setbackMap = {}
    for (const sb of (setbacks ?? [])) {
      setbackMap[sb.court_id] = sb
    }
    setActiveSetbacks(setbackMap)

    setLoading(false)
  }, [id, navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Build teamsByCategory for InscritosView
  const teamsByCategory = {}
  for (const cat of categories) {
    teamsByCategory[cat.id] = teams.filter(t => t.category_id === cat.id)
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-6 animate-fade-up">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate('/tournaments')}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5"/>
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold truncate" style={{ color: '#1F2937' }}>
              {tournament?.name ?? 'Torneo'}
            </h1>
            <p className="text-[11px]" style={{ color: '#6BB3D9' }}>Fase de Grupos</p>
          </div>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-xl p-1 mb-5"
          style={{ background: '#E8EAEE' }}
        >
          {[
            { key: 'inscritos', label: 'Inscritos' },
            { key: 'clasificacion', label: 'Clasificación' },
            { key: 'canchas', label: 'Canchas' },
          ].map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#1F2937' : '#6B7280',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <BrandLoader size={40} />
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando torneo...</p>
          </div>
        ) : activeTab === 'inscritos' ? (
          <InscritosView
            categories={categories}
            teamsByCategory={teamsByCategory}
          />
        ) : activeTab === 'clasificacion' ? (
          <ClasificacionView
            categories={categories}
            groups={groups}
            groupMembers={groupMembers}
            matches={matches}
          />
        ) : (
          <CanchasView
            courts={courts}
            matches={matches}
            categories={categories}
            activeSetbacks={activeSetbacks}
            tournamentId={id}
            onDataRefresh={loadData}
          />
        )}
      </div>
    </Layout>
  )
}
