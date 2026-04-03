import { useState } from 'react'

export default function ConflictAlert({ conflicts, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  if (!conflicts || conflicts.length === 0) return null

  const visibleConflicts = expanded ? conflicts : conflicts.slice(0, 3)
  const hiddenCount = conflicts.length - 3

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4 relative"
      style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 20 20" fill="#DC2626" className="w-4 h-4 flex-shrink-0">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>
            Conflictos de horario detectados
          </span>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ color: '#DC2626' }}
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      {/* Conflict list */}
      <div className="space-y-2">
        {visibleConflicts.map((conflict, idx) => (
          <div key={`${conflict.teamId}-${idx}`} className="pl-6">
            <p className="text-xs font-semibold" style={{ color: '#1F2937' }}>
              {conflict.teamName || 'Equipo'}
            </p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {conflict.match1.courtName} - {conflict.match1.date} {conflict.match1.time}
            </p>
            <p className="text-[10px] font-medium my-0.5" style={{ color: '#9CA3AF' }}>vs</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {conflict.match2.courtName} - {conflict.match2.date} {conflict.match2.time}
            </p>
          </div>
        ))}
      </div>

      {/* Show more link */}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs font-medium mt-2 pl-6"
          style={{ color: '#DC2626' }}
        >
          y {hiddenCount} mas...
        </button>
      )}
    </div>
  )
}
