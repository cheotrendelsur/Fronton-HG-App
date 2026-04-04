import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

function formatScoreSummary(scoreTeam1, scoreTeam2, scoringType) {
  if (!scoreTeam1 || !scoreTeam2) return ''

  if (scoringType === 'points') {
    return `${scoreTeam1.points ?? 0} - ${scoreTeam2.points ?? 0}`
  }

  // sets_normal or sets_suma — show sets won
  const s1 = scoreTeam1.sets_won ?? 0
  const s2 = scoreTeam2.sets_won ?? 0
  return `${s1} - ${s2}`
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export default function RecentResults({ registrationIds, loading: parentLoading }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!registrationIds?.length) {
      setResults([])
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)

      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          id, score_team1, score_team2, winner_id, scheduled_date,
          team1_id, team2_id,
          team1:tournament_registrations!tournament_matches_team1_id_fkey ( id, team_name ),
          team2:tournament_registrations!tournament_matches_team2_id_fkey ( id, team_name ),
          categories ( name ),
          tournaments ( scoring_config )
        `)
        .or(registrationIds.map(id => `team1_id.eq.${id},team2_id.eq.${id}`).join(','))
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(3)

      if (!error && data) {
        setResults(data.map(m => {
          const playerIsTeam1 = registrationIds.includes(m.team1_id)
          const playerRegId = playerIsTeam1 ? m.team1_id : m.team2_id
          const isWin = m.winner_id === playerRegId
          const scoringType = m.tournaments?.scoring_config?.type ?? 'sets_normal'
          return { ...m, isWin, scoringType }
        }))
      } else {
        setResults([])
      }
      setLoading(false)
    }

    fetch()
  }, [registrationIds])

  if (parentLoading || loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[0, 1].map(i => (
          <div key={i} style={{
            background: '#FFFFFF', border: '1px solid #E8EAEE',
            borderRadius: '12px', padding: '12px 16px',
          }}>
            <div className="shimmer" style={{ width: '70%', height: '14px', borderRadius: '4px', marginBottom: '6px' }} />
            <div className="shimmer" style={{ width: '40%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    )
  }

  if (!results.length) {
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8EAEE',
        borderRadius: '16px', padding: '24px 16px', textAlign: 'center',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <p style={{ color: '#6B7280', fontSize: '13px', fontWeight: 500 }}>
          Aun no tienes resultados
        </p>
        <p style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '2px' }}>
          Tus partidos completados apareceran aqui
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {results.map((m, i) => {
        const team1Name = m.team1?.team_name ?? '?'
        const team2Name = m.team2?.team_name ?? '?'
        const score = formatScoreSummary(m.score_team1, m.score_team2, m.scoringType)

        return (
          <div
            key={m.id}
            className="player-stagger-enter player-card-press"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAEE',
              borderLeft: `3px solid ${m.isWin ? '#22C55E' : '#EF4444'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              animationDelay: `${i * 80}ms`,
            }}
          >
            {/* Score line */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '4px',
            }}>
              <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 500, flex: 1 }}>
                <span>{team1Name}</span>
                <span style={{
                  fontFamily: 'DM Mono, monospace', fontWeight: 600,
                  margin: '0 8px', color: '#4B5563',
                }}>
                  {score}
                </span>
                <span>{team2Name}</span>
              </div>

              {/* Win/Loss badge */}
              <span style={{
                fontSize: '10px', fontWeight: 600,
                background: m.isWin ? '#F0FDF4' : '#FEF2F2',
                color: m.isWin ? '#16A34A' : '#EF4444',
                border: `1px solid ${m.isWin ? '#BBF7D0' : '#FECACA'}`,
                borderRadius: '6px', padding: '2px 8px',
              }}>
                {m.isWin ? 'Victoria' : 'Derrota'}
              </span>
            </div>

            {/* Category + date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {m.categories?.name && (
                <span style={{
                  fontSize: '10px', fontWeight: 500,
                  background: '#E8F4FA', color: '#3A8BB5',
                  borderRadius: '4px', padding: '1px 6px',
                }}>
                  {m.categories.name}
                </span>
              )}
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                {formatDateShort(m.scheduled_date)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
