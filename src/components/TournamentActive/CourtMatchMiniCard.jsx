const PHASE_LABELS = {
  quarterfinals: 'Cuartos de final',
  semifinals: 'Semifinal',
  final: 'Final',
  round_of_16: 'Octavos de final',
}

export default function CourtMatchMiniCard({ match, categoryMap, isPaused }) {
  const teamsReady = match.team1_id && match.team2_id
  const categoryName = categoryMap?.[match.category_id] ?? ''

  let phaseLabel = ''
  if (match.phase === 'group_phase') {
    phaseLabel = `Grupo ${match.group_letter || ''}`
  } else {
    phaseLabel = PHASE_LABELS[match.phase] ?? match.phase ?? ''
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
    >
      <div className="px-3 py-2.5">
        {/* Row 1: time + category/phase */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>
              {match.scheduled_time ?? '--:--'}
            </span>
            {isPaused && (
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full ml-1.5"
                style={{ background: '#FFF7ED', color: '#EA580C' }}
              >
                Retrasado
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
            {categoryName}{phaseLabel ? ` · ${phaseLabel}` : ''}
          </span>
        </div>

        {/* Row 2: team names */}
        {teamsReady ? (
          <p className="text-xs" style={{ color: '#1F2937' }}>
            {match.team1_name ?? 'Equipo 1'} vs {match.team2_name ?? 'Equipo 2'}
          </p>
        ) : (
          <p className="text-xs italic" style={{ color: '#9CA3AF' }}>
            Por definir vs Por definir
          </p>
        )}
      </div>
    </div>
  )
}
