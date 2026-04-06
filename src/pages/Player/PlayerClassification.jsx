import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { mockTournaments, mockPlayerRegistrations } from '../../mockData'
import usePlayerContext from '../../hooks/usePlayerContext'
import ClassificationContextSelector from '../../components/Player/ClassificationContextSelector'
import MyItinerary from '../../components/Player/MyItinerary'
import GroupPhaseView from '../../components/Player/GroupPhaseView'
import BracketView from '../../components/Player/BracketView'
import ExternalNavigation from '../../components/Player/ExternalNavigation'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

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

function ClassificationSkeleton() {
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
      <div className="shimmer" style={{ width: '100%', height: '40px', borderRadius: '10px', marginBottom: '12px' }} />
      <div className="shimmer" style={{ width: '60%', height: '32px', borderRadius: '10px', marginBottom: '24px' }} />
      {/* Itinerary skeleton */}
      <div className="shimmer" style={{ width: '80px', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
      <div className="shimmer" style={{ width: '100%', height: '100px', borderRadius: '12px', marginBottom: '20px' }} />
      {/* Table skeleton */}
      <div className="shimmer" style={{ width: '100px', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
      <div className="shimmer" style={{ width: '100%', height: '200px', borderRadius: '16px', marginBottom: '20px' }} />
      {/* Bracket skeleton */}
      <div className="shimmer" style={{ width: '90px', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
      <div className="shimmer" style={{ width: '100%', height: '150px', borderRadius: '16px' }} />
    </div>
  )
}

export default function PlayerClassification() {
  const { playerRegistrations, loading, refetch } = usePlayerContext()
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [contentKey, setContentKey] = useState(0)
  const [pullState, setPullState] = useState('idle')
  const [mockLoading, setMockLoading] = useState(USE_MOCK)
  const startYRef = useRef(0)
  const mainRef = useRef(null)

  useEffect(() => {
    if (USE_MOCK) {
      const t = setTimeout(() => setMockLoading(false), 500)
      return () => clearTimeout(t)
    }
  }, [])

  // Mock registrations adapted to the shape the selector expects
  const regs = USE_MOCK
    ? mockPlayerRegistrations
        .filter(r => {
          const t = mockTournaments.find(t => t.id === r.tournamentId)
          return t && t.status === 'active'
        })
        .map(r => ({
          id: r.id,
          tournament_id: r.tournamentId,
          category_id: r.categoryId,
          tournaments: mockTournaments.find(t => t.id === r.tournamentId)
            ? { id: r.tournamentId, name: mockTournaments.find(t => t.id === r.tournamentId).name, status: 'active' }
            : null,
          categories: { id: r.categoryId, name: r.categoryName },
        }))
    : playerRegistrations

  const registrationIds = useMemo(() => {
    return regs
      .filter(r => r.tournament_id === selectedTournamentId && r.category_id === selectedCategoryId)
      .map(r => r.id)
  }, [regs, selectedTournamentId, selectedCategoryId])

  const allTournamentRegIds = useMemo(() => {
    return regs
      .filter(r => r.tournament_id === selectedTournamentId)
      .map(r => r.id)
  }, [regs, selectedTournamentId])

  const handleTournamentChange = (id) => {
    setSelectedTournamentId(id)
    setContentKey(k => k + 1)
  }

  const handleCategoryChange = (id) => {
    setSelectedCategoryId(id)
    setContentKey(k => k + 1)
  }

  const handleRefresh = useCallback(async () => {
    if (USE_MOCK) return
    setPullState('refreshing')
    await refetch()
    setContentKey(k => k + 1)
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

  if (mockLoading || (!USE_MOCK && loading)) {
    return <ClassificationSkeleton />
  }

  const hasActiveTournaments = USE_MOCK
    ? regs.length > 0
    : playerRegistrations.some(r => r.tournaments?.status === 'active')

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
      {!USE_MOCK && pullState !== 'idle' && (
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
        playerRegistrations={regs}
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
