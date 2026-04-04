// cascadeSchedulePersistence.js — Persistencia de recalculación en cascada del cronograma
// Fetches court data and pending matches, runs cascade recalculation,
// and persists updated schedule times to the database.

import { recalculateCourt, recalculateCourtOnResume, validateSchedule } from './cascadeRecalculator.js'
import { resolveConflicts, finalValidation } from './conflictResolver.js'
import { createBulkNotifications } from './notificationPersistence.js'

/**
 * Fetch court_schedules for a court, returning a map: { [dayOfWeek]: { available_from, available_to, break_start, break_end } }
 */
async function fetchCourtSchedules(supabaseClient, courtId) {
  const { data } = await supabaseClient
    .from('court_schedules')
    .select('day_of_week, available_from, available_to, break_start, break_end')
    .eq('court_id', courtId)
  const map = {}
  if (data) {
    for (const cs of data) {
      map[cs.day_of_week] = {
        available_from: cs.available_from,
        available_to: cs.available_to,
        break_start: cs.break_start,
        break_end: cs.break_end,
      }
    }
  }
  return map
}

/**
 * Fetch court_schedules for ALL courts of a tournament.
 * Returns Map<courtId, { [dayOfWeek]: scheduleObj }>
 */
async function fetchAllCourtSchedules(supabaseClient, tournamentId) {
  const { data: courts } = await supabaseClient
    .from('courts')
    .select('id')
    .eq('tournament_id', tournamentId)
  if (!courts || courts.length === 0) return new Map()

  const courtIds = courts.map(c => c.id)
  const { data } = await supabaseClient
    .from('court_schedules')
    .select('court_id, day_of_week, available_from, available_to, break_start, break_end')
    .in('court_id', courtIds)

  const map = new Map()
  if (data) {
    for (const cs of data) {
      if (!map.has(cs.court_id)) map.set(cs.court_id, {})
      map.get(cs.court_id)[cs.day_of_week] = {
        available_from: cs.available_from,
        available_to: cs.available_to,
        break_start: cs.break_start,
        break_end: cs.break_end,
      }
    }
  }
  return map
}

/**
 * Fetch tournament_days, with fallback to start_date→end_date for legacy tournaments.
 */
async function fetchTournamentDays(supabaseClient, tournamentId) {
  const { data: daysData } = await supabaseClient
    .from('tournament_days')
    .select('day_date')
    .eq('tournament_id', tournamentId)
    .order('day_order')

  if (daysData && daysData.length > 0) {
    return daysData.map(d => d.day_date)
  }

  // Fallback: generate from start_date→end_date
  const { data: tournament } = await supabaseClient
    .from('tournaments')
    .select('start_date, end_date')
    .eq('id', tournamentId)
    .single()

  const days = []
  if (tournament?.start_date && tournament?.end_date) {
    const start = new Date(tournament.start_date + 'T00:00:00')
    const end = new Date(tournament.end_date + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
  }
  return days
}

/**
 * Fetches court data and pending matches, runs cascade recalculation,
 * and persists updated schedule times to the database.
 *
 * Only the affected court's matches are touched (ISO-01).
 * Only scheduled_date and scheduled_time are updated (ISO-02).
 *
 * @param {object} supabaseClient - Supabase client instance
 * @param {string} tournamentId - Tournament UUID
 * @param {string} matchId - The match that was just completed (to find its court_id and actual_end_time)
 * @returns {{ success: boolean, updatedCount: number, error?: string }}
 */
export async function applyCascadeRecalculation(supabaseClient, tournamentId, matchId) {
  try {
    // Step 1: Fetch the completed match to get court_id and actual_end_time
    const { data: completedMatch, error: matchError } = await supabaseClient
      .from('tournament_matches')
      .select('id, court_id, actual_end_time')
      .eq('id', matchId)
      .single()

    if (matchError) {
      return { success: false, updatedCount: 0, error: matchError.message }
    }

    // If no actual_end_time or no court_id, nothing to recalculate
    // (e.g., elimination match without court assignment)
    if (!completedMatch || !completedMatch.actual_end_time || !completedMatch.court_id) {
      return { success: true, updatedCount: 0 }
    }

    // Step 2: Fetch the court constraints
    const { data: court, error: courtError } = await supabaseClient
      .from('courts')
      .select('id, available_from, available_to, break_start, break_end')
      .eq('id', completedMatch.court_id)
      .single()

    if (courtError) {
      return { success: false, updatedCount: 0, error: courtError.message }
    }

    // Step 3: Fetch ALL matches on this court for this tournament (completed + pending, all days)
    // ISO-01: Only query matches for completedMatch.court_id
    const { data: courtMatches, error: cmError } = await supabaseClient
      .from('tournament_matches')
      .select('id, match_number, court_id, scheduled_date, scheduled_time, estimated_duration_minutes, status, team1_id, team2_id, phase')
      .eq('tournament_id', tournamentId)
      .eq('court_id', completedMatch.court_id)
      .order('scheduled_date')
      .order('scheduled_time')
      .order('match_number')

    if (cmError) {
      return { success: false, updatedCount: 0, error: cmError.message }
    }

    // Step 4: Fetch tournament days + court schedules for per-day awareness
    const tournamentDays = await fetchTournamentDays(supabaseClient, tournamentId)
    const courtSchedules = await fetchCourtSchedules(supabaseClient, completedMatch.court_id)

    // Step 5: Call the cascade engine
    const updates = recalculateCourt({
      courtId: completedMatch.court_id,
      actualEndTime: completedMatch.actual_end_time,
      courtMatches: courtMatches || [],
      court,
      tournamentDays,
      courtSchedules,
    })

    // Step 6: If no cascade changes, nothing to do
    if (updates.length === 0) return { success: true, updatedCount: 0 }

    // Step 7: Fetch ALL tournament matches for cross-court conflict detection
    const { data: allMatches, error: amError } = await supabaseClient
      .from('tournament_matches')
      .select('id, match_number, court_id, scheduled_date, scheduled_time, estimated_duration_minutes, status, team1_id, team2_id, phase')
      .eq('tournament_id', tournamentId)

    if (amError) {
      return { success: false, updatedCount: 0, error: amError.message }
    }

    // Step 7.5: Fetch all courts for conflict resolution across courts
    let allCourts = [court]
    try {
      const { data: courtsData } = await supabaseClient
        .from('courts')
        .select('id, available_from, available_to, break_start, break_end')
        .eq('tournament_id', tournamentId)
      if (courtsData) allCourts = courtsData
    } catch (_) { /* fallback to single court */ }

    // Fetch all court schedules for multi-court resolution
    const allCourtSchedulesMap = await fetchAllCourtSchedules(supabaseClient, tournamentId)

    // Step 8: Run conflict resolution on cascade updates
    let resolvedUpdates = []
    let resolutionSummary = null
    let finalValidationResult = null
    try {
      const resolution = resolveConflicts({
        affectedCourtId: completedMatch.court_id,
        cascadeUpdates: updates,
        courtMatches: courtMatches || [],
        allTournamentMatches: allMatches || [],
        court,
        allCourts,
        maxDisplacement: 120,
        courtSchedulesMap: allCourtSchedulesMap,
      })
      resolvedUpdates = resolution.resolvedUpdates
      resolutionSummary = resolution.resolutionSummary
    } catch (resolverErr) {
      console.error('Conflict resolver error in cascade recalculation:', resolverErr)
    }

    // Merge cascade + resolution updates
    const allUpdates = new Map()
    for (const u of updates) allUpdates.set(u.id, u)
    for (const u of resolvedUpdates) allUpdates.set(u.id, u)

    // Step 8.5: Final validation (R1-R7) with revert capability
    const cascadeRefMap = new Map()
    for (const u of updates) {
      cascadeRefMap.set(u.id, { scheduled_date: u.scheduled_date, scheduled_time: u.scheduled_time })
    }
    for (const m of (courtMatches || [])) {
      if (!cascadeRefMap.has(m.id) && (m.status === 'scheduled' || m.status === 'pending')) {
        cascadeRefMap.set(m.id, { scheduled_date: m.scheduled_date, scheduled_time: m.scheduled_time })
      }
    }

    try {
      finalValidationResult = finalValidation(allMatches || [], allUpdates, cascadeRefMap, allCourts)
      if (finalValidationResult.revertUpdates.size > 0) {
        for (const [id, revert] of finalValidationResult.revertUpdates) {
          allUpdates.set(id, revert)
        }
      }
    } catch (fvErr) {
      console.error('Final validation error in cascade recalculation:', fvErr)
    }

    const finalUpdates = Array.from(allUpdates.values())

    // Step 9: Persist all updates (cascade + resolution + reverts)
    for (const update of finalUpdates) {
      const { error: updateError } = await supabaseClient
        .from('tournament_matches')
        .update({
          scheduled_date: update.scheduled_date,
          scheduled_time: update.scheduled_time,
        })
        .eq('id', update.id)

      if (updateError) {
        return {
          success: false,
          updatedCount: 0,
          error: `Failed to update match ${update.id}: ${updateError.message}`,
        }
      }
    }

    return {
      success: true,
      updatedCount: finalUpdates.length,
      resolutionSummary,
      finalValidationResult,
    }
  } catch (err) {
    return {
      success: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Orchestrates the full resume flow when a paused court is resumed:
 * 1. Fetch court + setback + all matches + tournament days
 * 2. Calculate delta from reported_start to reported_end
 * 3. Call recalculateCourtOnResume with delta-based approach
 * 4. Persist updated times
 * 5. Detect spill-over and cross-court conflicts
 * 6. Send per-player resume notifications
 *
 * @param {object} supabaseClient - Supabase client instance
 * @param {string} tournamentId - Tournament UUID
 * @param {string} courtId - The court being resumed
 * @param {string} [resumeTime] - Organizer-reported resume time (ISO string). Used as reported_end for delta.
 * @param {string} [setbackStartTime] - Organizer-reported start time of the setback (ISO string). Passed directly to avoid DB race.
 * @returns {{ success: boolean, updatedCount: number, spillOver: boolean, spillOverDate?: string, conflicts?: Array, error?: string }}
 */
export async function applyCascadeOnResume(supabaseClient, tournamentId, courtId, resumeTime, setbackStartTime) {
  try {
    // Step 1: Fetch court constraints
    const { data: court, error: courtError } = await supabaseClient
      .from('courts')
      .select('id, name, available_from, available_to, break_start, break_end')
      .eq('id', courtId)
      .single()

    if (courtError) {
      return { success: false, updatedCount: 0, spillOver: false, error: courtError.message }
    }

    // Step 2: Fetch the most recently resolved setback for this court to get reported_start
    let setback = null
    const { data: setbackData, error: setbackError } = await supabaseClient
      .from('court_setbacks')
      .select('*')
      .eq('court_id', courtId)
      .eq('tournament_id', tournamentId)
      .eq('status', 'resolved')
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!setbackError && setbackData) {
      setback = setbackData
    }

    // Step 3: Calculate delta in minutes
    const reportedStart = setbackStartTime || setback?.reported_start || setback?.started_at
    const reportedEnd = resumeTime || setback?.reported_end || setback?.ended_at || new Date().toISOString()

    let deltaMinutes = 0
    if (reportedStart && reportedEnd) {
      const startMs = new Date(reportedStart).getTime()
      const endMs = new Date(reportedEnd).getTime()
      if (!isNaN(startMs) && !isNaN(endMs)) {
        deltaMinutes = Math.max(0, Math.round((endMs - startMs) / 60000))
      }
    }

    // Fallback: started_at → ended_at
    if (deltaMinutes === 0 && setback?.started_at && setback?.ended_at) {
      const fallbackStart = new Date(setback.started_at).getTime()
      const fallbackEnd = new Date(setback.ended_at).getTime()
      if (!isNaN(fallbackStart) && !isNaN(fallbackEnd)) {
        deltaMinutes = Math.max(0, Math.round((fallbackEnd - fallbackStart) / 60000))
      }
    }

    // Step 4: Fetch ALL matches for this court
    const { data: courtMatches, error: cmError } = await supabaseClient
      .from('tournament_matches')
      .select('id, match_number, court_id, scheduled_date, scheduled_time, estimated_duration_minutes, status, team1_id, team2_id, phase')
      .eq('tournament_id', tournamentId)
      .eq('court_id', courtId)
      .order('scheduled_date')
      .order('scheduled_time')
      .order('match_number')

    if (cmError) {
      return { success: false, updatedCount: 0, spillOver: false, error: cmError.message }
    }

    // Step 5: Fetch ALL tournament matches (all courts) for conflict detection + last group date
    const { data: allMatches, error: amError } = await supabaseClient
      .from('tournament_matches')
      .select('id, match_number, court_id, scheduled_date, scheduled_time, estimated_duration_minutes, status, team1_id, team2_id, phase')
      .eq('tournament_id', tournamentId)

    if (amError) {
      return { success: false, updatedCount: 0, spillOver: false, error: amError.message }
    }

    // Step 6: Find last group_phase match date+time across ALL courts
    let lastGroupDateTime = null
    const groupMatches = (allMatches || []).filter(m => m.phase === 'group_phase' && m.scheduled_date && m.scheduled_time)
    if (groupMatches.length > 0) {
      groupMatches.sort((a, b) => {
        const dc = b.scheduled_date.localeCompare(a.scheduled_date)
        if (dc !== 0) return dc
        return b.scheduled_time.localeCompare(a.scheduled_time)
      })
      const last = groupMatches[0]
      lastGroupDateTime = `${last.scheduled_date}|${last.scheduled_time}`
    }

    // Step 7: Fetch tournament days + court schedules
    const tournamentDays = await fetchTournamentDays(supabaseClient, tournamentId)
    const courtSchedules = await fetchCourtSchedules(supabaseClient, courtId)

    // Step 8: Call delta-based recalculation
    const { updates, conflicts } = recalculateCourtOnResume({
      courtId,
      deltaMinutes,
      courtMatches: courtMatches || [],
      court,
      tournamentDays,
      courtSchedules,
      lastGroupDateTime,
      allTournamentMatches: allMatches || [],
    })

    // Fetch all courts for conflict resolution across courts
    let allCourts = [court]
    try {
      const { data: courtsData } = await supabaseClient
        .from('courts')
        .select('id, available_from, available_to, break_start, break_end')
        .eq('tournament_id', tournamentId)
      if (courtsData) allCourts = courtsData
    } catch (_) { /* fallback to single court */ }

    // Fetch all court schedules for multi-court conflict resolution
    const allCourtSchedulesMap = await fetchAllCourtSchedules(supabaseClient, tournamentId)

    // Step 8.5: Resolve cross-court conflicts + same-court overlaps + elimination ordering
    // Wrapped in try/catch so cascade updates persist even if resolver crashes
    let resolvedUpdates = []
    let resolutionSummary = null
    try {
      const resolution = resolveConflicts({
        affectedCourtId: courtId,
        cascadeUpdates: updates,
        courtMatches: courtMatches || [],
        allTournamentMatches: allMatches || [],
        court,
        allCourts,
        lastGroupDateTime,
        courtSchedulesMap: allCourtSchedulesMap,
      })
      resolvedUpdates = resolution.resolvedUpdates
      resolutionSummary = resolution.resolutionSummary
    } catch (resolverErr) {
      console.error('Conflict resolver error (cascade updates still persist):', resolverErr)
    }

    // Merge cascade updates + resolution updates (resolution may override cascade for same match)
    const allUpdates = new Map()
    for (const u of updates) allUpdates.set(u.id, u)
    for (const u of resolvedUpdates) allUpdates.set(u.id, u)

    // Step 9: FINAL VALIDATION — last line of defense before persisting
    // Build cascade reference map (post-cascade, pre-resolution times)
    const cascadeRefMap = new Map()
    for (const u of updates) {
      cascadeRefMap.set(u.id, { scheduled_date: u.scheduled_date, scheduled_time: u.scheduled_time })
    }
    // For matches on the affected court not in cascade, their original DB time is the reference
    for (const m of (courtMatches || [])) {
      if (!cascadeRefMap.has(m.id) && (m.status === 'scheduled' || m.status === 'pending')) {
        cascadeRefMap.set(m.id, { scheduled_date: m.scheduled_date, scheduled_time: m.scheduled_time })
      }
    }

    let finalValidationResult = null
    try {
      finalValidationResult = finalValidation(
        allMatches || [],
        allUpdates,
        cascadeRefMap,
        allCourts,
      )

      // Apply reverts: override allUpdates with reverted positions
      if (finalValidationResult.revertUpdates.size > 0) {
        for (const [id, revert] of finalValidationResult.revertUpdates) {
          allUpdates.set(id, revert)
        }
      }
    } catch (fvErr) {
      console.error('Final validation error (proceeding with updates):', fvErr)
    }

    const finalUpdates = Array.from(allUpdates.values())

    // Step 9.5: Check spill-over past last tournament day
    const lastTournamentDay = tournamentDays.length > 0 ? tournamentDays[tournamentDays.length - 1] : null
    const spillOver = lastTournamentDay ? finalUpdates.some(u => u.scheduled_date > lastTournamentDay) : false
    const spillOverDate = spillOver
      ? finalUpdates.reduce((max, u) => (u.scheduled_date > max ? u.scheduled_date : max), '')
      : undefined

    // Step 10: Persist all updates
    for (const update of finalUpdates) {
      const { error: updateError } = await supabaseClient
        .from('tournament_matches')
        .update({
          scheduled_date: update.scheduled_date,
          scheduled_time: update.scheduled_time,
        })
        .eq('id', update.id)

      if (updateError) {
        return {
          success: false,
          updatedCount: 0,
          spillOver: false,
          error: `Failed to update match ${update.id}: ${updateError.message}`,
        }
      }
    }

    // Step 11: Send per-player resume notifications
    const pendingMatches = (courtMatches || []).filter(m => m.status !== 'completed')
    const uniqueTeamIds = new Set()
    for (const m of pendingMatches) {
      if (m.team1_id) uniqueTeamIds.add(m.team1_id)
      if (m.team2_id) uniqueTeamIds.add(m.team2_id)
    }

    if (uniqueTeamIds.size > 0) {
      const { data: registrations, error: regError } = await supabaseClient
        .from('tournament_registrations')
        .select('id, player1_id, player2_id')
        .in('id', Array.from(uniqueTeamIds))

      if (!regError && registrations && registrations.length > 0) {
        const updatedTimeMap = new Map()
        for (const u of finalUpdates) {
          updatedTimeMap.set(u.id, { scheduled_date: u.scheduled_date, scheduled_time: u.scheduled_time })
        }

        function getMatchTime(m) {
          const updated = updatedTimeMap.get(m.id)
          const date = updated ? updated.scheduled_date : m.scheduled_date
          const time = updated ? updated.scheduled_time : m.scheduled_time
          return { date, time, dateTime: `${date}T${time}` }
        }

        const sortedPending = [...pendingMatches].sort((a, b) => {
          const ta = getMatchTime(a)
          const tb = getMatchTime(b)
          return ta.dateTime.localeCompare(tb.dateTime)
        })

        const notifications = []
        const courtName = court.name || 'Cancha'

        for (const reg of registrations) {
          const regId = reg.id
          const nextMatch = sortedPending.find(
            m => m.team1_id === regId || m.team2_id === regId
          )

          if (nextMatch) {
            const { time: nextMatchTime } = getMatchTime(nextMatch)
            const playerIds = [reg.player1_id, reg.player2_id].filter(Boolean)
            for (const playerId of playerIds) {
              notifications.push({
                tournamentId,
                userId: playerId,
                message: `La cancha ${courtName} ha sido reanudada. Tu proximo partido: ${nextMatchTime} en ${courtName}.`,
                type: 'schedule_change',
              })
            }
          }
        }

        if (notifications.length > 0) {
          await createBulkNotifications(supabaseClient, notifications)
        }
      }
    }

    // Step 12: Return result with resolution summary + final validation
    return {
      success: true,
      updatedCount: finalUpdates.length,
      spillOver,
      conflicts: resolutionSummary?.unresolvedDetails || [],
      resolutionSummary,
      finalValidationResult,
      ...(spillOverDate ? { spillOverDate } : {}),
    }
  } catch (err) {
    return {
      success: false,
      updatedCount: 0,
      spillOver: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
