import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { declinePartnershipRequest } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('declinePartnershipRequest', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
    store.tournament_partnership_requests.push({
      id: TEST_IDS.request1,
      tournament_id: TEST_IDS.tournament1,
      category_id: TEST_IDS.category1,
      requester_id: TEST_IDS.player1,
      partner_requested_id: TEST_IDS.player2,
      status: 'pending_partner_acceptance',
      tournaments: { name: 'Torneo Test' },
      categories: { name: 'Cat A' },
    })
  })

  it('updates status to declined', async () => {
    const result = await declinePartnershipRequest(supabase, TEST_IDS.request1, 'No puedo')
    expect(result.success).toBe(true)
    const req = store.tournament_partnership_requests[0]
    expect(req.status).toBe('declined')
    expect(req.partner_response).toBe('declined')
  })

  it('stores rejected_reason', async () => {
    await declinePartnershipRequest(supabase, TEST_IDS.request1, 'Tengo otra pareja')
    expect(store.tournament_partnership_requests[0].rejected_reason).toBe('Tengo otra pareja')
  })

  it('creates notification for requester', async () => {
    await declinePartnershipRequest(supabase, TEST_IDS.request1, 'No puedo')
    const notif = store.notifications.find(n => n.user_id === TEST_IDS.player1 && n.type === 'partnership_declined')
    expect(notif).toBeDefined()
    expect(notif.message).toContain('rechazó')
  })

  it('does NOT create tournament_registrations', async () => {
    await declinePartnershipRequest(supabase, TEST_IDS.request1, null)
    expect(store.tournament_registrations).toHaveLength(0)
  })

  it('rejects if already processed', async () => {
    store.tournament_partnership_requests[0].status = 'converted_to_registration'
    const result = await declinePartnershipRequest(supabase, TEST_IDS.request1, null)
    expect(result.success).toBe(false)
  })
})
