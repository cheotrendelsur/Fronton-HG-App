export default function CategoryProgressCard({ categoryName, approved, max }) {
  const safePct  = max > 0 ? Math.min(Math.round((approved / max) * 100), 100) : 0
  const isFull   = approved >= max && max > 0

  return (
    <div className="rounded-2xl p-4 space-y-3"
         style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
      {/* Header: name + counter */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>{categoryName}</span>
        <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: '#6BB3D9' }}>
          {approved}/{max}
        </span>
      </div>

      {/* Progress bar + percentage */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${safePct}%`, background: '#6BB3D9' }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums w-9 text-right flex-shrink-0"
              style={{ color: '#6BB3D9' }}>
          {safePct}%
        </span>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6BB3D9' }} />
        {isFull ? (
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6BB3D9' }}>
            Llena ✓
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6BB3D9' }}>
            Abierta
          </span>
        )}
      </div>
    </div>
  )
}
