/**
 * OrganizerInscriptionPanel — 3-tab panel for organizers to manage inscriptions.
 * Tabs: Pendientes | Aprobadas | Rechazadas
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'
import {
  getOrganizerPendingRegistrations,
  approveRegistration,
  rejectRegistration,
} from '../../../services/partnership/partnershipRequestPersistence'

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(diffMs / 86400000)
  return `Hace ${days}d`
}

const TABS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'approved', label: 'Aprobadas' },
  { key: 'rejected', label: 'Rechazadas' },
]

export default function OrganizerInscriptionPanel({ tournamentId }) {
  const { session } = useAuth()
  const organizerId = session?.user?.id
  const [activeTab, setActiveTab] = useState('pending')
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [rejected, setRejected] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!tournamentId || !organizerId) return
    setLoading(true)

    // Pending
    const pendingResult = await getOrganizerPendingRegistrations(supabase, tournamentId, organizerId)
    if (pendingResult.success) setPending(pendingResult.registrations)

    // Approved
    const { data: approvedData } = await supabase
      .from('tournament_registrations')
      .select(`
        id, team_name, category_id, status, decided_at,
        player1:profiles!tournament_registrations_player1_id_fkey ( username ),
        player2:profiles!tournament_registrations_player2_id_fkey ( username ),
        categories ( name )
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'approved')
      .order('decided_at', { ascending: false })
    setApproved(approvedData ?? [])

    // Rejected
    const { data: rejectedData } = await supabase
      .from('tournament_registrations')
      .select(`
        id, team_name, category_id, status, decided_at, rejected_reason,
        player1:profiles!tournament_registrations_player1_id_fkey ( username ),
        player2:profiles!tournament_registrations_player2_id_fkey ( username ),
        categories ( name )
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'rejected')
      .order('decided_at', { ascending: false })
    setRejected(rejectedData ?? [])

    setLoading(false)
  }, [tournamentId, organizerId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleApprove = async (regId) => {
    setProcessing(regId)
    const result = await approveRegistration(supabase, regId, organizerId)
    if (result.success) await fetchAll()
    setProcessing(null)
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setProcessing(rejectModal)
    const result = await rejectRegistration(supabase, rejectModal, organizerId, rejectReason || null)
    if (result.success) {
      setRejectModal(null)
      setRejectReason('')
      await fetchAll()
    }
    setProcessing(null)
  }

  const counts = { pending: pending.length, approved: approved.length, rejected: rejected.length }

  return (
    <div>
      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #E0E2E6', marginBottom: '16px',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-label={tab.label}
              style={{
                flex: 1, padding: '10px 8px', border: 'none', background: 'transparent',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                color: isActive ? '#6BB3D9' : '#6B7280',
                borderBottom: isActive ? '2px solid #6BB3D9' : '2px solid transparent',
                transition: 'all 200ms',
              }}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span style={{
                  marginLeft: '4px', fontSize: '10px', fontWeight: 600,
                  background: isActive ? '#E8F4FA' : '#F3F4F6',
                  color: isActive ? '#3A8BB5' : '#6B7280',
                  borderRadius: '10px', padding: '1px 6px',
                }}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0,1,2].map(i => <div key={i} className="shimmer" style={{ height: '60px', borderRadius: '12px' }} />)}
        </div>
      ) : activeTab === 'pending' ? (
        pending.length === 0 ? (
          <EmptyState text="No hay inscripciones pendientes" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map((reg, i) => (
              <div key={reg.id} className="player-stagger-enter" style={{
                background: '#FFFFFF', border: '1px solid #E8EAEE',
                borderRadius: '12px', padding: '12px 16px',
                animationDelay: `${i * 50}ms`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{reg.team_name}</p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>
                      {reg.player1?.username ?? '?'} + {reg.player2?.username ?? '?'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 500, background: '#E8F4FA', color: '#3A8BB5',
                    borderRadius: '6px', padding: '2px 8px', border: '1px solid #D0E5F0',
                  }}>
                    {reg.categories?.name ?? 'Categoría'}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '10px' }}>
                  Solicitado {formatRelativeTime(reg.requested_at || reg.created_at)}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setRejectModal(reg.id); setRejectReason('') }}
                    disabled={processing === reg.id}
                    aria-label="Rechazar inscripcion"
                    style={{
                      flex: 1, background: '#FFFFFF', color: '#EF4444',
                      border: '1px solid #FECACA', borderRadius: '10px', padding: '8px',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    }}>
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(reg.id)}
                    disabled={processing === reg.id}
                    aria-label="Aprobar inscripcion"
                    style={{
                      flex: 1, background: '#6BB3D9', color: '#FFFFFF',
                      border: 'none', borderRadius: '10px', padding: '8px',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      opacity: processing === reg.id ? 0.7 : 1,
                    }}>
                    {processing === reg.id ? '...' : 'Aprobar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'approved' ? (
        approved.length === 0 ? (
          <EmptyState text="No hay inscripciones aprobadas" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {approved.map(reg => (
              <div key={reg.id} style={{
                background: '#FFFFFF', border: '1px solid #E8EAEE',
                borderLeft: '3px solid #22C55E',
                borderRadius: '12px', padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{reg.team_name}</p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>{reg.categories?.name}</p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, background: '#F0FDF4', color: '#16A34A', borderRadius: '6px', padding: '2px 8px', border: '1px solid #BBF7D0' }}>Aprobada</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        rejected.length === 0 ? (
          <EmptyState text="No hay inscripciones rechazadas" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rejected.map(reg => (
              <div key={reg.id} style={{
                background: '#FFFFFF', border: '1px solid #E8EAEE',
                borderLeft: '3px solid #EF4444',
                borderRadius: '12px', padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: reg.rejected_reason ? '6px' : 0 }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{reg.team_name}</p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>{reg.categories?.name}</p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, background: '#FEF2F2', color: '#EF4444', borderRadius: '6px', padding: '2px 8px', border: '1px solid #FECACA' }}>Rechazada</span>
                </div>
                {reg.rejected_reason && (
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, fontStyle: 'italic' }}>
                    Razon: {reg.rejected_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div onClick={() => setRejectModal(null)} style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 200ms ease-out',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#FFFFFF', borderRadius: '16px', padding: '20px',
            width: '90%', maxWidth: '360px', animation: 'playerPageEnter 200ms ease-out both',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Razon del rechazo
            </h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Razon (opcional)..."
              rows={3}
              style={{
                width: '100%', background: '#FFFFFF', border: '1px solid #E0E2E6',
                borderRadius: '12px', padding: '12px', fontSize: '13px',
                color: '#1F2937', resize: 'none', outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setRejectModal(null)}
                style={{ flex: 1, background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleReject} disabled={processing === rejectModal}
                style={{ flex: 1, background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: processing ? 0.7 : 1 }}>
                {processing ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
        <rect x="2" y="3" width="20" height="18" rx="2"/>
        <path d="M8 7h8M8 11h5"/>
      </svg>
      <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{text}</p>
    </div>
  )
}
