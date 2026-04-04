import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { approveRegistration } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('approveRegistration', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
    store.tournament_registrations.push({
      id: TEST_IDS.registration1,
      tournament_id: TEST_IDS.tournament1,
      category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player1,
      player2_id: TEST_IDS.player2,
      team_name: 'Jugador1 / Jugador2',
      status: 'pending_organizer_approval',
      tournaments: { id: TEST_IDS.tournament1, organizer_id: TEST_IDS.organizer, name: 'Torneo Test' },
      categories: { id: TEST_IDS.category1, name: 'Cat A', max_couples: 4 },
    })
  })

  it('changes status to approved', async () => {
    const result = await approveRegistration(supabase, TEST_IDS.registration1, TEST_IDS.organizer)
    expect(result.success).toBe(true)
    const reg = store.tournament_registrations[0]
    expect(reg.status).toBe('approved')
  })

  it('sets decided_at and decided_by', async () => {
    await approveRegistration(supabase, TEST_IDS.registration1, TEST_IDS.organizer)
    const reg = store.tournament_registrations[0]
    expect(reg.decided_at).toBeDefined()
    expect(reg.decided_by).toBe(TEST_IDS.organizer)
  })

  it('rejects if organizer does not own the tournament', async () => {
    const result = await approveRegistration(supabase, TEST_IDS.registration1, TEST_IDS.player1)
    expect(result.success).toBe(false)
    expect(result.error).toContain('permisos')
  })

  it('creates notifications for both players', async () => {
    await approveRegistration(supabase, TEST_IDS.registration1, TEST_IDS.organizer)
    const notifs = store.notifications.filter(n => n.type === 'registration_approved')
    expect(notifs).toHaveLength(2)
    expect(notifs.map(n => n.user_id).sort()).toEqual([TEST_IDS.player1, TEST_IDS.player2].sort())
  })
})
