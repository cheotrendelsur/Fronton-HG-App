// setbackPersistence.js — CRUD helpers for court setbacks

/**
 * Creates a new court setback record with status 'active'.
 *
 * @param {object} supabaseClient
 * @param {{ tournamentId: string, courtId: string, setbackType: string, description: string, affectedMatchIds?: string[], reportedStart?: string }} params
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function createSetback(supabaseClient, { tournamentId, courtId, setbackType, description, affectedMatchIds = [], reportedStart }) {
  try {
    // Check for existing active setback on this court — reject duplicates
    const { data: existing, error: checkError } = await supabaseClient
      .from('court_setbacks')
      .select('id')
      .eq('court_id', courtId)
      .eq('status', 'active')
      .maybeSingle()

    if (checkError) return { success: false, error: checkError.message }
    if (existing) return { success: false, error: 'Ya existe un contratiempo activo en esta cancha' }

    const { data, error } = await supabaseClient
      .from('court_setbacks')
      .insert({
        tournament_id: tournamentId,
        court_id: courtId,
        setback_type: setbackType,
        description,
        affected_match_ids: affectedMatchIds,
        status: 'active',
        started_at: new Date().toISOString(),
        ...(reportedStart ? { reported_start: reportedStart } : {}),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Resolves an active court setback by setting ended_at and status = 'resolved'.
 *
 * @param {object} supabaseClient
 * @param {string} setbackId - UUID of the setback to resolve
 * @param {{ reportedEnd?: string }} options - Optional organizer-chosen end time
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function resolveSetback(supabaseClient, setbackId, { reportedEnd } = {}) {
  try {
    const { data, error } = await supabaseClient
      .from('court_setbacks')
      .update({
        ended_at: new Date().toISOString(),
        status: 'resolved',
        ...(reportedEnd ? { reported_end: reportedEnd } : {}),
      })
      .eq('id', setbackId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Returns the currently active setback for a court, or null if none.
 *
 * @param {object} supabaseClient
 * @param {string} courtId - UUID of the court
 * @returns {{ success: boolean, data?: object|null, error?: string }}
 */
export async function getActiveSetback(supabaseClient, courtId) {
  try {
    const { data, error } = await supabaseClient
      .from('court_setbacks')
      .select('*')
      .eq('court_id', courtId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Returns the full setback history for a court, ordered by most recent first.
 *
 * @param {object} supabaseClient
 * @param {string} courtId - UUID of the court
 * @returns {{ success: boolean, data?: object[], error?: string }}
 */
export async function getSetbackHistory(supabaseClient, courtId, tournamentId) {
  try {
    let query = supabaseClient
      .from('court_setbacks')
      .select('*')
      .eq('court_id', courtId)
    if (tournamentId) query = query.eq('tournament_id', tournamentId)
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
