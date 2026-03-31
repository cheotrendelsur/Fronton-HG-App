export default function CompletedMatchCard({ match }) {
  const groupLabel = match.group_letter ? `Grupo ${match.group_letter}` : match.phase ?? ''

  // Build score summary
  let scoreSummary = ''
  const s1 = match.score_team1
  const s2 = match.score_team2
  if (s1?.games && s2?.games) {
    scoreSummary = s1.games.map((g, i) => `${g}-${s2.games[i] ?? 0}`).join(' / ')
  } else if (s1?.points != null && s2?.points != null) {
    scoreSummary = `${s1.points}-${s2.points}`
  }

  // Winner name
  const isTeam1Winner = match.winner_id === match.team1_id
  const winnerName = isTeam1Winner
    ? `${match.team1_p1 ?? '?'} / ${match.team1_p2 ?? '?'}`
    : `${match.team2_p1 ?? '?'} / ${match.team2_p2 ?? '?'}`

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#FAFBFC',
        border: '1px solid #E8EAEE',
        borderLeft: '4px solid #22C55E',
      }}
    >
      <div className="px-4 py-3">
        {/* Line 1: time + court | group ✓ */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>
            {match.scheduled_time ?? ''}{match.court_name ? ` · ${match.court_name}` : ''}
          </span>
          <span className="text-[10px] font-medium" style={{ color: '#16A34A' }}>
            {groupLabel} ✓
          </span>
        </div>

        {/* Vertical team display */}
        <div className="text-center space-y-1 mb-2.5">
          <p
            className="text-sm"
            style={{
              color: isTeam1Winner ? '#1F2937' : '#6B7280',
              fontWeight: isTeam1Winner ? 600 : 400,
            }}
          >
            {match.team1_p1 ?? '?'} / {match.team1_p2 ?? '?'}
          </p>
          <p className="text-[10px] font-bold" style={{ color: '#D1D5DB' }}>vs</p>
          <p
            className="text-sm"
            style={{
              color: !isTeam1Winner ? '#1F2937' : '#6B7280',
              fontWeight: !isTeam1Winner ? 600 : 400,
            }}
          >
            {match.team2_p1 ?? '?'} / {match.team2_p2 ?? '?'}
          </p>
        </div>

        {/* Score + winner */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#4B5563' }}>
            {scoreSummary}
          </span>
          <span className="text-[11px] font-medium" style={{ color: '#16A34A' }}>
            ★ {winnerName}
          </span>
        </div>
      </div>
    </div>
  )
}
