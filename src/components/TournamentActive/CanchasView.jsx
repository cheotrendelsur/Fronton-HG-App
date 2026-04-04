import { useState, useEffect } from 'react'
import { detectTeamConflicts } from '../../lib/conflictDetector'
import { applyCascadeOnResume } from '../../lib/cascadeSchedulePersistence'
import { supabase } from '../../lib/supabaseClient'
import CourtSwiper from './CourtSwiper'
import ConflictAlert from './ConflictAlert'
import DateExtensionModal from './DateExtensionModal'

export default function CanchasView({ courts, matches, categories, activeSetbacks, tournamentId, onDataRefresh }) {
  const [conflicts, setConflicts] = useState([])
  const [conflictsDismissed, setConflictsDismissed] = useState(false)
  const [spillOverDate, setSpillOverDate] = useState(null)
  const [spillOverCourtId, setSpillOverCourtId] = useState(null)
  const [resolutionSummary, setResolutionSummary] = useState(null)

  // Run conflict detection whenever matches change
  useEffect(() => {
    const courtNameMap = Object.fromEntries(courts.map(c => [c.id, c.name]))
    const detected = detectTeamConflicts(matches, courtNameMap)
    setConflicts(detected)
    if (detected.length > 0) setConflictsDismissed(false)
  }, [matches, courts])

  if (courts.length === 0) {
    return (
      <p className="text-xs text-center py-8" style={{ color: '#9CA3AF' }}>
        No hay canchas en este torneo
      </p>
    )
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const enrichedCourts = courts.map(court => {
    const pendingMatches = matches
      .filter(m => m.court_id === court.id && (m.status === 'scheduled' || m.status === 'pending'))
      .sort((a, b) => {
        if (a.scheduled_date !== b.scheduled_date) {
          return (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? '')
        }
        return (a.scheduled_time ?? '').localeCompare(b.scheduled_time ?? '')
      })
      .slice(0, 3)

    return {
      ...court,
      pendingMatches,
      activeSetback: activeSetbacks[court.id] || null,
      categoryMap,
    }
  })

  function handleSpillOver(courtId, date) {
    setSpillOverCourtId(courtId)
    setSpillOverDate(date)
  }

  async function handleExtensionConfirm() {
    // After DB update of end_date (done inside DateExtensionModal),
    // re-run cascade with the now-extended tournament date range (per D-07)
    if (spillOverCourtId) {
      await applyCascadeOnResume(supabase, tournamentId, spillOverCourtId)
    }
    setSpillOverDate(null)
    setSpillOverCourtId(null)
    onDataRefresh()
  }

  function handleExtensionDismiss() {
    setSpillOverDate(null)
    setSpillOverCourtId(null)
  }

  function handleResumeConflicts(resumeConflicts) {
    // Merge resume conflicts into the existing conflict detection
    // Format: unresolvedDetails uses flat keys (match1Id, match1Court, etc.)
    const courtNameMap = Object.fromEntries(courts.map(c => [c.id, c.name]))
    const formatted = resumeConflicts.map(c => ({
      teamId: c.teamId,
      teamName: c.teamId,
      match1: {
        matchId: c.match1Id,
        courtId: c.match1Court,
        courtName: courtNameMap[c.match1Court] || c.match1Court,
        date: '',
        time: c.match1Time,
        duration: 55,
      },
      match2: {
        matchId: c.match2Id,
        courtId: c.match2Court,
        courtName: courtNameMap[c.match2Court] || c.match2Court,
        date: '',
        time: c.match2Time,
        duration: 55,
      },
    }))
    setConflicts(prev => [...prev, ...formatted])
    setConflictsDismissed(false)
  }

  return (
    <>
      {/* Resolution summary banner */}
      {resolutionSummary && resolutionSummary.detected > 0 && (
        <div
          className="rounded-xl px-4 py-3 mb-4 relative"
          style={{
            background: resolutionSummary.unresolved > 0 ? '#FFF7ED' : '#F0FDF4',
            border: `1px solid ${resolutionSummary.unresolved > 0 ? '#FED7AA' : '#BBF7D0'}`,
          }}
        >
          <div className="flex items-start justify-between mb-1">
            <span className="text-sm font-semibold" style={{ color: resolutionSummary.unresolved > 0 ? '#EA580C' : '#16A34A' }}>
              Resolucion de conflictos
            </span>
            <button
              type="button"
              onClick={() => setResolutionSummary(null)}
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ color: '#9CA3AF' }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>
          <div className="space-y-1 text-xs" style={{ color: '#4B5563' }}>
            <p>Se detectaron <strong>{resolutionSummary.detected}</strong> conflictos de horario</p>
            {(resolutionSummary.resolvedBySwap > 0 || resolutionSummary.resolvedByMove > 0) && (
              <p>
                Se resolvieron <strong>{resolutionSummary.resolvedBySwap + resolutionSummary.resolvedByMove}</strong> automaticamente
                {resolutionSummary.resolvedBySwap > 0 && ` (${resolutionSummary.resolvedBySwap} por intercambio)`}
                {resolutionSummary.resolvedByMove > 0 && ` (${resolutionSummary.resolvedByMove} por desplazamiento)`}
              </p>
            )}
            {resolutionSummary.unresolved > 0 && (
              <>
                <p style={{ color: '#DC2626', fontWeight: 600 }}>
                  {resolutionSummary.unresolved} conflicto(s) requieren atencion manual
                </p>
                {resolutionSummary.unresolvedDetails.map((u, i) => (
                  <p key={i} className="pl-2 text-[11px]" style={{ color: '#6B7280' }}>
                    Partido #{u.match1Number} ({u.match1Time}) vs Partido #{u.match2Number} ({u.match2Time})
                  </p>
                ))}
              </>
            )}
            {resolutionSummary.reverted && resolutionSummary.reverted.length > 0 && (
              <>
                <p style={{ color: '#B45309', fontWeight: 600 }}>
                  {resolutionSummary.reverted.length} partido(s) revertidos por exceder el limite de 2 horas
                </p>
                {resolutionSummary.reverted.map((r, i) => (
                  <p key={i} className="pl-2 text-[11px]" style={{ color: '#6B7280' }}>
                    Partido #{r.matchNumber} — {r.reason === 'R6' ? `desplazamiento ${r.displacement} min` : 'programado en el pasado'}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {!conflictsDismissed && conflicts.length > 0 && (
        <ConflictAlert conflicts={conflicts} onDismiss={() => setConflictsDismissed(true)} />
      )}
      <CourtSwiper
        courts={enrichedCourts}
        tournamentId={tournamentId}
        onDataRefresh={onDataRefresh}
        onSpillOver={handleSpillOver}
        onConflicts={handleResumeConflicts}
        onResolutionSummary={setResolutionSummary}
      />
      {spillOverDate && (
        <DateExtensionModal
          visible={true}
          proposedDate={spillOverDate}
          tournamentId={tournamentId}
          onConfirm={handleExtensionConfirm}
          onDismiss={handleExtensionDismiss}
        />
      )}
    </>
  )
}
