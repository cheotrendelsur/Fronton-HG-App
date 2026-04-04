import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

const STATUS_BADGES = {
  active: { label: 'En curso', bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
  inscription: { label: 'Inscripcion', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  draft: { label: 'Borrador', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
}

export default function ActiveTournamentsCarousel({ playerRegistrations, loading: parentLoading }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!playerRegistrations?.length) {
      setTournaments([])
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)

      // Group registrations by tournament
      const byTournament = {}
      for (const reg of playerRegistrations) {
        const t = reg.tournaments
        if (!t || t.status !== 'active') continue
        if (!byTournament[t.id]) {
          byTournament[t.id] = {
            ...t,
            categories: [],
            registrationIds: [],
          }
        }
        byTournament[t.id].categories.push(reg.categories?.name ?? 'Sin categoria')
        byTournament[t.id].registrationIds.push(reg.id)
      }

      const tournamentList = Object.values(byTournament)

      // Fetch match progress for each tournament
      for (const t of tournamentList) {
        const { count: totalCount } = await supabase
          .from('tournament_matches')
          .select('id', { count: 'exact', head: true })
          .eq('tournament_id', t.id)
          .or(t.registrationIds.map(id => `team1_id.eq.${id},team2_id.eq.${id}`).join(','))

        const { count: completedCount } = await supabase
          .from('tournament_matches')
          .select('id', { count: 'exact', head: true })
          .eq('tournament_id', t.id)
          .eq('status', 'completed')
          .or(t.registrationIds.map(id => `team1_id.eq.${id},team2_id.eq.${id}`).join(','))

        t.totalMatches = totalCount ?? 0
        t.completedMatches = completedCount ?? 0
        t.progress = t.totalMatches > 0 ? Math.round((t.completedMatches / t.totalMatches) * 100) : 0
      }

      setTournaments(tournamentList)
      setLoading(false)
    }

    fetch()
  }, [playerRegistrations])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.scrollWidth / tournaments.length
    const idx = Math.round(el.scrollLeft / cardWidth)
    setActiveIdx(idx)
  }, [tournaments.length])

  if (parentLoading || loading) {
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8EAEE',
        borderRadius: '16px', padding: '16px',
      }}>
        <div className="shimmer" style={{ width: '60%', height: '16px', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="shimmer" style={{ width: '40%', height: '12px', borderRadius: '4px', marginBottom: '12px' }} />
        <div className="shimmer" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
      </div>
    )
  }

  if (!tournaments.length) return null

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: '12px',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {tournaments.map((t, i) => {
          const badge = STATUS_BADGES[t.status] ?? STATUS_BADGES.active
          return (
            <div
              key={t.id}
              className="player-card-press"
              style={{
                flex: '0 0 85%',
                scrollSnapAlign: 'center',
                background: '#FFFFFF',
                border: '1px solid #E8EAEE',
                borderLeft: '3px solid #6BB3D9',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                ...(tournaments.length === 1 ? { flex: '0 0 100%' } : {}),
              }}
            >
              {/* Tournament name + badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  background: badge.bg, color: badge.color,
                  border: `1px solid ${badge.border}`,
                  borderRadius: '6px', padding: '2px 8px',
                  whiteSpace: 'nowrap',
                }}>
                  {badge.label}
                </span>
              </div>

              {/* Categories */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                {t.categories.map((cat, ci) => (
                  <span key={ci} style={{
                    fontSize: '10px', fontWeight: 500,
                    background: '#E8F4FA', color: '#3A8BB5',
                    borderRadius: '4px', padding: '2px 6px',
                  }}>
                    {cat}
                  </span>
                ))}
              </div>

              {/* Dates */}
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
                {formatDateShort(t.start_date)} - {formatDateShort(t.end_date)}
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  flex: 1, height: '6px', borderRadius: '3px',
                  background: '#E5E7EB', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${t.progress}%`, height: '100%',
                    background: '#6BB3D9', borderRadius: '3px',
                    transition: 'width 500ms ease-out',
                  }} />
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: '#6BB3D9',
                  fontFamily: 'DM Mono, monospace', minWidth: '32px', textAlign: 'right',
                }}>
                  {t.progress}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dots */}
      {tournaments.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
          {tournaments.map((_, i) => (
            <span key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: i === activeIdx ? '#6BB3D9' : 'transparent',
              border: `1.5px solid ${i === activeIdx ? '#6BB3D9' : '#D1D5DB'}`,
              transition: 'all 200ms',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
