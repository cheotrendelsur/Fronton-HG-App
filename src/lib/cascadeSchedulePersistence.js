// cascadeSchedulePersistence.js — Persistencia de recalculación en cascada del cronograma
// Fetches court data and pending matches, runs cascade recalculation,
// and persists updated schedule times to the database.

import { recalculateCourt } from './cascadeRecalculator.js'

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
