import { useState, useEffect, useCallback, useRef } from 'react'
import usePlayerContext from '../../hooks/usePlayerContext'
import TournamentSearch from '../../components/Player/TournamentSearch'
import TournamentDirectory from '../../components/Player/TournamentDirectory'
import InscriptionFlowModal from '../../components/Player/inscription/InscriptionFlowModal'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

function TournamentsSkeleton() {
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 16px' }}>
      {/* Search bar skeleton */}
      <div className="shimmer" style={{ width: '100%', height: '44px', borderRadius: '12px', marginBottom: '12px', marginTop: '8px' }} />
      {/* Card skeletons */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
          <div className="shimmer" style={{ height: '72px', width: '100%' }} />
          <div style={{ padding: '12px 16px' }}>
            <div className="shimmer" style={{ width: '65%', height: '16px', borderRadius: '4px', marginBottom: '8px' }} />
            <div className="shimmer" style={{ width: '40%', height: '12px', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PlayerTournaments() {
  const { playerId, playerRegistrations, refetch } = usePlayerContext()
  const [filters, setFilters] = useState({ text: '', statuses: [], dateFrom: '', dateTo: '' })
  const [pullState, setPullState] = useState('idle')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [mockLoading, setMockLoading] = useState(USE_MOCK)
  const startYRef = useRef(0)
  const mainRef = useRef(null)

  useEffect(() => {
    if (USE_MOCK) {
      const t = setTimeout(() => setMockLoading(false), 500)
      return () => clearTimeout(t)
    }
  }, [])

  const playerRegistrationIds = USE_MOCK ? ['reg-001', 'reg-002'] : playerRegistrations.map(r => r.id)

  const handleRefresh = useCallback(async () => {
    if (USE_MOCK) return
    setPullState('refreshing')
    await refetch()
    setRefreshKey(k => k + 1)
    setTimeout(() => setPullState('idle'), 400)
  }, [refetch])

  const onTouchStart = useCallback(e => {
    if (USE_MOCK) return
    if (mainRef.current?.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback(e => {
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

  if (mockLoading) return <TournamentsSkeleton />

  return (
    <div
      ref={mainRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 16px' }}
    >
      {/* Pull indicator */}
      {!USE_MOCK && pullState !== 'idle' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{
            animation: pullState === 'refreshing' ? 'spin 0.8s linear infinite' : 'none',
          }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="#6BB3D9" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <TournamentSearch filters={filters} onFiltersChange={setFilters} />
      <TournamentDirectory
        key={refreshKey}
        filters={filters}
        playerRegistrationIds={playerRegistrationIds}
        onInscribe={(tournament) => setSelectedTournament(tournament)}
      />

      {selectedTournament && (
        <InscriptionFlowModal
          tournament={selectedTournament}
          playerId={USE_MOCK ? 'mock-player-001' : playerId}
          onClose={() => setSelectedTournament(null)}
          onSuccess={() => { if (!USE_MOCK) { refetch(); setRefreshKey(k => k + 1) } }}
        />
      )}
    </div>
  )
}
