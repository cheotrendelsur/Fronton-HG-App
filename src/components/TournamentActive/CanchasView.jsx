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

  return (
    <>
      {!conflictsDismissed && conflicts.length > 0 && (
        <ConflictAlert conflicts={conflicts} onDismiss={() => setConflictsDismissed(true)} />
      )}
      <CourtSwiper
        courts={enrichedCourts}
        tournamentId={tournamentId}
        onDataRefresh={onDataRefresh}
        onSpillOver={handleSpillOver}
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
