const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatDateRange(start, end) {
  if (!start) return null
  const s = new Date(start + 'T00:00:00')
  const e = end ? new Date(end + 'T00:00:00') : null
  if (!e || start === end) {
    return `${s.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
  }
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
  }
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`
}

function IconLocation() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted">
      <path d="M8 1.5a4 4 0 0 1 4 4c0 2.8-4 9-4 9S4 8.3 4 5.5a4 4 0 0 1 4-4Z"
            stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="5.5" r="1.2" fill="currentColor"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2.5 13.5c0-3 2.24-5 5.5-5s5.5 2 5.5 5"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted">
      <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 1.5v3M11 1.5v3M1.5 7h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconTag() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted">
      <path d="M2 2h5l7 7-5 5-7-7V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="5" cy="5" r="1" fill="currentColor"/>
    </svg>
  )
}

function IconMoney() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 4.5v7M6 6.5c0-1.1.9-2 2-2s2 .9 2 2-2 1.5-2 1.5-2 .4-2 1.5c0 1.1.9 2 2 2s2-.9 2-2"
            stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function StatusBadge({ status }) {
  const config = {
    inscription: { label: 'Inscripciones',  cls: 'bg-neon-300/10 text-neon-300 border-neon-300/20' },
    active:      { label: 'En curso',        cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    finished:    { label: 'Finalizado',      cls: 'bg-surface-800 text-ink-muted border-border-default' },
    draft:       { label: 'Borrador',        cls: 'bg-surface-800 text-ink-muted border-border-default' },
  }
  const { label, cls } = config[status] ?? { label: status, cls: 'bg-surface-800 text-ink-muted border-border-default' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
      {label}
    </span>
  )
}

export default function TournamentWidget({ tournament, organizerUsername, onClick }) {
  const dateRange   = formatDateRange(tournament?.start_date, tournament?.end_date)
  const sportName   = tournament?.sports?.name
  const categories  = tournament?.categories ?? []
  const categoryNames = categories.map(c => c.name).join(', ')
  const fee         = tournament?.inscription_fee

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface-900 border border-border-default rounded-2xl p-4
                 hover:border-border-strong hover:shadow-card active:scale-[0.99]
                 transition-all duration-200"
    >
      {/* Header row: name + status */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-ink-primary text-sm font-semibold leading-snug flex-1 min-w-0 truncate">
          {tournament?.name ?? '—'}
        </p>
        {tournament?.status && <StatusBadge status={tournament.status} />}
      </div>

      {/* Info rows */}
      <div className="space-y-1.5">
        {tournament?.location && (
          <div className="flex items-center gap-2">
            <IconLocation />
            <span className="text-ink-muted text-xs truncate">{tournament.location}</span>
          </div>
        )}

        {organizerUsername && (
          <div className="flex items-center gap-2">
            <IconUser />
            <span className="text-ink-muted text-xs truncate">Org: {organizerUsername}</span>
          </div>
        )}

        {dateRange && (
          <div className="flex items-center gap-2">
            <IconCalendar />
            <span className="text-ink-muted text-xs">{dateRange}</span>
          </div>
        )}

        {categoryNames && (
          <div className="flex items-center gap-2">
            <IconTag />
            <span className="text-ink-muted text-xs truncate">
              {sportName ? `${sportName} · ` : ''}{categoryNames}
            </span>
          </div>
        )}

        {fee != null && (
          <div className="flex items-center gap-2">
            <IconMoney />
            <span className="text-ink-muted text-xs">${fee}/dupla</span>
          </div>
        )}
      </div>
    </button>
  )
}
