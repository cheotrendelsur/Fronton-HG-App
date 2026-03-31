const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function RegistrationRequestCard({ registration, onApprove, onReject, acting, isCategoryFull }) {
  const categoryName = registration.categories?.name ?? '—'
  const p1 = registration.player1?.username ?? registration.player1?.email ?? '?'
  const p2 = registration.player2?.username ?? registration.player2?.email ?? '?'

  return (
    <div className="rounded-2xl p-4 space-y-3"
         style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
      {/* Team info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-snug" style={{ color: '#1F2937' }}>
            {p1} / {p2}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: '#FFF5D6', color: '#92750F', border: '1px solid #F5E6A3' }}>
            Pendiente
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
            <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 flex-shrink-0">
              <path d="M7 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 12c0-2.76 2.24-4.5 5-4.5s5 1.74 5 4.5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {categoryName}
          </span>
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
            <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 flex-shrink-0">
              <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 1v3M9.5 1v3M1 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {formatDate(registration.requested_at)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {isCategoryFull && (
        <p className="text-[11px] font-medium" style={{ color: '#F59E0B' }}>
          Categoría llena — no se aceptan más participantes.
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onApprove(registration)}
          disabled={acting || isCategoryFull}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold
                     text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-all duration-150"
          style={{ background: '#6BB3D9' }}
        >
          {acting ? '…' : 'Admitir'}
        </button>
        <button
          type="button"
          onClick={() => onReject(registration)}
          disabled={acting}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold
                     text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-all duration-150"
          style={{ background: '#EF4444' }}
        >
          {acting ? '…' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}
