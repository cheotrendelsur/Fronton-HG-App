const PHASE_LABELS = { quarterfinals: 'Cuartos de final', semifinals: 'Semifinal', final: 'Final', round_of_16: 'Octavos de final' }

export default function PendingMatchCard({ match, onRegister }) {
  const groupLabel = match.group_letter ? `Grupo ${match.group_letter}` : (PHASE_LABELS[match.phase] ?? match.phase ?? '')
  const teamsReady = match.team1_id && match.team2_id
  const isPlaceholder = !teamsReady

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: isPlaceholder ? '#F9FAFB' : '#FFFFFF',
        border: '1px solid #E8EAEE',
        borderLeft: `4px solid ${isPlaceholder ? '#D1D5DB' : '#6BB3D9'}`,
        boxShadow: isPlaceholder ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div className="px-4 py-3">
        {/* Line 1: time + court | phase/group */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>
            {match.scheduled_time ?? ''}{match.court_name ? ` · ${match.court_name}` : ''}
          </span>
          <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
            {groupLabel}
          </span>
        </div>

        {/* Vertical team display */}
        <div className="text-center space-y-1 mb-3">
          {isPlaceholder ? (
            <>
              <p className="text-sm italic" style={{ color: '#9CA3AF' }}>Por definir</p>
              <p className="text-[10px] font-bold" style={{ color: '#D1D5DB' }}>vs</p>
              <p className="text-sm italic" style={{ color: '#9CA3AF' }}>Por definir</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium" style={{ color: '#1F2937' }}>
                {match.team1_p1 ?? '?'} / {match.team1_p2 ?? '?'}
              </p>
              <p className="text-[10px] font-bold" style={{ color: '#D1D5DB' }}>vs</p>
              <p className="text-sm font-medium" style={{ color: '#1F2937' }}>
                {match.team2_p1 ?? '?'} / {match.team2_p2 ?? '?'}
              </p>
            </>
          )}
        </div>

        {/* Register button — only if both teams are defined */}
        {teamsReady && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onRegister(match)}
              className="text-xs font-semibold transition-colors duration-150"
              style={{ color: '#6BB3D9' }}
            >
              Registrar →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
