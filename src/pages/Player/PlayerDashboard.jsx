import { useState, useCallback, useRef, useEffect } from 'react'
import usePlayerContext from '../../hooks/usePlayerContext'
import usePartnershipRequest from '../../hooks/usePartnershipRequest'
import NextMatchHero from '../../components/Player/NextMatchHero'
import ActiveTournamentsCarousel from '../../components/Player/ActiveTournamentsCarousel'
import RecentResults from '../../components/Player/RecentResults'
import LiveGroupTable from '../../components/Player/LiveGroupTable'
import QuickAlerts from '../../components/Player/QuickAlerts'
import PartnershipRequestCard from '../../components/Player/inscription/PartnershipRequestCard'
import PendingInscriptionAlert from '../../components/Player/inscription/PendingInscriptionAlert'

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

export default function PlayerDashboard() {
  const { playerId, playerProfile, playerRegistrations, loading, refetch } = usePlayerContext()
  const { pendingRequests, fetchPendingRequests, acceptRequest, declineRequest } = usePartnershipRequest()
  const [unreadCount, setUnreadCount] = useState(0)
  const [pullState, setPullState] = useState('idle') // idle | pulling | refreshing
  const startYRef = useRef(0)
  const mainRef = useRef(null)

  const registrationIds = playerRegistrations.map(r => r.id)

  // Fetch partnership requests on mount
  useEffect(() => {
    if (playerId) fetchPendingRequests()
  }, [playerId, fetchPendingRequests])

  const hasPartnershipRequests = (pendingRequests.asRequester?.length > 0) || (pendingRequests.asPartner?.length > 0)

  const handleRefresh = useCallback(async () => {
    setPullState('refreshing')
    await Promise.all([refetch(), fetchPendingRequests()])
    setTimeout(() => setPullState('idle'), 400)
  }, [refetch, fetchPendingRequests])

  // Pull-to-refresh handlers
  const onTouchStart = useCallback((e) => {
    if (mainRef.current?.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e) => {
    if (pullState === 'refreshing') return
    if (mainRef.current?.scrollTop > 0) return
    const deltaY = e.touches[0].clientY - startYRef.current
    if (deltaY > 60) setPullState('pulling')
  }, [pullState])

  const onTouchEnd = useCallback(() => {
    if (pullState === 'pulling') handleRefresh()
    else setPullState('idle')
  }, [pullState, handleRefresh])

  const username = playerProfile?.username ?? 'Jugador'
  const avatarUrl = playerProfile?.avatar_url

  return (
    <div
      ref={mainRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}
    >
      {/* Pull indicator */}
      {pullState !== 'idle' && (
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
            border: '2px solid #E8F4FA',
          }}>
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', margin: 0, letterSpacing: '-0.02em' }}>
            Hola, {username}
          </p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
            Bienvenido de vuelta
          </p>
        </div>
      </div>

      {/* Quick alerts */}
      <div style={{ marginBottom: '20px' }}>
        <QuickAlerts playerId={playerId} onUnreadCountChange={setUnreadCount} />
      </div>

      {/* Partnership requests — solicitudes pendientes */}
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
        <NextMatchHero registrationIds={registrationIds} loading={loading} />
      </div>

      {/* Active tournaments carousel */}
      {(loading || playerRegistrations.some(r => r.tournaments?.status === 'active')) && (
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle>Torneos activos</SectionTitle>
          <ActiveTournamentsCarousel playerRegistrations={playerRegistrations} loading={loading} />
        </div>
      )}

      {/* Live group table — renders nothing if no active groups */}
      <div style={{ marginBottom: '20px' }}>
        <LiveGroupTable
          registrationIds={registrationIds}
          playerRegistrations={playerRegistrations}
          loading={loading}
        />
      </div>

      {/* Recent results */}
      {(loading || registrationIds.length > 0) && (
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle>Resultados recientes</SectionTitle>
          <RecentResults registrationIds={registrationIds} loading={loading} />
        </div>
      )}
    </div>
  )
}
