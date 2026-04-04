/**
 * PartnershipRequestCard — Card shown to the partner who needs to accept/decline.
 */
import { useState } from 'react'

function formatRelativeTime(createdAt) {
  const now = Date.now()
  const then = new Date(createdAt).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(diffMs / 86400000)
  return `Hace ${days}d`
}

export default function PartnershipRequestCard({ request, onAccept, onDecline }) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const requester = request.requester
  const tournamentName = request.tournaments?.name ?? 'Torneo'
  const categoryName = request.categories?.name ?? 'Categoría'
  const requesterName = requester?.username ?? 'Jugador'
  const initial = requesterName.charAt(0).toUpperCase()

  const handleAccept = async () => {
    setProcessing(true)
    const result = await onAccept(request.id)
    if (result?.success) {
      setDismissed(true)
    }
    setProcessing(false)
  }

  const handleDecline = async () => {
    setProcessing(true)
    const result = await onDecline(request.id, reason || null)
    if (result?.success) {
      setDismissed(true)
    }
    setProcessing(false)
  }

  if (dismissed) return null

  return (
    <div
      className="player-stagger-enter"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8EAEE',
        borderLeft: '3px solid #6BB3D9',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'opacity 300ms, transform 300ms',
        opacity: dismissed ? 0 : 1,
        transform: dismissed ? 'translateX(100%)' : 'translateX(0)',
      }}
    >
      {/* Header: avatar + requester info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        {requester?.avatar_url ? (
          <img src={requester.avatar_url} alt={requesterName}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6BB3D9, #1B3A5C)',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 600,
          }}>
            {initial}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{requesterName}</p>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '1px 0 0' }}>
            {formatRelativeTime(request.created_at)}
          </p>
        </div>
      </div>

      {/* Tournament + category */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '11px', fontWeight: 500, background: '#F3F4F6', color: '#6B7280',
          borderRadius: '6px', padding: '2px 8px', border: '1px solid #E0E2E6',
        }}>
          {tournamentName}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 500, background: '#E8F4FA', color: '#3A8BB5',
          borderRadius: '6px', padding: '2px 8px', border: '1px solid #D0E5F0',
        }}>
          {categoryName}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '12px' }}>
        Te solicita ser su pareja en este torneo.
      </p>

      {showRejectForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Razon del rechazo (opcional)..."
            rows={2}
            style={{
              width: '100%', background: '#FFFFFF', border: '1px solid #E0E2E6',
              borderRadius: '10px', padding: '10px 12px', fontSize: '13px',
              color: '#1F2937', resize: 'none', outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowRejectForm(false)} disabled={processing}
              style={{
                flex: 1, background: '#F3F4F6', color: '#4B5563',
                border: 'none', borderRadius: '10px', padding: '10px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}>
              Cancelar
            </button>
            <button onClick={handleDecline} disabled={processing}
              aria-label="Confirmar rechazo"
              style={{
                flex: 1, background: '#EF4444', color: '#FFFFFF',
                border: 'none', borderRadius: '10px', padding: '10px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                opacity: processing ? 0.7 : 1,
              }}>
              {processing ? 'Enviando...' : 'Confirmar rechazo'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowRejectForm(true)} disabled={processing}
            aria-label="Rechazar solicitud"
            style={{
              flex: 1, background: '#FFFFFF', color: '#EF4444',
              border: '1px solid #FECACA', borderRadius: '10px', padding: '10px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 200ms',
            }}>
            Rechazar
          </button>
          <button onClick={handleAccept} disabled={processing}
            aria-label="Aceptar solicitud de pareja"
            style={{
              flex: 1, background: '#6BB3D9', color: '#FFFFFF',
              border: 'none', borderRadius: '10px', padding: '10px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 12px rgba(107,179,217,0.15)',
              opacity: processing ? 0.7 : 1, transition: 'all 200ms',
            }}>
            {processing ? 'Aceptando...' : 'Aceptar'}
          </button>
        </div>
      )}
    </div>
  )
}
