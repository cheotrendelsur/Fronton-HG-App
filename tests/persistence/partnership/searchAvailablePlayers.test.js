import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockStore, TEST_IDS } from '../../helpers/mockSupabase.js'
import { searchAvailablePlayers } from '../../../src/services/partnership/partnershipRequestPersistence.js'

describe('searchAvailablePlayers', () => {
  let store, supabase

  beforeEach(() => {
    store = createMockStore()
    supabase = createMockSupabase(store)
  })

  it('finds by username case-insensitive', async () => {
    const result = await searchAvailablePlayers(supabase, TEST_IDS.tournament1, TEST_IDS.category1, 'jugador', TEST_IDS.organizer)
    expect(result.success).toBe(true)
    expect(result.players.length).toBeGreaterThan(0)
  })

  it('finds by email', async () => {
    const result = await searchAvailablePlayers(supabase, TEST_IDS.tournament1, TEST_IDS.category1, 'j1@test', TEST_IDS.organizer)
    expect(result.success).toBe(true)
    expect(result.players.some(p => p.email === 'j1@test.com')).toBe(true)
  })

  it('excludes the searching player', async () => {
    const result = await searchAvailablePlayers(supabase, TEST_IDS.tournament1, TEST_IDS.category1, 'jugador', TEST_IDS.player1)
    expect(result.success).toBe(true)
    expect(result.players.every(p => p.id !== TEST_IDS.player1)).toBe(true)
  })

  it('excludes already approved players', async () => {
    store.tournament_registrations.push({
      id: 'r1', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      player1_id: TEST_IDS.player2, player2_id: TEST_IDS.player3, status: 'approved',
    })
    const result = await searchAvailablePlayers(supabase, TEST_IDS.tournament1, TEST_IDS.category1, 'jugador', TEST_IDS.player1)
    expect(result.players.every(p => p.id !== TEST_IDS.player2 && p.id !== TEST_IDS.player3)).toBe(true)
  })

  it('excludes players with pending requests', async () => {
    store.tournament_partnership_requests.push({
      id: 'pr1', tournament_id: TEST_IDS.tournament1, category_id: TEST_IDS.category1,
      requester_id: TEST_IDS.player2, partner_requested_id: TEST_IDS.player3,
      status: 'pending_partner_acceptance',
    })
    const result = await searchAvailablePlayers(supabase, TEST_IDS.tournament1, TEST_IDS.category1, 'jugador', TEST_IDS.player1)
    expect(result.players.every(p => p.id !== TEST_IDS.player2 && p.id !== TEST_IDS.player3)).toBe(true)
  })

  it('rejects search terms < 2 chars', async () => {
    const result = await searchAvailablePlayers(supabase, TEST_IDS.tournament1, TEST_IDS.category1, 'j', TEST_IDS.player1)
    expect(result.success).toBe(true)
    expect(result.players).toHaveLength(0)
  })

  it('limits to 10 results', async () => {
    // Add 15 extra profiles
    for (let i = 0; i < 15; i++) {
      store.profiles.push({ id: `extra-${i}`, username: `Jugador_Extra${i}`, email: `extra${i}@test.com`, avatar_url: null })
    }
    const result = await searchAvailablePlayers(supabase, TEST_IDS.tournament1, TEST_IDS.category1, 'jugador', TEST_IDS.organizer)
    expect(result.players.length).toBeLessThanOrEqual(10)
  })
})
