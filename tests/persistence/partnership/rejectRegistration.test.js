import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { rejectRegistration } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('rejectRegistration', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
    store.tournament_partnership_requests.push({
      id: TEST_IDS.request1, tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      requester_id: TEST_IDS.player1, partner_requested_id: TEST_IDS.player2,
      status: 'converted_to_registration', tournament_registrations_id: TEST_IDS.registration1,
    })
    store.tournament_registrations.push({
      id: TEST_IDS.registration1,
      tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player1, player2_id: TEST_IDS.player2,
      team_name: 'Jugador1 / Jugador2', status: 'pending_organizer_approval',
      partnership_request_id: TEST_IDS.request1,
      tournaments: { id: TEST_IDS.tournament1, organizer_id: TEST_IDS.organizer, name: 'Torneo Test' },
      categories: { id: TEST_IDS.category1, name: 'Cat A' },
    })
  })

  it('changes status to rejected', async () => {
    const result = await rejectRegistration(supabase, TEST_IDS.registration1, TEST_IDS.organizer, 'Categoria llena')
    expect(result.success).toBe(true)
    expect(store.tournament_registrations[0].status).toBe('rejected')
  })

  it('stores rejected_reason', async () => {
    await rejectRegistration(supabase, TEST_IDS.registration1, TEST_IDS.organizer, 'Motivo especifico')
    expect(store.tournament_registrations[0].rejected_reason).toBe('Motivo especifico')
  })

  it('reverts partnership_request to pending_partner_acceptance', async () => {
    await rejectRegistration(supabase, TEST_IDS.registration1, TEST_IDS.organizer, null)
    expect(store.tournament_partnership_requests[0].status).toBe('pending_partner_acceptance')
  })

  it('creates notifications for both players', async () => {
    await rejectRegistration(supabase, TEST_IDS.registration1, TEST_IDS.organizer, 'Test')
    const notifs = store.notifications.filter(n => n.type === 'registration_rejected')
    expect(notifs).toHaveLength(2)
  })
})
