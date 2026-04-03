import CourtMatchMiniCard from './CourtMatchMiniCard'

export default function CourtCard({ court, tournamentId, onDataRefresh }) {
  const { name, pendingMatches, activeSetback, categoryMap, onDeclareSetback } = court
  const isPaused = !!activeSetback
  const hasPending = pendingMatches.length > 0

  let buttonStyle
  let buttonText
  let buttonDisabled

  if (isPaused) {
    buttonStyle = { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6 }
    buttonText = 'Cancha ya pausada'
    buttonDisabled = true
  } else if (!hasPending) {
    buttonStyle = { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6 }
    buttonText = 'Sin partidos pendientes'
    buttonDisabled = true
  } else {
    buttonStyle = { background: '#FFF7ED', color: '#EA580C' }
    buttonText = 'Declarar contratiempo'
    buttonDisabled = false
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8EAEE',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div className="px-4 py-4 space-y-4">
        {/* Header row: court name + status badge */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>
            {name}
          </h3>
          {isPaused ? (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#FEF2F2', color: '#DC2626' }}
            >
              Pausada — {activeSetback.setback_type}
            </span>
          ) : (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#F0FDF4', color: '#16A34A' }}
            >
              Operativa
            </span>
          )}
        </div>

        {/* Action button */}
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={buttonDisabled ? undefined : () => onDeclareSetback?.()}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
          style={buttonStyle}
        >
          {buttonText}
        </button>

        {/* Match list */}
        <div>
          <p
            className="text-[11px] font-semibold uppercase mb-2"
            style={{ color: '#6B7280', letterSpacing: '0.08em' }}
          >
            Próximos partidos:
          </p>
          {hasPending ? (
            <div className="space-y-2">
              {pendingMatches.map(match => (
                <CourtMatchMiniCard
                  key={match.id}
                  match={match}
                  categoryMap={categoryMap}
                  isPaused={isPaused}
                />
              ))}
            </div>
          ) : (
            <p
              className="text-xs text-center italic py-2"
              style={{ color: '#9CA3AF' }}
            >
              Todos los partidos de esta cancha han sido disputados
            </p>
          )}
        </div>

        {/* SetbackHistory will be added in Plan 03 */}
      </div>
    </div>
  )
}
