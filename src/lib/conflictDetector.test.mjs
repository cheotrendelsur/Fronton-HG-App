// conflictDetector.test.mjs
// Unit tests for cross-court team scheduling conflict detection

import { describe, it, expect } from 'vitest'
import { detectTeamConflicts } from './conflictDetector.js'

// Helper to make test matches
function makeMatch(overrides) {
  return {
    id: overrides.id || `match-${Math.random().toString(36).slice(2)}`,
    team1_id: 'team-a',
    team2_id: 'team-b',
    court_id: 'court-1',
    scheduled_date: '2025-06-15',
    scheduled_time: '10:00',
    estimated_duration_minutes: 60,
    status: 'scheduled',
    ...overrides,
  }
}

describe('detectTeamConflicts', () => {
  it('overlapping matches on different courts for same team returns one conflict', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-b' }),
      makeMatch({ id: 'm2', court_id: 'court-2', scheduled_time: '10:30', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-c' }),
    ]
    const conflicts = detectTeamConflicts(matches)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].teamId).toBe('team-a')
  })

  it('non-overlapping matches on different courts returns zero conflicts', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-b' }),
      makeMatch({ id: 'm2', court_id: 'court-2', scheduled_time: '11:30', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-c' }),
    ]
    const conflicts = detectTeamConflicts(matches)
    expect(conflicts).toHaveLength(0)
  })

  it('same court matches are not conflicts (sequential, not overlapping)', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-b' }),
      makeMatch({ id: 'm2', court_id: 'court-1', scheduled_time: '11:00', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-c' }),
    ]
    const conflicts = detectTeamConflicts(matches)
    expect(conflicts).toHaveLength(0)
  })

  it('completed matches are excluded from conflict detection', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', estimated_duration_minutes: 60, status: 'completed', team1_id: 'team-a', team2_id: 'team-b' }),
      makeMatch({ id: 'm2', court_id: 'court-2', scheduled_time: '10:30', estimated_duration_minutes: 60, status: 'scheduled', team1_id: 'team-a', team2_id: 'team-c' }),
    ]
    const conflicts = detectTeamConflicts(matches)
    expect(conflicts).toHaveLength(0)
  })

  it('null team_ids are excluded from detection', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', team1_id: null, team2_id: null }),
      makeMatch({ id: 'm2', court_id: 'court-2', scheduled_time: '10:30', team1_id: null, team2_id: null }),
    ]
    const conflicts = detectTeamConflicts(matches)
    expect(conflicts).toHaveLength(0)
  })

  it('team as team1 in one match and team2 in another is correctly detected', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-b' }),
      makeMatch({ id: 'm2', court_id: 'court-2', scheduled_time: '10:30', estimated_duration_minutes: 60, team1_id: 'team-c', team2_id: 'team-a' }),
    ]
    const conflicts = detectTeamConflicts(matches)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].teamId).toBe('team-a')
  })

  it('multiple teams with conflicts are all returned', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-b' }),
      makeMatch({ id: 'm2', court_id: 'court-2', scheduled_time: '10:30', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-b' }),
    ]
    // Both team-a and team-b have overlapping matches on different courts
    const conflicts = detectTeamConflicts(matches)
    expect(conflicts).toHaveLength(2)
    const teamIds = conflicts.map(c => c.teamId).sort()
    expect(teamIds).toEqual(['team-a', 'team-b'])
  })

  it('conflict includes courtName from courtNames map', () => {
    const matches = [
      makeMatch({ id: 'm1', court_id: 'court-1', scheduled_time: '10:00', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-b' }),
      makeMatch({ id: 'm2', court_id: 'court-2', scheduled_time: '10:30', estimated_duration_minutes: 60, team1_id: 'team-a', team2_id: 'team-c' }),
    ]
    const courtNames = { 'court-1': 'Cancha 1', 'court-2': 'Cancha 2' }
    const conflicts = detectTeamConflicts(matches, courtNames)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].match1.courtName).toBe('Cancha 1')
    expect(conflicts[0].match2.courtName).toBe('Cancha 2')
  })
})
