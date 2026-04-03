// cascadeRecalculator.js — Motor de recalculación en cascada de cronograma
// Módulo de lógica pura (sin React, sin Supabase)

/**
 * Parsea un string de hora "HH:MM" a minutos desde medianoche.
 * Reimplementado localmente — schedulingEngine.js no exporta esta función.
 */
function parseTime(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convierte minutos desde medianoche a string "HH:MM".
 * Reimplementado localmente — schedulingEngine.js no exporta esta función.
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Recalculates scheduled times for pending matches on a specific court
 * after a match finishes with a known actual end time.
 *
 * @param {Object} params
 * @param {string} params.courtId - The court where recalculation happens
 * @param {string} params.actualEndTime - ISO timestamp of when the completed match ended (e.g. "2025-06-15T14:30:00")
 * @param {Array} params.courtMatches - ALL matches on this court (completed + pending), each with:
 *   { id, match_number, court_id, scheduled_date, scheduled_time, estimated_duration_minutes, status, team1_id, team2_id, phase }
 * @param {Object} params.court - Court constraints: { available_from: "HH:MM", available_to: "HH:MM", break_start: "HH:MM"|null, break_end: "HH:MM"|null }
 * @param {Array} params.tournamentDays - Ordered array of tournament day strings ["2025-06-15", "2025-06-16", ...]
 * @returns {Array} updates - Array of { id, scheduled_date, scheduled_time } for matches that changed. Empty if nothing changed.
 */
export function recalculateCourt({ courtId, actualEndTime, courtMatches, court, tournamentDays }) {
  // Step 1: Filter to only this courtId (defensive — ISO-01)
  const filteredMatches = courtMatches.filter(m => m.court_id === courtId)

  // Step 2: Separate completed and pending
  const pending = filteredMatches.filter(
    m => m.status === 'scheduled' || m.status === 'pending'
  )

  // Step 3: Sort pending by scheduled_date ASC, scheduled_time ASC, match_number ASC
  pending.sort((a, b) => {
    const dateCmp = a.scheduled_date.localeCompare(b.scheduled_date)
    if (dateCmp !== 0) return dateCmp
    const timeCmp = a.scheduled_time.localeCompare(b.scheduled_time)
    if (timeCmp !== 0) return timeCmp
    return a.match_number - b.match_number
  })

  // Step 4: Parse actualEndTime to extract anchor date and time
  // Format: "2025-06-15T14:30:00" or "2025-06-15T14:30:00Z" etc.
  const [anchorDatePart, anchorTimePart] = actualEndTime.split('T')
  const anchorDate = anchorDatePart
  const anchorTimeStr = anchorTimePart ? anchorTimePart.substring(0, 5) : '00:00' // "HH:MM"
  const anchorTimeMinutes = parseTime(anchorTimeStr)

  // Step 5: Find the triggering match — the completed match on anchorDate that
  // just ended at actualEndTime. We identify it as the completed match on anchorDate
  // with the LATEST scheduled_time that is <= anchorTimeStr (since a match that
  // ended at anchorTime must have started at or before anchorTime).
  const completedOnAnchorDay = filteredMatches.filter(
    m => m.status === 'completed' && m.scheduled_date === anchorDate && m.scheduled_time <= anchorTimeStr
  )
  completedOnAnchorDay.sort((a, b) => {
    const tc = b.scheduled_time.localeCompare(a.scheduled_time)
    if (tc !== 0) return tc
    return b.match_number - a.match_number
  })
  const triggeringMatch = completedOnAnchorDay[0] || null

  // Get ALL matches (completed + pending) that come AFTER the triggering match
  // in the court queue. We process completed ones to advance the cursor (they
  // occupy time slots), but only add pending ones to the updates array.
  function isAfterTrigger(m) {
    // Matches on future days are always affected
    if (m.scheduled_date > anchorDate) return true
    if (m.scheduled_date === anchorDate) {
      if (!triggeringMatch) {
        // No completed match found on anchor day — this is a resume scenario.
        // ALL non-completed matches on anchor day should be recalculated
        // from the anchor time, regardless of their original scheduled_time.
        return m.status !== 'completed'
      }
      const tm = triggeringMatch.scheduled_time
      if (m.scheduled_time > tm) return true
      if (m.scheduled_time === tm && m.match_number > triggeringMatch.match_number) return true
      return false
    }
    return false
  }

  const affected = filteredMatches.filter(m => isAfterTrigger(m))

  // Sort affected matches: scheduled_date ASC, scheduled_time ASC, match_number ASC
  affected.sort((a, b) => {
    const dateCmp = a.scheduled_date.localeCompare(b.scheduled_date)
    if (dateCmp !== 0) return dateCmp
    const timeCmp = a.scheduled_time.localeCompare(b.scheduled_time)
    if (timeCmp !== 0) return timeCmp
    return a.match_number - b.match_number
  })

  // Court constraints
  const availableFrom = parseTime(court.available_from)
  const availableTo = parseTime(court.available_to)
  const hasBreak = court.break_start != null && court.break_end != null
  const breakStart = hasBreak ? parseTime(court.break_start) : null
  const breakEnd = hasBreak ? parseTime(court.break_end) : null

  /**
   * Advance time past break window if it falls inside it.
   * Returns minutes after applying break window push.
   */
  function applyBreak(timeMinutes, duration = 0) {
    if (!hasBreak) return timeMinutes
    // If start time falls inside break window [break_start, break_end), push to break_end
    if (timeMinutes >= breakStart && timeMinutes < breakEnd) {
      return breakEnd
    }
    // If match would extend into break (doesn't fit before break starts), push to break_end
    if (duration > 0 && timeMinutes < breakStart && timeMinutes + duration > breakStart) {
      return breakEnd
    }
    return timeMinutes
  }

  /**
   * Find next tournament day after a given date string.
   * Returns null if there is no next day.
   */
  function nextTournamentDay(dateStr) {
    const idx = tournamentDays.indexOf(dateStr)
    if (idx === -1 || idx >= tournamentDays.length - 1) return null
    return tournamentDays[idx + 1]
  }

  /**
   * Get the start cursor for a new day: available_from, adjusted for break.
   */
  function startOfDay() {
    return applyBreak(availableFrom)
  }

  // Step 6: Assign new times in cascade.
  // Process all affected matches (completed + pending) in order:
  // - Completed matches advance the cursor (they occupy time slots) but are NOT in updates
  // - Pending matches get new times assigned and ARE added to updates if time changed
  const updates = []

  // Cursor tracks the next available start time (starts at actualEndTime)
  let cursorDate = anchorDate
  let cursorTime = anchorTimeMinutes

  for (const match of affected) {
    const duration = match.estimated_duration_minutes || 60
    const isCompleted = match.status === 'completed'

    // Apply break window to cursor (including check that match fits before break)
    cursorTime = applyBreak(cursorTime, duration)

    // Check overflow: match can't start AND finish within available_to
    if (cursorTime >= availableTo || cursorTime + duration > availableTo) {
      // Overflow to next day
      const next = nextTournamentDay(cursorDate)
      if (next) {
        cursorDate = next
        cursorTime = startOfDay()
      } else {
        // No next day — best effort: stay on last day at available_from
        cursorDate = tournamentDays[tournamentDays.length - 1] || cursorDate
        cursorTime = startOfDay()
      }

      // Re-apply break after overflow (in case available_from falls in break)
      cursorTime = applyBreak(cursorTime, duration)
    }

    const newDate = cursorDate
    const newTime = minutesToTime(cursorTime)

    // Completed matches: advance cursor but do NOT add to updates
    // Pending matches: add to updates if time changed
    if (!isCompleted && (newDate !== match.scheduled_date || newTime !== match.scheduled_time)) {
      updates.push({
        id: match.id,
        scheduled_date: newDate,
        scheduled_time: newTime,
      })
    }

    // Advance cursor by match duration (for both completed and pending)
    cursorTime += duration
  }

  return updates
}
