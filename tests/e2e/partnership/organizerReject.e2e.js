/**
 * E2E: Organizer rejects → partnership request reverts to allow retry.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import {
  createPartnershipRequest,
  acceptPartnershipRequest,
  rejectRegistration,
} from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('E2E: Organizer reject flow', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
  })

  it('organizer rejects → registration rejected, partnership request reverts', async () => {
    // Create and accept request
    const create = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    store.tournament_partnership_requests[0].tournaments = { name: 'Torneo Test', status: 'inscription' }
    store.tournament_partnership_requests[0].categories = { name: 'Cat A', max_couples: 4 }

    const accept = await acceptPartnershipRequest(supabase, create.requestId, TEST_IDS.player2)
    expect(accept.success).toBe(true)

    // Organizer rejects
    const reg = store.tournament_registrations.find(r => r.id === accept.registrationId)
    reg.tournaments = { id: TEST_IDS.tournament1, organizer_id: TEST_IDS.organizer, name: 'Torneo Test' }
    reg.categories = { id: TEST_IDS.category1, name: 'Cat A' }

    const reject = await rejectRegistration(supabase, accept.registrationId, TEST_IDS.organizer, 'No cumplen requisitos')
    expect(reject.success).toBe(true)

    // Registration status = rejected
    expect(reg.status).toBe('rejected')

    // Partnership request reverts to pending
    expect(store.tournament_partnership_requests[0].status).toBe('pending_partner_acceptance')

    // Notifications for both players
    const rejectNotifs = store.notifications.filter(n => n.type === 'registration_rejected')
    expect(rejectNotifs).toHaveLength(2)
  })
})
