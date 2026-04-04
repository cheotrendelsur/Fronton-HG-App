import { useState, useMemo, useCallback, useRef } from 'react'
import usePlayerContext from '../../hooks/usePlayerContext'
import ClassificationContextSelector from '../../components/Player/ClassificationContextSelector'
import MyItinerary from '../../components/Player/MyItinerary'
import GroupPhaseView from '../../components/Player/GroupPhaseView'
import BracketView from '../../components/Player/BracketView'
import ExternalNavigation from '../../components/Player/ExternalNavigation'

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

export default function PlayerClassification() {
  const { playerRegistrations, loading, refetch } = usePlayerContext()
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [contentKey, setContentKey] = useState(0)
  const [pullState, setPullState] = useState('idle')
  const startYRef = useRef(0)
  const mainRef = useRef(null)

  // Registration IDs for the selected tournament + category
  const registrationIds = useMemo(() => {
    return playerRegistrations
      .filter(r =>
        r.tournament_id === selectedTournamentId &&
        r.category_id === selectedCategoryId
      )
      .map(r => r.id)
  }, [playerRegistrations, selectedTournamentId, selectedCategoryId])

  // All registration IDs for the selected tournament (for bracket view)
  const allTournamentRegIds = useMemo(() => {
    return playerRegistrations
      .filter(r => r.tournament_id === selectedTournamentId)
      .map(r => r.id)
  }, [playerRegistrations, selectedTournamentId])

  const handleTournamentChange = (id) => {
    setSelectedTournamentId(id)
    setContentKey(k => k + 1)
  }

  const handleCategoryChange = (id) => {
    setSelectedCategoryId(id)
    setContentKey(k => k + 1)
  }

  const handleRefresh = useCallback(async () => {
    setPullState('refreshing')
    await refetch()
    setContentKey(k => k + 1)
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

  if (loading) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        <div className="shimmer" style={{ width: '100%', height: '40px', borderRadius: '10px', marginBottom: '12px' }} />
        <div className="shimmer" style={{ width: '60%', height: '32px', borderRadius: '10px', marginBottom: '24px' }} />
        <div className="shimmer" style={{ width: '100%', height: '200px', borderRadius: '16px' }} />
      </div>
    )
  }

  // Check if player has any active tournament registrations
  const hasActiveTournaments = playerRegistrations.some(r => r.tournaments?.status === 'active')

  if (!hasActiveTournaments) {
    return (
      <div style={{
        maxWidth: '480px', margin: '0 auto', padding: '48px 16px',
        textAlign: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
          <path d="M3 20H21M5 20V14M9 20V8M13 20V11M17 20V4"/>
        </svg>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
          No tienes torneos activos
        </p>
        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
          Inscribete en un torneo para ver la clasificacion
        </p>
      </div>
    )
  }

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
          display: 'flex', justifyContent: 'center', padding: '10px 0',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{
            animation: pullState === 'refreshing' ? 'spin 0.8s linear infinite' : 'none',
          }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="#6BB3D9" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Context selector */}
      <ClassificationContextSelector
        playerRegistrations={playerRegistrations}
        selectedTournamentId={selectedTournamentId}
        selectedCategoryId={selectedCategoryId}
        onTournamentChange={handleTournamentChange}
        onCategoryChange={handleCategoryChange}
      />

      {/* Content with fade transition */}
      {selectedTournamentId && selectedCategoryId && (
        <div key={contentKey} className="player-page-enter">
          {/* My Itinerary */}
          <div style={{ marginBottom: '20px' }}>
            <SectionTitle>Mi itinerario</SectionTitle>
            <MyItinerary
              tournamentId={selectedTournamentId}
              categoryId={selectedCategoryId}
              registrationIds={registrationIds}
            />
          </div>

          {/* Group phase table */}
          <div style={{ marginBottom: '20px' }}>
            <SectionTitle>Fase de grupos</SectionTitle>
            <GroupPhaseView
              tournamentId={selectedTournamentId}
              categoryId={selectedCategoryId}
              registrationIds={allTournamentRegIds}
            />
          </div>

          {/* Bracket */}
          <div style={{ marginBottom: '20px' }}>
            <SectionTitle>Eliminatoria</SectionTitle>
            <BracketView
              tournamentId={selectedTournamentId}
              categoryId={selectedCategoryId}
              registrationIds={allTournamentRegIds}
            />
          </div>

          {/* External navigation */}
          <div style={{ marginBottom: '20px' }}>
            <SectionTitle>Explorar</SectionTitle>
            <ExternalNavigation
              tournamentId={selectedTournamentId}
              categoryId={selectedCategoryId}
              registrationIds={allTournamentRegIds}
            />
          </div>
        </div>
      )}
    </div>
  )
}
