/**
 * E2E: Partner declines the partnership request.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import {
  createPartnershipRequest,
  declinePartnershipRequest,
  createPartnershipRequest as createAnother,
} from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('E2E: Partner decline flow', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
  })

  it('partner declines → no registration created, requester can try again', async () => {
    // Player1 requests Player2
    const createResult = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(createResult.success).toBe(true)

    // Add metadata for decline query
    store.tournament_partnership_requests[0].tournaments = { name: 'Torneo Test' }
    store.tournament_partnership_requests[0].categories = { name: 'Cat A' }

    // Player2 declines with reason
    const declineResult = await declinePartnershipRequest(supabase, createResult.requestId, 'Ya tengo pareja')
    expect(declineResult.success).toBe(true)

    // NO registration created
    expect(store.tournament_registrations).toHaveLength(0)

    // Notification to Player1 with reason
    const notif = store.notifications.find(n => n.user_id === TEST_IDS.player1 && n.type === 'partnership_declined')
    expect(notif).toBeDefined()
    expect(notif.message).toContain('rechazó')
    expect(notif.message).toContain('Ya tengo pareja')

    // Player1 can request Player3
    const retry = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player3)
    expect(retry.success).toBe(true)
  })
})
