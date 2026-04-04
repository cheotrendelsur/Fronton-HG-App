import { useState, useEffect, useRef } from 'react'

export default function ClassificationContextSelector({
  playerRegistrations,
  selectedTournamentId,
  selectedCategoryId,
  onTournamentChange,
  onCategoryChange,
}) {
  // Build unique tournament list from approved registrations in active tournaments
  const tournaments = []
  const seen = new Set()
  for (const reg of playerRegistrations) {
    const t = reg.tournaments
    if (!t || t.status !== 'active' || seen.has(t.id)) continue
    seen.add(t.id)
    tournaments.push(t)
  }

  // Categories for selected tournament
  const categories = []
  const catSeen = new Set()
  for (const reg of playerRegistrations) {
    if (reg.tournament_id !== selectedTournamentId) continue
    const c = reg.categories
    if (!c || catSeen.has(c.id)) continue
    catSeen.add(c.id)
    categories.push(c)
  }

  // Auto-select first tournament if none selected
  useEffect(() => {
    if (!selectedTournamentId && tournaments.length > 0) {
      onTournamentChange(tournaments[0].id)
    }
  }, [tournaments.length, selectedTournamentId])

  // Auto-select first category when tournament changes
  useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === selectedCategoryId)) {
      onCategoryChange(categories[0].id)
    }
  }, [selectedTournamentId, categories.length])

  if (!tournaments.length) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>No tienes torneos activos</p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Tournament selector */}
      <ChipRow
        items={tournaments.map(t => ({ id: t.id, label: t.name }))}
        activeId={selectedTournamentId}
        onChange={onTournamentChange}
      />

      {/* Category selector */}
      {categories.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <ChipRow
            items={categories.map(c => ({ id: c.id, label: c.name }))}
            activeId={selectedCategoryId}
            onChange={onCategoryChange}
            small
          />
        </div>
      )}
    </div>
  )
}

function ChipRow({ items, activeId, onChange, small }) {
  const scrollRef = useRef(null)

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex', gap: '8px',
        overflowX: 'auto', scrollbarWidth: 'none',
        msOverflowStyle: 'none', paddingBottom: '2px',
      }}
    >
      {items.map(item => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              flexShrink: 0,
              fontSize: small ? '12px' : '13px',
              fontWeight: isActive ? 600 : 500,
              background: isActive ? '#6BB3D9' : '#FFFFFF',
              color: isActive ? '#FFFFFF' : '#6B7280',
              border: `1px solid ${isActive ? '#6BB3D9' : '#E0E2E6'}`,
              borderRadius: '10px',
              padding: small ? '6px 14px' : '8px 16px',
              cursor: 'pointer',
              transition: 'all 200ms',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
