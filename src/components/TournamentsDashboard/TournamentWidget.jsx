import { useState } from 'react'

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
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
      <path d="M8 1.5a4 4 0 0 1 4 4c0 2.8-4 9-4 9S4 8.3 4 5.5a4 4 0 0 1 4-4Z"
            stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="5.5" r="1.2" fill="currentColor"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2.5 13.5c0-3 2.24-5 5.5-5s5.5 2 5.5 5"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
      <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 1.5v3M11 1.5v3M1.5 7h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconTag() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
      <path d="M2 2h5l7 7-5 5-7-7V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="5" cy="5" r="1" fill="currentColor"/>
    </svg>
  )
}

function IconMoney() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 4.5v7M6 6.5c0-1.1.9-2 2-2s2 .9 2 2-2 1.5-2 1.5-2 .4-2 1.5c0 1.1.9 2 2 2s2-.9 2-2"
            stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function StatusBadge({ status }) {
  const config = {
    inscription: { label: 'Inscripciones',  cls: 'border', style: { background: '#E8F4FA', color: '#3A8BB5', borderColor: '#D0E5F0' } },
    active:      { label: 'En curso',        cls: 'border', style: { background: '#EFF6FF', color: '#3B82F6', borderColor: '#BFDBFE' } },
    finished:    { label: 'Finalizado',      cls: 'border', style: { background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' } },
    draft:       { label: 'Borrador',        cls: 'border', style: { background: '#F3F4F6', color: '#6B7280', borderColor: '#E0E2E6' } },
  }
  const cfg = config[status] ?? { label: status, cls: 'border', style: { background: '#F3F4F6', color: '#6B7280', borderColor: '#E0E2E6' } }
  const { label, cls, style: badgeStyle } = cfg
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}
          style={badgeStyle}>
      {label}
    </span>
  )
}

function StartConfirmModal({ tournamentName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-card animate-fade-up"
           style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
             style={{ background: '#E8F4FA', border: '1px solid #D0E5F0' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"
            style={{ color: '#6BB3D9' }}
            stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <h3 className="text-base font-semibold text-center leading-snug mb-2" style={{ color: '#1F2937' }}>
          ¿Iniciar torneo?
        </h3>
        <p className="text-xs text-center leading-relaxed mb-1" style={{ color: '#6B7280' }}>
          <span className="font-medium" style={{ color: '#4B5563' }}>"{tournamentName}"</span>
        </p>
        <p className="text-xs text-center leading-relaxed mb-6" style={{ color: '#6B7280' }}>
          Esta acción iniciará el torneo y no se podrá volver atrás.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-medium
                       transition-all duration-200"
            style={{ background: '#F3F4F6', color: '#4B5563' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-semibold
                       text-white
                       transition-all duration-200"
            style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
          >
            Sí, iniciar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TournamentWidget({ tournament, organizerUsername, onClick, readonly = false }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const dateRange     = formatDateRange(tournament?.start_date, tournament?.end_date)
  const sportName     = tournament?.sports?.name
  const categories    = tournament?.categories ?? []
  const categoryNames = categories.map(c => c.name).join(', ')
  const fee           = tournament?.inscription_fee

  function handleStartClick(e) {
    e.stopPropagation()
    setConfirmOpen(true)
  }

  function handleConfirm() {
    setConfirmOpen(false)
    // TASK-004: implementar inicio real del torneo
    console.log('Iniciando TASK-004...')
  }

  function handleCancel() {
    setConfirmOpen(false)
  }

  return (
    <>
      <div
        onClick={!readonly ? onClick : undefined}
        className={`w-full text-left rounded-2xl p-4
                   transition-all duration-200
                   ${readonly
                     ? 'opacity-60 cursor-default'
                     : 'hover:shadow-card active:scale-[0.99] cursor-pointer'
                   }`}
        style={readonly
          ? { background: '#FFFFFF', border: '1px solid #E8EAEE', borderLeft: '3px solid #D1D5DB' }
          : { background: '#FFFFFF', border: '1px solid #E8EAEE', borderLeft: '3px solid #6BB3D9' }
        }
      >
        {/* Header row: name + status */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-sm font-semibold leading-snug flex-1 min-w-0 truncate" style={{ color: '#1F2937' }}>
            {tournament?.name ?? '—'}
          </p>
          {tournament?.status && <StatusBadge status={tournament.status} />}
        </div>

        {/* Info rows */}
        <div className="space-y-1.5" style={{ color: '#6B7280' }}>
          {tournament?.location && (
            <div className="flex items-center gap-2">
              <IconLocation />
              <span className="text-xs truncate">{tournament.location}</span>
            </div>
          )}

          {organizerUsername && (
            <div className="flex items-center gap-2">
              <IconUser />
              <span className="text-xs truncate">Org: {organizerUsername}</span>
            </div>
          )}

          {dateRange && (
            <div className="flex items-center gap-2">
              <IconCalendar />
              <span className="text-xs">{dateRange}</span>
            </div>
          )}

          {categoryNames && (
            <div className="flex items-center gap-2">
              <IconTag />
              <span className="text-xs truncate">
                {sportName ? `${sportName} · ` : ''}{categoryNames}
              </span>
            </div>
          )}

          {fee != null && (
            <div className="flex items-center gap-2">
              <IconMoney />
              <span className="text-xs">${fee}/dupla</span>
            </div>
          )}
        </div>

        {/* Start button — only for active (non-readonly) widgets */}
        {!readonly && (
          <button
            type="button"
            onClick={handleStartClick}
            className="mt-4 w-full py-3 rounded-xl text-sm font-semibold
                       text-white
                       transition-all duration-200"
            style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
          >
            Listo para iniciar
          </button>
        )}
      </div>

      {confirmOpen && (
        <StartConfirmModal
          tournamentName={tournament?.name ?? ''}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
