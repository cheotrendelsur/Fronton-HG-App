import { useState, useEffect, useRef } from 'react'
import { mockBracket } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

const ROUND_NAMES = {
  round_of_32: '16avos',
  round_of_16: 'Octavos',
  quarterfinals: 'Cuartos',
  semifinals: 'Semifinal',
  final: 'Final',
}

const ROUND_SIZE_TO_PHASE = {
  32: 'round_of_32', 16: 'round_of_16',
  8: 'quarterfinals', 4: 'semifinals', 2: 'final',
}

function formatScoreShort(score1, score2) {
  if (!score1 || !score2) return ''
  if (score1.sets_won != null) return `${score1.sets_won}-${score2.sets_won}`
  if (score1.points != null) return `${score1.points}-${score2.points}`
  return ''
}

export default function BracketView({ tournamentId, categoryId, registrationIds, showAll }) {
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    if (USE_MOCK) {
      // Get bracket for this category
      const bracket = mockBracket[categoryId]
      if (!bracket?.phases?.length) {
        setRounds([])
        setLoading(false)
        return
      }

      const mockRounds = bracket.phases.map((phase, ri) => ({
        roundNumber: ri + 1,
        phaseName: phase.name,
        slots: phase.matches.map(m => ({
          id: m.id,
          team1Name: m.team1,
          team2Name: m.team2,
          score: m.score1 && m.score2 ? `${m.score1}-${m.score2}` : '',
          isCompleted: m.winner != null,
          matchWinnerId: m.winner,
          team1_id: null,
          team2_id: null,
          status: m.status,
        })),
      }))

      setRounds(mockRounds)
      setLoading(false)
      return
    }

    // Real Supabase logic preserved below
    if (!tournamentId || !categoryId) {
      setRounds([])
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)
      const { supabase } = await import('../../lib/supabaseClient')

      const { data: brackets } = await supabase
        .from('tournament_bracket')
        .select(`
          id, phase, round_number, position, status,
          team1_id, team2_id, winner_id, match_id,
          team1_reg:tournament_registrations!tournament_bracket_team1_id_fkey ( id, team_name ),
          team2_reg:tournament_registrations!tournament_bracket_team2_id_fkey ( id, team_name )
        `)
        .eq('tournament_id', tournamentId)
        .eq('category_id', categoryId)
        .order('round_number', { ascending: true })
        .order('position', { ascending: true })

      if (!brackets?.length) {
        setRounds([])
        setLoading(false)
        return
      }

      const matchIds = brackets.filter(b => b.match_id).map(b => b.match_id)
      let matchResults = {}
      if (matchIds.length) {
        const { data: matches } = await supabase
          .from('tournament_matches')
          .select('id, score_team1, score_team2, winner_id, status')
          .in('id', matchIds)
        if (matches) {
          for (const m of matches) matchResults[m.id] = m
        }
      }

      const roundMap = {}
      for (const b of brackets) {
        if (!roundMap[b.round_number]) roundMap[b.round_number] = []
        const match = b.match_id ? matchResults[b.match_id] : null
        roundMap[b.round_number].push({
          ...b,
          team1Name: b.team1_reg?.team_name ?? null,
          team2Name: b.team2_reg?.team_name ?? null,
          score: match ? formatScoreShort(match.score_team1, match.score_team2) : '',
          isCompleted: match?.status === 'completed',
          matchWinnerId: match?.winner_id ?? b.winner_id,
        })
      }

      const roundList = Object.entries(roundMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roundNum, slots]) => {
          const firstSlotPhase = slots[0]?.phase
          const teamsInRound = slots.length * 2
          const phaseName = ROUND_NAMES[ROUND_SIZE_TO_PHASE[teamsInRound]] ??
                           ROUND_NAMES[firstSlotPhase] ?? `Ronda ${roundNum}`
          return { roundNumber: Number(roundNum), phaseName, slots }
        })

      setRounds(roundList)
      setLoading(false)

      if (!showAll && registrationIds?.length && containerRef.current) {
        setTimeout(() => {
          const el = containerRef.current?.querySelector('[data-player-match]')
          if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }, 200)
      }
    }

    fetch()
  }, [tournamentId, categoryId, registrationIds, showAll])

  if (loading) {
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8EAEE',
        borderRadius: '16px', padding: '16px',
      }}>
        <div className="shimmer" style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
      </div>
    )
  }

  if (!rounds.length) return null

  const playerRegSet = new Set(registrationIds ?? [])

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8EAEE',
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #E8EAEE',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21H16M12 17V21M6 3H18V10C18 13.31 15.31 16 12 16C8.69 16 6 13.31 6 10V3Z"/>
        </svg>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
          Eliminatoria
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          overflowX: 'auto', overflowY: 'hidden',
          padding: '16px', touchAction: 'pan-x pan-y',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}
      >
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'center',
          minWidth: `${rounds.length * 160}px`,
        }}>
          {rounds.map((round, ri) => {
            const isFinal = ri === rounds.length - 1
            return (
              <div key={round.roundNumber} style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                minWidth: '148px', alignItems: 'center',
              }}>
                {/* Round header */}
                <div style={{
                  fontSize: '10px', fontWeight: 600, color: '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  textAlign: 'center', marginBottom: '4px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {isFinal && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4A827" strokeWidth={2}
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 21H16M12 17V21M6 3H18V10C18 13.31 15.31 16 12 16C8.69 16 6 13.31 6 10V3Z"/>
                    </svg>
                  )}
                  {round.phaseName}
                </div>

                {/* Slots */}
                {round.slots.map((slot) => {
                  const playerInMatch = !showAll && !USE_MOCK && (
                    playerRegSet.has(slot.team1_id) || playerRegSet.has(slot.team2_id)
                  )
                  const isPending = slot.status === 'pending'

                  return (
                    <div
                      key={slot.id}
                      data-player-match={playerInMatch ? 'true' : undefined}
                      style={{
                        width: '148px',
                        border: playerInMatch
                          ? '2px solid #6BB3D9'
                          : isPending
                            ? '1px dashed #D1D5DB'
                            : '1px solid #E0E2E6',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: playerInMatch ? 'rgba(107,179,217,0.06)' : '#FFFFFF',
                        boxShadow: playerInMatch ? '0 0 8px rgba(107,179,217,0.15)' : 'none',
                      }}
                    >
                      {/* Team 1 */}
                      <TeamRow
                        name={slot.team1Name}
                        isWinner={false}
                        isPlayer={false}
                        score={null}
                        isPending={isPending}
                      />
                      <div style={{ height: '1px', background: '#F3F4F6' }} />
                      {/* Team 2 */}
                      <TeamRow
                        name={slot.team2Name}
                        isWinner={false}
                        isPlayer={false}
                        score={null}
                        isPending={isPending}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TeamRow({ name, isWinner, isPlayer, score, isPending }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', minHeight: '32px',
      background: isWinner ? '#F0FDF4' : 'transparent',
    }}>
      <span style={{
        fontSize: '11px',
        fontWeight: isPlayer ? 600 : isWinner ? 500 : 400,
        color: name ? (isPlayer ? '#1B3A5C' : '#1F2937') : '#9CA3AF',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: '100px', fontFamily: 'DM Sans, sans-serif',
        fontStyle: isPending && !name ? 'italic' : 'normal',
      }}>
        {name ?? 'Por definir'}
      </span>
      {score != null && (
        <span style={{
          fontSize: '11px', fontWeight: 700,
          fontFamily: 'DM Mono, monospace',
          color: isWinner ? '#16A34A' : '#6B7280',
        }}>
          {score}
        </span>
      )}
    </div>
  )
}
