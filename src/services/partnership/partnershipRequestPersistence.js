/**
 * partnershipRequestPersistence.js — CRUD helpers for partnership request flow.
 *
 * Handles the 3-step inscription flow:
 *   1. Player requests a partner → pending_partner_acceptance
 *   2. Partner accepts/declines → converted_to_registration / declined
 *   3. Organizer approves/rejects the registration → approved / rejected
 */

import { createNotification, createBulkNotifications } from '../../lib/notificationPersistence'

// ─────────────────────────────────────────────────────────
// 1. createPartnershipRequest
// ─────────────────────────────────────────────────────────

/**
 * Creates a partnership request from requester to partner for a specific tournament/category.
 *
 * @param {object} supabase - Supabase client
 * @param {string} tournamentId
 * @param {string} categoryId
 * @param {string} requesterId - auth.uid() of the requester
 * @param {string} partnerRequestedId - profile id of the requested partner
 * @returns {Promise<{ success: boolean, requestId?: string, error?: string }>}
 */
export async function createPartnershipRequest(supabase, tournamentId, categoryId, requesterId, partnerRequestedId) {
  try {
    // Validate partner exists
    const { data: partner, error: partnerErr } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', partnerRequestedId)
      .maybeSingle()

    if (partnerErr || !partner) {
      return { success: false, error: 'El jugador seleccionado no existe' }
    }

    // Check no pending request between these two in this category
    const { data: existing } = await supabase
      .from('tournament_partnership_requests')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('requester_id', requesterId)
      .eq('partner_requested_id', partnerRequestedId)
      .eq('status', 'pending_partner_acceptance')
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Ya existe una solicitud pendiente para esta pareja en esta categoría' }
    }

    // Check requester is not already approved in this category
    const { data: requesterReg } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('status', 'approved')
      .or(`player1_id.eq.${requesterId},player2_id.eq.${requesterId}`)
      .maybeSingle()

    if (requesterReg) {
      return { success: false, error: 'Ya estás inscrito en esta categoría' }
    }

    // Check partner is not already approved in this category
    const { data: partnerReg } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('status', 'approved')
      .or(`player1_id.eq.${partnerRequestedId},player2_id.eq.${partnerRequestedId}`)
      .maybeSingle()

    if (partnerReg) {
      return { success: false, error: 'El compañero ya está inscrito en esta categoría' }
    }

    // Create the request
    const { data: request, error: insertErr } = await supabase
      .from('tournament_partnership_requests')
      .insert({
        tournament_id: tournamentId,
        category_id: categoryId,
        requester_id: requesterId,
        partner_requested_id: partnerRequestedId,
        status: 'pending_partner_acceptance',
      })
      .select('id')
      .single()

    if (insertErr) {
      if (insertErr.message?.includes('unique_partnership_request')) {
        return { success: false, error: 'Ya existe una solicitud para esta pareja en esta categoría' }
      }
      return { success: false, error: insertErr.message }
    }

    // Get requester username and tournament/category names for notification
    const { data: requester } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', requesterId)
      .single()

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('name')
      .eq('id', tournamentId)
      .single()

    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single()

    const requesterName = requester?.username ?? 'Un jugador'
    const tournamentName = tournament?.name ?? 'un torneo'
    const categoryName = category?.name ?? 'una categoría'

    // Notify partner
    await createNotification(supabase, {
      tournamentId,
      userId: partnerRequestedId,
      message: `${requesterName} te solicita ser tu pareja en ${tournamentName} (${categoryName})`,
      type: 'partnership_request',
    })

    return { success: true, requestId: request.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────
// 2. acceptPartnershipRequest
// ─────────────────────────────────────────────────────────

/**
 * Partner accepts a partnership request → creates a tournament_registration via RPC.
 *
 * @param {object} supabase
 * @param {string} requestId
 * @param {string} validatedBy - auth.uid() of the partner accepting
 * @returns {Promise<{ success: boolean, registrationId?: string, error?: string }>}
 */
export async function acceptPartnershipRequest(supabase, requestId, validatedBy) {
  try {
    // Fetch the request with related data
    const { data: req, error: fetchErr } = await supabase
      .from('tournament_partnership_requests')
      .select(`
        id, tournament_id, category_id, requester_id, partner_requested_id, status,
        tournaments ( name, status ),
        categories ( name, max_couples )
      `)
      .eq('id', requestId)
      .single()

    if (fetchErr || !req) {
      return { success: false, error: 'Solicitud no encontrada' }
    }

    if (req.status !== 'pending_partner_acceptance') {
      return { success: false, error: 'Esta solicitud ya fue procesada' }
    }

    if (req.partner_requested_id !== validatedBy) {
      return { success: false, error: 'Solo el compañero solicitado puede aceptar' }
    }

    // Validate tournament is in valid status for inscriptions
    const tStatus = req.tournaments?.status
    if (!tStatus || !['inscription', 'draft'].includes(tStatus)) {
      return { success: false, error: 'El torneo ya no acepta inscripciones' }
    }

    // Check category is not full
    const { count: approvedCount } = await supabase
      .from('tournament_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', req.tournament_id)
      .eq('category_id', req.category_id)
      .eq('status', 'approved')

    const maxCouples = req.categories?.max_couples ?? 0
    if (maxCouples > 0 && (approvedCount ?? 0) >= maxCouples) {
      return { success: false, error: 'La categoría está llena' }
    }

    // Call RPC to create registration atomically
    const { data: registrationId, error: rpcErr } = await supabase.rpc(
      'convert_partnership_request_to_registration',
      {
        p_request_id: requestId,
        p_tournament_id: req.tournament_id,
        p_category_id: req.category_id,
        p_requester_id: req.requester_id,
        p_partner_id: req.partner_requested_id,
      }
    )

    if (rpcErr) {
      return { success: false, error: rpcErr.message }
    }

    const tournamentName = req.tournaments?.name ?? 'el torneo'
    const categoryName = req.categories?.name ?? 'la categoría'

    // Notify both players
    await createBulkNotifications(supabase, [
      {
        tournamentId: req.tournament_id,
        userId: req.requester_id,
        message: `¡Solicitud aceptada! Ambos son pareja en ${tournamentName} (${categoryName}). Aguardando aprobación del organizador.`,
        type: 'partnership_accepted',
      },
      {
        tournamentId: req.tournament_id,
        userId: req.partner_requested_id,
        message: `¡Solicitud aceptada! Ambos son pareja en ${tournamentName} (${categoryName}). Aguardando aprobación del organizador.`,
        type: 'partnership_accepted',
      },
    ])

    return { success: true, registrationId }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────
// 3. declinePartnershipRequest
// ─────────────────────────────────────────────────────────

/**
 * Partner declines a partnership request.
 *
 * @param {object} supabase
 * @param {string} requestId
 * @param {string} [reason] - Optional reason for declining
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function declinePartnershipRequest(supabase, requestId, reason) {
  try {
    // Fetch request to get requester info for notification
    const { data: req, error: fetchErr } = await supabase
      .from('tournament_partnership_requests')
      .select(`
        id, tournament_id, requester_id, partner_requested_id, status,
        tournaments ( name ),
        categories ( name )
      `)
      .eq('id', requestId)
      .single()

    if (fetchErr || !req) {
      return { success: false, error: 'Solicitud no encontrada' }
    }

    if (req.status !== 'pending_partner_acceptance') {
      return { success: false, error: 'Esta solicitud ya fue procesada' }
    }

    // Call RPC
    const { error: rpcErr } = await supabase.rpc('reject_partnership_request', {
      p_request_id: requestId,
      p_reason: reason || null,
    })

    if (rpcErr) {
      return { success: false, error: rpcErr.message }
    }

    // Get partner name for notification message
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', req.partner_requested_id)
      .single()

    const partnerName = partnerProfile?.username ?? 'Tu compañero'
    const tournamentName = req.tournaments?.name ?? 'el torneo'
    const categoryName = req.categories?.name ?? 'la categoría'
    const reasonText = reason ? ` Razón: ${reason}.` : ''

    // Notify requester
    await createNotification(supabase, {
      tournamentId: req.tournament_id,
      userId: req.requester_id,
      message: `${partnerName} rechazó tu solicitud en ${tournamentName} (${categoryName}).${reasonText} Puedes buscar otro compañero.`,
      type: 'partnership_declined',
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────
// 4. searchAvailablePlayers
// ─────────────────────────────────────────────────────────

/**
 * Searches for players available to partner with in a specific tournament/category.
 *
 * @param {object} supabase
 * @param {string} tournamentId
 * @param {string} categoryId
 * @param {string} searchTerm - min 2 characters
 * @param {string} excludePlayerId - current user to exclude
 * @returns {Promise<{ success: boolean, players?: Array, error?: string }>}
 */
export async function searchAvailablePlayers(supabase, tournamentId, categoryId, searchTerm, excludePlayerId) {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return { success: true, players: [] }
    }

    const term = `%${searchTerm}%`

    // Search profiles by username or email
    const { data: profiles, error: searchErr } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url')
      .or(`username.ilike.${term},email.ilike.${term}`)
      .neq('id', excludePlayerId)
      .limit(20)

    if (searchErr) {
      return { success: false, error: searchErr.message }
    }

    if (!profiles?.length) {
      return { success: true, players: [] }
    }

    const profileIds = profiles.map(p => p.id)

    // Get IDs of players already approved in this category
    const { data: approvedRegs } = await supabase
      .from('tournament_registrations')
      .select('player1_id, player2_id')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('status', 'approved')

    const approvedIds = new Set()
    for (const reg of approvedRegs ?? []) {
      if (reg.player1_id) approvedIds.add(reg.player1_id)
      if (reg.player2_id) approvedIds.add(reg.player2_id)
    }

    // Get IDs of players with pending partnership requests in this category
    const { data: pendingRequests } = await supabase
      .from('tournament_partnership_requests')
      .select('requester_id, partner_requested_id')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('status', 'pending_partner_acceptance')

    const pendingIds = new Set()
    for (const pr of pendingRequests ?? []) {
      if (pr.requester_id) pendingIds.add(pr.requester_id)
      if (pr.partner_requested_id) pendingIds.add(pr.partner_requested_id)
    }

    // Filter out approved and pending players
    const available = profiles.filter(p =>
      !approvedIds.has(p.id) && !pendingIds.has(p.id)
    ).slice(0, 10)

    return { success: true, players: available }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────
// 5. getPendingPartnershipRequests
// ─────────────────────────────────────────────────────────

/**
 * Returns pending partnership requests for a player, split by role.
 *
 * @param {object} supabase
 * @param {string} playerId
 * @returns {Promise<{ success: boolean, asRequester?: Array, asPartner?: Array, error?: string }>}
 */
export async function getPendingPartnershipRequests(supabase, playerId) {
  try {
    // Requests made by player (awaiting partner response)
    const { data: asRequester, error: err1 } = await supabase
      .from('tournament_partnership_requests')
      .select(`
        id, tournament_id, category_id, status, created_at,
        partner_requested_id,
        partner:profiles!tournament_partnership_requests_partner_requested_id_fkey ( id, username, email, avatar_url ),
        tournaments ( id, name ),
        categories ( id, name )
      `)
      .eq('requester_id', playerId)
      .eq('status', 'pending_partner_acceptance')
      .order('created_at', { ascending: false })

    if (err1) return { success: false, error: err1.message }

    // Requests received by player (need to respond)
    const { data: asPartner, error: err2 } = await supabase
      .from('tournament_partnership_requests')
      .select(`
        id, tournament_id, category_id, status, created_at,
        requester_id,
        requester:profiles!tournament_partnership_requests_requester_id_fkey ( id, username, email, avatar_url ),
        tournaments ( id, name ),
        categories ( id, name )
      `)
      .eq('partner_requested_id', playerId)
      .eq('status', 'pending_partner_acceptance')
      .order('created_at', { ascending: false })

    if (err2) return { success: false, error: err2.message }

    return { success: true, asRequester: asRequester ?? [], asPartner: asPartner ?? [] }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────
// 6. getOrganizerPendingRegistrations
// ─────────────────────────────────────────────────────────

/**
 * Returns registrations pending organizer approval for a specific tournament.
 *
 * @param {object} supabase
 * @param {string} tournamentId
 * @param {string} organizerId - validates ownership
 * @returns {Promise<{ success: boolean, registrations?: Array, error?: string }>}
 */
export async function getOrganizerPendingRegistrations(supabase, tournamentId, organizerId) {
  try {
    // Validate organizer owns the tournament
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('id, organizer_id')
      .eq('id', tournamentId)
      .single()

    if (tErr || !tournament) {
      return { success: false, error: 'Torneo no encontrado' }
    }

    if (tournament.organizer_id !== organizerId) {
      return { success: false, error: 'No tienes permisos para este torneo' }
    }

    const { data: registrations, error: regErr } = await supabase
      .from('tournament_registrations')
      .select(`
        id, team_name, category_id, status, requested_at, created_at,
        player1:profiles!tournament_registrations_player1_id_fkey ( id, username, email, avatar_url ),
        player2:profiles!tournament_registrations_player2_id_fkey ( id, username, email, avatar_url ),
        categories ( id, name ),
        tournaments ( id, name )
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'pending_organizer_approval')
      .order('requested_at', { ascending: false })

    if (regErr) return { success: false, error: regErr.message }

    return { success: true, registrations: registrations ?? [] }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────
// 7. approveRegistration
// ─────────────────────────────────────────────────────────

/**
 * Organizer approves a pending registration.
 *
 * @param {object} supabase
 * @param {string} registrationId
 * @param {string} organizerId
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function approveRegistration(supabase, registrationId, organizerId) {
  try {
    // Fetch registration with tournament + category info
    const { data: reg, error: fetchErr } = await supabase
      .from('tournament_registrations')
      .select(`
        id, tournament_id, category_id, player1_id, player2_id, status, team_name,
        tournaments ( id, organizer_id, name ),
        categories ( id, name, max_couples )
      `)
      .eq('id', registrationId)
      .single()

    if (fetchErr || !reg) {
      return { success: false, error: 'Inscripción no encontrada' }
    }

    if (reg.tournaments?.organizer_id !== organizerId) {
      return { success: false, error: 'No tienes permisos para este torneo' }
    }

    if (reg.status !== 'pending_organizer_approval') {
      return { success: false, error: 'Esta inscripción ya fue procesada' }
    }

    // Check category is not full
    const { count: approvedCount } = await supabase
      .from('tournament_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', reg.tournament_id)
      .eq('category_id', reg.category_id)
      .eq('status', 'approved')

    const maxCouples = reg.categories?.max_couples ?? 0
    if (maxCouples > 0 && (approvedCount ?? 0) >= maxCouples) {
      return { success: false, error: 'La categoría está llena' }
    }

    // Approve
    const { error: updateErr } = await supabase
      .from('tournament_registrations')
      .update({
        status: 'approved',
        decided_at: new Date().toISOString(),
        decided_by: organizerId,
      })
      .eq('id', registrationId)

    if (updateErr) return { success: false, error: updateErr.message }

    const tournamentName = reg.tournaments?.name ?? 'el torneo'
    const categoryName = reg.categories?.name ?? 'la categoría'

    // Notify both players
    await createBulkNotifications(supabase, [
      {
        tournamentId: reg.tournament_id,
        userId: reg.player1_id,
        message: `¡Tu inscripción en ${tournamentName} (${categoryName}) fue aprobada! Ya están en el sistema.`,
        type: 'registration_approved',
      },
      {
        tournamentId: reg.tournament_id,
        userId: reg.player2_id,
        message: `¡Tu inscripción en ${tournamentName} (${categoryName}) fue aprobada! Ya están en el sistema.`,
        type: 'registration_approved',
      },
    ])

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────
// 8. rejectRegistration
// ─────────────────────────────────────────────────────────

/**
 * Organizer rejects a pending registration. Reverts partnership request to allow retry.
 *
 * @param {object} supabase
 * @param {string} registrationId
 * @param {string} organizerId
 * @param {string} [reason] - Optional rejection reason
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function rejectRegistration(supabase, registrationId, organizerId, reason) {
  try {
    // Fetch registration with tournament info
    const { data: reg, error: fetchErr } = await supabase
      .from('tournament_registrations')
      .select(`
        id, tournament_id, category_id, player1_id, player2_id, status, team_name,
        partnership_request_id,
        tournaments ( id, organizer_id, name ),
        categories ( id, name )
      `)
      .eq('id', registrationId)
      .single()

    if (fetchErr || !reg) {
      return { success: false, error: 'Inscripción no encontrada' }
    }

    if (reg.tournaments?.organizer_id !== organizerId) {
      return { success: false, error: 'No tienes permisos para este torneo' }
    }

    if (reg.status !== 'pending_organizer_approval') {
      return { success: false, error: 'Esta inscripción ya fue procesada' }
    }

    // Reject the registration
    const { error: updateErr } = await supabase
      .from('tournament_registrations')
      .update({
        status: 'rejected',
        decided_at: new Date().toISOString(),
        decided_by: organizerId,
        rejected_reason: reason || null,
      })
      .eq('id', registrationId)

    if (updateErr) return { success: false, error: updateErr.message }

    // Revert partnership request to allow retry
    if (reg.partnership_request_id) {
      await supabase
        .from('tournament_partnership_requests')
        .update({
          status: 'pending_partner_acceptance',
          tournament_registrations_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reg.partnership_request_id)
    }

    const tournamentName = reg.tournaments?.name ?? 'el torneo'
    const categoryName = reg.categories?.name ?? 'la categoría'
    const reasonText = reason ? ` Razón: ${reason}.` : ''

    // Notify both players
    await createBulkNotifications(supabase, [
      {
        tournamentId: reg.tournament_id,
        userId: reg.player1_id,
        message: `Tu inscripción en ${tournamentName} (${categoryName}) fue rechazada.${reasonText} Puedes intentar de nuevo.`,
        type: 'registration_rejected',
      },
      {
        tournamentId: reg.tournament_id,
        userId: reg.player2_id,
        message: `Tu inscripción en ${tournamentName} (${categoryName}) fue rechazada.${reasonText} Puedes intentar de nuevo.`,
        type: 'registration_rejected',
      },
    ])

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
