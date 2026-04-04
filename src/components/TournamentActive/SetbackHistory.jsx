import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getSetbackHistory } from '../../lib/setbackPersistence'

function formatDuration(startedAt, endedAt) {
  if (!startedAt) return ''
  const start = new Date(startedAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const diffMin = Math.floor((end - start) / 60000)
  if (diffMin < 60) return `${diffMin} min`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return `${hours}h ${mins}min`
}

function formatDateTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

export default function SetbackHistory({ courtId }) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    if (!courtId) return
    async function loadHistory() {
      setLoading(true)
      const result = await getSetbackHistory(supabase, courtId)
      if (result.success) {
        setHistory(result.data ?? [])
      }
      setLoading(false)
    }
    loadHistory()
  }, [courtId])

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 12 12" fill="currentColor"
            className="w-2.5 h-2.5 transition-transform duration-200"
            style={{ color: '#9CA3AF', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
          >
            <path d="M3 1l6 5-6 5V1z" />
          </svg>
          <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>
            Historial de contratiempos ({history.length})
          </span>
        </div>
      </button>

      {/* Collapsible content */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 1000}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid #F3F4F6' }}>
          <div className="pt-2" />

          {loading && (
            <p className="text-[10px] text-center" style={{ color: '#9CA3AF' }}>Cargando...</p>
          )}

          {!loading && history.length === 0 && (
            <p className="text-[10px] text-center" style={{ color: '#9CA3AF' }}>Sin contratiempos registrados</p>
          )}

          {!loading && history.map(entry => (
            <div
              key={entry.id}
              className="rounded-lg px-3 py-2"
              style={{ background: '#FFFFFF', border: '1px solid #E8EAEE' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold" style={{ color: '#1F2937' }}>
                  {entry.setback_type}
                </span>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: entry.status === 'active' ? '#FEF2F2' : '#F0FDF4',
                    color: entry.status === 'active' ? '#DC2626' : '#16A34A',
                  }}
                >
                  {entry.status === 'active' ? 'En curso' : 'Resuelto'}
                </span>
              </div>
              {entry.description && (
                <p className="text-[10px] mb-1.5" style={{ color: '#6B7280' }}>
                  {entry.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: '#9CA3AF' }}>
                <span>Inicio: {formatDateTime(entry.reported_start || entry.started_at)}</span>
                <span>Fin: {(entry.reported_end || entry.ended_at) ? formatDateTime(entry.reported_end || entry.ended_at) : 'En curso'}</span>
                <span>Duracion: {formatDuration(entry.reported_start || entry.started_at, entry.reported_end || entry.ended_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
