import { useState, useEffect, useRef } from 'react'
import { mockPlayerStats } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

const MOCK_CATEGORIES = [
  { id: 'cat-masc-3', name: 'Masculina Tercera' },
  { id: 'cat-masc-4', name: 'Masculina Cuarta' },
]

function CounterUp({ value, duration = 600 }) {
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
      setDisplay(Math.round(eased * value * 10) / 10)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <span>{Number.isInteger(display) ? display : display.toFixed(1)}</span>
}

export default function PlayerStats({ playerId, registrations }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    if (USE_MOCK) {
      setCategories(MOCK_CATEGORIES)
      updateMockStats('all')
      setLoading(false)
      return
    }

    if (!playerId || !registrations?.length) {
      setLoading(false)
      return
    }

    // Derive unique categories from registrations
    const cats = []
    const seen = new Set()
    for (const r of registrations) {
      const catId = r.category_id || r.categories?.id
      const catName = r.categories?.name
      if (catId && !seen.has(catId)) {
        seen.add(catId)
        cats.push({ id: catId, name: catName || catId })
      }
    }
    setCategories(cats)
    fetchStats()
  }, [playerId, registrations])

  // React to category changes
  useEffect(() => {
    if (USE_MOCK) {
      updateMockStats(selectedCategory)
      return
    }
    if (playerId && registrations?.length) fetchStats()
  }, [selectedCategory])

  function updateMockStats(catId) {
    if (catId === 'all') {
      setStats({
        played: mockPlayerStats.totalMatches,
        won: mockPlayerStats.matchesWon,
        lost: mockPlayerStats.matchesLost,
        winRate: mockPlayerStats.winRate,
      })
    } else {
      const catStats = mockPlayerStats.byCategory[catId]
      if (catStats) {
        setStats({
          played: catStats.played,
          won: catStats.won,
          lost: catStats.lost,
          winRate: catStats.winRate,
        })
      } else {
        setStats({ played: 0, won: 0, lost: 0, winRate: 0 })
      }
    }
  }

  async function fetchStats() {
    if (USE_MOCK) return
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const regIds = registrations
        .filter(r => selectedCategory === 'all' || (r.category_id || r.categories?.id) === selectedCategory)
        .map(r => r.id)

      if (!regIds.length) {
        setStats({ played: 0, won: 0, lost: 0, winRate: 0 })
        setLoading(false)
        return
      }

      const { data: matches, error } = await supabase
        .from('tournament_matches')
        .select('id, winner_id, team1_id, team2_id')
        .eq('status', 'completed')
        .or(regIds.map(id => `team1_id.eq.${id}`).concat(regIds.map(id => `team2_id.eq.${id}`)).join(','))

      if (error) throw error

      const playerMatches = (matches || []).filter(m =>
        regIds.includes(m.team1_id) || regIds.includes(m.team2_id)
      )

      const played = playerMatches.length
      const won = playerMatches.filter(m => regIds.includes(m.winner_id)).length
      const lost = played - won
      const winRate = played > 0 ? Math.round((won / played) * 100) : 0

      setStats({ played, won, lost, winRate })
    } catch (err) {
      console.error('PlayerStats fetch error:', err)
      setStats({ played: 0, won: 0, lost: 0, winRate: 0 })
    } finally {
      setLoading(false)
    }
  }

  function getWinRateColor(rate) {
    if (rate >= 60) return '#6BB3D9'
    if (rate >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const statCards = stats ? [
    { label: 'Jugados', value: stats.played, color: '#6BB3D9' },
    { label: 'Ganados', value: stats.won, color: '#16A34A' },
    { label: 'Perdidos', value: stats.lost, color: '#EF4444' },
    { label: 'Win Rate', value: stats.winRate, color: getWinRateColor(stats.winRate), suffix: '%' },
  ] : []

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Category filter */}
      {categories.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            aria-label="Filtrar por categoría"
            style={{
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #E0E2E6',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#1F2937',
              fontFamily: 'DM Sans, sans-serif',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              cursor: 'pointer',
              transition: 'border-color 200ms',
            }}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="shimmer" style={{
              height: '80px',
              borderRadius: '16px',
            }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          {statCards.map((card, i) => (
            <div
              key={`${card.label}-${selectedCategory}`}
              className="player-stagger-enter"
              style={{
                animationDelay: `${i * 60}ms`,
                background: '#FFFFFF',
                border: '1px solid #E8EAEE',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '28px',
                fontWeight: 500,
                color: card.color,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
              }}>
                <CounterUp key={`${card.label}-${selectedCategory}-${card.value}`} value={card.value} />
                {card.suffix || ''}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {card.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
