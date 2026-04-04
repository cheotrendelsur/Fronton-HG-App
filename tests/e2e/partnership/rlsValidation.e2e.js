/**
 * E2E: RLS validation — access control tests.
 * These verify the persistence functions enforce ownership checks.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import {
  acceptPartnershipRequest,
  approveRegistration,
  rejectRegistration,
} from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('E2E: RLS Validation', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
  })

  it('only the requested partner can accept a request', async () => {
    store.tournament_partnership_requests.push({
      id: TEST_IDS.request1,
      tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      requester_id: TEST_IDS.player1, partner_requested_id: TEST_IDS.player2,
      status: 'pending_partner_acceptance',
      tournaments: { name: 'Torneo Test', status: 'inscription' },
      categories: { name: 'Cat A', max_couples: 4 },
    })

    // Player3 tries to accept (not the partner)
    const result = await acceptPartnershipRequest(supabase, TEST_IDS.request1, TEST_IDS.player3)
    expect(result.success).toBe(false)
    expect(result.error).toContain('solicitado')
  })

  it('only tournament organizer can approve registrations', async () => {
    store.tournament_registrations.push({
      id: TEST_IDS.registration1,
      tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player1, player2_id: TEST_IDS.player2,
      status: 'pending_organizer_approval',
      tournaments: { id: TEST_IDS.tournament1, organizer_id: TEST_IDS.organizer, name: 'Test' },
      categories: { id: TEST_IDS.category1, name: 'Cat A', max_couples: 4 },
    })

    // Player1 tries to approve (not the organizer)
    const result = await approveRegistration(supabase, TEST_IDS.registration1, TEST_IDS.player1)
    expect(result.success).toBe(false)
    expect(result.error).toContain('permisos')
  })

  it('only tournament organizer can reject registrations', async () => {
    store.tournament_registrations.push({
      id: TEST_IDS.registration1,
      tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player1, player2_id: TEST_IDS.player2,
      status: 'pending_organizer_approval',
      tournaments: { id: TEST_IDS.tournament1, organizer_id: TEST_IDS.organizer, name: 'Test' },
      categories: { id: TEST_IDS.category1, name: 'Cat A' },
    })

    const result = await rejectRegistration(supabase, TEST_IDS.registration1, TEST_IDS.player2, 'No')
    expect(result.success).toBe(false)
    expect(result.error).toContain('permisos')
  })
})
