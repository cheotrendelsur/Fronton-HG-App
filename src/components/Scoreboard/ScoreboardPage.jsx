import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { saveMatchResult, checkGroupPhaseComplete } from '../../lib/scorePersistence'
import { processGroupPhaseCompletion, advanceBracketWinner, checkAllCategoriesComplete } from '../../lib/postGroupPhase'
import BrandLoader from '../BrandLoader'
import DaySwiper from './DaySwiper'
import ScoreInputModal from './ScoreInputModal'

export default function ScoreboardPage({ tournament }) {
  const [matches, setMatches] = useState([])
  const [categories, setCategories] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [banner, setBanner] = useState(null)

  const loadData = useCallback(async () => {
    if (!tournament?.id) return
    setLoading(true)

    // Fetch categories
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name')
      .eq('tournament_id', tournament.id)

    setCategories(cats ?? [])

    // Fetch matches with joins
    const { data: mts } = await supabase
      .from('tournament_matches')
      .select(`
        id, tournament_id, category_id, group_id, phase,
        match_number, team1_id, team2_id, status,
        score_team1, score_team2, winner_id,
        scheduled_date, scheduled_time, court_id,
        court:courts(id, name),
        group:tournament_groups(group_letter),
        team1_reg:tournament_registrations!tournament_matches_team1_id_fkey(
          id, team_name,
          player1:profiles!tournament_registrations_player1_id_fkey(username),
          player2:profiles!tournament_registrations_player2_id_fkey(username)
        ),
        team2_reg:tournament_registrations!tournament_matches_team2_id_fkey(
          id, team_name,
          player1:profiles!tournament_registrations_player1_id_fkey(username),
          player2:profiles!tournament_registrations_player2_id_fkey(username)
        )
      `)
      .eq('tournament_id', tournament.id)
      .order('scheduled_date')
      .order('scheduled_time')

    // Enrich matches with flattened names
    const enriched = (mts ?? []).map(m => ({
      ...m,
      court_name: m.court?.name ?? null,
      group_letter: m.group?.group_letter ?? null,
      team1_p1: m.team1_reg?.player1?.username ?? '?',
      team1_p2: m.team1_reg?.player2?.username ?? '?',
      team2_p1: m.team2_reg?.player1?.username ?? '?',
      team2_p2: m.team2_reg?.player2?.username ?? '?',
      team1_name: m.team1_reg?.team_name ?? 'Equipo 1',
      team2_name: m.team2_reg?.team_name ?? 'Equipo 2',
    }))

    setMatches(enriched)

    // Fetch group members (for mapping registration_id → member_id when saving)
    const { data: gm } = await supabase
      .from('tournament_group_members')
      .select('id, group_id, registration_id')
      .in('group_id', (mts ?? []).map(m => m.group_id).filter(Boolean))

    setGroupMembers(gm ?? [])
    setLoading(false)
  }, [tournament?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Generate ALL days from tournament start_date to end_date
  const allDays = useMemo(() => {
    if (!tournament?.start_date || !tournament?.end_date) return []
    const result = []
    const start = new Date(tournament.start_date + 'T00:00:00')
    const end = new Date(tournament.end_date + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      result.push(`${yyyy}-${mm}-${dd}`)
    }
    return result
  }, [tournament?.start_date, tournament?.end_date])

  // Group matches by date → category_id
  const matchesByDate = useMemo(() => {
    const byDate = {}
    for (const m of matches) {
      const date = m.scheduled_date
      if (!date) continue
      if (!byDate[date]) byDate[date] = {}
      if (!byDate[date][m.category_id]) byDate[date][m.category_id] = []
      byDate[date][m.category_id].push(m)
    }
    return byDate
  }, [matches])

  // Determine default day: today if in range, else first day with pending matches, else last day
  const defaultDayIndex = useMemo(() => {
    if (allDays.length === 0) return 0
    const today = new Date().toISOString().slice(0, 10)

    const todayIdx = allDays.indexOf(today)
    if (todayIdx >= 0) return todayIdx

    // Find first day with pending matches
    for (let i = 0; i < allDays.length; i++) {
      const dayCats = matchesByDate[allDays[i]] ?? {}
      const hasPending = Object.values(dayCats).some(catMatches =>
        catMatches.some(m => m.status !== 'completed')
      )
      if (hasPending) return i
    }

    return allDays.length - 1
  }, [allDays, matchesByDate])

  function handleRegister(match) {
    setSelectedMatch(match)
  }

  // Find the category name for the selected match
  const selectedCategoryName = selectedMatch
    ? categories.find(c => c.id === selectedMatch.category_id)?.name ?? ''
    : ''

  async function handleSaveResult(match, result, endTime) {
    // endTime = { date: 'YYYY-MM-DD', time: 'HH:MM' }
    const actualEndTime = endTime?.date && endTime?.time
      ? `${endTime.date}T${endTime.time}:00`
      : null
    const winnerId = result.winner === 'team1' ? match.team1_id : match.team2_id
    const isGroupPhase = match.phase === 'group_phase' && match.group_id

    if (isGroupPhase) {
      // Group phase: update match + group member stats via RPC
      const team1Member = groupMembers.find(
        gm => gm.group_id === match.group_id && gm.registration_id === match.team1_id
      )
      const team2Member = groupMembers.find(
        gm => gm.group_id === match.group_id && gm.registration_id === match.team2_id
      )

      if (!team1Member || !team2Member) {
        setSelectedMatch(null)
        setBanner({ type: 'error', text: 'Error: no se encontraron los miembros del grupo' })
        return
      }

      const res = await saveMatchResult(
        supabase, match.id, result, winnerId,
        team1Member.id, team2Member.id, tournament.scoring_config,
        actualEndTime,
      )

      setSelectedMatch(null)

      if (!res.success) {
        setBanner({ type: 'error', text: res.error || 'Error al guardar resultado' })
      } else {
        setBanner({ type: 'success', text: 'Resultado guardado correctamente' })

        // Check if group phase is complete for this category
        const check = await checkGroupPhaseComplete(supabase, tournament.id, match.category_id)
        if (check.complete) {
          const catName = categories.find(c => c.id === match.category_id)?.name ?? ''
          setBanner({ type: 'info', text: `Calculando clasificación de ${catName}...` })

          const classResult = await processGroupPhaseCompletion(
            supabase, tournament.id, match.category_id, tournament.scoring_config,
          )

          if (classResult.success) {
            setBanner({ type: 'success', text: `✓ Clasificación completada para ${catName}. Partidos de eliminatoria programados.` })
          } else {
            setBanner({ type: 'error', text: classResult.error || 'Error en clasificación automática' })
          }
        }
      }
    } else {
      // Elimination phase: update match + advance bracket
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          score_team1: result.score_team1,
          score_team2: result.score_team2,
          winner_id: winnerId,
          status: 'completed',
          actual_end_time: actualEndTime,
        })
        .eq('id', match.id)

      setSelectedMatch(null)

      if (error) {
        setBanner({ type: 'error', text: error.message || 'Error al guardar resultado' })
      } else {
        // Advance bracket winner to next round
        const advResult = await advanceBracketWinner(supabase, tournament.id, match.id, winnerId)

        if (advResult.nextMatchReady) {
          setBanner({ type: 'success', text: 'Resultado guardado. Siguiente ronda lista.' })
        } else {
          setBanner({ type: 'success', text: 'Resultado de eliminatoria guardado' })
        }

        // Check if entire tournament is finished
        await checkAllCategoriesComplete(supabase, tournament.id)
      }
    }

    await loadData()
    setTimeout(() => setBanner(null), 4000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <BrandLoader size={40} />
        <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando marcadores...</p>
      </div>
    )
  }

  if (allDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" style={{ color: '#D1D5DB' }}>
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
          No hay partidos programados
        </p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Los partidos aparecerán aquí una vez que el torneo esté activo.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Feedback banner */}
      {banner && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-center animate-fade-up"
          style={{
            background: banner.type === 'error' ? '#FEF2F2'
              : banner.type === 'info' ? '#EFF6FF'
              : '#F0FDF4',
            border: `1px solid ${banner.type === 'error' ? '#FECACA'
              : banner.type === 'info' ? '#BFDBFE'
              : '#BBF7D0'}`,
          }}
        >
          <p
            className="text-xs font-medium"
            style={{
              color: banner.type === 'error' ? '#EF4444'
                : banner.type === 'info' ? '#3B82F6'
                : '#16A34A',
            }}
          >
            {banner.text}
          </p>
        </div>
      )}

      <DaySwiper
        days={allDays}
        matchesByDate={matchesByDate}
        categories={categories}
        defaultDayIndex={defaultDayIndex}
        onRegister={handleRegister}
      />

      {selectedMatch && (
        <ScoreInputModal
          match={selectedMatch}
          scoringConfig={tournament.scoring_config}
          categoryName={selectedCategoryName}
          onSave={handleSaveResult}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </>
  )
}
