const STATUS_CONFIG = {
  scheduled: {
    label: 'Programado',
    style: { background: '#F3F4F6', color: '#6B7280' },
  },
  in_progress: {
    label: 'En juego',
    style: { background: '#E8F4FA', color: '#3A8BB5' },
    pulse: true,
  },
  completed: {
    label: null, // will show score
    style: { background: '#F0FDF4', color: '#16A34A' },
  },
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()}`
}

export default function MatchCard({ match }) {
  const cfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.scheduled

  // Build score label for completed matches
  let badgeLabel = cfg.label
  if (match.status === 'completed') {
    const s1 = match.score_team1
    const s2 = match.score_team2
    if (s1 && s2) {
      badgeLabel = `${Array.isArray(s1) ? s1.length : s1} - ${Array.isArray(s2) ? s2.length : s2}`
    } else {
      badgeLabel = 'Finalizado'
    }
  }

  const hasSchedule = match.scheduled_date && match.scheduled_time
  const courtName = match.court?.name

  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: '#FFFFFF', border: '1px solid #E8EAEE' }}
    >
      {/* Line 1: match number + date/time or badge */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
          Partido {match.match_number}
        </span>
        {hasSchedule ? (
          <span className="text-[11px] font-medium tabular-nums" style={{ color: '#6B7280' }}>
            {formatDateShort(match.scheduled_date)} · {match.scheduled_time}
          </span>
        ) : (
          <span className="text-[11px] italic" style={{ color: '#9CA3AF' }}>
            Por definir
          </span>
        )}
      </div>

      {/* Line 2: Teams */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className="flex-1 truncate"
          style={{
            color: !match.team1_id ? '#9CA3AF' : match.winner_id && match.winner_id === match.team1_id ? '#1F2937' : '#374151',
            fontWeight: match.winner_id && match.winner_id === match.team1_id ? 600 : 400,
            fontStyle: !match.team1_id ? 'italic' : 'normal',
          }}
        >
          {match.team1_id ? (match.team1_name ?? 'Equipo 1') : 'Por definir'}
        </span>
        <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#D1D5DB' }}>vs</span>
        <span
          className="flex-1 truncate text-right"
          style={{
            color: !match.team2_id ? '#9CA3AF' : match.winner_id && match.winner_id === match.team2_id ? '#1F2937' : '#374151',
            fontWeight: match.winner_id && match.winner_id === match.team2_id ? 600 : 400,
            fontStyle: !match.team2_id ? 'italic' : 'normal',
          }}
        >
          {match.team2_id ? (match.team2_name ?? 'Equipo 2') : 'Por definir'}
        </span>
      </div>

      {/* Line 3: Court + status badge (only if court or schedule exists) */}
      {(courtName || hasSchedule) && (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px]" style={{ color: '#9CA3AF' }}>
            {courtName ?? ''}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                        ${cfg.pulse ? 'animate-pulse' : ''}`}
            style={cfg.style}
          >
            {badgeLabel}
          </span>
        </div>
      )}

      {/* Badge on line 1 area if no schedule info at all (legacy/elimination without court) */}
      {!courtName && !hasSchedule && (
        <div className="flex justify-end mt-1">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                        ${cfg.pulse ? 'animate-pulse' : ''}`}
            style={cfg.style}
          >
            {badgeLabel}
          </span>
        </div>
      )}
    </div>
  )
}
