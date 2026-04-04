/**
 * E2E: Business validations — duplicates, full categories, team_name generation.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import {
  createPartnershipRequest,
  acceptPartnershipRequest,
} from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('E2E: Business Validations', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
  })

  it('prevents duplicate requests (same pair, same tournament/category)', async () => {
    const first = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(first.success).toBe(true)

    const duplicate = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(duplicate.success).toBe(false)
    expect(duplicate.error).toContain('Ya existe')
  })

  it('prevents inscription when category is full', async () => {
    // Fill category with max_couples = 4
    for (let i = 0; i < 4; i++) {
      store.tournament_registrations.push({
        id: `reg-${i}`, tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
        player1_id: `p-${i}a`, player2_id: `p-${i}b`, status: 'approved',
      })
    }

    // Create and try to accept
    store.tournament_partnership_requests.push({
      id: TEST_IDS.request1,
      tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      requester_id: TEST_IDS.player1, partner_requested_id: TEST_IDS.player2,
      status: 'pending_partner_acceptance',
      tournaments: { name: 'Torneo Test', status: 'inscription' },
      categories: { name: 'Cat A', max_couples: 4 },
    })

    const result = await acceptPartnershipRequest(supabase, TEST_IDS.request1, TEST_IDS.player2)
    expect(result.success).toBe(false)
    expect(result.error).toContain('llena')
  })

  it('prevents request if partner already inscribed in category', async () => {
    store.tournament_registrations.push({
      id: 'existing-reg', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player2, player2_id: TEST_IDS.player3, status: 'approved',
    })

    const result = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    expect(result.success).toBe(false)
    expect(result.error).toContain('inscrito')
  })

  it('generates team_name as "Requester / Partner"', async () => {
    const create = await createPartnershipRequest(supabase, TEST_IDS.tournament1, TEST_IDS.category1, TEST_IDS.player1, TEST_IDS.player2)
    store.tournament_partnership_requests[0].tournaments = { name: 'T', status: 'inscription' }
    store.tournament_partnership_requests[0].categories = { name: 'C', max_couples: 4 }

    const accept = await acceptPartnershipRequest(supabase, create.requestId, TEST_IDS.player2)
    const reg = store.tournament_registrations.find(r => r.id === accept.registrationId)
    expect(reg.team_name).toBe('Jugador1 / Jugador2')
  })
})
