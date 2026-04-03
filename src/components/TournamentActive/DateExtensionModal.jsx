import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'

export default function DateExtensionModal({ visible, proposedDate, tournamentId, onConfirm, onDismiss }) {
  const [submitting, setSubmitting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Block body scroll while modal is open
  useEffect(() => {
    if (!visible) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [visible])

  if (!visible) return null

  const formattedDate = proposedDate
    ? new Date(proposedDate + 'T12:00:00').toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)

    const { error } = await supabase
      .from('tournaments')
      .update({ end_date: proposedDate })
      .eq('id', tournamentId)

    setSubmitting(false)

    if (!error) {
      onConfirm()
    }
  }

  function handleDismiss() {
    setDismissed(true)
    onDismiss()
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, background: 'rgba(0,0,0,0.4)' }}
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden mx-4 p-6"
        style={{ background: '#FFFFFF', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="flex justify-center mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: '#FEF2F2' }}
          >
            <svg viewBox="0 0 20 20" fill="#DC2626" className="w-6 h-6">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-base font-semibold text-center mb-2" style={{ color: '#1F2937' }}>
          Algunos partidos exceden la fecha final del torneo
        </h2>

        {/* Description */}
        <p className="text-sm text-center mb-1" style={{ color: '#6B7280' }}>
          Se necesita extender la fecha del torneo hasta:
        </p>
        <p className="text-base font-semibold text-center mb-5" style={{ color: '#1F2937' }}>
          {formattedDate}
        </p>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
            style={{
              background: submitting ? '#D1D5DB' : '#16A34A',
              color: '#FFFFFF',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Extendiendo...' : 'Extender torneo'}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            Cancelar
          </button>

          {/* Warning text on dismiss */}
          {dismissed && (
            <p className="text-xs text-center mt-1" style={{ color: '#DC2626' }}>
              Algunos partidos no pudieron ser reprogramados dentro del rango del torneo.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
