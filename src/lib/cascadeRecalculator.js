// cascadeRecalculator.js — Motor de recalculación en cascada de cronograma
// Módulo de lógica pura (sin React, sin Supabase)

/**
 * Parsea un string de hora "HH:MM" a minutos desde medianoche.
 */
export function parseTime(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convierte minutos desde medianoche a string "HH:MM".
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
 * Used by the per-match cascade (after recording a result).
 * This version re-packs matches from the actual end time forward.
 *
 * @param {Object} params
 * @param {string} params.courtId - The court where recalculation happens
 * @param {string} params.actualEndTime - ISO timestamp of when the completed match ended
 * @param {Array} params.courtMatches - ALL matches on this court (completed + pending)
 * @param {Object} params.court - Court constraints (fallback): { available_from, available_to, break_start, break_end }
 * @param {Array} params.tournamentDays - Ordered array of tournament day strings
 * @param {Object} [params.courtSchedules] - Per-day-of-week overrides: { [dow]: { available_from, available_to, break_start, break_end } }
 * @returns {Array} updates - Array of { id, scheduled_date, scheduled_time } for matches that changed.
 */
export function recalculateCourt({ courtId, actualEndTime, courtMatches, court, tournamentDays, courtSchedules = {} }) {
  // Step 1: Filter to only this courtId (defensive — ISO-01)
  const filteredMatches = courtMatches.filter(m => m.court_id === courtId)

  // Step 2: Parse actualEndTime to extract anchor date and time
  const [anchorDatePart, anchorTimePart] = actualEndTime.split('T')
  const anchorDate = anchorDatePart
  const anchorTimeStr = anchorTimePart ? anchorTimePart.substring(0, 5) : '00:00'
  const anchorTimeMinutes = parseTime(anchorTimeStr)

  // Step 3: Find the triggering match — the completed match on anchorDate
  const completedOnAnchorDay = filteredMatches.filter(
    m => m.status === 'completed' && m.scheduled_date === anchorDate && m.scheduled_time <= anchorTimeStr
  )
  completedOnAnchorDay.sort((a, b) => {
    const tc = b.scheduled_time.localeCompare(a.scheduled_time)
    if (tc !== 0) return tc
    return b.match_number - a.match_number
  })
  const triggeringMatch = completedOnAnchorDay[0] || null

  // Get only SAME-DAY matches after the triggering match on this court.
  // Future-day matches are NOT dragged backwards — they only move if spill-over pushes them further forward.
  function isAfterTriggerSameDay(m) {
    if (m.scheduled_date !== anchorDate) return false
    if (!triggeringMatch) {
      return m.status !== 'completed'
    }
    const tm = triggeringMatch.scheduled_time
    if (m.scheduled_time > tm) return true
    if (m.scheduled_time === tm && m.match_number > triggeringMatch.match_number) return true
    return false
  }

  const sameDayAffected = filteredMatches.filter(m => isAfterTriggerSameDay(m))
  sameDayAffected.sort((a, b) => {
    const timeCmp = a.scheduled_time.localeCompare(b.scheduled_time)
    if (timeCmp !== 0) return timeCmp
    return a.match_number - b.match_number
  })

  // Future-day matches on this court — only affected by spill-over
  const futureDayMatches = filteredMatches
    .filter(m => m.scheduled_date > anchorDate && m.status !== 'completed')
    .sort((a, b) => {
      const dateCmp = a.scheduled_date.localeCompare(b.scheduled_date)
      if (dateCmp !== 0) return dateCmp
      const timeCmp = a.scheduled_time.localeCompare(b.scheduled_time)
      if (timeCmp !== 0) return timeCmp
      return a.match_number - b.match_number
    })

  // Helper: get effective court config for a specific date
  function getCourtForDate(dateStr) {
    const dow = new Date(dateStr + 'T00:00:00').getDay()
    const sched = courtSchedules[dow]
    if (sched) {
      return {
        available_from: sched.available_from || court.available_from,
        available_to: sched.available_to || court.available_to,
        break_start: sched.break_start,
        break_end: sched.break_end,
      }
    }
    return court
  }

  function getConstraints(dateStr) {
    const c = getCourtForDate(dateStr)
    const af = parseTime(c.available_from)
    const at = parseTime(c.available_to)
    const hb = c.break_start != null && c.break_end != null
    return { availableFrom: af, availableTo: at, hasBreak: hb, breakStart: hb ? parseTime(c.break_start) : null, breakEnd: hb ? parseTime(c.break_end) : null }
  }

  function applyBreakForDate(timeMinutes, duration, dateStr) {
    const { hasBreak, breakStart, breakEnd } = getConstraints(dateStr)
    if (!hasBreak) return timeMinutes
    if (timeMinutes >= breakStart && timeMinutes < breakEnd) return breakEnd
    if (duration > 0 && timeMinutes < breakStart && timeMinutes + duration > breakStart) return breakEnd
    return timeMinutes
  }

  function nextTournamentDay(dateStr) {
    const idx = tournamentDays.indexOf(dateStr)
    if (idx === -1 || idx >= tournamentDays.length - 1) return null
    return tournamentDays[idx + 1]
  }

  function startOfDay(dateStr) {
    const { availableFrom } = getConstraints(dateStr)
    return applyBreakForDate(availableFrom, 0, dateStr)
  }

  // Step 4: Cascade same-day matches from anchor
  const updates = []
  let cursorDate = anchorDate
  let cursorTime = anchorTimeMinutes
  const spillOverMatches = [] // matches that spill from anchor day into the next day

  for (const match of sameDayAffected) {
    const duration = match.estimated_duration_minutes || 60
    const isCompleted = match.status === 'completed'

    cursorTime = applyBreakForDate(cursorTime, duration, cursorDate)

    const { availableTo } = getConstraints(cursorDate)
    if (cursorTime >= availableTo || cursorTime + duration > availableTo) {
      // Spill-over: this match and all remaining same-day matches go to next day
      spillOverMatches.push(match)
      // Collect remaining same-day matches for spill-over
      const idx = sameDayAffected.indexOf(match)
      for (let i = idx + 1; i < sameDayAffected.length; i++) {
        spillOverMatches.push(sameDayAffected[i])
      }
      break
    }

    const newTime = minutesToTime(cursorTime)

    if (!isCompleted && (cursorDate !== match.scheduled_date || newTime !== match.scheduled_time)) {
      updates.push({
        id: match.id,
        scheduled_date: cursorDate,
        scheduled_time: newTime,
      })
    }

    cursorTime += duration
  }

  // Step 5: Handle spill-over — matches that don't fit in anchor day cascade forward through future days
  if (spillOverMatches.length > 0) {
    // Queue of matches that need placement, starting with the spill-over from anchor day
    let pendingPlacement = [...spillOverMatches]
    let spillDate = nextTournamentDay(anchorDate)

    while (pendingPlacement.length > 0 && spillDate) {
      let spillCursorTime = startOfDay(spillDate)
      const placed = []
      const nextSpill = []
      const { availableTo: spillAvailableTo } = getConstraints(spillDate)

      // Merge pending with existing future-day matches on this day
      const existingOnDay = futureDayMatches.filter(m =>
        m.scheduled_date === spillDate && !pendingPlacement.find(p => p.id === m.id)
      )
      const allForDay = [...pendingPlacement, ...existingOnDay].sort((a, b) => {
        const aIsPending = pendingPlacement.includes(a) ? 0 : 1
        const bIsPending = pendingPlacement.includes(b) ? 0 : 1
        if (aIsPending !== bIsPending) return aIsPending - bIsPending
        return a.scheduled_time.localeCompare(b.scheduled_time) || a.match_number - b.match_number
      })

      for (const match of allForDay) {
        const duration = match.estimated_duration_minutes || 60
        const isPending = pendingPlacement.includes(match)

        spillCursorTime = applyBreakForDate(spillCursorTime, duration, spillDate)

        if (spillCursorTime + duration > spillAvailableTo) {
          // This match and all remaining spill further
          nextSpill.push(match)
          const idx = allForDay.indexOf(match)
          for (let i = idx + 1; i < allForDay.length; i++) nextSpill.push(allForDay[i])
          break
        }

        const newTime = minutesToTime(spillCursorTime)
        const origDate = match.scheduled_date
        const origTime = match.scheduled_time

        // Only update if position changed and only move forward (never backwards)
        if (isPending || (spillDate === origDate && newTime > origTime)) {
          if (spillDate !== origDate || newTime !== origTime) {
            updates.push({ id: match.id, scheduled_date: spillDate, scheduled_time: newTime })
          }
        }

        placed.push(match)
        spillCursorTime += duration
      }

      pendingPlacement = nextSpill.length > 0 ? nextSpill : []
      spillDate = nextTournamentDay(spillDate)
    }
  }

  return updates
}

/**
 * Delta-based recalculation for court resume after a setback.
 * Instead of repacking all matches from scratch, adds a delta (delay)
 * to each pending match and handles edge cases (breaks, day overflow).
 *
 * BUG FIX 1: Only adds the delta, doesn't repack from scratch.
 * BUG FIX 3: Never moves matches backwards.
 * BUG FIX 2: Enforces elimination matches stay after last group match.
 *
 * @param {Object} params
 * @param {string} params.courtId - The court being resumed
 * @param {number} params.deltaMinutes - Delay in minutes (reported_end - reported_start)
 * @param {Array} params.courtMatches - ALL matches on this court
 * @param {Object} params.court - Court constraints (fallback)
 * @param {Array} params.tournamentDays - Ordered tournament days
 * @param {Object} [params.courtSchedules] - Per-day-of-week overrides: { [dow]: { available_from, available_to, break_start, break_end } }
 * @param {string|null} params.lastGroupDateTime - ISO-like "YYYY-MM-DD|HH:MM" of last group match across ALL courts
 * @param {Array} params.allTournamentMatches - ALL matches across ALL courts (for conflict detection)
 * @returns {{ updates: Array, conflicts: Array }}
 */
export function recalculateCourtOnResume({
  courtId,
  deltaMinutes,
  courtMatches,
  court,
  tournamentDays,
  courtSchedules = {},
  lastGroupDateTime,
  allTournamentMatches = [],
}) {
  if (deltaMinutes <= 0) return { updates: [], conflicts: [] }

  // Filter to this court's matches
  const filteredMatches = courtMatches.filter(m => m.court_id === courtId)

  // Separate pending matches and sort chronologically
  const pending = filteredMatches
    .filter(m => m.status === 'scheduled' || m.status === 'pending')
    .sort((a, b) => {
      const dateCmp = a.scheduled_date.localeCompare(b.scheduled_date)
      if (dateCmp !== 0) return dateCmp
      const timeCmp = a.scheduled_time.localeCompare(b.scheduled_time)
      if (timeCmp !== 0) return timeCmp
      return a.match_number - b.match_number
    })

  if (pending.length === 0) return { updates: [], conflicts: [] }

  // Helper: get effective court config for a specific date
  function getCourtForDate(dateStr) {
    const dow = new Date(dateStr + 'T00:00:00').getDay()
    const sched = courtSchedules[dow]
    if (sched) {
      return {
        available_from: sched.available_from || court.available_from,
        available_to: sched.available_to || court.available_to,
        break_start: sched.break_start,
        break_end: sched.break_end,
      }
    }
    return court
  }

  // Parse last group date+time for elimination ordering (BUG 2)
  let lastGroupDate = null
  let lastGroupTime = null
  if (lastGroupDateTime) {
    const [d, t] = lastGroupDateTime.split('|')
    lastGroupDate = d
    lastGroupTime = t
  }

  function applyBreakForDate(timeMinutes, duration, dateStr) {
    const c = getCourtForDate(dateStr)
    const hasBreak = c.break_start != null && c.break_end != null
    if (!hasBreak) return timeMinutes
    const bs = parseTime(c.break_start)
    const be = parseTime(c.break_end)
    if (timeMinutes >= bs && timeMinutes < be) return be
    if (duration > 0 && timeMinutes < bs && timeMinutes + duration > bs) return be
    return timeMinutes
  }

  function nextTournamentDay(dateStr) {
    const idx = tournamentDays.indexOf(dateStr)
    if (idx === -1 || idx >= tournamentDays.length - 1) return null
    return tournamentDays[idx + 1]
  }

  // Process each pending match: add delta in cascade
  const updates = []
  let prevEndDate = null
  let prevEndTime = 0

  for (const match of pending) {
    const duration = match.estimated_duration_minutes || 60
    const origTime = parseTime(match.scheduled_time)
    const origDate = match.scheduled_date

    // Start with original time + delta
    let newTime = origTime + deltaMinutes
    let newDate = origDate

    // If there's a previous match in this cascade, ensure we don't overlap
    if (prevEndDate !== null) {
      if (newDate === prevEndDate && newTime < prevEndTime) {
        newTime = prevEndTime
      } else if (newDate < prevEndDate) {
        newDate = prevEndDate
        newTime = prevEndTime
      }
    }

    // Apply break for the specific day
    newTime = applyBreakForDate(newTime, duration, newDate)

    // Day overflow: if match can't finish before court closes on this day, move to next day
    const dayConfig = getCourtForDate(newDate)
    const availableTo = parseTime(dayConfig.available_to)
    if (newTime + duration > availableTo) {
      const next = nextTournamentDay(newDate)
      if (next) {
        newDate = next
        const nextConfig = getCourtForDate(next)
        const nextFrom = parseTime(nextConfig.available_from)
        newTime = applyBreakForDate(nextFrom, duration, next)
      }
      // If no next day, keep it on last day (spill-over will be detected)
    }

    // BUG FIX 3: Never move matches backwards
    if (newDate < origDate || (newDate === origDate && newTime < origTime)) {
      newDate = origDate
      newTime = origTime
    }

    // BUG FIX 2: Elimination matches must not be before last group match
    if (lastGroupDate && match.phase && match.phase !== 'group_phase') {
      if (newDate < lastGroupDate || (newDate === lastGroupDate && lastGroupTime && minutesToTime(newTime) < lastGroupTime)) {
        // Keep original or push forward, don't move before last group
        if (origDate > lastGroupDate || (origDate === lastGroupDate && match.scheduled_time >= lastGroupTime)) {
          newDate = origDate
          newTime = origTime
        } else {
          newDate = lastGroupDate
          newTime = parseTime(lastGroupTime)
          newTime = applyBreak(newTime, duration)
        }
      }
    }

    const newTimeStr = minutesToTime(newTime)

    if (newDate !== origDate || newTimeStr !== match.scheduled_time) {
      updates.push({
        id: match.id,
        scheduled_date: newDate,
        scheduled_time: newTimeStr,
        // Carry forward for conflict detection
        _match_number: match.match_number,
        _team1_id: match.team1_id,
        _team2_id: match.team2_id,
        _duration: duration,
        _court_id: courtId,
        _phase: match.phase,
      })
    }

    // Track end of this match for cascading
    prevEndDate = newDate
    prevEndTime = newTime + duration
  }

  // BUG FIX 4: Detect cross-court conflicts after recalculation
  // Build a merged view of all matches with updated times for this court
  const updatedTimeMap = new Map()
  for (const u of updates) {
    updatedTimeMap.set(u.id, { date: u.scheduled_date, time: u.scheduled_time, duration: u._duration })
  }

  // Get effective times for all pending matches on THIS court
  const thisCourtEffective = pending.map(m => {
    const upd = updatedTimeMap.get(m.id)
    return {
      id: m.id,
      courtId,
      date: upd ? upd.date : m.scheduled_date,
      time: upd ? upd.time : m.scheduled_time,
      duration: m.estimated_duration_minutes || 60,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      match_number: m.match_number,
    }
  })

  // Get all pending matches on OTHER courts
  const otherCourtMatches = (allTournamentMatches || []).filter(m =>
    m.court_id !== courtId &&
    (m.status === 'scheduled' || m.status === 'pending') &&
    m.scheduled_date && m.scheduled_time &&
    (m.team1_id || m.team2_id)
  ).map(m => ({
    id: m.id,
    courtId: m.court_id,
    date: m.scheduled_date,
    time: m.scheduled_time,
    duration: m.estimated_duration_minutes || 60,
    team1_id: m.team1_id,
    team2_id: m.team2_id,
    match_number: m.match_number,
  }))

  // Check each this-court match against all other-court matches for team overlap
  const conflicts = []
  const seenConflicts = new Set()

  for (const a of thisCourtEffective) {
    if (!a.team1_id && !a.team2_id) continue
    const startA = parseTime(a.time)
    const endA = startA + a.duration

    for (const b of otherCourtMatches) {
      if (a.date !== b.date) continue

      const startB = parseTime(b.time)
      const endB = startB + b.duration

      // Check time overlap
      if (startA >= endB || startB >= endA) continue

      // Check team overlap
      const teamsA = [a.team1_id, a.team2_id].filter(Boolean)
      const teamsB = [b.team1_id, b.team2_id].filter(Boolean)
      const overlappingTeams = teamsA.filter(t => teamsB.includes(t))

      for (const teamId of overlappingTeams) {
        const key = [a.id, b.id].sort().join('-') + ':' + teamId
        if (seenConflicts.has(key)) continue
        seenConflicts.add(key)

        conflicts.push({
          teamId,
          matchOnAffectedCourt: { matchId: a.id, matchNumber: a.match_number, date: a.date, time: a.time, courtId: a.courtId },
          matchOnOtherCourt: { matchId: b.id, matchNumber: b.match_number, date: b.date, time: b.time, courtId: b.courtId },
        })
      }
    }
  }

  // Clean internal fields from updates before returning
  const cleanUpdates = updates.map(({ id, scheduled_date, scheduled_time }) => ({
    id,
    scheduled_date,
    scheduled_time,
  }))

  return { updates: cleanUpdates, conflicts }
}

/**
 * Calculates the delta (delay) in minutes between two timestamps.
 * Pure function — no side effects.
 *
 * @param {string} reportedStart - ISO timestamp or date string of when setback started
 * @param {string} reportedEnd - ISO timestamp or date string of when setback ended
 * @returns {number} delta in minutes (positive integer), or throws on invalid input
 */
export function calculateDelta(reportedStart, reportedEnd) {
  const startMs = new Date(reportedStart).getTime()
  const endMs = new Date(reportedEnd).getTime()

  if (isNaN(startMs) || isNaN(endMs)) {
    throw new Error('Invalid timestamps: cannot parse reportedStart or reportedEnd')
  }

  const deltaMinutes = Math.round((endMs - startMs) / 60000)

  if (deltaMinutes <= 0) {
    throw new Error(`Invalid delta: ${deltaMinutes} minutes. reported_end must be after reported_start`)
  }

  return deltaMinutes
}

/**
 * Validates the full tournament schedule against the 7 rules.
 * Pure function — no side effects, no DB calls.
 *
 * @param {Array} matches - All tournament matches with: id, court_id, scheduled_date, scheduled_time,
 *                          estimated_duration_minutes, status, team1_id, team2_id, phase
 * @param {Array} courts - Court configs with: id, available_from, available_to, break_start, break_end
 * @param {Object} [options]
 * @param {Map} [options.referenceTimeMap] - Map<matchId, { date, time }> for R6 check (post-cascade reference)
 * @param {number} [options.now] - Current timestamp (ms) for R7 check. If omitted, R7 is skipped.
 * @returns {{ valid: boolean, violations: Array<{ rule: string, description: string, matchIds: string[] }> }}
 */
export function validateSchedule(matches, courts, options = {}) {
  const { referenceTimeMap, now } = options
  const violations = []
  const courtMap = new Map()
  for (const c of courts) courtMap.set(c.id, c)

  // Only check pending/scheduled matches
  const active = matches.filter(m =>
    (m.status === 'scheduled' || m.status === 'pending') &&
    m.scheduled_date && m.scheduled_time
  )

  // R1 — No overlap on same court
  const byCourtDate = new Map()
  for (const m of active) {
    const key = `${m.court_id}|${m.scheduled_date}`
    if (!byCourtDate.has(key)) byCourtDate.set(key, [])
    byCourtDate.get(key).push(m)
  }
  for (const [, group] of byCourtDate) {
    group.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1]
      const curr = group[i]
      const prevEnd = parseTime(prev.scheduled_time) + (prev.estimated_duration_minutes || 60)
      const currStart = parseTime(curr.scheduled_time)
      if (currStart < prevEnd) {
        violations.push({
          rule: 'R1',
          description: `Same-court overlap: match ${prev.id} ends at ${minutesToTime(prevEnd)} but match ${curr.id} starts at ${curr.scheduled_time} on court ${prev.court_id}`,
          matchIds: [prev.id, curr.id],
        })
      }
    }
  }

  // R2 — No team playing on 2 courts simultaneously
  const withTeams = active.filter(m => m.team1_id || m.team2_id)
  for (let i = 0; i < withTeams.length; i++) {
    for (let j = i + 1; j < withTeams.length; j++) {
      const a = withTeams[i]
      const b = withTeams[j]
      if (a.court_id === b.court_id) continue
      if (a.scheduled_date !== b.scheduled_date) continue

      const startA = parseTime(a.scheduled_time)
      const endA = startA + (a.estimated_duration_minutes || 60)
      const startB = parseTime(b.scheduled_time)
      const endB = startB + (b.estimated_duration_minutes || 60)
      if (startA >= endB || startB >= endA) continue

      const teamsA = [a.team1_id, a.team2_id].filter(Boolean)
      const teamsB = [b.team1_id, b.team2_id].filter(Boolean)
      const shared = teamsA.filter(t => teamsB.includes(t))
      if (shared.length > 0) {
        violations.push({
          rule: 'R2',
          description: `Cross-court overlap: team ${shared[0]} has matches ${a.id} and ${b.id} overlapping on different courts`,
          matchIds: [a.id, b.id],
        })
      }
    }
  }

  // R3 — Group phase before elimination (per-category)
  const r3Categories = [...new Set(active.map(m => m.category_id).filter(Boolean))]
  for (const catId of r3Categories) {
    const catMatches = active.filter(m => m.category_id === catId)
    let lastGroupEnd = null
    let lastGroupDate = ''
    for (const m of catMatches) {
      if (m.phase !== 'group_phase') continue
      const end = parseTime(m.scheduled_time) + (m.estimated_duration_minutes || 60)
      if (m.scheduled_date > lastGroupDate || (m.scheduled_date === lastGroupDate && end > (lastGroupEnd || 0))) {
        lastGroupDate = m.scheduled_date
        lastGroupEnd = end
      }
    }
    if (!lastGroupDate) continue
    for (const m of catMatches) {
      if (!m.phase || m.phase === 'group_phase') continue
      const start = parseTime(m.scheduled_time)
      if (m.scheduled_date < lastGroupDate || (m.scheduled_date === lastGroupDate && start < lastGroupEnd)) {
        violations.push({
          rule: 'R3',
          description: `Elimination match ${m.id} (${m.phase}) starts before last group match ends in its category`,
          matchIds: [m.id],
        })
      }
    }
  }

  // R4 — Respect breaks
  for (const m of active) {
    const court = courtMap.get(m.court_id)
    if (!court || !court.break_start || !court.break_end) continue
    const start = parseTime(m.scheduled_time)
    const dur = m.estimated_duration_minutes || 60
    const bs = parseTime(court.break_start)
    const be = parseTime(court.break_end)
    if ((start >= bs && start < be) || (start < bs && start + dur > bs)) {
      violations.push({
        rule: 'R4',
        description: `Match ${m.id} at ${m.scheduled_time} spans into break (${court.break_start}-${court.break_end}) on court ${m.court_id}`,
        matchIds: [m.id],
      })
    }
  }

  // R5 — Respect court hours
  for (const m of active) {
    const court = courtMap.get(m.court_id)
    if (!court || !court.available_from || !court.available_to) continue
    const start = parseTime(m.scheduled_time)
    const dur = m.estimated_duration_minutes || 60
    const from = parseTime(court.available_from)
    const to = parseTime(court.available_to)
    if (start < from || start + dur > to) {
      violations.push({
        rule: 'R5',
        description: `Match ${m.id} at ${m.scheduled_time} (dur ${dur}min) outside court hours ${court.available_from}-${court.available_to}`,
        matchIds: [m.id],
      })
    }
  }

  // R6 — Max 120 min displacement (only if referenceTimeMap provided)
  if (referenceTimeMap) {
    for (const m of active) {
      const ref = referenceTimeMap.get(m.id)
      if (!ref) continue
      if (ref.date !== m.scheduled_date) continue // cross-day displacement is harder to measure in minutes
      const refTime = parseTime(ref.time)
      const currTime = parseTime(m.scheduled_time)
      if (Math.abs(currTime - refTime) > 120) {
        violations.push({
          rule: 'R6',
          description: `Match ${m.id} displaced ${Math.abs(currTime - refTime)} min from reference (max 120)`,
          matchIds: [m.id],
        })
      }
    }
  }

  // R7 — No match in the past (only if now provided)
  if (now) {
    const nowDate = new Date(now)
    const todayStr = nowDate.toISOString().slice(0, 10)
    const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes()
    for (const m of active) {
      if (m.scheduled_date < todayStr || (m.scheduled_date === todayStr && parseTime(m.scheduled_time) < nowMinutes)) {
        violations.push({
          rule: 'R7',
          description: `Match ${m.id} scheduled in the past: ${m.scheduled_date} ${m.scheduled_time}`,
          matchIds: [m.id],
        })
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}
