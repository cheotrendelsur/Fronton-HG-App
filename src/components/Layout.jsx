import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLoader from './BrandLoader'
import NotificationBell from './NotificationBell'
import lobo from '../assets/lobo.png'

const PAGE_TITLES = {
  '/dashboard':          'Inicio',
  '/tournaments':        'Torneos',
  '/tournaments/create': 'Crear torneo',
  '/standings':          'Clasificación',
  '/profile':            'Perfil',
  '/organizer/hub':      'Hub',
  '/results/input':      'Marcadores',
  '/admin':              'Administración',
}

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
  plus: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v8M8 12h8"/>
    </svg>
  ),
  hub: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  results: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  shield: (active) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L4 7v5c0 4.42 3.37 8.57 8 9.93C16.63 20.57 20 16.42 20 12V7l-8-4z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
}

const playerNavItems = [
  { to: '/dashboard',   label: 'Inicio',        icon: 'home'   },
  { to: '/tournaments', label: 'Torneos',        icon: 'trophy' },
  { to: '/standings',   label: 'Clasificación',  icon: 'chart'  },
  { to: '/profile',     label: 'Perfil',         icon: 'user'   },
]

const organizerNavItems = [
  { to: '/dashboard',          label: 'Inicio',     icon: 'home'    },
  { to: '/tournaments',        label: 'Torneos',    icon: 'trophy'  },
  { to: '/tournaments/create', label: 'Crear',      icon: 'plus'    },
  { to: '/results/input',      label: 'Marcadores', icon: 'results' },
  { to: '/profile',            label: 'Perfil',     icon: 'user'    },
]

const adminNavItems = [
  { to: '/dashboard', label: 'Inicio',  icon: 'home'   },
  { to: '/admin',     label: 'Admin',   icon: 'shield' },
  { to: '/profile',   label: 'Perfil',  icon: 'user'   },
]

function SyncOverlay() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
      <BrandLoader size={40} />
      <p className="text-[10px] uppercase tracking-widest" style={{ color: '#9CA3AF', animation: 'pulse 2s ease-in-out infinite' }}>
        Verificando sesión
      </p>
    </div>
  )
}

export default function Layout({ children }) {
  const location               = useLocation()
  const { profile, isSyncing } = useAuth()
  const role                   = profile?.role

  const navItems =
    role === 'admin'     ? adminNavItems     :
    role === 'organizer' ? organizerNavItems :
    playerNavItems

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Frontón HGV'

  return (
    <div className="min-h-[100dvh]" style={{ background: '#F2F3F5' }}>

      {/* Header superior */}
      <header
        className="fixed top-0 left-0 w-full z-40"
        style={{
          background:  '#F2F3F5',
          borderBottom: '1px solid #E0E2E6',
        }}
      >
        <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
          {/* Título de página */}
          <span
            style={{
              color:      '#1F2937',
              fontSize:   '16px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {pageTitle}
          </span>

          {/* Right side: bell + identity */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span
              style={{
                color:    '#6B7280',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Comisión de Frontón
            </span>
            <img
              src={lobo}
              alt="HGV"
              style={{
                width:     'auto',
                height:    '32px',
                objectFit: 'contain',
                display:   'block',
              }}
            />
          </div>
        </div>
      </header>

      {/* Contenido principal — offset por header (56px) y nav (96px) */}
      <main className="pt-14 pb-24">
        {isSyncing ? <SyncOverlay /> : children}
      </main>

      {/* Nav inferior */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50"
        style={{
          background:    '#E8F4FA',
          borderTop:     '1px solid #D0E5F0',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
          {navItems.map(({ to, label, icon }) => {
            const isCreate = to === '/tournaments/create'
            const isAdmin  = to === '/admin'

            const isActive = isCreate || isAdmin
              ? location.pathname === to
              : location.pathname === to ||
                (to !== '/dashboard' &&
                 to !== '/tournaments' &&
                 location.pathname.startsWith(to))

            if (isCreate) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:opacity-70 transition-opacity duration-150"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      background: location.pathname === to
                        ? '#6BB3D9'
                        : 'rgba(107,179,217,0.12)',
                      color: location.pathname === to ? '#FFFFFF' : '#6BB3D9',
                      border: '1px solid rgba(107,179,217,0.30)',
                    }}
                  >
                    {icons[icon](location.pathname === to)}
                  </span>
                  <span
                    className="text-[10px] font-medium tracking-wide"
                    style={{ color: '#6BB3D9' }}
                  >
                    {label}
                  </span>
                </NavLink>
              )
            }

            if (isAdmin) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:opacity-70 transition-opacity duration-150"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      background: location.pathname === to
                        ? 'rgba(107,179,217,0.20)'
                        : 'rgba(107,179,217,0.08)',
                      color:  '#6BB3D9',
                      border: '1px solid rgba(107,179,217,0.25)',
                    }}
                  >
                    {icons[icon](location.pathname === to)}
                  </span>
                  <span
                    className="text-[10px] font-medium tracking-wide"
                    style={{ color: '#6BB3D9' }}
                  >
                    {label}
                  </span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={to}
                to={to}
                className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:opacity-70 transition-opacity duration-150"
              >
                {isActive && (
                  <span
                    className="absolute top-2 w-1 h-1 rounded-full"
                    style={{
                      background: '#6BB3D9',
                      boxShadow:  '0 0 6px rgba(107,179,217,0.6)',
                    }}
                  />
                )}
                <span
                  className="transition-colors duration-200"
                  style={{ color: isActive ? '#1F2937' : '#9CA3AF' }}
                >
                  {icons[icon](isActive)}
                </span>
                <span
                  className="text-[10px] tracking-wide transition-colors duration-200"
                  style={{
                    color:      isActive ? '#1F2937' : '#9CA3AF',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
