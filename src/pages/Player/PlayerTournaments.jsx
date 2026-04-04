import { useState, useCallback, useRef } from 'react'
import usePlayerContext from '../../hooks/usePlayerContext'
import TournamentSearch from '../../components/Player/TournamentSearch'
import TournamentDirectory from '../../components/Player/TournamentDirectory'
import InscriptionFlowModal from '../../components/Player/inscription/InscriptionFlowModal'

export default function PlayerTournaments() {
  const { playerId, playerRegistrations, refetch } = usePlayerContext()
  const [filters, setFilters] = useState({
    text: '',
    statuses: [],
    dateFrom: '',
    dateTo: '',
  })
  const [pullState, setPullState] = useState('idle')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedTournament, setSelectedTournament] = useState(null)
  const startYRef = useRef(0)
  const mainRef = useRef(null)

  const playerRegistrationIds = playerRegistrations.map(r => r.id)

  const handleRefresh = useCallback(async () => {
    setPullState('refreshing')
    await refetch()
    setRefreshKey(k => k + 1)
    setTimeout(() => setPullState('idle'), 400)
  }, [refetch])

  const onTouchStart = useCallback(e => {
    if (mainRef.current?.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback(e => {
    if (pullState === 'refreshing') return
    if (mainRef.current?.scrollTop > 0) return
    const deltaY = e.touches[0].clientY - startYRef.current
    if (deltaY > 60) setPullState('pulling')
  }, [pullState])

  const onTouchEnd = useCallback(() => {
    if (pullState === 'pulling') handleRefresh()
    else setPullState('idle')
  }, [pullState, handleRefresh])

  return (
    <div
      ref={mainRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 16px' }}
    >
      {/* Pull indicator */}
      {pullState !== 'idle' && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '10px 0',
        }}>
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

      {/* Inscription modal */}
      {selectedTournament && (
        <InscriptionFlowModal
          tournament={selectedTournament}
          playerId={playerId}
          onClose={() => setSelectedTournament(null)}
          onSuccess={() => { refetch(); setRefreshKey(k => k + 1) }}
        />
      )}
    </div>
  )
}
