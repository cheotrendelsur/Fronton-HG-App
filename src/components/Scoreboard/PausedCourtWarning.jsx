import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function PausedCourtWarning({ setbackType, onCancel, onProceed }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-5 space-y-4">
          {/* Warning icon + text */}
          <div className="flex gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEF2F2' }}
            >
              <span className="text-lg">&#9888;</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1F2937' }}>Cancha pausada</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                Esta cancha esta pausada por{' '}
                <strong style={{ color: '#1F2937' }}>{setbackType}</strong>.
                {' '}¿Deseas registrar el resultado de todos modos?
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#F3F4F6', color: '#4B5563' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onProceed}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#6BB3D9', color: '#FFFFFF' }}
            >
              Registrar de todos modos
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
