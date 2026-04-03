// cascadeRecalculator.test.mjs
// Unit tests for cascade recalculation engine

import { describe, it, expect } from 'vitest'
import { recalculateCourt } from './cascadeRecalculator.js'

// Helper to make test matches
function makeMatch(overrides) {
  return {
    id: overrides.id || `match-${Math.random().toString(36).slice(2)}`,
    match_number: 1,
    court_id: 'court-1',
    scheduled_date: '2025-06-15',
    scheduled_time: '10:00',
    estimated_duration_minutes: 60,
    status: 'scheduled',
    team1_id: 'team-a',
    team2_id: 'team-b',
    phase: 'group_phase',
    ...overrides,
  }
}

const court = {
  available_from: '09:00',
  available_to: '21:00',
  break_start: '13:00',
  break_end: '14:00',
}

const courtNoBreak = {
  available_from: '09:00',
  available_to: '21:00',
  break_start: null,
  break_end: null,
}

const days = ['2025-06-15', '2025-06-16', '2025-06-17']

describe('recalculateCourt', () => {
  it('basic cascade — 3 pending matches shift when match ends early', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
      makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '11:00', status: 'scheduled' }),
      makeMatch({ id: 'm4', match_number: 4, scheduled_date: '2025-06-15', scheduled_time: '12:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T09:50:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_date).toBe('2025-06-15')
    expect(m2update.scheduled_time).toBe('09:50')

    const m3update = updates.find(u => u.id === 'm3')
    expect(m3update).toBeTruthy()
    expect(m3update.scheduled_time).toBe('10:50')

    const m4update = updates.find(u => u.id === 'm4')
    expect(m4update).toBeTruthy()
    expect(m4update.scheduled_time).toBe('11:50')

    expect(updates.length).toBe(3)
  })

  it('completed matches between anchor and pending are not modified', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'completed' }),
      makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '11:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T09:50:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeFalsy()

    const m3update = updates.find(u => u.id === 'm3')
    expect(m3update).toBeTruthy()
    expect(m3update.scheduled_time).toBe('10:50')
  })

  it('break window — recalculated start at 13:00 pushed to 14:00', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '12:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '13:00', status: 'scheduled', estimated_duration_minutes: 60 }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T13:00:00',
      courtMatches: matches,
      court,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_time).toBe('14:00')
  })

  it('day overflow — match pushed to next day at available_from', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '20:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '21:00', status: 'scheduled', estimated_duration_minutes: 60 }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T20:30:00',
      courtMatches: matches,
      court,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_date).toBe('2025-06-16')
    expect(m2update.scheduled_time).toBe('09:00')
  })

  it('day overflow with break — available_from falls in break, pushed to break_end', () => {
    const courtWithEarlyBreak = {
      available_from: '09:00',
      available_to: '21:00',
      break_start: '09:00',
      break_end: '10:00',
    }

    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '20:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '21:00', status: 'scheduled', estimated_duration_minutes: 60 }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T20:30:00',
      courtMatches: matches,
      court: courtWithEarlyBreak,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_date).toBe('2025-06-16')
    expect(m2update.scheduled_time).toBe('10:00')
  })

  it('multi-day cascade — overflow cascades across multiple days', () => {
    const tightCourt = {
      available_from: '09:00',
      available_to: '10:00',
      break_start: null,
      break_end: null,
    }

    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', estimated_duration_minutes: 60, status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '09:00', estimated_duration_minutes: 60, status: 'scheduled' }),
      makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-16', scheduled_time: '09:00', estimated_duration_minutes: 60, status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T10:10:00',
      courtMatches: matches,
      court: tightCourt,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_date).toBe('2025-06-16')
    expect(m2update.scheduled_time).toBe('09:00')

    const m3update = updates.find(u => u.id === 'm3')
    expect(m3update).toBeTruthy()
    expect(m3update.scheduled_date).toBe('2025-06-17')
    expect(m3update.scheduled_time).toBe('09:00')
  })

  it('isolation — matches on a different court_id are not in updates', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', court_id: 'court-1', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
      makeMatch({ id: 'm3', court_id: 'court-2', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T09:50:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    const m3update = updates.find(u => u.id === 'm3')
    expect(m3update).toBeFalsy()

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
  })

  it('only scheduled_date and scheduled_time in update objects', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled', team1_id: 'team-x', team2_id: 'team-y', phase: 'elimination' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T09:50:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()

    const updateKeys = Object.keys(m2update)
    expect(updateKeys).toContain('id')
    expect(updateKeys).toContain('scheduled_date')
    expect(updateKeys).toContain('scheduled_time')
    expect(updateKeys).not.toContain('court_id')
    expect(updateKeys).not.toContain('team1_id')
    expect(updateKeys).not.toContain('team2_id')
    expect(updateKeys).not.toContain('phase')
    expect(updateKeys).not.toContain('status')
    expect(updateKeys).not.toContain('estimated_duration_minutes')
    expect(updateKeys).not.toContain('match_number')
  })

  it('match order preserved — sequence by scheduled order is maintained', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '11:00', status: 'scheduled' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
      makeMatch({ id: 'm4', match_number: 4, scheduled_date: '2025-06-15', scheduled_time: '12:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T09:50:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    const m3update = updates.find(u => u.id === 'm3')
    const m4update = updates.find(u => u.id === 'm4')

    expect(m2update.scheduled_time).toBe('09:50')
    expect(m3update.scheduled_time).toBe('10:50')
    expect(m4update.scheduled_time).toBe('11:50')
  })

  it('no pending matches after anchor — returns empty array', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '08:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T09:50:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    expect(updates.length).toBe(0)
  })

  it('matches with status "pending" are also recalculated', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'pending', estimated_duration_minutes: 60 }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T09:50:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_time).toBe('09:50')
  })

  it('match already at correct time is not included in updates', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T10:00:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeFalsy()
  })

  it('resume anchor — cascade starts from current time', () => {
    // Simulate resume at 15:00: m1 completed at 09:00, m2 and m3 are pending
    // Anchor = 15:00 means "resume now", so pending matches shift from 15:00
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
      makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '11:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T15:00:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    // m2 should be shifted to 15:00 (the anchor time)
    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_date).toBe('2025-06-15')
    expect(m2update.scheduled_time).toBe('15:00')

    // m3 should be at 16:00 (15:00 + 60 min duration)
    const m3update = updates.find(u => u.id === 'm3')
    expect(m3update).toBeTruthy()
    expect(m3update.scheduled_date).toBe('2025-06-15')
    expect(m3update.scheduled_time).toBe('16:00')
  })

  it('resume anchor — no triggering completed match uses anchor directly', () => {
    // All matches are pending (no completed match exists).
    // Anchor = 14:00 means "resume now", first pending starts at 14:00
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'scheduled' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
    ]

    const updates = recalculateCourt({
      courtId: 'court-1',
      actualEndTime: '2025-06-15T14:00:00',
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
    })

    // m1 should be shifted to 14:00
    const m1update = updates.find(u => u.id === 'm1')
    expect(m1update).toBeTruthy()
    expect(m1update.scheduled_time).toBe('14:00')

    // m2 should be at 15:00
    const m2update = updates.find(u => u.id === 'm2')
    expect(m2update).toBeTruthy()
    expect(m2update.scheduled_time).toBe('15:00')
  })
})
