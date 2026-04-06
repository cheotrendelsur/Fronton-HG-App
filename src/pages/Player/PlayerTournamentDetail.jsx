import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockTournaments, mockPlayerRegistrations } from '../../mockData'
import usePlayerContext from '../../hooks/usePlayerContext'
import InscriptionFlowModal from '../../components/Player/inscription/InscriptionFlowModal'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

const STATUS_BADGES = {
  inscription: { label: 'Inscripcion abierta', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  active: { label: 'En curso', bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
  finished: { label: 'Finalizado', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
}

const GRADIENTS = [
  'linear-gradient(135deg, #1B3A5C 0%, #2A5A8C 50%, #6BB3D9 100%)',
]

function formatDateES(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function formatFee(fee) {
  if (!fee || fee === 0) return 'Gratis'
  return `$${Number(fee).toLocaleString('es-AR')}`
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E0E2E6',
      borderRadius: '16px', overflow: 'hidden', marginBottom: '12px',
    }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #E8EAEE',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#6B7280',
        }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  )
}

export default function PlayerTournamentDetail() {
  const { tournamentId } = useParams()
  const navigate = useNavigate()
  const { playerId, playerRegistrations, refetch } = usePlayerContext()

  const [tournament, setTournament] = useState(null)
  const [days, setDays] = useState([])
  const [catCounts, setCatCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showInscription, setShowInscription] = useState(false)

  useEffect(() => {
    if (USE_MOCK) {
      // Find tournament in mock data
      const found = mockTournaments.find(t => t.id === tournamentId)
      if (found) {
        // Adapt mock shape
        setTournament({
          id: found.id,
          name: found.name,
          status: found.status,
          start_date: found.startDate,
          end_date: found.endDate,
          location: found.location,
          inscription_fee: found.inscriptionFee,
          description: found.description,
          cover_image_url: found.coverImageUrl,
          prize_description: found.prizeDescription,
          rules_summary: found.rulesSummary,
          categories: found.categories.map(c => ({
            id: c.id,
            name: c.name,
            max_couples: c.maxCouples,
          })),
          courts: found.courts,
        })
        // Build cat counts from mock enrolledCount
        const counts = {}
        for (const cat of found.categories) {
          counts[cat.id] = cat.enrolledCount
        }
        setCatCounts(counts)
        setDays(found.days ? found.days.map(d => ({ day_date: d })) : [])
      }
      setLoading(false)
      return
    }

    // Real Supabase logic preserved below
    async function load() {
      setLoading(true)
      const { supabase } = await import('../../lib/supabaseClient')

      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id, name, status, start_date, end_date, location,
          inscription_fee, description, cover_image_url,
          prize_description, rules_summary, scoring_config,
          categories ( id, name, max_couples ),
          courts ( id, name )
        `)
        .eq('id', tournamentId)
        .single()

      if (!error && data) setTournament(data)

      const { data: daysData } = await supabase
        .from('tournament_days')
        .select('day_date')
        .eq('tournament_id', tournamentId)
        .order('day_date', { ascending: true })

      setDays(daysData ?? [])

      if (data?.categories) {
        const counts = {}
        for (const cat of data.categories) {
          const { count } = await supabase
            .from('tournament_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId)
            .eq('category_id', cat.id)
            .eq('status', 'approved')
          counts[cat.id] = count ?? 0
        }
        setCatCounts(counts)
      }

      setLoading(false)
    }

    load()
  }, [tournamentId])

  // Player's registrations for this tournament
  const myRegs = USE_MOCK
    ? mockPlayerRegistrations.filter(r => r.tournamentId === tournamentId)
    : playerRegistrations.filter(r => r.tournament_id === tournamentId)

  if (loading) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        <div className="shimmer" style={{ height: '140px', borderRadius: '16px', marginBottom: '16px' }} />
        <div className="shimmer" style={{ width: '60%', height: '20px', borderRadius: '4px', marginBottom: '12px' }} />
        <div className="shimmer" style={{ width: '80%', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="shimmer" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Torneo no encontrado</p>
        <button
          onClick={() => navigate('/player/torneos')}
          style={{
            marginTop: '12px', background: '#6BB3D9', color: '#FFFFFF',
            border: 'none', borderRadius: '12px', padding: '10px 24px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Volver a torneos
        </button>
      </div>
    )
  }

  const badge = STATUS_BADGES[tournament.status] ?? STATUS_BADGES.finished
  const categories = tournament.categories ?? []
  const courts = tournament.courts ?? []
  const allCatsFull = categories.length > 0 && categories.every(cat =>
    cat.max_couples > 0 && (catCounts[cat.id] ?? 0) >= cat.max_couples
  )
  const allCatsInscribed = USE_MOCK
    ? categories.length > 0 && categories.every(cat =>
        myRegs.some(r => r.categoryId === cat.id)
      )
    : false
  const canInscribe = tournament.status === 'inscription' && !allCatsFull && !allCatsInscribed

  return (
    <div className="player-detail-enter" style={{ maxWidth: '480px', margin: '0 auto' }}>
      {/* Cover image */}
      <div style={{
        height: '160px', width: '100%', position: 'relative',
        background: tournament.cover_image_url
          ? `url(${tournament.cover_image_url}) center/cover`
          : GRADIENTS[0],
        borderRadius: '0 0 20px 20px',
      }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/player/torneos')}
          aria-label="Volver a torneos"
          style={{
            position: 'absolute', top: '12px', left: '12px',
            width: '36px', height: '36px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.9)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {/* Status badge */}
        <span style={{
          position: 'absolute', top: '12px', right: '12px',
          fontSize: '10px', fontWeight: 600,
          background: badge.bg, color: badge.color,
          border: `1px solid ${badge.border}`,
          borderRadius: '6px', padding: '3px 10px',
        }}>
          {badge.label}
        </span>

        {/* Tournament name overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 20px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
          borderRadius: '0 0 20px 20px',
        }}>
          <h1 style={{
            fontSize: '20px', fontWeight: 700, color: '#FFFFFF',
            letterSpacing: '-0.02em', margin: 0,
          }}>
            {tournament.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>

        {/* My inscriptions */}
        {myRegs.length > 0 && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '12px',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Estas inscrito
            </span>
            {myRegs.map(r => (
              <div key={USE_MOCK ? r.id : r.id} style={{ marginTop: '6px', fontSize: '13px', color: '#1F2937' }}>
                <span style={{ fontWeight: 500 }}>{USE_MOCK ? r.categoryName : r.categories?.name}</span>
                <span style={{ color: '#6B7280' }}> — {USE_MOCK ? r.teamName : r.team_name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <SectionCard title="Informacion">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Dates */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <div style={{ fontSize: '13px', color: '#1F2937' }}>
                {days.length > 0 ? (
                  days.map(d => (
                    <div key={d.day_date} style={{ marginBottom: '2px' }}>
                      {formatDateES(d.day_date)}
                    </div>
                  ))
                ) : (
                  <span>{formatDateES(tournament.start_date)} - {formatDateES(tournament.end_date)}</span>
                )}
              </div>
            </div>

            {/* Location */}
            {tournament.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span style={{ fontSize: '13px', color: '#1F2937' }}>{tournament.location}</span>
              </div>
            )}

            {/* Fee */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
              <span style={{ fontSize: '13px', color: '#1F2937' }}>
                {formatFee(tournament.inscription_fee)}
              </span>
            </div>

            {/* Description */}
            {tournament.description && (
              <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, marginTop: '4px' }}>
                {tournament.description}
              </p>
            )}
          </div>
        </SectionCard>

        {/* Categories */}
        <SectionCard title="Categorias">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map(cat => {
              const count = catCounts[cat.id] ?? 0
              const isFull = cat.max_couples > 0 && count >= cat.max_couples
              return (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#F9FAFB', borderRadius: '10px', padding: '10px 14px',
                  border: '1px solid #E8EAEE',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>{cat.name}</span>
                    {isFull && (
                      <span style={{
                        fontSize: '9px', fontWeight: 600,
                        background: '#FEF2F2', color: '#EF4444',
                        border: '1px solid #FECACA',
                        borderRadius: '4px', padding: '1px 6px',
                      }}>
                        Completa
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: isFull ? '#EF4444' : '#9CA3AF',
                    fontFamily: 'DM Mono, monospace',
                  }}>
                    {count}/{cat.max_couples} parejas
                  </span>
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* Courts */}
        {courts.length > 0 && (
          <SectionCard title="Canchas">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {courts.map(c => (
                <span key={c.id} style={{
                  fontSize: '12px', fontWeight: 500,
                  background: '#E8F4FA', color: '#3A8BB5',
                  borderRadius: '8px', padding: '6px 12px',
                }}>
                  {c.name}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Prize */}
        {tournament.prize_description && (
          <SectionCard title="Premiacion">
            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {tournament.prize_description}
            </p>
          </SectionCard>
        )}

        {/* Rules */}
        {tournament.rules_summary && (
          <SectionCard title="Reglamento">
            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {tournament.rules_summary}
            </p>
          </SectionCard>
        )}

        {/* Spacer for sticky button */}
        {(canInscribe || allCatsInscribed) && <div style={{ height: '72px' }} />}
      </div>

      {/* Sticky inscription button */}
      {canInscribe && (
        <div style={{
          position: 'fixed', bottom: '80px', left: 0, right: 0,
          padding: '12px 16px',
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          background: 'linear-gradient(transparent, #F2F3F5 30%)',
          zIndex: 30,
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <button
              onClick={() => setShowInscription(true)}
              aria-label="Inscribirme en este torneo"
              className="player-card-press"
              style={{
                width: '100%', background: '#6BB3D9', color: '#FFFFFF',
                border: 'none', borderRadius: '14px', padding: '14px',
                fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(107,179,217,0.3)',
                transition: 'all 200ms',
              }}
            >
              Inscribirme
            </button>
          </div>
        </div>
      )}

      {/* Disabled button if already inscribed in all categories */}
      {allCatsInscribed && !canInscribe && tournament.status === 'inscription' && (
        <div style={{
          position: 'fixed', bottom: '80px', left: 0, right: 0,
          padding: '12px 16px',
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          background: 'linear-gradient(transparent, #F2F3F5 30%)',
          zIndex: 30,
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <button
              disabled
              style={{
                width: '100%', background: '#E5E7EB', color: '#9CA3AF',
                border: 'none', borderRadius: '14px', padding: '14px',
                fontSize: '15px', fontWeight: 600, cursor: 'not-allowed',
              }}
            >
              Ya estas inscrito
            </button>
          </div>
        </div>
      )}

      {/* Inscription modal */}
      {showInscription && tournament && (
        <InscriptionFlowModal
          tournament={tournament}
          playerId={USE_MOCK ? 'mock-player-001' : playerId}
          onClose={() => setShowInscription(false)}
          onSuccess={() => { if (!USE_MOCK) refetch() }}
        />
      )}
    </div>
  )
}
