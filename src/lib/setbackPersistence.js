// setbackPersistence.js — CRUD helpers for court setbacks

/**
 * Creates a new court setback record with status 'active'.
 *
 * @param {object} supabaseClient
 * @param {{ tournamentId: string, courtId: string, setbackType: string, description: string, affectedMatchIds?: string[] }} params
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function createSetback(supabaseClient, { tournamentId, courtId, setbackType, description, affectedMatchIds = [] }) {
  try {
    const { data, error } = await supabaseClient
      .from('court_setbacks')
      .insert({
        tournament_id: tournamentId,
        court_id: courtId,
        setback_type: setbackType,
        description,
        affected_match_ids: affectedMatchIds,
        status: 'active',
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
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function resolveSetback(supabaseClient, setbackId) {
  try {
    const { data, error } = await supabaseClient
      .from('court_setbacks')
      .update({
        ended_at: new Date().toISOString(),
        status: 'resolved',
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
export async function getSetbackHistory(supabaseClient, courtId) {
  try {
    const { data, error } = await supabaseClient
      .from('court_setbacks')
      .select('*')
      .eq('court_id', courtId)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
