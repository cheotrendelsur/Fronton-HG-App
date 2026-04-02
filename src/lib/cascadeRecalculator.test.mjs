// cascadeRecalculator.test.mjs
// Unit tests for cascade recalculation engine
// Run with: node src/lib/cascadeRecalculator.test.mjs

import assert from 'assert'
import { recalculateCourt } from './cascadeRecalculator.js'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  PASS: ${name}`)
    passed++
  } catch (err) {
    console.log(`  FAIL: ${name}`)
    console.log(`    ${err.message}`)
    failed++
  }
}

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

// ─── Test 1: Basic cascade — 3 pending matches shift 10 min earlier ─────────
test('Test 1: Basic cascade — 3 pending matches shift when match ends early', () => {
  const matches = [
    makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
    makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
    makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '11:00', status: 'scheduled' }),
    makeMatch({ id: 'm4', match_number: 4, scheduled_date: '2025-06-15', scheduled_time: '12:00', status: 'scheduled' }),
  ]

  // Match m1 (09:00-10:00) ended at 09:50 — 10 min early
  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T09:50:00',
    courtMatches: matches,
    court: courtNoBreak,
    tournamentDays: days,
  })

  // m2 should shift from 10:00 to 09:50
  const m2update = updates.find(u => u.id === 'm2')
  assert.ok(m2update, 'm2 should be in updates')
  assert.strictEqual(m2update.scheduled_date, '2025-06-15')
  assert.strictEqual(m2update.scheduled_time, '09:50')

  // m3 should shift from 11:00 to 10:50
  const m3update = updates.find(u => u.id === 'm3')
  assert.ok(m3update, 'm3 should be in updates')
  assert.strictEqual(m3update.scheduled_time, '10:50')

  // m4 should shift from 12:00 to 11:50
  const m4update = updates.find(u => u.id === 'm4')
  assert.ok(m4update, 'm4 should be in updates')
  assert.strictEqual(m4update.scheduled_time, '11:50')

  assert.strictEqual(updates.length, 3)
})

// ─── Test 2: Completed matches are skipped ───────────────────────────────────
test('Test 2: Completed matches between anchor and pending are not modified', () => {
  const matches = [
    makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
    makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'completed' }), // already completed
    makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '11:00', status: 'scheduled' }),
  ]

  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T09:50:00',
    courtMatches: matches,
    court: courtNoBreak,
    tournamentDays: days,
  })

  // m2 is completed — must NOT appear in updates
  const m2update = updates.find(u => u.id === 'm2')
  assert.ok(!m2update, 'm2 (completed) must not be in updates')

  // m3 should still shift
  const m3update = updates.find(u => u.id === 'm3')
  assert.ok(m3update, 'm3 should be in updates')
  assert.strictEqual(m3update.scheduled_time, '10:50')
})

// ─── Test 3: Break window — match start pushed past break ────────────────────
test('Test 3: Break window — recalculated start at 13:00 (inside break 13:00-14:00) pushed to 14:00', () => {
  const matches = [
    makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '12:00', status: 'completed' }),
    makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '13:00', status: 'scheduled', estimated_duration_minutes: 60 }),
  ]

  // m1 ended exactly at 13:00 — m2 would start at 13:00 (inside break)
  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T13:00:00',
    courtMatches: matches,
    court,
    tournamentDays: days,
  })

  const m2update = updates.find(u => u.id === 'm2')
  assert.ok(m2update, 'm2 should be in updates')
  assert.strictEqual(m2update.scheduled_time, '14:00', 'Should push past break to 14:00')
})

// ─── Test 4: Day overflow — match would exceed available_to ──────────────────
test('Test 4: Day overflow — match pushed to next day at available_from', () => {
  const matches = [
    makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '20:00', status: 'completed' }),
    makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '21:00', status: 'scheduled', estimated_duration_minutes: 60 }),
  ]

  // m1 ended at 20:30 — m2 would start at 20:30, but 20:30 + 60 min = 21:30 > 21:00 available_to
  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T20:30:00',
    courtMatches: matches,
    court,
    tournamentDays: days,
  })

  const m2update = updates.find(u => u.id === 'm2')
  assert.ok(m2update, 'm2 should be in updates')
  assert.strictEqual(m2update.scheduled_date, '2025-06-16', 'Should overflow to next day')
  assert.strictEqual(m2update.scheduled_time, '09:00', 'Should start at available_from on next day')
})

// ─── Test 5: Day overflow with break — first available time falls in break ───
test('Test 5: Day overflow with break — available_from falls in break, pushed to break_end', () => {
  const courtWithEarlyBreak = {
    available_from: '09:00',
    available_to: '21:00',
    break_start: '09:00',  // break starts right at opening
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
  assert.ok(m2update, 'm2 should be in updates')
  assert.strictEqual(m2update.scheduled_date, '2025-06-16', 'Should overflow to next day')
  assert.strictEqual(m2update.scheduled_time, '10:00', 'Should push past break to break_end')
})

// ─── Test 6: Multi-day cascade ───────────────────────────────────────────────
test('Test 6: Multi-day cascade — overflow cascades across multiple days', () => {
  const tightCourt = {
    available_from: '09:00',
    available_to: '10:00', // Only 60 min per day
    break_start: null,
    break_end: null,
  }

  const matches = [
    makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', estimated_duration_minutes: 60, status: 'completed' }),
    makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '09:00', estimated_duration_minutes: 60, status: 'scheduled' }),
    makeMatch({ id: 'm3', match_number: 3, scheduled_date: '2025-06-16', scheduled_time: '09:00', estimated_duration_minutes: 60, status: 'scheduled' }),
  ]

  // m1 ended 10 min late at 10:10 — m2 starts at 10:10 which > available_to (10:00)
  // → m2 overflows to day 2 (09:00)
  // → m3 was on day 2 at 09:00, but m2 now takes that slot → m3 overflows to day 3
  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T10:10:00',
    courtMatches: matches,
    court: tightCourt,
    tournamentDays: days,
  })

  const m2update = updates.find(u => u.id === 'm2')
  assert.ok(m2update, 'm2 should be in updates')
  assert.strictEqual(m2update.scheduled_date, '2025-06-16')
  assert.strictEqual(m2update.scheduled_time, '09:00')

  const m3update = updates.find(u => u.id === 'm3')
  assert.ok(m3update, 'm3 should be in updates')
  assert.strictEqual(m3update.scheduled_date, '2025-06-17')
  assert.strictEqual(m3update.scheduled_time, '09:00')
})

// ─── Test 7: Isolation — matches on different court are untouched ─────────────
test('Test 7: Isolation — matches on a different court_id are returned unchanged (not in updates)', () => {
  const matches = [
    makeMatch({ id: 'm1', court_id: 'court-1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
    makeMatch({ id: 'm2', court_id: 'court-1', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
    makeMatch({ id: 'm3', court_id: 'court-2', match_number: 3, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }), // different court
  ]

  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T09:50:00',
    courtMatches: matches,
    court: courtNoBreak,
    tournamentDays: days,
  })

  // m3 (court-2) must not appear in updates
  const m3update = updates.find(u => u.id === 'm3')
  assert.ok(!m3update, 'm3 (different court) must not be in updates')

  // m2 (court-1) should appear
  const m2update = updates.find(u => u.id === 'm2')
  assert.ok(m2update, 'm2 (same court) should be in updates')
})

// ─── Test 8: Only scheduled_date and scheduled_time change ───────────────────
test('Test 8: Only scheduled_date and scheduled_time change — other fields not in updates', () => {
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
  assert.ok(m2update, 'm2 should be in updates')

  // Only id, scheduled_date, scheduled_time should be in the update object
  const updateKeys = Object.keys(m2update)
  assert.ok(updateKeys.includes('id'), 'id must be present')
  assert.ok(updateKeys.includes('scheduled_date'), 'scheduled_date must be present')
  assert.ok(updateKeys.includes('scheduled_time'), 'scheduled_time must be present')
  assert.ok(!updateKeys.includes('court_id'), 'court_id must NOT be in updates')
  assert.ok(!updateKeys.includes('team1_id'), 'team1_id must NOT be in updates')
  assert.ok(!updateKeys.includes('team2_id'), 'team2_id must NOT be in updates')
  assert.ok(!updateKeys.includes('phase'), 'phase must NOT be in updates')
  assert.ok(!updateKeys.includes('status'), 'status must NOT be in updates')
  assert.ok(!updateKeys.includes('estimated_duration_minutes'), 'estimated_duration_minutes must NOT be in updates')
  assert.ok(!updateKeys.includes('match_number'), 'match_number must NOT be in updates')
})

// ─── Test 9: Match order preserved ───────────────────────────────────────────
test('Test 9: Match order preserved — sequence by scheduled order is maintained', () => {
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

  // Check that updates are ordered by scheduled time (09:50, 10:50, 11:50)
  const orderedUpdates = updates.slice().sort((a, b) =>
    a.scheduled_date.localeCompare(b.scheduled_date) || a.scheduled_time.localeCompare(b.scheduled_time)
  )

  // m2 should have 09:50, m3 should have 10:50, m4 should have 11:50
  const m2update = updates.find(u => u.id === 'm2')
  const m3update = updates.find(u => u.id === 'm3')
  const m4update = updates.find(u => u.id === 'm4')

  assert.ok(m2update && m2update.scheduled_time === '09:50', 'm2 should be at 09:50')
  assert.ok(m3update && m3update.scheduled_time === '10:50', 'm3 should be at 10:50')
  assert.ok(m4update && m4update.scheduled_time === '11:50', 'm4 should be at 11:50')
})

// ─── Test 10: No pending matches after anchor ─────────────────────────────────
test('Test 10: No pending matches after anchor — returns empty array', () => {
  const matches = [
    makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
    makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '08:00', status: 'scheduled' }), // before anchor time
  ]

  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T09:50:00',
    courtMatches: matches,
    court: courtNoBreak,
    tournamentDays: days,
  })

  assert.strictEqual(updates.length, 0, 'No matches after anchor should return empty array')
})

// ─── Test 11: Pending status matches are included ─────────────────────────────
test('Test 11: Matches with status "pending" are also recalculated', () => {
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
  assert.ok(m2update, 'm2 with status "pending" should be recalculated')
  assert.strictEqual(m2update.scheduled_time, '09:50')
})

// ─── Test 12: Match already at correct time — not included in updates ─────────
test('Test 12: Match already at correct time is not included in updates', () => {
  const matches = [
    makeMatch({ id: 'm1', match_number: 1, scheduled_date: '2025-06-15', scheduled_time: '09:00', status: 'completed' }),
    makeMatch({ id: 'm2', match_number: 2, scheduled_date: '2025-06-15', scheduled_time: '10:00', status: 'scheduled' }),
  ]

  // m1 ended exactly at 10:00 — no shift needed
  const updates = recalculateCourt({
    courtId: 'court-1',
    actualEndTime: '2025-06-15T10:00:00',
    courtMatches: matches,
    court: courtNoBreak,
    tournamentDays: days,
  })

  const m2update = updates.find(u => u.id === 'm2')
  assert.ok(!m2update, 'm2 should not appear in updates — time is already correct')
})

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n=== Test Summary ===')
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total: ${passed + failed}`)

if (failed > 0) {
  process.exit(1)
} else {
  console.log('\nAll tests passed!')
}
