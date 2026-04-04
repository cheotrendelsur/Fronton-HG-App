import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { acceptPartnershipRequest } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('acceptPartnershipRequest', () => {
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
      tournaments: { name: 'Torneo Test', status: 'inscription' },
      categories: { name: 'Cat A', max_couples: 4 },
    })
  })

  it('creates registration with pending_organizer_approval', async () => {
    const result = await acceptPartnershipRequest(supabase, TEST_IDS.request1, TEST_IDS.player2)
    expect(result.success).toBe(true)
    expect(result.registrationId).toBeDefined()
    const reg = store.tournament_registrations.find(r => r.id === result.registrationId)
    expect(reg.status).toBe('pending_organizer_approval')
  })

  it('generates team_name correctly', async () => {
    const result = await acceptPartnershipRequest(supabase, TEST_IDS.request1, TEST_IDS.player2)
    const reg = store.tournament_registrations.find(r => r.id === result.registrationId)
    expect(reg.team_name).toBe('Jugador1 / Jugador2')
  })

  it('rejects if status is not pending', async () => {
    store.tournament_partnership_requests[0].status = 'declined'
    const result = await acceptPartnershipRequest(supabase, TEST_IDS.request1, TEST_IDS.player2)
    expect(result.success).toBe(false)
    expect(result.error).toContain('procesada')
  })

  it('creates notifications for both players', async () => {
    await acceptPartnershipRequest(supabase, TEST_IDS.request1, TEST_IDS.player2)
    const notifs = store.notifications.filter(n => n.type === 'partnership_accepted')
    expect(notifs).toHaveLength(2)
    expect(notifs.map(n => n.user_id).sort()).toEqual([TEST_IDS.player1, TEST_IDS.player2].sort())
  })
})
