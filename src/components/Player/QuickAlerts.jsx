import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { markNotificationRead } from '../../lib/notificationPersistence'

function formatRelativeTime(createdAt) {
  const now = Date.now()
  const then = new Date(createdAt).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(diffMs / 86400000)
  if (days < 7) return `Hace ${days}d`
  return new Date(createdAt).toLocaleDateString('es-ES')
}

const TYPE_ICONS = {
  schedule_change: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  setback: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  partnership_request: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6BB3D9" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  partnership_accepted: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 11l-3 3-1.5-1.5"/>
    </svg>
  ),
  partnership_declined: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M18 9l4 4m0-4l-4 4"/>
    </svg>
  ),
  registration_approved: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  registration_rejected: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
    </svg>
  ),
  general: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
}

export default function QuickAlerts({ playerId, onUnreadCountChange }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [dismissing, setDismissing] = useState(new Set())

  useEffect(() => {
    if (!playerId) {
      setAlerts([])
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', playerId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && data) {
        setAlerts(data)
        onUnreadCountChange?.(data.length)
      }
      setLoading(false)
    }

    fetch()
  }, [playerId])

  const handleDismiss = async (alert) => {
    setDismissing(prev => new Set([...prev, alert.id]))

    // Wait for slide-out animation
    setTimeout(async () => {
      await markNotificationRead(supabase, alert.id)
      setAlerts(prev => {
        const next = prev.filter(a => a.id !== alert.id)
        onUnreadCountChange?.(next.length)
        return next
      })
      setDismissing(prev => {
        const next = new Set(prev)
        next.delete(alert.id)
        return next
      })
    }, 300)
  }

  if (loading || !alerts.length) return null

  const visibleAlerts = expanded ? alerts : alerts.slice(0, 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {visibleAlerts.map((alert, i) => {
        const isDismissing = dismissing.has(alert.id)
        return (
          <div
            key={alert.id}
            role="button"
            aria-label="Marcar alerta como leida"
            onClick={() => handleDismiss(alert)}
            className="player-stagger-enter player-card-press"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: '#FFFFFF', border: '1px solid #E8EAEE',
              borderRadius: '12px', padding: '10px 14px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              animationDelay: `${i * 80}ms`,
              opacity: isDismissing ? 0 : 1,
              transform: isDismissing ? 'translateX(100%)' : 'translateX(0)',
              transition: 'opacity 300ms ease-out, transform 300ms ease-out',
            }}
          >
            <span style={{ flexShrink: 0, marginTop: '1px' }}>
              {TYPE_ICONS[alert.type] ?? TYPE_ICONS.general}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.4, margin: 0 }}>
                {alert.message}
              </p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>
                {formatRelativeTime(alert.created_at)}
              </p>
            </div>
          </div>
        )
      })}

      {!expanded && alerts.length > 2 && (
        <button
          onClick={() => setExpanded(true)}
          aria-label="Ver todas las alertas"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500, color: '#6BB3D9',
            padding: '4px 0', textAlign: 'center',
          }}
        >
          Ver todas ({alerts.length})
        </button>
      )}
    </div>
  )
}
