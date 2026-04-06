import { useState, useCallback, useRef, useEffect } from 'react'
import { mockCurrentPlayer } from '../../mockData'
import usePlayerContext from '../../hooks/usePlayerContext'
import usePartnershipRequest from '../../hooks/usePartnershipRequest'
import NextMatchHero from '../../components/Player/NextMatchHero'
import ActiveTournamentsCarousel from '../../components/Player/ActiveTournamentsCarousel'
import QuickStatsWidget from '../../components/Player/QuickStatsWidget'
import RecentResults from '../../components/Player/RecentResults'
import LiveGroupTable from '../../components/Player/LiveGroupTable'
import QuickAlerts from '../../components/Player/QuickAlerts'
import PartnershipRequestCard from '../../components/Player/inscription/PartnershipRequestCard'
import PendingInscriptionAlert from '../../components/Player/inscription/PendingInscriptionAlert'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="shimmer" style={{ width: '140px', height: '20px', borderRadius: '6px', marginBottom: '6px' }} />
          <div className="shimmer" style={{ width: '200px', height: '12px', borderRadius: '4px' }} />
        </div>
        <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
      </div>
      {/* Alert skeleton */}
      <div className="shimmer" style={{ width: '100%', height: '52px', borderRadius: '12px', marginBottom: '20px' }} />
      {/* Hero card skeleton */}
      <div className="shimmer" style={{ width: '100%', height: '140px', borderRadius: '16px', marginBottom: '20px' }} />
      {/* Carousel skeleton */}
      <div className="shimmer" style={{ width: '100%', height: '110px', borderRadius: '16px', marginBottom: '20px' }} />
      {/* Stats grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {[0,1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '72px', borderRadius: '14px' }} />)}
      </div>
      {/* Table skeleton */}
      <div className="shimmer" style={{ width: '100%', height: '180px', borderRadius: '16px' }} />
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: '12px', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: '#6B7280', marginBottom: '8px',
    }}>
      {children}
    </h2>
  )
}

function formatCurrentDateES() {
  const now = new Date()
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} ${now.getFullYear()}`
}

export default function PlayerDashboard() {
  const { playerId, playerProfile, playerRegistrations, loading, refetch } = usePlayerContext()
  const { pendingRequests, fetchPendingRequests, acceptRequest, declineRequest } = usePartnershipRequest()
  const [unreadCount, setUnreadCount] = useState(0)
  const [pullState, setPullState] = useState('idle') // idle | pulling | refreshing
  const [mockLoading, setMockLoading] = useState(USE_MOCK)
  const startYRef = useRef(0)
  const mainRef = useRef(null)

  // Simulated skeleton loading for mock mode
  useEffect(() => {
    if (USE_MOCK) {
      const t = setTimeout(() => setMockLoading(false), 500)
      return () => clearTimeout(t)
    }
  }, [])

  const registrationIds = USE_MOCK ? ['reg-001', 'reg-002'] : playerRegistrations.map(r => r.id)

  // Mock data
  const username = USE_MOCK
    ? mockCurrentPlayer.username.split(' ')[0]
    : (playerProfile?.username ?? 'Jugador')
  const avatarUrl = USE_MOCK ? mockCurrentPlayer.avatarUrl : playerProfile?.avatar_url

  // Fetch partnership requests on mount (only real mode)
  useEffect(() => {
    if (!USE_MOCK && playerId) fetchPendingRequests()
  }, [playerId, fetchPendingRequests])

  const hasPartnershipRequests = !USE_MOCK && ((pendingRequests.asRequester?.length > 0) || (pendingRequests.asPartner?.length > 0))

  const handleRefresh = useCallback(async () => {
    if (USE_MOCK) return
    setPullState('refreshing')
    await Promise.all([refetch(), fetchPendingRequests()])
    setTimeout(() => setPullState('idle'), 400)
  }, [refetch, fetchPendingRequests])

  // Pull-to-refresh handlers
  const onTouchStart = useCallback((e) => {
    if (USE_MOCK) return
    if (mainRef.current?.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e) => {
    if (USE_MOCK) return
    if (pullState === 'refreshing') return
    if (mainRef.current?.scrollTop > 0) return
    const deltaY = e.touches[0].clientY - startYRef.current
    if (deltaY > 60) setPullState('pulling')
  }, [pullState])

  const onTouchEnd = useCallback(() => {
    if (USE_MOCK) return
    if (pullState === 'pulling') handleRefresh()
    else setPullState('idle')
  }, [pullState, handleRefresh])

  if (mockLoading) return <DashboardSkeleton />

  return (
    <div
      ref={mainRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}
    >
      {/* Pull indicator */}
      {!USE_MOCK && pullState !== 'idle' && (
        <div style={{
          textAlign: 'center', padding: '8px 0 12px',
          fontSize: '11px', color: '#9CA3AF', fontWeight: 500,
        }}>
          {pullState === 'pulling' ? 'Suelta para actualizar' : 'Actualizando...'}
        </div>
      )}

      {/* Header saludo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', margin: 0, letterSpacing: '-0.02em' }}>
            Hola, {username}
          </p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>
            {formatCurrentDateES()}
          </p>
        </div>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              objectFit: 'cover', border: '2px solid #E8F4FA',
            }}
          />
        ) : (
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6BB3D9, #1B3A5C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: '16px', fontWeight: 600,
            border: '2px solid #E8F4FA', flexShrink: 0,
          }}>
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Quick alerts */}
      <div style={{ marginBottom: '20px' }}>
        <QuickAlerts playerId={USE_MOCK ? 'mock-player-001' : playerId} onUnreadCountChange={setUnreadCount} />
      </div>

      {/* Partnership requests — solicitudes pendientes (real mode only) */}
      {hasPartnershipRequests && (
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle>Solicitudes pendientes</SectionTitle>

          {/* Cards for requests TO the player (need to accept/decline) */}
          {pendingRequests.asPartner?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              {pendingRequests.asPartner.map(req => (
                <PartnershipRequestCard
                  key={req.id}
                  request={req}
                  onAccept={async (id) => {
                    const result = await acceptRequest(id)
                    if (result.success) { fetchPendingRequests(); refetch() }
                    return result
                  }}
                  onDecline={async (id, reason) => {
                    const result = await declineRequest(id, reason)
                    if (result.success) fetchPendingRequests()
                    return result
                  }}
                />
              ))}
            </div>
          )}

          {/* Alerts for requests FROM the player (waiting for partner) */}
          <PendingInscriptionAlert requests={pendingRequests.asRequester} />
        </div>
      )}

      {/* Next match hero */}
      <div style={{ marginBottom: '20px' }}>
        <SectionTitle>Proximo partido</SectionTitle>
        <NextMatchHero registrationIds={registrationIds} loading={USE_MOCK ? false : loading} />
      </div>

      {/* Active tournaments carousel */}
      <div style={{ marginBottom: '20px' }}>
        <SectionTitle>Torneos activos</SectionTitle>
        <ActiveTournamentsCarousel playerRegistrations={USE_MOCK ? null : playerRegistrations} loading={USE_MOCK ? false : loading} />
      </div>

      {/* Quick stats widget */}
      <div style={{ marginBottom: '20px' }}>
        <SectionTitle>Mis estadisticas</SectionTitle>
        <QuickStatsWidget registrationIds={registrationIds} loading={USE_MOCK ? false : loading} />
      </div>

      {/* Live group table — renders nothing if no active groups */}
      <div style={{ marginBottom: '20px' }}>
        <LiveGroupTable
          registrationIds={registrationIds}
          playerRegistrations={USE_MOCK ? null : playerRegistrations}
          loading={USE_MOCK ? false : loading}
        />
      </div>

      {/* Recent results */}
      <div style={{ marginBottom: '20px' }}>
        <SectionTitle>Resultados recientes</SectionTitle>
        <RecentResults registrationIds={registrationIds} loading={USE_MOCK ? false : loading} />
      </div>
    </div>
  )
}
