import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getUnreadCount } from '../lib/notificationPersistence'
import NotificationPanel from './NotificationPanel'

const POLL_INTERVAL_MS = 30_000

export default function NotificationBell() {
  const { profile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Fetch count on mount, when panel closes, and poll every 30s
  useEffect(() => {
    if (!profile?.id) return

    let timer = null

    async function fetchCount() {
      const result = await getUnreadCount(supabase, profile.id)
      if (result.success && mountedRef.current) {
        setUnreadCount(result.count)
      }
    }

    fetchCount()
    timer = setInterval(fetchCount, POLL_INTERVAL_MS)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [profile?.id, panelOpen])

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen((prev) => !prev)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Notificaciones"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1F2937"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <NotificationPanel
          onClose={() => setPanelOpen(false)}
          onCountChange={setUnreadCount}
        />
      )}
    </>
  )
}
