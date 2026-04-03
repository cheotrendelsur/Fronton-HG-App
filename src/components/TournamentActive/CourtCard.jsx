import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { resolveSetback } from '../../lib/setbackPersistence'
import { applyCascadeOnResume } from '../../lib/cascadeSchedulePersistence'
import CourtMatchMiniCard from './CourtMatchMiniCard'
import SetbackFormModal from './SetbackFormModal'
import SetbackHistory from './SetbackHistory'

export default function CourtCard({ court, tournamentId, onDataRefresh, onSpillOver }) {
  const { id, name, pendingMatches, activeSetback, categoryMap } = court
  const isPaused = !!activeSetback
  const hasPending = pendingMatches.length > 0

  const [showSetbackModal, setShowSetbackModal] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [elapsed, setElapsed] = useState('')

  // Live elapsed timer for paused court
  useEffect(() => {
    if (!isPaused || !activeSetback?.started_at) {
      setElapsed('')
      return
    }

    function updateElapsed() {
      const start = new Date(activeSetback.started_at).getTime()
      const now = Date.now()
      const diffSec = Math.max(0, Math.floor((now - start) / 1000))
      const hours = Math.floor(diffSec / 3600)
      const mins = Math.floor((diffSec % 3600) / 60)
      const secs = diffSec % 60
      const pad = n => String(n).padStart(2, '0')
      if (hours > 0) {
        setElapsed(`${pad(hours)}:${pad(mins)}:${pad(secs)}`)
      } else {
        setElapsed(`${pad(mins)}:${pad(secs)}`)
      }
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [isPaused, activeSetback?.started_at])

  // Formatted pause start time
  const pausedSinceTime = activeSetback?.started_at
    ? new Date(activeSetback.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : ''

  // Unique notified player count from pending matches
  const notifiedCount = isPaused
    ? (() => {
        const teamIds = new Set()
        for (const m of pendingMatches) {
          if (m.team1_id) teamIds.add(m.team1_id)
          if (m.team2_id) teamIds.add(m.team2_id)
        }
        return teamIds.size * 2
      })()
    : 0

  async function handleResume() {
    if (!activeSetback?.id) return
    setResuming(true)

    // Step 1: Resolve the setback
    const resolveResult = await resolveSetback(supabase, activeSetback.id)
    if (!resolveResult.success) {
      setResuming(false)
      return
    }

    // Step 2: Run cascade recalculation (per D-02, D-03)
    const cascadeResult = await applyCascadeOnResume(supabase, tournamentId, id)

    setResuming(false)

    // Step 3: Handle spill-over (per D-06) — pass courtId so CanchasView can re-run cascade after extension
    if (cascadeResult.success && cascadeResult.spillOver) {
      onSpillOver(id, cascadeResult.spillOverDate)
    }

    // Step 4: Refresh data (loads new match times + resolved setback)
    onDataRefresh()
  }

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8EAEE',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div className="px-4 py-4 space-y-4">
          {/* Header row: court name + status badge */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>
              {name}
            </h3>
            {isPaused ? (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#FEF2F2', color: '#DC2626' }}
              >
                Pausada — {activeSetback.setback_type}
              </span>
            ) : (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#F0FDF4', color: '#16A34A' }}
              >
                Operativa
              </span>
            )}
          </div>

          {/* Paused state info: since time + live elapsed */}
          {isPaused && (
            <div className="space-y-1">
              <p className="text-xs" style={{ color: '#6B7280' }}>
                Pausada desde: <span style={{ color: '#1F2937', fontWeight: 600 }}>{pausedSinceTime}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg">&#9201;</span>
                <span className="text-xl font-mono font-bold" style={{ color: '#DC2626' }}>{elapsed}</span>
              </div>
            </div>
          )}

          {/* Action button */}
          {isPaused ? (
            <button
              type="button"
              onClick={handleResume}
              disabled={resuming}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
              style={{ background: '#F0FDF4', color: '#16A34A', cursor: resuming ? 'not-allowed' : 'pointer' }}
            >
              {resuming ? 'Reanudando...' : 'Reanudar cancha'}
            </button>
          ) : hasPending ? (
            <button
              type="button"
              onClick={() => setShowSetbackModal(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
              style={{ background: '#FFF7ED', color: '#EA580C' }}
            >
              Declarar contratiempo
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
              style={{ background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6 }}
            >
              Sin partidos pendientes
            </button>
          )}

          {/* Match list */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase mb-2"
              style={{ color: '#6B7280', letterSpacing: '0.08em' }}
            >
              {isPaused ? 'Próximos partidos (retrasados):' : 'Próximos partidos:'}
            </p>
            {hasPending ? (
              <div className="space-y-2">
                {pendingMatches.map(match => (
                  <CourtMatchMiniCard
                    key={match.id}
                    match={match}
                    categoryMap={categoryMap}
                    isPaused={isPaused}
                  />
                ))}
              </div>
            ) : (
              <p
                className="text-xs text-center italic py-2"
                style={{ color: '#9CA3AF' }}
              >
                Todos los partidos de esta cancha han sido disputados
              </p>
            )}

            {/* Notified players count */}
            {isPaused && activeSetback?.affected_match_ids && (
              <p className="text-xs text-center mt-2" style={{ color: '#6B7280' }}>
                Jugadores notificados: {notifiedCount}
              </p>
            )}
          </div>

          {/* Setback history accordion */}
          <SetbackHistory courtId={court.id} />
        </div>
      </div>

      {showSetbackModal && (
        <SetbackFormModal
          court={court}
          tournamentId={tournamentId}
          onClose={() => setShowSetbackModal(false)}
          onSuccess={() => {
            setShowSetbackModal(false)
            onDataRefresh()
          }}
        />
      )}
    </>
  )
}
