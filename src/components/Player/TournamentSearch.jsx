import { useState, useRef, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'inscription', label: 'Inscripcion abierta' },
  { value: 'active', label: 'En curso' },
  { value: 'finished', label: 'Finalizado' },
]

export default function TournamentSearch({ filters, onFiltersChange }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [localText, setLocalText] = useState(filters.text ?? '')
  const debounceRef = useRef(null)

  // Debounce text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, text: localText })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [localText])

  const toggleStatus = (val) => {
    const current = filters.statuses ?? []
    const next = current.includes(val)
      ? current.filter(s => s !== val)
      : [...current, val]
    onFiltersChange({ ...filters, statuses: next })
  }

  const clearAll = () => {
    setLocalText('')
    onFiltersChange({ text: '', statuses: [], dateFrom: '', dateTo: '' })
  }

  const activeChips = []
  if (filters.statuses?.length) {
    for (const s of filters.statuses) {
      const opt = STATUS_OPTIONS.find(o => o.value === s)
      if (opt) activeChips.push({ key: `status-${s}`, label: opt.label, remove: () => toggleStatus(s) })
    }
  }
  if (filters.dateFrom) {
    activeChips.push({ key: 'dateFrom', label: `Desde ${filters.dateFrom}`, remove: () => onFiltersChange({ ...filters, dateFrom: '' }) })
  }
  if (filters.dateTo) {
    activeChips.push({ key: 'dateTo', label: `Hasta ${filters.dateTo}`, remove: () => onFiltersChange({ ...filters, dateTo: '' }) })
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{
        position: 'sticky', top: '56px', zIndex: 20,
        background: '#F2F3F5', padding: '8px 0 4px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#FFFFFF', border: '1px solid #E0E2E6',
          borderRadius: '12px', padding: '0 12px', height: '44px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={localText}
            onChange={e => setLocalText(e.target.value)}
            placeholder="Buscar torneos..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: '14px', color: '#1F2937', fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir filtros"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', display: 'flex', alignItems: 'center',
              position: 'relative',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
            {activeChips.length > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#6BB3D9',
              }} />
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {activeChips.map(chip => (
              <span key={chip.key} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontWeight: 500,
                background: '#E8F4FA', color: '#3A8BB5',
                borderRadius: '6px', padding: '3px 8px',
              }}>
                {chip.label}
                <button onClick={chip.remove} aria-label={`Quitar filtro ${chip.label}`} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'flex', color: '#3A8BB5',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </span>
            ))}
            <button onClick={clearAll} aria-label="Limpiar todos los filtros" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 500, color: '#EF4444', padding: '3px 4px',
            }}>
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* Filter drawer */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 9998, animation: 'fadeIn 200ms ease-out',
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#FFFFFF', borderRadius: '20px 20px 0 0',
            zIndex: 9999, padding: '16px',
            maxHeight: '70vh', overflowY: 'auto',
            animation: 'slideUp 300ms ease-out',
          }}>
            {/* Drag handle */}
            <div style={{
              width: '40px', height: '4px', borderRadius: '2px',
              background: '#D1D5DB', margin: '0 auto 16px',
            }} />

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '16px' }}>
              Filtros
            </h3>

            {/* Status chips */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#6B7280', display: 'block', marginBottom: '8px',
              }}>
                Estado
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {STATUS_OPTIONS.map(opt => {
                  const active = (filters.statuses ?? []).includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleStatus(opt.value)}
                      style={{
                        fontSize: '13px', fontWeight: active ? 600 : 500,
                        background: active ? '#E8F4FA' : '#FFFFFF',
                        color: active ? '#3A8BB5' : '#6B7280',
                        border: `1px solid ${active ? '#6BB3D9' : '#E0E2E6'}`,
                        borderRadius: '12px', padding: '8px 16px',
                        cursor: 'pointer', transition: 'all 200ms',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date range */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: '#6B7280', display: 'block', marginBottom: '8px',
              }}>
                Rango de fechas
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                  style={{
                    flex: 1, background: '#FFFFFF', border: '1px solid #E0E2E6',
                    borderRadius: '12px', padding: '10px 12px', fontSize: '13px',
                    color: '#1F2937', fontFamily: 'DM Sans, sans-serif',
                  }}
                />
                <input
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={e => onFiltersChange({ ...filters, dateTo: e.target.value })}
                  style={{
                    flex: 1, background: '#FFFFFF', border: '1px solid #E0E2E6',
                    borderRadius: '12px', padding: '10px 12px', fontSize: '13px',
                    color: '#1F2937', fontFamily: 'DM Sans, sans-serif',
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={clearAll} aria-label="Limpiar filtros" style={{
                flex: 1, background: '#F3F4F6', color: '#4B5563',
                border: 'none', borderRadius: '12px', padding: '12px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}>
                Limpiar
              </button>
              <button onClick={() => setDrawerOpen(false)} aria-label="Aplicar filtros" style={{
                flex: 1, background: '#6BB3D9', color: '#FFFFFF',
                border: 'none', borderRadius: '12px', padding: '12px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 0 12px rgba(107,179,217,0.15)',
              }}>
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
