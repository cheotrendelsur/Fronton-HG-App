import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { getUnreadCount } from '../../lib/notificationPersistence'

const icons = {
  home: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9M19 10L21 12M19 10V20C19 20.55 18.55 21 18 21H15M9 21V15C9 14.45 9.45 14 10 14H14C14.55 14 15 14.45 15 15V21M9 21H15"/>
    </svg>
  ),
  trophy: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21H16M12 17V21M6 3H18V10C18 13.31 15.31 16 12 16C8.69 16 6 13.31 6 10V3Z"/>
      <path d="M6 5H3V8C3 9.66 4.34 11 6 11"/>
      <path d="M18 5H21V8C21 9.66 19.66 11 18 11"/>
    </svg>
  ),
  chart: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20H21M5 20V14M9 20V8M13 20V11M17 20V4"/>
    </svg>
  ),
  user: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20"/>
    </svg>
  ),
}

const navItems = [
  { to: '/player',               label: 'Inicio',        icon: 'home',   exact: true },
  { to: '/player/torneos',       label: 'Torneos',       icon: 'trophy', exact: false },
  { to: '/player/clasificacion', label: 'Clasificacion', icon: 'chart',  exact: true },
  { to: '/player/perfil',        label: 'Perfil',        icon: 'user',   exact: true },
]

export default function PlayerBottomNav() {
  const location = useLocation()
  const { profile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    let timer = null
    async function fetchCount() {
      const result = await getUnreadCount(supabase, profile.id)
      if (result.success) setUnreadCount(result.count)
    }
    fetchCount()
    timer = setInterval(fetchCount, 30000)
    return () => { if (timer) clearInterval(timer) }
  }, [profile?.id])

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 player-bottom-nav-hide-landscape"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #D0E5F0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ to, label, icon, exact }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname === to || location.pathname.startsWith(to + '/')

          return (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:opacity-70 transition-opacity duration-150"
            >
              {/* Active pill indicator */}
              {isActive && (
                <span
                  className="absolute top-1.5 rounded-full"
                  style={{
                    width: '16px',
                    height: '3px',
                    background: '#6BB3D9',
                    boxShadow: '0 0 8px rgba(107,179,217,0.5)',
                    animation: 'playerNavPill 300ms ease-out',
                  }}
                />
              )}

              {/* Icon with scale animation */}
              <span
                className="transition-all duration-200"
                style={{
                  color: isActive ? '#6BB3D9' : '#9CA3AF',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  position: 'relative',
                }}
              >
                {icons[icon](isActive)}
                {/* Unread badge on home icon */}
                {icon === 'home' && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-6px',
                    background: '#EF4444', color: '#FFFFFF',
                    fontSize: '9px', fontWeight: 700,
                    minWidth: '14px', height: '14px', borderRadius: '7px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className="text-[10px] tracking-wide transition-colors duration-200"
                style={{
                  color: isActive ? '#6BB3D9' : '#9CA3AF',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
