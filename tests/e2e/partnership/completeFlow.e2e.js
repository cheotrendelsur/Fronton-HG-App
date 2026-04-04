/**
 * E2E: Complete partnership flow — Request → Accept → Approve
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import {
  createPartnershipRequest,
  acceptPartnershipRequest,
  approveRegistration,
} from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('E2E: Complete partnership flow', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
  })

  it('full flow: request → accept → approve', async () => {
    // Step 1: Player1 requests Player2
    const createResult = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(createResult.success).toBe(true)
    expect(store.tournament_partnership_requests).toHaveLength(1)
    expect(store.tournament_partnership_requests[0].status).toBe('pending_partner_acceptance')

    // Notification sent to Player2
    expect(store.notifications.some(n => n.user_id === TEST_IDS.player2 && n.type === 'partnership_request')).toBe(true)

    // Step 2: Player2 accepts
    const requestId = createResult.requestId
    // Need to add related data for the mock to find in the query
    store.tournament_partnership_requests[0].tournaments = { name: 'Torneo Test', status: 'inscription' }
    store.tournament_partnership_requests[0].categories = { name: 'Cat A', max_couples: 4 }

    const acceptResult = await acceptPartnershipRequest(supabase, requestId, TEST_IDS.player2)
    expect(acceptResult.success).toBe(true)
    expect(acceptResult.registrationId).toBeDefined()

    // Registration created with pending_organizer_approval
    const reg = store.tournament_registrations.find(r => r.id === acceptResult.registrationId)
    expect(reg.status).toBe('pending_organizer_approval')
    expect(reg.team_name).toBe('Jugador1 / Jugador2')

    // Notifications for both
    const acceptNotifs = store.notifications.filter(n => n.type === 'partnership_accepted')
    expect(acceptNotifs).toHaveLength(2)

    // Step 3: Organizer approves
    // Add tournament/categories metadata for approval query
    reg.tournaments = { id: TEST_IDS.tournament1, organizer_id: TEST_IDS.organizer, name: 'Torneo Test' }
    reg.categories = { id: TEST_IDS.category1, name: 'Cat A', max_couples: 4 }

    const approveResult = await approveRegistration(supabase, acceptResult.registrationId, TEST_IDS.organizer)
    expect(approveResult.success).toBe(true)
    expect(reg.status).toBe('approved')

    // Notifications for both players
    const approveNotifs = store.notifications.filter(n => n.type === 'registration_approved')
    expect(approveNotifs).toHaveLength(2)

    // Registration now visible in competition (status = 'approved')
    const approvedRegs = store.tournament_registrations.filter(r => r.status === 'approved')
    expect(approvedRegs).toHaveLength(1)
  })
})
