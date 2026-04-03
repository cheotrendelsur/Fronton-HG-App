import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/notificationPersistence'
import BrandLoader from './BrandLoader'

/**
 * Returns a human-readable relative time string in Spanish.
 */
function formatRelativeTime(createdAt) {
  const now = Date.now()
  const then = new Date(createdAt).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`

  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(diffMs / 86_400_000)
  if (days < 7) return `Hace ${days} d`

  return new Date(createdAt).toLocaleDateString('es-ES')
}

const TYPE_CONFIG = {
  setback: { color: '#F59E0B', label: 'Contratiempo' },
  schedule_change: { color: '#10B981', label: 'Cambio de horario' },
  general: { color: '#3B82F6', label: 'General' },
}

export default function NotificationPanel({ onClose, onCountChange }) {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch notifications on mount
  useEffect(() => {
    async function load() {
      if (!profile?.id) {
        setLoading(false)
        return
      }
      const result = await getUserNotifications(supabase, profile.id)
      if (result.success) {
        setNotifications(result.data)
      }
      setLoading(false)
    }
    load()
  }, [profile?.id])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleMarkRead = async (notification) => {
    if (notification.read) return
    await markNotificationRead(supabase, notification.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
    onCountChange((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    if (!profile?.id) return
    await markAllNotificationsRead(supabase, profile.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    onCountChange(0)
  }

  const hasUnread = notifications.some((n) => !n.read)

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9998,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: 'min(360px, 85vw)',
          background: '#FFFFFF',
          zIndex: 9999,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          transform: 'translateX(0)',
          transition: 'transform 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '1px solid #E0E2E6',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1F2937',
            }}
          >
            Notificaciones
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Cerrar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mark all as read */}
        {hasUnread && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6BB3D9',
                fontSize: '13px',
                fontWeight: 500,
                padding: '8px 16px',
              }}
            >
              Marcar todo como leido
            </button>
          </div>
        )}

        {/* Notification list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
          {loading && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '48px',
              }}
            >
              <BrandLoader size={32} />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div
              style={{
                fontSize: '14px',
                color: '#9CA3AF',
                textAlign: 'center',
                paddingTop: '48px',
              }}
            >
              No tienes notificaciones
            </div>
          )}

          {!loading &&
            notifications.map((notification) => {
              const typeConfig =
                TYPE_CONFIG[notification.type] || TYPE_CONFIG.general

              return (
                <div
                  key={notification.id}
                  onClick={() => handleMarkRead(notification)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: notification.read ? '#FFFFFF' : '#F0F7FF',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  {/* Unread dot */}
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      minWidth: '8px',
                      borderRadius: '9999px',
                      background: '#3B82F6',
                      marginTop: '4px',
                      visibility: notification.read ? 'hidden' : 'visible',
                    }}
                  />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Type label */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '2px',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '9999px',
                          background: typeConfig.color,
                          display: 'inline-block',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: typeConfig.color,
                        }}
                      >
                        {typeConfig.label}
                      </span>
                    </div>

                    {/* Message */}
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#374151',
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.message}
                    </div>

                    {/* Timestamp */}
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9CA3AF',
                        marginTop: '4px',
                      }}
                    >
                      {formatRelativeTime(notification.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </>,
    document.body
  )
}
