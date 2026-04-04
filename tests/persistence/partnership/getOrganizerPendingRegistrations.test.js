import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { getOrganizerPendingRegistrations } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('getOrganizerPendingRegistrations', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
    store.tournament_registrations.push(
      { id: 'reg-1', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1, player1_id: TEST_IDS.player1, player2_id: TEST_IDS.player2, team_name: 'J1 / J2', status: 'pending_organizer_approval', requested_at: new Date().toISOString() },
      { id: 'reg-2', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1, player1_id: TEST_IDS.player2, player2_id: TEST_IDS.player3, team_name: 'J2 / J3', status: 'approved', requested_at: new Date().toISOString() },
    )
  })

  it('returns only pending_organizer_approval registrations', async () => {
    const result = await getOrganizerPendingRegistrations(supabase, TEST_IDS.tournament1, TEST_IDS.organizer)
    expect(result.success).toBe(true)
    expect(result.registrations).toHaveLength(1)
    expect(result.registrations[0].status).toBe('pending_organizer_approval')
  })

  it('returns only registrations for the specified tournament', async () => {
    const result = await getOrganizerPendingRegistrations(supabase, TEST_IDS.tournament1, TEST_IDS.organizer)
    expect(result.registrations.every(r => r.tournament_id === TEST_IDS.tournament1)).toBe(true)
  })

  it('includes complete data', async () => {
    const result = await getOrganizerPendingRegistrations(supabase, TEST_IDS.tournament1, TEST_IDS.organizer)
    const reg = result.registrations[0]
    expect(reg.team_name).toBe('J1 / J2')
    expect(reg.category_id).toBe(TEST_IDS.category1)
  })
})
