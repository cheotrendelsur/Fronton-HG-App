import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { createPartnershipRequest } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('createPartnershipRequest', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
  })

  it('creates a request successfully', async () => {
    const result = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(result.success).toBe(true)
    expect(result.requestId).toBeDefined()
    expect(store.tournament_partnership_requests).toHaveLength(1)
    expect(store.tournament_partnership_requests[0].status).toBe('pending_partner_acceptance')
  })

  it('rejects duplicate pending request', async () => {
    store.tournament_partnership_requests.push({
      id: 'existing', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      requester_id: TEST_IDS.player1, partner_requested_id: TEST_IDS.player2,
      status: 'pending_partner_acceptance',
    })
    const result = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Ya existe')
  })

  it('rejects if partner already approved in category', async () => {
    store.tournament_registrations.push({
      id: 'reg-existing', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player2, player2_id: TEST_IDS.player3, status: 'approved',
    })
    const result = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(result.success).toBe(false)
    expect(result.error).toContain('inscrito')
  })

  it('rejects if requester already approved in category', async () => {
    store.tournament_registrations.push({
      id: 'reg-existing', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player1, player2_id: TEST_IDS.player3, status: 'approved',
    })
    const result = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(result.success).toBe(false)
    expect(result.error).toContain('inscrito')
  })

  it('creates notification for partner', async () => {
    await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    const notif = store.notifications.find(n => n.user_id === TEST_IDS.player2)
    expect(notif).toBeDefined()
    expect(notif.type).toBe('partnership_request')
    expect(notif.message).toContain('Jugador1')
  })
})
