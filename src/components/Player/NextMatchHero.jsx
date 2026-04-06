import { useState, useEffect } from 'react'
import { mockScheduledMatches } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

function formatDateES(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

function getCountdown(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  const now = new Date()
  const target = new Date(`${dateStr}T${timeStr}`)
  const diff = target - now

  if (diff <= 0) return { text: 'Partido en curso', urgent: true }

  const totalMin = Math.floor(diff / 60000)
  const urgent = totalMin < 60

  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const mins = totalMin % 60

  // Check if today
  const today = new Date()
  const targetDate = new Date(dateStr + 'T00:00:00')
  if (today.toDateString() === targetDate.toDateString()) {
    return { text: `Hoy a las ${formatTime(timeStr)}`, urgent }
  }

  if (days > 0) return { text: `En ${days}d ${hours}h ${mins}m`, urgent }
  if (hours > 0) return { text: `En ${hours}h ${mins}m`, urgent }
  return { text: `En ${mins}m`, urgent }
}

export default function NextMatchHero({ registrationIds, loading: parentLoading }) {
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    if (USE_MOCK) {
      // Use first scheduled mock match
      const m = mockScheduledMatches[0] ?? null
      setMatch(m)
      setLoading(false)
      return
    }

    // Real Supabase logic preserved below
    if (!registrationIds?.length) {
      setLoading(false)
      setMatch(null)
      return
    }

    async function fetch() {
      setLoading(true)
      const { supabase } = await import('../../lib/supabaseClient')
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          id, scheduled_date, scheduled_time, phase, status,
          team1_id, team2_id,
          team1:tournament_registrations!tournament_matches_team1_id_fkey ( team_name ),
          team2:tournament_registrations!tournament_matches_team2_id_fkey ( team_name ),
          tournaments ( name ),
          categories ( name ),
          courts ( name )
        `)
        .or(registrationIds.map(id => `team1_id.eq.${id},team2_id.eq.${id}`).join(','))
        .eq('status', 'scheduled')
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        setMatch(data)
      } else {
        setMatch(null)
      }
      setLoading(false)
    }

    fetch()
  }, [registrationIds])

  // Live countdown
  useEffect(() => {
    const dateStr = USE_MOCK ? match?.scheduledDate : match?.scheduled_date
    const timeStr = USE_MOCK ? match?.scheduledTime : match?.scheduled_time
    if (!dateStr || !timeStr) return
    function tick() {
      setCountdown(getCountdown(dateStr, timeStr))
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [match])

  if (parentLoading || loading) return <NextMatchSkeleton />

  if (!match) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8EAEE',
          borderRadius: '16px',
          padding: '24px 16px',
          textAlign: 'center',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>
          No tienes partidos programados
        </p>
      </div>
    )
  }

  // Adapt field names based on mock vs real
  const tournamentName = USE_MOCK ? match.tournamentName : match.tournaments?.name
  const categoryName = USE_MOCK ? match.categoryName : match.categories?.name
  const team1Name = USE_MOCK ? match.team1Name : (match.team1?.team_name ?? 'Por definir')
  const team2Name = USE_MOCK ? match.team2Name : (match.team2?.team_name ?? 'Por definir')
  const courtName = USE_MOCK ? match.courtName : match.courts?.name
  const scheduledDate = USE_MOCK ? match.scheduledDate : match.scheduled_date
  const scheduledTime = USE_MOCK ? match.scheduledTime : match.scheduled_time
  const isPlayerTeam1 = USE_MOCK ? match.isPlayerTeam1 : registrationIds?.includes(match.team1_id)

  return (
    <div
      className="player-card-press"
      style={{
        background: 'linear-gradient(135deg, #1B3A5C 0%, #2A5A8C 50%, #6BB3D9 100%)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(27,58,92,0.25)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle decorative circle */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />

      {/* Tournament + category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, opacity: 0.9 }}>
          {tournamentName}
        </span>
        {categoryName && (
          <span style={{
            fontSize: '10px', fontWeight: 600,
            background: 'rgba(255,255,255,0.2)', borderRadius: '6px',
            padding: '2px 8px',
          }}>
            {categoryName}
          </span>
        )}
      </div>

      {/* VS block */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '12px', margin: '8px 0 16px',
      }}>
        <span style={{
          fontSize: '15px', fontWeight: isPlayerTeam1 ? 700 : 500,
          textAlign: 'right', flex: 1,
        }}>
          {team1Name}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 700, opacity: 0.6,
          letterSpacing: '0.05em',
        }}>
          VS
        </span>
        <span style={{
          fontSize: '15px', fontWeight: !isPlayerTeam1 ? 700 : 500,
          textAlign: 'left', flex: 1,
        }}>
          {team2Name}
        </span>
      </div>

      {/* Date, time, court */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '12px', opacity: 0.85,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span>{formatDateES(scheduledDate)}</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>
            {formatTime(scheduledTime)}
          </span>
        </div>

        {courtName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/>
              <path d="M12 3v18M2 12h20"/>
            </svg>
            <span>{courtName}</span>
          </div>
        )}
      </div>

      {/* Countdown */}
      {countdown && (
        <div style={{
          marginTop: '12px', textAlign: 'center',
          fontSize: '13px', fontWeight: 600,
          fontFamily: 'DM Mono, monospace',
          animation: countdown.urgent ? 'countdownPulse 2s ease-in-out infinite' : 'none',
        }}>
          {countdown.text}
        </div>
      )}
    </div>
  )
}

function NextMatchSkeleton() {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8EAEE',
      borderRadius: '16px', padding: '20px',
    }}>
      <div className="shimmer" style={{ width: '50%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
      <div className="shimmer" style={{ width: '80%', height: '18px', borderRadius: '4px', margin: '0 auto 16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="shimmer" style={{ width: '40%', height: '12px', borderRadius: '4px' }} />
        <div className="shimmer" style={{ width: '30%', height: '12px', borderRadius: '4px' }} />
      </div>
    </div>
  )
}
