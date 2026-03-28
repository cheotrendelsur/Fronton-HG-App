import TournamentWidget from './TournamentWidget'

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map(i => (
        <div
          key={i}
          className="w-full bg-surface-900 border border-border-default rounded-2xl p-4 space-y-2 animate-pulse"
        >
          <div className="h-3.5 bg-surface-800 rounded-full w-2/3" />
          <div className="h-3 bg-surface-800 rounded-full w-1/2" />
          <div className="h-3 bg-surface-800 rounded-full w-3/4" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 opacity-25">
        <circle cx="20" cy="20" r="18" stroke="#5c665c" strokeWidth="1.5"/>
        <path d="M13 20h14M20 13v14" stroke="#5c665c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p className="text-ink-muted text-xs text-center leading-relaxed">
        No tienes torneos activos.<br />Crea uno en <span className="text-neon-300">Nuevo torneo</span>.
      </p>
    </div>
  )
}

export default function ActiveTournaments({ tournaments = [], onSelect, loading, organizerUsername }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-ink-primary text-xs font-semibold uppercase tracking-widest">
          Torneos activos
        </h2>
        {!loading && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                            rounded-full bg-surface-800 border border-border-default
                            text-ink-muted text-[10px] font-medium tabular-nums">
            {tournaments.length}
          </span>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : tournaments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {tournaments.map(t => (
            <TournamentWidget
              key={t.id}
              tournament={t}
              organizerUsername={organizerUsername}
              onClick={() => onSelect(t)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
