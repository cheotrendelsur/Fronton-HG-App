import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BrandLoader from '../BrandLoader'
import NotificationBell from '../NotificationBell'
import PlayerBottomNav from './PlayerBottomNav'
import lobo from '../../assets/lobo.png'

const PAGE_TITLES = {
  '/player':               'Inicio',
  '/player/torneos':       'Torneos',
  '/player/clasificacion': 'Clasificacion',
  '/player/perfil':        'Perfil',
}

function SyncOverlay() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
      <BrandLoader size={40} />
      <p className="text-[10px] uppercase tracking-widest"
        style={{ color: '#9CA3AF', animation: 'pulse 2s ease-in-out infinite' }}>
        Verificando sesion
      </p>
    </div>
  )
}

export default function PlayerLayout({ children }) {
  const location = useLocation()
  const { isSyncing } = useAuth()

  // Match the base path for title (ignore params like /player/torneos/:id)
  const basePath = Object.keys(PAGE_TITLES).find(
    p => location.pathname === p || (p !== '/player' && location.pathname.startsWith(p))
  ) ?? '/player'
  const pageTitle = PAGE_TITLES[basePath] ?? 'Fronton HGV'

  return (
    <div className="min-h-[100dvh]" style={{ background: '#F2F3F5' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full z-40"
        style={{
          background: '#F2F3F5',
          borderBottom: '1px solid #E0E2E6',
        }}
      >
        <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
          <span style={{
            color: '#1F2937',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>
            {pageTitle}
          </span>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <span style={{
              color: '#6B7280',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}>
              Fronton HGV
            </span>
            <img
              src={lobo}
              alt="HGV"
              style={{
                width: 'auto',
                height: '32px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>
      </header>

      {/* Content area with page transition */}
      <main className="pt-14 pb-24">
        {isSyncing ? (
          <SyncOverlay />
        ) : (
          <div key={location.pathname} className="player-page-enter">
            {children}
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <PlayerBottomNav />
    </div>
  )
}
