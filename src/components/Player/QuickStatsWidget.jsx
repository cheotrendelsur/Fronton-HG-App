import { useState, useEffect, useRef } from 'react'
import { mockPlayerStats } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

function CounterUp({ value, duration = 500 }) {
  const [display, setDisplay] = useState(0)
  const animated = useRef(false)

  useEffect(() => {
    if (animated.current || value === 0) {
      setDisplay(value)
      return
    }
    animated.current = true
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <span>{display}</span>
}

export default function QuickStatsWidget({ registrationIds, loading: parentLoading }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (USE_MOCK) {
      setStats({
        played: mockPlayerStats.totalMatches,
        won: mockPlayerStats.matchesWon,
        lost: mockPlayerStats.matchesLost,
        winRate: Math.round(mockPlayerStats.winRate),
      })
      setLoading(false)
      return
    }

    // Real Supabase logic preserved below
    if (!registrationIds?.length) {
      setStats({ played: 0, won: 0, lost: 0, winRate: 0 })
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)
      try {
        const { supabase } = await import('../../lib/supabaseClient')
        const { data: matches, error } = await supabase
          .from('tournament_matches')
          .select('id, winner_id, team1_id, team2_id')
          .eq('status', 'completed')
          .or(
            registrationIds
              .map(id => `team1_id.eq.${id}`)
              .concat(registrationIds.map(id => `team2_id.eq.${id}`))
              .join(',')
          )

        if (error) throw error

        const playerMatches = (matches || []).filter(
          m => registrationIds.includes(m.team1_id) || registrationIds.includes(m.team2_id)
        )

        const played = playerMatches.length
        const won = playerMatches.filter(m => registrationIds.includes(m.winner_id)).length
        const lost = played - won
        const winRate = played > 0 ? Math.round((won / played) * 100) : 0

        setStats({ played, won, lost, winRate })
      } catch {
        setStats({ played: 0, won: 0, lost: 0, winRate: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [registrationIds])

  if (parentLoading || loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="shimmer" style={{ height: '72px', borderRadius: '14px' }} />
        ))}
      </div>
    )
  }

  if (!stats || stats.played === 0) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8EAEE',
        borderRadius: '16px',
        padding: '20px 16px',
        textAlign: 'center',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
          <path d="M3 3v18h18" />
          <path d="M7 16l4-8 4 4 4-6" />
        </svg>
        <p style={{ color: '#6B7280', fontSize: '13px', fontWeight: 500 }}>
          Sin estadisticas aun
        </p>
        <p style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '2px' }}>
          Juega tu primer partido para ver tus stats
        </p>
      </div>
    )
  }

  function getWinRateColor(rate) {
    if (rate >= 60) return '#16A34A'
    if (rate >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const cards = [
    { label: 'Jugados', value: stats.played, color: '#6BB3D9' },
    { label: 'Ganados', value: stats.won, color: '#16A34A' },
    { label: 'Perdidos', value: stats.lost, color: '#EF4444' },
    { label: 'Win Rate', value: stats.winRate, color: getWinRateColor(stats.winRate), suffix: '%' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="player-stagger-enter player-card-press"
          style={{
            animationDelay: `${i * 60}ms`,
            background: '#FFFFFF',
            border: '1px solid #E8EAEE',
            borderRadius: '14px',
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '26px',
            fontWeight: 500,
            color: card.color,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}>
            <CounterUp value={card.value} />
            {card.suffix || ''}
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {card.label}
          </span>
        </div>
      ))}
    </div>
  )
}
