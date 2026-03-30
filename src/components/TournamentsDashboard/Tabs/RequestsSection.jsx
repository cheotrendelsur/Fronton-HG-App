import RegistrationRequestCard from './RegistrationRequestCard'

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="rounded-2xl p-4 space-y-3 animate-pulse"
             style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
          <div className="h-3.5 rounded-full w-3/5" style={{ background: '#E5E7EB' }} />
          <div className="h-3 rounded-full w-2/5" style={{ background: '#E5E7EB' }} />
          <div className="flex gap-2 pt-1">
            <div className="flex-1 h-9 rounded-xl" style={{ background: '#E5E7EB' }} />
            <div className="flex-1 h-9 rounded-xl" style={{ background: '#E5E7EB' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2
                    rounded-xl"
         style={{ background: '#F9FAFB', border: '1px solid #E0E2E6' }}>
      <p className="text-xs text-center leading-relaxed" style={{ color: '#9CA3AF' }}>
        No hay solicitudes pendientes.
      </p>
    </div>
  )
}

export default function RequestsSection({ registrations, loading, actingId, fullCategoryIds = new Set(), onApprove, onReject }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#1F2937' }}>
          Solicitudes nuevas
        </h3>
        {!loading && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                            rounded-full text-[10px] font-medium tabular-nums"
                style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E0E2E6' }}>
            {registrations.length}
          </span>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : registrations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {registrations.map(r => (
            <RegistrationRequestCard
              key={r.id}
              registration={r}
              onApprove={onApprove}
              onReject={onReject}
              acting={actingId === r.id}
              isCategoryFull={fullCategoryIds.has(r.category_id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
