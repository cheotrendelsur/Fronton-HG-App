// notificationPersistence.js — CRUD helpers for in-app notifications

/**
 * Creates a single notification for a user.
 *
 * @param {object} supabaseClient
 * @param {{ tournamentId: string, userId: string, message: string, type: 'setback'|'schedule_change'|'general' }} params
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function createNotification(supabaseClient, { tournamentId, userId, message, type }) {
  try {
    const { data, error } = await supabaseClient
      .from('notifications')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        message,
        type,
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
 * Creates multiple notifications in a single batch insert.
 *
 * @param {object} supabaseClient
 * @param {Array<{ tournamentId: string, userId: string, message: string, type: string }>} notifications
 * @returns {{ success: boolean, data?: object[], count?: number, error?: string }}
 */
export async function createBulkNotifications(supabaseClient, notifications) {
  try {
    const mapped = notifications.map(({ tournamentId, userId, message, type }) => ({
      tournament_id: tournamentId,
      user_id: userId,
      message,
      type,
    }))

    const { data, error } = await supabaseClient
      .from('notifications')
      .insert(mapped)
      .select()

    if (error) return { success: false, error: error.message }
    return { success: true, data, count: data.length }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Returns all notifications for a user, ordered by most recent first.
 *
 * @param {object} supabaseClient
 * @param {string} userId - UUID of the user
 * @param {{ limit?: number }} options
 * @returns {{ success: boolean, data?: object[], error?: string }}
 */
export async function getUserNotifications(supabaseClient, userId, { limit = 50 } = {}) {
  try {
    const { data, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Returns the count of unread notifications for a user.
 *
 * @param {object} supabaseClient
 * @param {string} userId - UUID of the user
 * @returns {{ success: boolean, count?: number, error?: string }}
 */
export async function getUnreadCount(supabaseClient, userId) {
  try {
    const { count, error } = await supabaseClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) return { success: false, error: error.message }
    return { success: true, count: count ?? 0 }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Marks a single notification as read.
 *
 * @param {object} supabaseClient
 * @param {string} notificationId - UUID of the notification
 * @returns {{ success: boolean, error?: string }}
 */
export async function markNotificationRead(supabaseClient, notificationId) {
  try {
    const { error } = await supabaseClient
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Marks all unread notifications for a user as read.
 *
 * @param {object} supabaseClient
 * @param {string} userId - UUID of the user
 * @returns {{ success: boolean, error?: string }}
 */
export async function markAllNotificationsRead(supabaseClient, userId) {
  try {
    const { error } = await supabaseClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
