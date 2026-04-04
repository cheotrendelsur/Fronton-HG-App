import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { getPendingPartnershipRequests } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('getPendingPartnershipRequests', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
    store.tournament_partnership_requests.push(
      { id: 'req-1', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1, requester_id: TEST_IDS.player1, partner_requested_id: TEST_IDS.player2, status: 'pending_partner_acceptance', created_at: new Date().toISOString() },
      { id: 'req-2', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category2, requester_id: TEST_IDS.player3, partner_requested_id: TEST_IDS.player1, status: 'pending_partner_acceptance', created_at: new Date().toISOString() },
      { id: 'req-3', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1, requester_id: TEST_IDS.player1, partner_requested_id: TEST_IDS.player3, status: 'declined', created_at: new Date().toISOString() },
    )
  })

  it('returns requests as requester', async () => {
    const result = await getPendingPartnershipRequests(supabase, TEST_IDS.player1)
    expect(result.success).toBe(true)
    expect(result.asRequester.length).toBe(1)
    expect(result.asRequester[0].id).toBe('req-1')
  })

  it('returns requests as partner', async () => {
    const result = await getPendingPartnershipRequests(supabase, TEST_IDS.player1)
    expect(result.asPartner.length).toBe(1)
    expect(result.asPartner[0].id).toBe('req-2')
  })

  it('excludes non-pending requests', async () => {
    const result = await getPendingPartnershipRequests(supabase, TEST_IDS.player1)
    const allIds = [...result.asRequester, ...result.asPartner].map(r => r.id)
    expect(allIds).not.toContain('req-3')
  })

  it('includes tournament and category data', async () => {
    const result = await getPendingPartnershipRequests(supabase, TEST_IDS.player1)
    expect(result.asRequester[0].tournament_id).toBe(TEST_IDS.tournament1)
    expect(result.asRequester[0].category_id).toBe(TEST_IDS.category1)
  })
})
