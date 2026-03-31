import { useState, useRef } from 'react'

function getBarColor(pct) {
  if (pct <= 33) return '#EF4444'
  if (pct <= 66) return '#F59E0B'
  return '#22C55E'
}

export default function CategoryProgressCard({ categoryName, approved, max, teams = [] }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)

  const safePct  = max > 0 ? Math.min(Math.round((approved / max) * 100), 100) : 0
  const barColor = getBarColor(safePct)
  const isFull   = approved >= max && max > 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}
    >
      {/* Clickable header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 space-y-3 text-left transition-colors duration-150 cursor-pointer"
        style={{ background: open ? '#F9FAFB' : '#FFFFFF' }}
      >
        {/* Name + counter */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              viewBox="0 0 12 12" fill="currentColor"
              className="w-2.5 h-2.5 flex-shrink-0 transition-transform duration-200"
              style={{ color: '#9CA3AF', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
            >
              <path d="M3 1l6 5-6 5V1z"/>
            </svg>
            <span className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>
              {categoryName}
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: barColor }}>
            {approved}/{max}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${safePct}%`, background: barColor }}
            />
          </div>
          <span className="text-[11px] font-semibold tabular-nums w-9 text-right flex-shrink-0"
                style={{ color: barColor }}>
            {safePct}%
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: barColor }} />
          {isFull ? (
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: barColor }}>
              Llena ✓
            </span>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: barColor }}>
              Abierta
            </span>
          )}
        </div>
      </button>

      {/* Expandable teams list */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 2000}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid #F3F4F6' }}>
          <div className="pt-2" />
          {teams.length === 0 ? (
            <p className="text-[11px] text-center py-2" style={{ color: '#9CA3AF' }}>
              Sin duplas inscritas
            </p>
          ) : (
            teams.map((team, i) => {
              const p1 = team.player1?.username ?? team.player1?.email ?? '?'
              const p2 = team.player2?.username ?? team.player2?.email ?? '?'
              return (
                <div key={team.id || i} className="flex items-start gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                    style={{ background: '#E8F4FA', color: '#3A8BB5' }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs font-medium truncate" style={{ color: '#1F2937' }}>
                    {p1} / {p2}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
