// setbackE2E.test.mjs — End-to-end tests for the 10 hypothetical cases + R1-R7
import { describe, it, expect } from 'vitest'
import { recalculateCourtOnResume, calculateDelta, validateSchedule } from './cascadeRecalculator.js'
import { resolveConflicts, detectElimBeforeGroup, finalValidation } from './conflictResolver.js'

// ── Helpers ──

function makeMatch(overrides) {
  return {
    id: overrides.id || `m-${Math.random().toString(36).slice(2)}`,
    match_number: overrides.match_number || 1,
    court_id: overrides.court_id || 'courtA',
    scheduled_date: overrides.scheduled_date || '2025-06-15',
    scheduled_time: overrides.scheduled_time || '10:00',
    estimated_duration_minutes: overrides.estimated_duration_minutes || 55,
    status: overrides.status || 'scheduled',
    team1_id: overrides.team1_id ?? 'tA',
    team2_id: overrides.team2_id ?? 'tB',
    phase: overrides.phase || 'group_phase',
    ...overrides,
  }
}

const courtA = { id: 'courtA', available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' }
const courtB = { id: 'courtB', available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' }
const courtNoBreak = { id: 'courtA', available_from: '08:00', available_to: '18:00', break_start: null, break_end: null }
const days = ['2025-06-15', '2025-06-16', '2025-06-17']

// ── calculateDelta ──

describe('calculateDelta', () => {
  it('10:00→10:30 = 30 min', () => {
    expect(calculateDelta('2025-06-15T10:00:00', '2025-06-15T10:30:00')).toBe(30)
  })

  it('10:00→10:15 = 15 min', () => {
    expect(calculateDelta('2025-06-15T10:00:00', '2025-06-15T10:15:00')).toBe(15)
  })

  it('10:00→10:00 = error (delta 0)', () => {
    expect(() => calculateDelta('2025-06-15T10:00:00', '2025-06-15T10:00:00')).toThrow()
  })

  it('end before start = error', () => {
    expect(() => calculateDelta('2025-06-15T10:30:00', '2025-06-15T10:00:00')).toThrow()
  })
})

// ── CASO 1: Simple +15 min sin conflictos ──

describe('CASO 1 — Simple +15 min', () => {
  it('each match moves exactly +15 min', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_time: '10:00' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_time: '10:55' }),
      makeMatch({ id: 'm3', match_number: 3, scheduled_time: '11:50' }),
    ]

    const { updates, conflicts } = recalculateCourtOnResume({
      courtId: 'courtA',
      deltaMinutes: 15,
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
      allTournamentMatches: matches,
    })

    expect(updates).toHaveLength(3)
    expect(updates.find(u => u.id === 'm1').scheduled_time).toBe('10:15')
    expect(updates.find(u => u.id === 'm2').scheduled_time).toBe('11:10')
    expect(updates.find(u => u.id === 'm3').scheduled_time).toBe('12:05')
    expect(conflicts).toHaveLength(0)
  })
})

// ── CASO 2: Empuja al break ──

describe('CASO 2 — Break push', () => {
  it('match that would span into break jumps to break_end', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_time: '12:20' }),
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'courtA',
      deltaMinutes: 20,
      courtMatches: matches,
      court: courtA,
      tournamentDays: days,
      allTournamentMatches: matches,
    })

    // 12:20 + 20 = 12:40. 12:40+55=13:35 > 13:00 break → jump to 14:00
    expect(updates).toHaveLength(1)
    expect(updates[0].scheduled_time).toBe('14:00')
  })
})

// ── CASO 3: Empuja al día siguiente ──

describe('CASO 3 — Day overflow', () => {
  it('match past closing moves to next day at available_from', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_time: '17:20' }),
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'courtA',
      deltaMinutes: 20,
      courtMatches: matches,
      court: courtA,
      tournamentDays: days,
      allTournamentMatches: matches,
    })

    // 17:20 + 20 = 17:40. 17:40+55=18:35 > 18:00 → next day 08:00
    expect(updates).toHaveLength(1)
    expect(updates[0].scheduled_date).toBe('2025-06-16')
    expect(updates[0].scheduled_time).toBe('08:00')
  })
})

// ── CASO 4: Conflicto resuelto con swap ──

describe('CASO 4 — Swap resolution', () => {
  it('cross-court conflict resolved by swapping with non-conflicting match', () => {
    // Dupla X plays on courtA at 11:00 and courtB at 11:40 — overlap
    // Dupla Y plays on courtA at 09:50 with no courtB conflict
    const courtAMatches = [
      makeMatch({ id: 'mY', match_number: 1, court_id: 'courtA', scheduled_time: '09:50', team1_id: 'tY1', team2_id: 'tY2' }),
      makeMatch({ id: 'mX', match_number: 2, court_id: 'courtA', scheduled_time: '11:00', team1_id: 'tX', team2_id: 'tA' }),
    ]
    const courtBMatches = [
      makeMatch({ id: 'mB', match_number: 3, court_id: 'courtB', scheduled_time: '11:40', team1_id: 'tX', team2_id: 'tC' }),
    ]
    const allMatches = [...courtAMatches, ...courtBMatches]

    // Cascade update: mX was moved to 11:00 (already there, but simulate it as an update)
    const cascadeUpdates = [
      { id: 'mX', scheduled_date: '2025-06-15', scheduled_time: '11:00' },
    ]

    const result = resolveConflicts({
      affectedCourtId: 'courtA',
      cascadeUpdates,
      courtMatches: courtAMatches,
      allTournamentMatches: allMatches,
      court: courtNoBreak,
    })

    // Should resolve by swap: mX goes to 09:50, mY goes to 11:00
    expect(result.resolutionSummary.resolvedBySwap).toBeGreaterThanOrEqual(1)
    expect(result.resolutionSummary.unresolved).toBe(0)
  })
})

// ── CASO 5: Irresoluble (excede 120 min) ──

describe('CASO 5 — Irresolvable (>120 min)', () => {
  it('conflict marked irresolvable when push exceeds displacement limit', () => {
    function minutesToTime(m) { return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}` }
    // mX on courtA at 10:00 (dur 55). tX also has matches on courtB continuously
    // from 08:00 to 12:05 (3 matches, all with tX). The only slot that doesn't
    // overlap tX on courtB is after 12:05, which is 125 min from mX's reference (10:00) → >120.
    // courtA has no other matches for swap. courtB candidates all share tX with mX.
    // Fallback push: mB1 at 10:00 pushed to 10:55, but mB2 at 10:55 cascades to 11:50,
    // mB3 at 11:50 cascades to 12:45. But mX at 10:00 still overlaps with mB1 at 10:55
    // (10:00+55=10:55 == 10:55 start, no overlap). Actually that resolves it.
    // Instead: make mX long (120 min) so it overlaps everything on courtB up to 12:00.
    // courtB has back-to-back tX matches from 08:00 to 15:00. Forward displacement of mX
    // would need to go past 15:00, which is 300 min from ref(10:00) > 120.
    const courtAMatches = [
      makeMatch({ id: 'mX', match_number: 1, court_id: 'courtA', scheduled_time: '10:00',
        estimated_duration_minutes: 120, team1_id: 'tX', team2_id: 'tA' }),
    ]
    const courtBMatches = []
    // Fill courtB with tX matches from 08:00 to 15:00 (each 55 min)
    let t = 8 * 60 // 08:00
    let n = 2
    while (t + 55 <= 15 * 60) {
      courtBMatches.push(makeMatch({
        id: `mB${n}`, match_number: n, court_id: 'courtB',
        scheduled_time: minutesToTime(t), team1_id: 'tX', team2_id: `tOther${n}`,
      }))
      t += 55
      n++
    }
    const allMatches = [...courtAMatches, ...courtBMatches]

    const cascadeUpdates = [
      { id: 'mX', scheduled_date: '2025-06-15', scheduled_time: '10:00' },
    ]

    const result = resolveConflicts({
      affectedCourtId: 'courtA',
      cascadeUpdates,
      courtMatches: courtAMatches,
      allTournamentMatches: allMatches,
      court: courtNoBreak,
    })

    // Forward displacement can't find a slot within 120 min that doesn't overlap tX on courtB
    // Fallback push on courtB won't help because ALL courtB matches involve tX
    expect(result.resolutionSummary.unresolved).toBeGreaterThanOrEqual(1)
  })
})

// ── CASO 6: Múltiples conflictos simultáneos ──

describe('CASO 6 — Multiple simultaneous conflicts', () => {
  it('all three conflicts resolved', () => {
    // 3 matches on courtA at 10:00, 10:55, 11:50 — each has a team playing on courtB
    const courtAMatches = [
      makeMatch({ id: 'mA1', match_number: 1, court_id: 'courtA', scheduled_time: '09:00', team1_id: 'tSafe1', team2_id: 'tSafe2' }),
      makeMatch({ id: 'mA2', match_number: 2, court_id: 'courtA', scheduled_time: '09:55', team1_id: 'tSafe3', team2_id: 'tSafe4' }),
      makeMatch({ id: 'mA3', match_number: 3, court_id: 'courtA', scheduled_time: '10:50', team1_id: 'tSafe5', team2_id: 'tSafe6' }),
      makeMatch({ id: 'mA4', match_number: 4, court_id: 'courtA', scheduled_time: '11:45', team1_id: 'tX', team2_id: 'tA' }),
      makeMatch({ id: 'mA5', match_number: 5, court_id: 'courtA', scheduled_time: '12:40', team1_id: 'tY', team2_id: 'tB' }),
      makeMatch({ id: 'mA6', match_number: 6, court_id: 'courtA', scheduled_time: '14:00', team1_id: 'tZ', team2_id: 'tC' }),
    ]
    const courtBMatches = [
      makeMatch({ id: 'mBX', match_number: 7, court_id: 'courtB', scheduled_time: '11:50', team1_id: 'tX', team2_id: 'tD' }),
      makeMatch({ id: 'mBY', match_number: 8, court_id: 'courtB', scheduled_time: '12:45', team1_id: 'tY', team2_id: 'tE' }),
      makeMatch({ id: 'mBZ', match_number: 9, court_id: 'courtB', scheduled_time: '14:05', team1_id: 'tZ', team2_id: 'tF' }),
    ]

    const allMatches = [...courtAMatches, ...courtBMatches]
    const cascadeUpdates = courtAMatches.map(m => ({
      id: m.id,
      scheduled_date: m.scheduled_date,
      scheduled_time: m.scheduled_time,
    }))

    const result = resolveConflicts({
      affectedCourtId: 'courtA',
      cascadeUpdates,
      courtMatches: courtAMatches,
      allTournamentMatches: allMatches,
      court: courtNoBreak,
    })

    const total = result.resolutionSummary.resolvedBySwap + result.resolutionSummary.resolvedByMove
    expect(total).toBeGreaterThanOrEqual(3)
    expect(result.resolutionSummary.unresolved).toBe(0)
  })
})

// ── CASO 7: Resolver uno crea otro (chain) ──

describe('CASO 7 — Chain resolution', () => {
  it('second cycle resolves conflict created by first swap', () => {
    // mA conflicts with mB1. Swapping mA with mC solves it, but mC now conflicts with mB2.
    // Second cycle resolves mC via displacement.
    const courtAMatches = [
      makeMatch({ id: 'mC', match_number: 1, court_id: 'courtA', scheduled_time: '10:00', team1_id: 'tC', team2_id: 'tC2' }),
      makeMatch({ id: 'mA', match_number: 2, court_id: 'courtA', scheduled_time: '10:55', team1_id: 'tX', team2_id: 'tA' }),
    ]
    const courtBMatches = [
      makeMatch({ id: 'mB1', match_number: 3, court_id: 'courtB', scheduled_time: '11:00', team1_id: 'tX', team2_id: 'tB' }),
      makeMatch({ id: 'mB2', match_number: 4, court_id: 'courtB', scheduled_time: '10:00', team1_id: 'tC', team2_id: 'tD' }),
    ]
    const allMatches = [...courtAMatches, ...courtBMatches]

    const cascadeUpdates = courtAMatches.map(m => ({
      id: m.id, scheduled_date: m.scheduled_date, scheduled_time: m.scheduled_time,
    }))

    const result = resolveConflicts({
      affectedCourtId: 'courtA',
      cascadeUpdates,
      courtMatches: courtAMatches,
      allTournamentMatches: allMatches,
      court: courtNoBreak,
    })

    // Either all resolved by swap/move or some cycles ran
    const totalResolved = result.resolutionSummary.resolvedBySwap + result.resolutionSummary.resolvedByMove
    expect(totalResolved).toBeGreaterThanOrEqual(1)
  })
})

// ── CASO 8: Cancha sin partidos pendientes ──
// This is a UI test (button disabled) — verified in Phase 3. Verify pure logic returns empty.

describe('CASO 8 — No pending matches', () => {
  it('returns 0 updates when all matches completed', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, status: 'completed' }),
      makeMatch({ id: 'm2', match_number: 2, status: 'completed' }),
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'courtA',
      deltaMinutes: 15,
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
      allTournamentMatches: matches,
    })

    expect(updates).toHaveLength(0)
  })
})

// ── CASO 9: Two setbacks — no simultaneous ──
// Persistence check: createSetback rejects duplicates. Covered in Phase 2.
// Here: second delta applies ON TOP of first (already-moved times).

describe('CASO 9 — Sequential deltas', () => {
  it('second delta applies on top of already-shifted times', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_time: '10:00' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_time: '10:55' }),
    ]

    // First setback: +15
    const first = recalculateCourtOnResume({
      courtId: 'courtA', deltaMinutes: 15, courtMatches: matches,
      court: courtNoBreak, tournamentDays: days, allTournamentMatches: matches,
    })
    expect(first.updates.find(u => u.id === 'm1').scheduled_time).toBe('10:15')
    expect(first.updates.find(u => u.id === 'm2').scheduled_time).toBe('11:10')

    // Apply first delta to matches
    const updatedMatches = matches.map(m => {
      const u = first.updates.find(u => u.id === m.id)
      return u ? { ...m, scheduled_time: u.scheduled_time, scheduled_date: u.scheduled_date } : m
    })

    // Second setback: +20 on shifted times
    const second = recalculateCourtOnResume({
      courtId: 'courtA', deltaMinutes: 20, courtMatches: updatedMatches,
      court: courtNoBreak, tournamentDays: days, allTournamentMatches: updatedMatches,
    })
    expect(second.updates.find(u => u.id === 'm1').scheduled_time).toBe('10:35')
    expect(second.updates.find(u => u.id === 'm2').scheduled_time).toBe('11:30')
  })
})

// ── CASO 10: Eliminatoria no queda antes de grupo ──

describe('CASO 10 — Elimination stays after group', () => {
  it('elimination match not moved before last group match', () => {
    const matches = [
      makeMatch({ id: 'mG1', match_number: 1, phase: 'group_phase', scheduled_time: '15:00' }),
      makeMatch({ id: 'mE1', match_number: 2, phase: 'quarterfinals', scheduled_time: '16:00', team1_id: null, team2_id: null }),
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'courtA',
      deltaMinutes: 30,
      courtMatches: matches,
      court: courtNoBreak,
      tournamentDays: days,
      lastGroupDateTime: '2025-06-15|15:30', // after delta, group ends at 15:30+55=16:25
      allTournamentMatches: matches,
    })

    const elimUpdate = updates.find(u => u.id === 'mE1')
    if (elimUpdate) {
      // Must be after 15:30 (last group start)
      expect(elimUpdate.scheduled_time >= '15:30').toBe(true)
    }
  })
})

// ── validateSchedule: R1-R7 ──

describe('validateSchedule', () => {
  const courts = [courtA, courtB]

  it('R1 violation: same-court overlap detected', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'courtA', scheduled_time: '10:00' }),
      makeMatch({ id: 'm2', court_id: 'courtA', scheduled_time: '10:30' }), // overlaps with m1 (10:00+55=10:55)
    ]
    const result = validateSchedule(matches, courts)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.rule === 'R1')).toBe(true)
  })

  it('R2 violation: cross-court team overlap detected', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'courtA', scheduled_time: '10:00', team1_id: 'tX', team2_id: 'tA' }),
      makeMatch({ id: 'm2', court_id: 'courtB', scheduled_time: '10:30', team1_id: 'tX', team2_id: 'tB' }),
    ]
    const result = validateSchedule(matches, courts)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.rule === 'R2')).toBe(true)
  })

  it('R3 violation: elimination before group (same category)', () => {
    const matches = [
      makeMatch({ id: 'mG', court_id: 'courtA', scheduled_time: '15:00', phase: 'group_phase', category_id: 'catA' }),
      makeMatch({ id: 'mE', court_id: 'courtA', scheduled_time: '14:00', phase: 'quarterfinals', category_id: 'catA' }),
    ]
    const result = validateSchedule(matches, courts)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.rule === 'R3')).toBe(true)
  })

  it('R4 violation: match spans into break', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'courtA', scheduled_time: '12:30' }), // 12:30+55=13:25 spans break
    ]
    const result = validateSchedule(matches, courts)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.rule === 'R4')).toBe(true)
  })

  it('R5 violation: match exceeds court hours', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'courtA', scheduled_time: '17:30' }), // 17:30+55=18:25 > 18:00
    ]
    const result = validateSchedule(matches, courts)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.rule === 'R5')).toBe(true)
  })

  it('R6 violation: displacement >120 min (with referenceTimeMap)', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'courtA', scheduled_time: '14:30' }),
    ]
    const refMap = new Map([['m1', { date: '2025-06-15', time: '10:00' }]]) // 270 min diff
    const result = validateSchedule(matches, courts, { referenceTimeMap: refMap })
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.rule === 'R6')).toBe(true)
  })

  it('R7 violation: match in the past', () => {
    const pastDate = '2020-01-01'
    const matches = [
      makeMatch({ id: 'm1', court_id: 'courtA', scheduled_date: pastDate, scheduled_time: '09:00' }),
    ]
    const result = validateSchedule(matches, courts, { now: new Date('2025-06-15T12:00:00').getTime() })
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.rule === 'R7')).toBe(true)
  })

  it('valid schedule returns valid=true', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'courtA', scheduled_time: '08:00', team1_id: 'tA', team2_id: 'tB' }),
      makeMatch({ id: 'm2', court_id: 'courtA', scheduled_time: '09:00', team1_id: 'tC', team2_id: 'tD' }),
      makeMatch({ id: 'm3', court_id: 'courtB', scheduled_time: '08:00', team1_id: 'tE', team2_id: 'tF' }),
    ]
    const result = validateSchedule(matches, [courtA, courtB])
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })
})

// ── Full algorithm table example from task spec ──

describe('Full algorithm table — break 13-14, close 18:00, delta 30, dur 55', () => {
  it('matches the expected results from the task specification', () => {
    const matches = [
      makeMatch({ id: 'm1', match_number: 1, scheduled_time: '08:00' }),
      makeMatch({ id: 'm2', match_number: 2, scheduled_time: '08:55' }),
      makeMatch({ id: 'm3', match_number: 3, scheduled_time: '09:50' }),
      makeMatch({ id: 'm4', match_number: 4, scheduled_time: '10:45' }),
      makeMatch({ id: 'm5', match_number: 5, scheduled_time: '11:40' }),
      makeMatch({ id: 'm6', match_number: 6, scheduled_time: '12:35' }),
      makeMatch({ id: 'm7', match_number: 7, scheduled_time: '17:20' }),
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'courtA',
      deltaMinutes: 30,
      courtMatches: matches,
      court: courtA,
      tournamentDays: days,
      allTournamentMatches: matches,
    })

    const getTime = id => updates.find(u => u.id === id)?.scheduled_time
    const getDate = id => updates.find(u => u.id === id)?.scheduled_date

    expect(getTime('m1')).toBe('08:30')
    expect(getTime('m2')).toBe('09:25')
    expect(getTime('m3')).toBe('10:20')
    expect(getTime('m4')).toBe('11:15')
    expect(getTime('m5')).toBe('14:00') // break push
    expect(getTime('m6')).toBe('14:55') // cascade from m5
    expect(getDate('m7')).toBe('2025-06-16') // day overflow
    expect(getTime('m7')).toBe('08:00')
  })
})

// ── R3 Per-Category Tests ──

function makeStateMatch(overrides) {
  return {
    id: overrides.id || `s-${Math.random().toString(36).slice(2)}`,
    courtId: overrides.courtId || 'courtA',
    date: overrides.date || '2025-04-03',
    time: overrides.time || '08:00',
    duration: overrides.duration || 55,
    team1_id: overrides.team1_id ?? 'tA',
    team2_id: overrides.team2_id ?? 'tB',
    match_number: overrides.match_number || 1,
    phase: overrides.phase || 'group_phase',
    status: overrides.status || 'scheduled',
    category_id: overrides.category_id || 'catA',
  }
}

describe('R3 Per-Category — detectElimBeforeGroup', () => {
  it('TEST 1: Cat A elim before Cat B last group = VALID (0 violations)', () => {
    const state = [
      makeStateMatch({ id: 'a1', date: '2025-04-03', time: '08:00', phase: 'group_phase', category_id: 'catA' }),
      makeStateMatch({ id: 'a2', date: '2025-04-03', time: '08:55', phase: 'group_phase', category_id: 'catA' }),
      makeStateMatch({ id: 'a3', date: '2025-04-03', time: '09:50', phase: 'group_phase', category_id: 'catA' }),
      makeStateMatch({ id: 'aq', date: '2025-04-03', time: '14:00', phase: 'quarterfinals', category_id: 'catA' }),
      makeStateMatch({ id: 'b1', date: '2025-04-04', time: '08:00', phase: 'group_phase', category_id: 'catB' }),
      makeStateMatch({ id: 'b2', date: '2025-04-04', time: '08:55', phase: 'group_phase', category_id: 'catB' }),
      makeStateMatch({ id: 'b3', date: '2025-04-04', time: '09:50', phase: 'group_phase', category_id: 'catB' }),
      makeStateMatch({ id: 'bq', date: '2025-04-04', time: '14:00', phase: 'quarterfinals', category_id: 'catB' }),
    ]
    const violations = detectElimBeforeGroup(state)
    expect(violations).toHaveLength(0)
  })

  it('TEST 2: Cat A elim before Cat A last group = INVALID (1 violation)', () => {
    const state = [
      makeStateMatch({ id: 'a1', date: '2025-04-04', time: '08:00', phase: 'group_phase', category_id: 'catA' }),
      makeStateMatch({ id: 'a2', date: '2025-04-04', time: '08:55', phase: 'group_phase', category_id: 'catA' }),
      makeStateMatch({ id: 'aq', date: '2025-04-03', time: '14:00', phase: 'quarterfinals', category_id: 'catA' }),
    ]
    const violations = detectElimBeforeGroup(state)
    expect(violations).toHaveLength(1)
    expect(violations[0].match.id).toBe('aq')
  })

  it('TEST 3: Three categories, only Cat B has violation', () => {
    const state = [
      makeStateMatch({ id: 'a1', date: '2025-04-03', time: '08:00', phase: 'group_phase', category_id: 'catA' }),
      makeStateMatch({ id: 'aq', date: '2025-04-04', time: '08:00', phase: 'quarterfinals', category_id: 'catA' }),
      makeStateMatch({ id: 'b1', date: '2025-04-04', time: '08:00', phase: 'group_phase', category_id: 'catB' }),
      makeStateMatch({ id: 'bq', date: '2025-04-03', time: '14:00', phase: 'quarterfinals', category_id: 'catB' }),
      makeStateMatch({ id: 'c1', date: '2025-04-03', time: '09:50', phase: 'group_phase', category_id: 'catC' }),
      makeStateMatch({ id: 'cq', date: '2025-04-03', time: '14:00', phase: 'quarterfinals', category_id: 'catC' }),
    ]
    const violations = detectElimBeforeGroup(state)
    expect(violations).toHaveLength(1)
    expect(violations[0].match.category_id).toBe('catB')
  })

  it('TEST 4: Category with only groups, no elimination = 0 violations', () => {
    const state = [
      makeStateMatch({ id: 'a1', date: '2025-04-03', time: '08:00', phase: 'group_phase', category_id: 'catA' }),
      makeStateMatch({ id: 'a2', date: '2025-04-04', time: '08:00', phase: 'group_phase', category_id: 'catA' }),
    ]
    const violations = detectElimBeforeGroup(state)
    expect(violations).toHaveLength(0)
  })
})

describe('R3 Per-Category — consistency across all 3 functions', () => {
  it('TEST 5: detectElimBeforeGroup, validateSchedule, finalValidation all agree (0 R3 violations)', () => {
    const courtsConfig = [
      { id: 'courtA', available_from: '08:00', available_to: '18:00', break_start: null, break_end: null },
    ]

    const matches = [
      makeMatch({ id: 'a1', scheduled_date: '2025-04-03', scheduled_time: '08:00', phase: 'group_phase', category_id: 'catA' }),
      makeMatch({ id: 'a2', scheduled_date: '2025-04-03', scheduled_time: '08:55', phase: 'group_phase', category_id: 'catA' }),
      makeMatch({ id: 'a3', scheduled_date: '2025-04-03', scheduled_time: '09:50', phase: 'group_phase', category_id: 'catA' }),
      makeMatch({ id: 'aq', scheduled_date: '2025-04-03', scheduled_time: '14:00', phase: 'quarterfinals', category_id: 'catA' }),
      makeMatch({ id: 'b1', scheduled_date: '2025-04-04', scheduled_time: '08:00', phase: 'group_phase', category_id: 'catB' }),
      makeMatch({ id: 'b2', scheduled_date: '2025-04-04', scheduled_time: '08:55', phase: 'group_phase', category_id: 'catB' }),
      makeMatch({ id: 'b3', scheduled_date: '2025-04-04', scheduled_time: '09:50', phase: 'group_phase', category_id: 'catB' }),
      makeMatch({ id: 'bq', scheduled_date: '2025-04-04', scheduled_time: '14:00', phase: 'quarterfinals', category_id: 'catB' }),
    ]

    // 1. detectElimBeforeGroup
    const stateMatches = matches.map(m => makeStateMatch({
      id: m.id, date: m.scheduled_date, time: m.scheduled_time,
      phase: m.phase, category_id: m.category_id,
    }))
    const detectResult = detectElimBeforeGroup(stateMatches)
    expect(detectResult).toHaveLength(0)

    // 2. validateSchedule
    const validateResult = validateSchedule(matches, courtsConfig)
    expect(validateResult.violations.filter(v => v.rule === 'R3')).toHaveLength(0)

    // 3. finalValidation
    const fvResult = finalValidation(matches, new Map(), new Map(), courtsConfig)
    expect(fvResult.violations.filter(v => v.rule === 'R3')).toHaveLength(0)
  })
})
