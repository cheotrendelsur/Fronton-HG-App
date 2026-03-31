export default function ScheduleDayView({ dayData }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Day header */}
      <div className="px-4 py-3" style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
        <h4 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
          {dayData.dayLabel}
        </h4>
      </div>

      {/* Courts */}
      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {dayData.courts.map((court, ci) => {
          // Detect break gap: find where there's a time jump > match duration between consecutive matches
          const matchesWithBreak = []
          for (let i = 0; i < court.matches.length; i++) {
            const m = court.matches[i]
            if (i > 0) {
              const prev = court.matches[i - 1]
              const prevEndMin = parseTimeToMin(prev.scheduled_time) + prev.estimated_duration_minutes
              const currStartMin = parseTimeToMin(m.scheduled_time)
              // If gap is significantly larger than match duration, it's likely a break
              if (currStartMin - prevEndMin >= 30) {
                matchesWithBreak.push({
                  type: 'break',
                  start: minutesToStr(prevEndMin),
                  end: minutesToStr(currStartMin),
                })
              }
            }
            matchesWithBreak.push({ type: 'match', data: m })
          }

          return (
            <div key={court.court_id} className="px-4 py-3">
              {/* Court name */}
              <div className="flex items-center gap-2 mb-2.5">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: '#9CA3AF' }}>
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="text-xs font-semibold" style={{ color: '#4B5563' }}>
                  {court.court_name}
                </span>
                <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
                  {court.matches.length} partidos
                </span>
              </div>

              {/* Match list */}
              <div className="space-y-1.5 ml-1">
                {matchesWithBreak.map((item, idx) => {
                  if (item.type === 'break') {
                    return (
                      <div key={`break-${idx}`}
                        className="flex items-center gap-2 py-1.5 mx-1">
                        <div className="flex-1 border-t border-dashed" style={{ borderColor: '#D1D5DB' }} />
                        <span className="text-[10px] font-medium px-2" style={{ color: '#9CA3AF' }}>
                          {item.start} - {item.end} — Descanso
                        </span>
                        <div className="flex-1 border-t border-dashed" style={{ borderColor: '#D1D5DB' }} />
                      </div>
                    )
                  }

                  const m = item.data
                  const isElim = m.phase && m.phase !== 'group_phase'
                  const phaseLabel = isElim ? ({ quarterfinals: 'Cuartos', semifinals: 'Semis', final: 'Final', round_of_16: 'Octavos' }[m.phase] ?? m.phase) : null
                  return (
                    <div key={m.match_number}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                      style={{
                        background: isElim ? '#F0F0F2' : '#F9FAFB',
                        border: `1px solid ${isElim ? '#E0E2E6' : '#F3F4F6'}`,
                      }}>
                      <span className="text-xs font-bold flex-shrink-0 tabular-nums"
                        style={{ color: isElim ? '#9CA3AF' : '#6BB3D9', minWidth: '36px' }}>
                        {m.scheduled_time}
                      </span>
                      <span className="flex-1 text-xs font-medium truncate" style={{ color: isElim ? '#6B7280' : '#374151' }}>
                        {isElim ? `${phaseLabel} — Por definir` : `P${m.match_number}`}
                      </span>
                      {!isElim && (
                        <span className="text-[10px] font-medium flex-shrink-0" style={{ color: '#9CA3AF' }}>
                          #{m.match_number}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function parseTimeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToStr(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
