// cascadeSchedulePersistence.js — Persistencia de recalculación en cascada del cronograma
// Fetches court data and pending matches, runs cascade recalculation,
// and persists updated schedule times to the database.

import { recalculateCourt } from './cascadeRecalculator.js'
import { createBulkNotifications } from './notificationPersistence.js'

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

    // Step 4: Fetch tournament date range for tournamentDays array
    const { data: tournament, error: tError } = await supabaseClient
      .from('tournaments')
      .select('start_date, end_date')
      .eq('id', tournamentId)
      .single()

    if (tError) {
      return { success: false, updatedCount: 0, error: tError.message }
    }

    // Generate ordered array of tournament day strings
    const tournamentDays = []
    const start = new Date(tournament.start_date + 'T00:00:00')
    const end = new Date(tournament.end_date + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      tournamentDays.push(`${yyyy}-${mm}-${dd}`)
    }

    // Step 5: Call the cascade engine
    const updates = recalculateCourt({
      courtId: completedMatch.court_id,
      actualEndTime: completedMatch.actual_end_time,
      courtMatches: courtMatches || [],
      court,
      tournamentDays,
    })

    // Step 6: Persist updates — batch UPDATE each match's scheduled_date and scheduled_time
    // ISO-02: Only update scheduled_date and scheduled_time — no other fields
    if (updates.length === 0) return { success: true, updatedCount: 0 }

    for (const update of updates) {
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

    return { success: true, updatedCount: updates.length }
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
 * 1. Fetch court constraints + matches + tournament days
 * 2. Call recalculateCourt with "now" as anchor
 * 3. Persist updated times
 * 4. Detect spill-over past end_date
 * 5. Send per-player resume notifications with their specific next match time
 *
 * @param {object} supabaseClient - Supabase client instance
 * @param {string} tournamentId - Tournament UUID
 * @param {string} courtId - The court being resumed
 * @returns {{ success: boolean, updatedCount: number, spillOver: boolean, spillOverDate?: string, error?: string }}
 */
export async function applyCascadeOnResume(supabaseClient, tournamentId, courtId) {
  try {
    // Step 1: Construct anchor time — "now" (per D-04)
    const anchorTime = new Date().toISOString()

    // Step 2: Fetch court constraints (include name for notification message)
    const { data: court, error: courtError } = await supabaseClient
      .from('courts')
      .select('id, name, available_from, available_to, break_start, break_end')
      .eq('id', courtId)
      .single()

    if (courtError) {
      return { success: false, updatedCount: 0, spillOver: false, error: courtError.message }
    }

    // Step 3: Fetch ALL matches on this court for this tournament
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

    // Step 4: Fetch tournament dates
    const { data: tournament, error: tError } = await supabaseClient
      .from('tournaments')
      .select('start_date, end_date')
      .eq('id', tournamentId)
      .single()

    if (tError) {
      return { success: false, updatedCount: 0, spillOver: false, error: tError.message }
    }

    // Step 5: Generate tournamentDays array from start_date to end_date
    const tournamentDays = []
    const start = new Date(tournament.start_date + 'T00:00:00')
    const end = new Date(tournament.end_date + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      tournamentDays.push(`${yyyy}-${mm}-${dd}`)
    }

    // Step 6: Call recalculateCourt with current time as anchor
    const updates = recalculateCourt({
      courtId,
      actualEndTime: anchorTime,
      courtMatches: courtMatches || [],
      court,
      tournamentDays,
    })

    // Step 7: Check spill-over past tournament end_date
    const spillOver = updates.some(u => u.scheduled_date > tournament.end_date)
    const spillOverDate = spillOver
      ? updates.reduce((max, u) => (u.scheduled_date > max ? u.scheduled_date : max), '')
      : undefined

    // Step 8: Persist updates — batch UPDATE each match's scheduled_date and scheduled_time
    for (const update of updates) {
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

    // Step 9: Send per-player resume notifications (per D-13, D-14, D-15)
    const allMatches = courtMatches || []
    const pendingMatches = allMatches.filter(m => m.status !== 'completed')

    // Collect unique team IDs from pending matches on this court
    const uniqueTeamIds = new Set()
    for (const m of pendingMatches) {
      if (m.team1_id) uniqueTeamIds.add(m.team1_id)
      if (m.team2_id) uniqueTeamIds.add(m.team2_id)
    }

    if (uniqueTeamIds.size > 0) {
      // Fetch registrations to get player IDs
      const { data: registrations, error: regError } = await supabaseClient
        .from('tournament_registrations')
        .select('id, player1_id, player2_id')
        .in('id', Array.from(uniqueTeamIds))

      if (!regError && registrations && registrations.length > 0) {
        // Build a map of updated match times (use updated time if available, else original)
        const updatedTimeMap = new Map()
        for (const u of updates) {
          updatedTimeMap.set(u.id, { scheduled_date: u.scheduled_date, scheduled_time: u.scheduled_time })
        }

        // For each match, get its effective time (updated or original)
        function getMatchTime(m) {
          const updated = updatedTimeMap.get(m.id)
          const date = updated ? updated.scheduled_date : m.scheduled_date
          const time = updated ? updated.scheduled_time : m.scheduled_time
          return { date, time, dateTime: `${date}T${time}` }
        }

        // Sort pending matches by effective time
        const sortedPending = [...pendingMatches].sort((a, b) => {
          const ta = getMatchTime(a)
          const tb = getMatchTime(b)
          return ta.dateTime.localeCompare(tb.dateTime)
        })

        // Build per-player notifications
        const notifications = []
        const courtName = court.name || 'Cancha'

        for (const reg of registrations) {
          const regId = reg.id
          // Find first upcoming pending match for this team
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

    // Step 10: Return result
    return {
      success: true,
      updatedCount: updates.length,
      spillOver,
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
