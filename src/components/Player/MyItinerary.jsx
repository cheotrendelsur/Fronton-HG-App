import { useState, useEffect } from 'react'
import { mockScheduledMatches } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

const PHASE_LABELS = {
  group_phase: 'Grupos',
  quarterfinals: 'Cuartos',
  semifinals: 'Semifinal',
  final: 'Final',
  round_of_16: 'Octavos',
  round_of_32: '16avos',
}

const STATUS_STYLES = {
  scheduled: { label: 'Programado', bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
  pending: { label: 'Pendiente', bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
}

function formatDateES(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function formatTime(t) { return t ? t.slice(0, 5) : '' }

export default function MyItinerary({ tournamentId, categoryId, registrationIds }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (USE_MOCK) {
      // Filter mock matches by tournament and category
      const filtered = mockScheduledMatches.filter(m =>
        m.tournamentId === tournamentId &&
        m.categoryId === categoryId &&
        m.status === 'scheduled'
      ).map(m => ({
        id: m.id,
        phase: m.phase,
        status: m.status,
        scheduled_date: m.scheduledDate,
        scheduled_time: m.scheduledTime,
        team1Name: m.team1Name,
        team2Name: m.team2Name,
        courtName: m.courtName,
      }))
      setMatches(filtered)
      setLoading(false)
      return
    }

    // Real Supabase logic preserved below
    if (!tournamentId || !categoryId || !registrationIds?.length) {
      setMatches([])
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)
      const { supabase } = await import('../../lib/supabaseClient')
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          id, phase, status, scheduled_date, scheduled_time,
          team1_id, team2_id,
          team1:tournament_registrations!tournament_matches_team1_id_fkey ( team_name ),
          team2:tournament_registrations!tournament_matches_team2_id_fkey ( team_name ),
          courts ( name )
        `)
        .eq('tournament_id', tournamentId)
        .eq('category_id', categoryId)
        .or(registrationIds.map(id => `team1_id.eq.${id},team2_id.eq.${id}`).join(','))
        .in('status', ['scheduled', 'pending'])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })

      const result = (!error ? (data ?? []) : []).map(m => ({
        ...m,
        team1Name: m.team1?.team_name ?? null,
        team2Name: m.team2?.team_name ?? null,
        courtName: m.courts?.name ?? null,
      }))
      setMatches(result)
      setLoading(false)
    }

    fetch()
  }, [tournamentId, categoryId, registrationIds])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[0, 1].map(i => (
          <div key={i} style={{
            background: '#FFFFFF', border: '1px solid #E8EAEE',
            borderRadius: '12px', padding: '14px 16px',
          }}>
            <div className="shimmer" style={{ width: '30%', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
            <div className="shimmer" style={{ width: '70%', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
            <div className="shimmer" style={{ width: '50%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <path d="M22 4L12 14.01l-3-3"/>
        </svg>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#16A34A' }}>
          Todos los partidos completados
        </p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '20px' }}>
      {/* Timeline line */}
      <div style={{
        position: 'absolute', left: '7px', top: '8px', bottom: '8px',
        width: '2px', background: '#E0E2E6', borderRadius: '1px',
      }} />

      {matches.map((m, i) => {
        const phaseLabel = PHASE_LABELS[m.phase] ?? m.phase
        const statusStyle = STATUS_STYLES[m.status] ?? STATUS_STYLES.pending
        const team1 = m.team1Name ?? 'Por definir'
        const team2 = m.team2Name ?? 'Por definir'

        return (
          <div
            key={m.id}
            className="player-stagger-enter"
            style={{
              position: 'relative', marginBottom: '12px',
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Timeline dot */}
            <div style={{
              position: 'absolute', left: '-17px', top: '16px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: m.status === 'scheduled' ? '#6BB3D9' : '#F59E0B',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 0 2px #E0E2E6',
            }} />

            {/* Card */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #E8EAEE',
              borderRadius: '12px', padding: '12px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              {/* Phase + status badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  background: '#E8F4FA', color: '#3A8BB5',
                  borderRadius: '4px', padding: '2px 8px',
                }}>
                  {phaseLabel}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  background: statusStyle.bg, color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  borderRadius: '4px', padding: '2px 8px',
                }}>
                  {statusStyle.label}
                </span>
              </div>

              {/* Teams */}
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937', margin: '0 0 6px' }}>
                {team1} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '12px' }}>vs</span> {team2}
              </p>

              {/* Date, time, court */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#6B7280' }}>
                {m.scheduled_date && (
                  <span>{formatDateES(m.scheduled_date)}</span>
                )}
                {m.scheduled_time && (
                  <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
                    {formatTime(m.scheduled_time)}
                  </span>
                )}
                {m.courtName && (
                  <span>{m.courtName}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
