import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'
import { createSetback } from '../../lib/setbackPersistence'
import { createBulkNotifications } from '../../lib/notificationPersistence'

const SETBACK_TYPES = [
  'Lluvia',
  'Mantenimiento',
  'Lesion de jugador',
  'Falla electrica',
  'Problema de equipamiento',
  'Otro',
]

export default function SetbackFormModal({ court, tournamentId, onClose, onSuccess }) {
  const [setbackType, setSetbackType] = useState('')
  const [customType, setCustomType] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Block body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const effectiveType = setbackType === 'Otro' ? customType.trim() : setbackType
  const isValid = effectiveType.length > 0 && startDate.length > 0 && startTime.length > 0

  async function handleSubmit() {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)

    const reportedStart = new Date(`${startDate}T${startTime}:00`).toISOString()

    // Fetch ALL pending matches on this court (not just the pre-sliced 3 from UI)
    const { data: allPendingOnCourt } = await supabase
      .from('tournament_matches')
      .select('id, team1_id, team2_id, scheduled_date')
      .eq('tournament_id', tournamentId)
      .eq('court_id', court.id)
      .in('status', ['scheduled', 'pending'])

    const affectedMatchIds = (allPendingOnCourt ?? []).map(m => m.id)

    const result = await createSetback(supabase, {
      tournamentId,
      courtId: court.id,
      setbackType: effectiveType,
      description: description.trim(),
      affectedMatchIds,
      reportedStart,
    })

    if (!result.success) {
      setError(result.error ?? 'Error al activar el contratiempo')
      setSubmitting(false)
      return
    }

    // Send notifications to players with matches on this court TODAY
    const todayMatches = (allPendingOnCourt ?? []).filter(m =>
      m.scheduled_date === startDate && (m.team1_id || m.team2_id)
    )
    const matchIds = todayMatches.map(m => m.id)
    if (matchIds.length > 0) {
      const { data: regData } = await supabase
        .from('tournament_matches')
        .select('team1_id, team2_id')
        .in('id', matchIds)

      const regIds = new Set()
      for (const r of (regData ?? [])) {
        if (r.team1_id) regIds.add(r.team1_id)
        if (r.team2_id) regIds.add(r.team2_id)
      }

      if (regIds.size > 0) {
        const { data: regs } = await supabase
          .from('tournament_registrations')
          .select('player1_id, player2_id')
          .in('id', [...regIds])

        const playerIds = new Set()
        for (const reg of (regs ?? [])) {
          if (reg.player1_id) playerIds.add(reg.player1_id)
          if (reg.player2_id) playerIds.add(reg.player2_id)
        }

        if (playerIds.size > 0) {
          const message = `Contratiempo en ${court.name}: ${effectiveType}. Tu(s) partido(s) de hoy en esta cancha se encuentran retrasados. Te notificaremos cuando se reanude.`
          const notifications = [...playerIds].map(userId => ({
            tournamentId,
            userId,
            message,
            type: 'setback',
          }))
          await createBulkNotifications(supabase, notifications)
        }
      }
    }

    onSuccess()
    onClose()
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
            <h2 className="text-base font-semibold" style={{ color: '#1F2937' }}>Declarar contratiempo</h2>
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
          {/* Type dropdown */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#1F2937' }}>
              Tipo de contratiempo *
            </label>
            <select
              value={setbackType}
              onChange={e => setSetbackType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: '#F9FAFB',
                border: '1px solid #E0E2E6',
                color: setbackType ? '#1F2937' : '#9CA3AF',
              }}
            >
              <option value="">Seleccionar...</option>
              {SETBACK_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Custom type input — only if Otro selected */}
          {setbackType === 'Otro' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1F2937' }}>
                Especificar tipo *
              </label>
              <input
                type="text"
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                placeholder="Describe el tipo de contratiempo"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#F9FAFB', border: '1px solid #E0E2E6', color: '#1F2937' }}
              />
            </div>
          )}

          {/* Date and time inputs */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1F2937' }}>
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#F9FAFB', border: '1px solid #E0E2E6', color: '#1F2937' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#1F2937' }}>
                Hora de inicio *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#F9FAFB', border: '1px solid #E0E2E6', color: '#1F2937' }}
              />
            </div>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#1F2937' }}>
              Descripcion (opcional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe la situacion"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
              style={{ background: '#F9FAFB', border: '1px solid #E0E2E6', color: '#1F2937' }}
            />
          </div>

          {/* Warning text */}
          <div
            className="flex gap-2 p-3 rounded-xl"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
          >
            <span className="text-sm flex-shrink-0">&#9888;</span>
            <p className="text-xs" style={{ color: '#9A3412' }}>
              Al activar, el cronograma de esta cancha se pausara y los jugadores afectados seran notificados.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>
          )}
        </div>

        {/* Footer buttons */}
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
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
            style={{
              background: isValid && !submitting ? '#EA580C' : '#F3F4F6',
              color: isValid && !submitting ? '#FFFFFF' : '#9CA3AF',
              cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Activando...' : 'Activar contratiempo'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
