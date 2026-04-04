import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ResumeFormModal({ court, onClose, onConfirm }) {
  const [endDate, setEndDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [endTime, setEndTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isValid = endDate.length > 0 && endTime.length > 0

  async function handleConfirm() {
    if (!isValid || submitting) return
    setSubmitting(true)
    const reportedEnd = new Date(`${endDate}T${endTime}:00`).toISOString()
    await onConfirm(reportedEnd)
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E8EAEE' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#1F2937' }}>Reanudar cancha</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{court.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1F2937' }}>
                Fecha de reanudacion *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#F9FAFB', border: '1px solid #E0E2E6', color: '#1F2937' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1F2937' }}>
                Hora de reanudacion *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#F9FAFB', border: '1px solid #E0E2E6', color: '#1F2937' }}
              />
            </div>
          </div>

          <div
            className="flex gap-2 p-3 rounded-xl"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <span className="text-sm flex-shrink-0">&#9989;</span>
            <p className="text-xs" style={{ color: '#166534' }}>
              Al confirmar, los horarios de los partidos pendientes se recalcularan automaticamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid #E8EAEE' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#F3F4F6', color: '#4B5563' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
            style={{
              background: isValid && !submitting ? '#16A34A' : '#F3F4F6',
              color: isValid && !submitting ? '#FFFFFF' : '#9CA3AF',
              cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Reanudando...' : 'Confirmar reanudacion'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
