const FILTERS = [
  { id: 'all',      label: 'Todas' },
  { id: 'approved', label: 'Admitidas' },
  { id: 'rejected', label: 'Rechazadas' },
]

function DecidedRow({ registration }) {
  const isApproved   = registration.status === 'approved'
  const categoryName = registration.categories?.name ?? '—'

  return (
    <div className="flex items-center justify-between gap-3 py-3 last:border-0"
         style={{ borderBottom: '1px solid #E8EAEE' }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
              style={isApproved
                ? { background: '#F0FDF4', color: '#16A34A' }
                : { background: '#FEF2F2', color: '#EF4444' }
              }>
          {isApproved ? '✓' : '✗'}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: '#1F2937' }}>{registration.team_name}</p>
          <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>Cat: {categoryName}</p>
        </div>
      </div>
      <span className="flex-shrink-0 text-[11px] font-medium"
            style={{ color: isApproved ? '#16A34A' : '#EF4444' }}>
        {isApproved ? 'Admitida' : 'Rechazada'}
      </span>
    </div>
  )
}

function EmptyState({ filter }) {
  const text = filter === 'approved' ? 'No hay solicitudes admitidas.'
    : filter === 'rejected' ? 'No hay solicitudes rechazadas.'
    : 'Las solicitudes procesadas aparecerán aquí.'

  return (
    <div className="flex items-center justify-center py-6">
      <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>{text}</p>
    </div>
  )
}

export default function ApprovedSection({ registrations, loading, filter, onFilterChange }) {
  const filtered = filter === 'all'
    ? registrations
    : registrations.filter(r => r.status === filter)

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#1F2937' }}>
        Admitidas / Rechazadas
      </h3>

      {/* Filter pills */}
      <div className="flex gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150"
            style={filter === f.id
              ? { background: '#E8F4FA', color: '#3A8BB5', border: '1px solid #D0E5F0' }
              : { background: 'transparent', color: '#6B7280', border: '1px solid #E0E2E6' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-1 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="h-10 rounded-xl" style={{ background: '#F3F4F6' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="rounded-2xl px-4"
             style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
          {filtered.map(r => <DecidedRow key={r.id} registration={r} />)}
        </div>
      )}
    </section>
  )
}
