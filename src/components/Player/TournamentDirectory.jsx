import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockTournaments, mockPlayerRegistrations } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

const STATUS_BADGES = {
  inscription: { label: 'Inscripcion', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  active: { label: 'En curso', bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
  finished: { label: 'Finalizado', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  draft: { label: 'Borrador', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function formatFee(fee) {
  if (!fee || fee === 0) return 'Gratis'
  return `$${Number(fee).toLocaleString('es-AR')}`
}

const GRADIENTS = [
  'linear-gradient(135deg, #1B3A5C 0%, #2A5A8C 50%, #6BB3D9 100%)',
  'linear-gradient(135deg, #1B3A5C 0%, #3A6B8C 50%, #5A9BBF 100%)',
  'linear-gradient(135deg, #2A5A8C 0%, #1B3A5C 100%)',
]

export default function TournamentDirectory({ filters, playerRegistrationIds, onInscribe }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(10)
  const navigate = useNavigate()

  useEffect(() => {
    if (USE_MOCK) {
      // Filter mock tournaments
      let filtered = [...mockTournaments]

      // Text filter
      if (filters.text) {
        const q = filters.text.toLowerCase()
        filtered = filtered.filter(t => t.name.toLowerCase().includes(q))
      }

      // Status filter
      if (filters.statuses?.length) {
        filtered = filtered.filter(t => filters.statuses.includes(t.status))
      }

      // Date filters
      if (filters.dateFrom) {
        filtered = filtered.filter(t => t.startDate >= filters.dateFrom)
      }
      if (filters.dateTo) {
        filtered = filtered.filter(t => t.endDate <= filters.dateTo)
      }

      // Sort: inscription first, then active, then finished
      const order = { inscription: 0, active: 1, finished: 2 }
      filtered.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))

      // Adapt mock shape to match what the cards expect
      const adapted = filtered.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        start_date: t.startDate,
        end_date: t.endDate,
        location: t.location,
        inscription_fee: t.inscriptionFee,
        description: t.description,
        cover_image_url: t.coverImageUrl,
        categories: t.categories,
        courts: t.courts,
        // Mock inscribed check
        _mockInscribed: mockPlayerRegistrations.some(r => r.tournamentId === t.id),
        // Extra mock fields for detail page
        prizeDescription: t.prizeDescription,
        rulesSummary: t.rulesSummary,
      }))

      setTournaments(adapted)
      setLoading(false)
      setVisibleCount(10)
      return
    }

    // Real Supabase logic preserved below
    async function fetch() {
      setLoading(true)
      const { supabase } = await import('../../lib/supabaseClient')
      let query = supabase
        .from('tournaments')
        .select(`
          id, name, status, start_date, end_date, location,
          inscription_fee, description, cover_image_url,
          categories ( id, name, max_couples ),
          tournament_registrations ( id, player1_id, player2_id, status, category_id )
        `)
        .in('status', ['inscription', 'active', 'finished'])
        .order('created_at', { ascending: false })

      if (filters.text) query = query.ilike('name', `%${filters.text}%`)
      if (filters.statuses?.length) query = query.in('status', filters.statuses)
      if (filters.dateFrom) query = query.gte('start_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('end_date', filters.dateTo)

      const { data, error } = await query.limit(50)

      if (!error && data) {
        const order = { inscription: 0, active: 1, finished: 2, draft: 3 }
        data.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
        setTournaments(data)
      } else {
        setTournaments([])
      }
      setLoading(false)
      setVisibleCount(10)
    }

    fetch()
  }, [filters.text, filters.statuses, filters.dateFrom, filters.dateTo])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            background: '#FFFFFF', border: '1px solid #E8EAEE',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <div className="shimmer" style={{ height: '80px', width: '100%' }} />
            <div style={{ padding: '12px 16px' }}>
              <div className="shimmer" style={{ width: '60%', height: '16px', borderRadius: '4px', marginBottom: '8px' }} />
              <div className="shimmer" style={{ width: '40%', height: '12px', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!tournaments.length) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 16px',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          <path d="M8 11h6"/>
        </svg>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
          No se encontraron torneos
        </p>
        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
          Intenta ajustar los filtros de busqueda
        </p>
      </div>
    )
  }

  const visible = tournaments.slice(0, visibleCount)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: '12px',
      padding: '12px 0',
    }}
    className="tournament-grid"
    >
      {visible.map((t, i) => {
        const badge = STATUS_BADGES[t.status] ?? STATUS_BADGES.draft
        const catCount = t.categories?.length ?? 0
        const isInscribed = USE_MOCK
          ? t._mockInscribed
          : t.tournament_registrations?.some(
              r => r.status === 'approved' && playerRegistrationIds?.includes(r.id)
            )
        const gradient = GRADIENTS[i % GRADIENTS.length]

        return (
          <button
            key={t.id}
            onClick={() => navigate(`/player/torneos/${t.id}`)}
            className="player-stagger-enter player-card-press"
            style={{
              background: '#FFFFFF', border: '1px solid #E8EAEE',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Cover */}
            <div style={{
              height: '72px', width: '100%',
              background: t.cover_image_url ? `url(${t.cover_image_url}) center/cover` : gradient,
              position: 'relative',
            }}>
              {/* Status badge */}
              <span style={{
                position: 'absolute', top: '8px', right: '8px',
                fontSize: '10px', fontWeight: 600,
                background: badge.bg, color: badge.color,
                border: `1px solid ${badge.border}`,
                borderRadius: '6px', padding: '2px 8px',
              }}>
                {badge.label}
              </span>

              {/* Inscribed badge */}
              {isInscribed && (
                <span style={{
                  position: 'absolute', top: '8px', left: '8px',
                  fontSize: '10px', fontWeight: 600,
                  background: '#F0FDF4', color: '#16A34A',
                  border: '1px solid #BBF7D0',
                  borderRadius: '6px', padding: '2px 8px',
                  display: 'flex', alignItems: 'center', gap: '3px',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Inscrito
                </span>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '12px 16px' }}>
              <h3 style={{
                fontSize: '14px', fontWeight: 600, color: '#1F2937',
                marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {t.name}
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                {(t.start_date || t.end_date) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    {formatDateShort(t.start_date)} - {formatDateShort(t.end_date)}
                  </span>
                )}

                {t.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {t.location}
                  </span>
                )}

                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  {formatFee(t.inscription_fee)}
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16M4 12h16M4 18h12"/>
                  </svg>
                  {catCount} {catCount === 1 ? 'categoria' : 'categorias'}
                </span>
              </div>

              {/* Inscription button */}
              {t.status === 'inscription' && !isInscribed && onInscribe && (
                <button
                  onClick={(e) => { e.stopPropagation(); onInscribe(t) }}
                  aria-label="Solicitar inscripcion"
                  style={{
                    marginTop: '10px', width: '100%',
                    background: '#6BB3D9', color: '#FFFFFF',
                    border: 'none', borderRadius: '10px', padding: '10px',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(107,179,217,0.15)',
                    transition: 'all 200ms',
                  }}
                >
                  Solicitar Inscripcion
                </button>
              )}
            </div>
          </button>
        )
      })}

      {/* Load more */}
      {visibleCount < tournaments.length && (
        <button
          onClick={() => setVisibleCount(v => v + 10)}
          style={{
            background: '#F3F4F6', color: '#4B5563',
            border: 'none', borderRadius: '12px', padding: '12px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            width: '100%', textAlign: 'center',
            gridColumn: '1 / -1',
          }}
        >
          Cargar mas ({tournaments.length - visibleCount} restantes)
        </button>
      )}
    </div>
  )
}
