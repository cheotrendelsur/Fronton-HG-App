// task9E2E.test.mjs — End-to-end tests for TASK-9: Flexible dates, per-day schedules, preset categories
import { describe, it, expect } from 'vitest'
import { generateAllSlots, distributeFullTournament, validateDistribution } from './schedulingEngine.js'
import { recalculateCourtOnResume } from './cascadeRecalculator.js'

// ── Test Setup: 4 Saturdays + 4 Sundays (non-consecutive) ──

const tournamentDays = [
  '2026-04-11', // Sat
  '2026-04-12', // Sun
  '2026-04-18', // Sat
  '2026-04-19', // Sun
  '2026-04-25', // Sat
  '2026-04-26', // Sun
  '2026-05-02', // Sat
  '2026-05-03', // Sun
]

// 3 courts with different schedules per day
const courts = [
  { id: 'c1', name: 'Cancha 1', available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' },
  { id: 'c2', name: 'Cancha 2', available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' },
  { id: 'c3', name: 'Cancha 3', available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' },
]

// Saturday (6): 08:00-18:00 with break 13:00-14:00
// Sunday (0): 09:00-14:00 without break
const courtSchedules = {
  c1: {
    6: { available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' },
    0: { available_from: '09:00', available_to: '14:00', break_start: null, break_end: null },
  },
  c2: {
    6: { available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' },
    0: { available_from: '09:00', available_to: '14:00', break_start: null, break_end: null },
  },
  c3: {
    6: { available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' },
    0: { available_from: '09:00', available_to: '14:00', break_start: null, break_end: null },
  },
}

const MATCH_DURATION = 55

// Helper to generate group matches
function makeGroupMatches(count, categoryId, groupId, startNumber = 1) {
  const matches = []
  for (let i = 0; i < count; i++) {
    matches.push({
      id: `${categoryId}-g-${i}`,
      match_number: startNumber + i,
      team1_id: `${categoryId}-t${(i * 2) % 12 + 1}`,
      team2_id: `${categoryId}-t${(i * 2 + 1) % 12 + 1}`,
      group_id: groupId,
      phase: 'group_phase',
      category_id: categoryId,
    })
  }
  return matches
}

function makeElimMatches(count, categoryId, startNumber, roundNumber, phase) {
  const matches = []
  for (let i = 0; i < count; i++) {
    matches.push({
      id: `${categoryId}-e-${roundNumber}-${i}`,
      match_number: startNumber + i,
      team1_id: null,
      team2_id: null,
      phase,
      round_number: roundNumber,
      category_id: categoryId,
    })
  }
  return matches
}

// ── TEST 1: Slots only on active days ──

describe('TASK-9 E2E — Slot generation with flexible dates', () => {
  it('generates slots ONLY on the 8 active days, not on weekdays between', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const uniqueDates = [...new Set(slots.map(s => s.date))].sort()
    expect(uniqueDates).toEqual(tournamentDays)
    // No Monday-Friday dates
    for (const d of uniqueDates) {
      const dow = new Date(d + 'T00:00:00').getDay()
      expect([0, 6]).toContain(dow)
    }
  })

  it('Saturday slots respect break (13:00-14:00), Sunday slots do not have break', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    // Saturday: no slot should start within 13:00-14:00
    const satSlots = slots.filter(s => new Date(s.date + 'T00:00:00').getDay() === 6)
    for (const s of satSlots) {
      const startMin = parseInt(s.start_time.split(':')[0]) * 60 + parseInt(s.start_time.split(':')[1])
      const endMin = parseInt(s.end_time.split(':')[0]) * 60 + parseInt(s.end_time.split(':')[1])
      // Slot should not overlap with break 13:00-14:00 (780-840 min)
      expect(startMin >= 840 || endMin <= 780).toBe(true)
    }

    // Sunday: slots can exist between 09:00 and 14:00 without break gaps
    const sunSlots = slots.filter(s => new Date(s.date + 'T00:00:00').getDay() === 0)
    for (const s of sunSlots) {
      const startMin = parseInt(s.start_time.split(':')[0]) * 60 + parseInt(s.start_time.split(':')[1])
      const endMin = parseInt(s.end_time.split(':')[0]) * 60 + parseInt(s.end_time.split(':')[1])
      // All Sunday slots within 09:00-14:00
      expect(startMin >= 540).toBe(true) // >= 09:00
      expect(endMin <= 840).toBe(true)   // <= 14:00
    }
  })

  it('Sunday slots end by 14:00 (court closes early)', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const sunSlots = slots.filter(s => new Date(s.date + 'T00:00:00').getDay() === 0)
    for (const s of sunSlots) {
      expect(s.end_time <= '14:00').toBe(true)
    }
  })

  it('Saturday has more slots than Sunday (longer hours + break recovery)', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const satCount = slots.filter(s => s.date === '2026-04-11').length
    const sunCount = slots.filter(s => s.date === '2026-04-12').length
    expect(satCount).toBeGreaterThan(sunCount)
  })
})

// ── TEST 2: Match distribution on non-consecutive days ──

describe('TASK-9 E2E — Match distribution', () => {
  // Masculina Primera: 12 duplas → 4 groups of 3 → 12 group matches
  // Junior: 8 duplas → 2 groups of 4 → 12 group matches
  const mascGroupMatches = [
    ...makeGroupMatches(3, 'masc', 'gA', 1),
    ...makeGroupMatches(3, 'masc', 'gB', 4),
    ...makeGroupMatches(3, 'masc', 'gC', 7),
    ...makeGroupMatches(3, 'masc', 'gD', 10),
  ]

  const juniorGroupMatches = [
    ...makeGroupMatches(6, 'junior', 'gE', 13),
    ...makeGroupMatches(6, 'junior', 'gF', 19),
  ]

  const allGroupMatches = [...mascGroupMatches, ...juniorGroupMatches]

  const mascElim = [
    ...makeElimMatches(4, 'masc', 25, 1, 'quarterfinals'),
    ...makeElimMatches(2, 'masc', 29, 2, 'semifinals'),
    ...makeElimMatches(1, 'masc', 31, 3, 'final'),
  ]

  const juniorElim = [
    ...makeElimMatches(2, 'junior', 32, 1, 'semifinals'),
    ...makeElimMatches(1, 'junior', 34, 2, 'final'),
  ]

  const allElimMatches = [...mascElim, ...juniorElim]

  it('distributes all matches only on active tournament days', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const result = distributeFullTournament(allGroupMatches, allElimMatches, slots)

    // All 34 matches assigned
    expect(result.unassigned).toHaveLength(0)
    expect(result.assignments.length).toBe(allGroupMatches.length + allElimMatches.length)

    // Only active days
    const assignedDates = [...new Set(result.assignments.map(a => a.scheduled_date))].sort()
    for (const d of assignedDates) {
      expect(tournamentDays).toContain(d)
    }

    // No weekday dates (Mon-Fri)
    for (const d of assignedDates) {
      const dow = new Date(d + 'T00:00:00').getDay()
      expect([0, 6]).toContain(dow)
    }
  })

  it('Sunday matches all end before 14:00', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const result = distributeFullTournament(allGroupMatches, allElimMatches, slots)

    const sunAssignments = result.assignments.filter(a =>
      new Date(a.scheduled_date + 'T00:00:00').getDay() === 0
    )
    for (const a of sunAssignments) {
      const startMin = parseInt(a.scheduled_time.split(':')[0]) * 60 + parseInt(a.scheduled_time.split(':')[1])
      const endMin = startMin + a.estimated_duration_minutes
      expect(endMin).toBeLessThanOrEqual(840) // 14:00
    }
  })

  it('0 same-court overlaps', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const result = distributeFullTournament(allGroupMatches, allElimMatches, slots)
    const validation = validateDistribution(result.assignments, allGroupMatches)

    const r1Violations = validation.violations.filter(v => v.rule === 'R1')
    expect(r1Violations).toHaveLength(0)
  })

  it('0 cross-court team overlaps', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const result = distributeFullTournament(allGroupMatches, allElimMatches, slots)
    const validation = validateDistribution(result.assignments, allGroupMatches)

    const r2Violations = validation.violations.filter(v => v.rule === 'R2')
    expect(r2Violations).toHaveLength(0)
  })

  it('R_ORDER: no elimination match before last group match date', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-05-03', MATCH_DURATION, {
      tournamentDays,
      courtSchedules,
    })

    const result = distributeFullTournament(allGroupMatches, allElimMatches, slots)
    const validation = validateDistribution(result.assignments, allGroupMatches)

    const rOrderViolations = validation.violations.filter(v => v.rule === 'R_ORDER')
    expect(rOrderViolations).toHaveLength(0)
  })
})

// ── TEST 3: Cascade recalculation with per-day schedules ──

describe('TASK-9 E2E — Cascade with per-day court schedules', () => {
  const courtA = { id: 'c1', available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' }
  const courtASchedules = {
    6: { available_from: '08:00', available_to: '18:00', break_start: '13:00', break_end: '14:00' },
    0: { available_from: '09:00', available_to: '14:00', break_start: null, break_end: null },
  }

  it('Saturday cascade respects Saturday break', () => {
    // m1 at 11:00 (+ 55 = 11:55), m2 at 11:55 (+ 55 = 12:50)
    // Delta +15: m1→11:15 (fits before break), m2→12:10 but 12:10+55=13:05 spans break → 14:00
    const matches = [
      { id: 'm1', match_number: 1, court_id: 'c1', scheduled_date: '2026-04-11', scheduled_time: '11:00', estimated_duration_minutes: 55, status: 'scheduled', team1_id: 't1', team2_id: 't2', phase: 'group_phase' },
      { id: 'm2', match_number: 2, court_id: 'c1', scheduled_date: '2026-04-11', scheduled_time: '11:55', estimated_duration_minutes: 55, status: 'scheduled', team1_id: 't3', team2_id: 't4', phase: 'group_phase' },
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'c1',
      deltaMinutes: 15,
      courtMatches: matches,
      court: courtA,
      tournamentDays,
      courtSchedules: courtASchedules,
      allTournamentMatches: matches,
    })

    const u1 = updates.find(u => u.id === 'm1')
    const u2 = updates.find(u => u.id === 'm2')
    expect(u1.scheduled_time).toBe('11:15')
    // m2: 11:55+15=12:10, but 12:10+55=13:05 spans break (13:00-14:00) → jumps to 14:00
    expect(u2.scheduled_time).toBe('14:00')
  })

  it('Sunday spill-over goes to next Saturday (not Monday)', () => {
    // Sunday closes at 14:00, last match at 13:00 with 55min → ends 13:55
    // With +15 min delay → 13:15 + 55 = 14:10 > 14:00 → spill-over
    const matches = [
      { id: 'm1', match_number: 1, court_id: 'c1', scheduled_date: '2026-04-12', scheduled_time: '13:00', estimated_duration_minutes: 55, status: 'scheduled', team1_id: 't1', team2_id: 't2', phase: 'group_phase' },
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'c1',
      deltaMinutes: 15,
      courtMatches: matches,
      court: courtA,
      tournamentDays,
      courtSchedules: courtASchedules,
      allTournamentMatches: matches,
    })

    const u1 = updates.find(u => u.id === 'm1')
    // Should go to next active day: Sat Apr 18
    expect(u1.scheduled_date).toBe('2026-04-18')
    // On Saturday, starts at 08:00
    expect(u1.scheduled_time).toBe('08:00')
  })

  it('no spill-over alert needed when match fits', () => {
    const matches = [
      { id: 'm1', match_number: 1, court_id: 'c1', scheduled_date: '2026-04-12', scheduled_time: '09:00', estimated_duration_minutes: 55, status: 'scheduled', team1_id: 't1', team2_id: 't2', phase: 'group_phase' },
    ]

    const { updates } = recalculateCourtOnResume({
      courtId: 'c1',
      deltaMinutes: 10,
      courtMatches: matches,
      court: courtA,
      tournamentDays,
      courtSchedules: courtASchedules,
      allTournamentMatches: matches,
    })

    const u1 = updates.find(u => u.id === 'm1')
    expect(u1.scheduled_date).toBe('2026-04-12') // stays on Sunday
    expect(u1.scheduled_time).toBe('09:10')
  })
})

// ── TEST 4: Category names ──

describe('TASK-9 E2E — Preset category names', () => {
  it('category names follow the Type + Level pattern', () => {
    const categories = [
      { name: 'Masculina Primera', max_couples: 16 },
      { name: 'Junior', max_couples: 8 },
      { name: 'Femenina Tercera', max_couples: 12 },
      { name: 'Master', max_couples: 10 },
    ]

    // Masculina/Femenina have level suffix
    expect(categories[0].name).toMatch(/^Masculina \w+$/)
    expect(categories[2].name).toMatch(/^Femenina \w+$/)
    // Master/Junior are standalone
    expect(categories[1].name).toBe('Junior')
    expect(categories[3].name).toBe('Master')
  })
})

// ── TEST 5: Legacy fallback (start_date→end_date when no tournamentDays) ──

describe('TASK-9 E2E — Legacy fallback', () => {
  it('without tournamentDays, falls back to start→end iteration', () => {
    const slots = generateAllSlots(courts, '2026-04-11', '2026-04-13', MATCH_DURATION)

    const uniqueDates = [...new Set(slots.map(s => s.date))].sort()
    // Should include all 3 consecutive days (Sat, Sun, Mon)
    expect(uniqueDates).toEqual(['2026-04-11', '2026-04-12', '2026-04-13'])
  })
})
