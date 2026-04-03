import CourtSwiper from './CourtSwiper'

export default function CanchasView({ courts, matches, categories, activeSetbacks, tournamentId, onDataRefresh }) {
  if (courts.length === 0) {
    return (
      <p className="text-xs text-center py-8" style={{ color: '#9CA3AF' }}>
        No hay canchas en este torneo
      </p>
    )
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const enrichedCourts = courts.map(court => {
    const pendingMatches = matches
      .filter(m => m.court_id === court.id && (m.status === 'scheduled' || m.status === 'pending'))
      .sort((a, b) => {
        if (a.scheduled_date !== b.scheduled_date) {
          return (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? '')
        }
        return (a.scheduled_time ?? '').localeCompare(b.scheduled_time ?? '')
      })
      .slice(0, 3)

    return {
      ...court,
      pendingMatches,
      activeSetback: activeSetbacks[court.id] || null,
      categoryMap,
    }
  })

  return (
    <CourtSwiper
      courts={enrichedCourts}
      tournamentId={tournamentId}
      onDataRefresh={onDataRefresh}
    />
  )
}
