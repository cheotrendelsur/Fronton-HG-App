import TournamentWidget from './TournamentWidget'

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map(i => (
        <div
          key={i}
          className="w-full rounded-2xl p-4 space-y-2 animate-pulse"
          style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}
        >
          <div className="h-3.5 rounded-full w-2/3" style={{ background: '#E5E7EB' }} />
          <div className="h-3 rounded-full w-1/2" style={{ background: '#E5E7EB' }} />
          <div className="h-3 rounded-full w-3/4" style={{ background: '#E5E7EB' }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 opacity-25" style={{ color: '#9CA3AF' }}>
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M13 20h14M20 13v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p className="text-xs text-center leading-relaxed" style={{ color: '#9CA3AF' }}>
        No tienes torneos activos.<br />Crea uno en <span style={{ color: '#6BB3D9' }}>Nuevo torneo</span>.
      </p>
    </div>
  )
}

export default function ActiveTournaments({ tournaments = [], onSelect, loading, organizerUsername }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#1F2937' }}>
          Torneos activos
        </h2>
        {!loading && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                            rounded-full text-[10px] font-medium tabular-nums"
                style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E0E2E6' }}>
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
