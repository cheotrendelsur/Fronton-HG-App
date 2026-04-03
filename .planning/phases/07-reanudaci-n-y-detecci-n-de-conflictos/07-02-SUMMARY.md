---
phase: 07-reanudaci-n-y-detecci-n-de-conflictos
plan: 02
subsystem: conflict-detection
tags: [pure-logic, tdd, scheduling, conflict-detection]
dependency_graph:
  requires: []
  provides: [detectTeamConflicts]
  affects: [tournament-scheduling-ui]
tech_stack:
  added: []
  patterns: [pure-function, time-range-overlap, team-match-map]
key_files:
  created:
    - src/lib/conflictDetector.js
    - src/lib/conflictDetector.test.mjs
  modified: []
decisions:
  - "Deduplication key includes teamId so same match pair reports conflict for each team involved"
  - "parseTime reimplemented locally following cascadeRecalculator.js pattern"
  - "courtNames fallback to courtId when name not provided"
metrics:
  duration_minutes: 2
  completed: "2026-04-03T02:33:00Z"
---

# Phase 07 Plan 02: Conflict Detection Module Summary

Pure-logic cross-court team conflict detector using time-range overlap analysis with team-to-match mapping

## What Was Done

### Task 1: Create conflictDetector.js with detectTeamConflicts (TDD)

**RED:** Created `src/lib/conflictDetector.test.mjs` with 8 test cases covering:
- Overlapping matches on different courts (positive case)
- Non-overlapping matches (negative case)
- Same court matches excluded (sequential, not conflicting)
- Completed matches excluded
- Null team_ids excluded
- Cross team1/team2 detection
- Multiple teams with simultaneous conflicts
- Court name mapping from courtNames parameter

**GREEN:** Implemented `src/lib/conflictDetector.js` as a pure function module:
- `parseTime(timeStr)` helper converts "HH:MM" to minutes
- `detectTeamConflicts(matches, courtNames)` scans all non-completed matches
- Builds team-to-matches map (handling both team1_id and team2_id)
- Checks all pairs per team: same date, different court, time range overlap
- Returns structured conflicts with teamId, teamName, match1/match2 details

**Commits:**
| Commit | Description |
|--------|-------------|
| `9e5e7be` | test(07-02): add failing tests for detectTeamConflicts |
| `f6a29eb` | feat(07-02): implement detectTeamConflicts conflict detection module |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Deduplication key was too aggressive**
- **Found during:** Task 1 GREEN phase
- **Issue:** Dedup key `matchA-matchB` prevented reporting the same match pair as conflict for different teams (e.g., team-a and team-b both conflicting on m1 vs m2)
- **Fix:** Changed dedup key to include teamId: `teamId:matchA-matchB`
- **Files modified:** src/lib/conflictDetector.js
- **Commit:** f6a29eb

## Verification

- `npx vitest run src/lib/conflictDetector.test.mjs` -- 8/8 tests pass
- `grep -n "detectTeamConflicts" src/lib/conflictDetector.js` -- exported function confirmed
- `grep -n "startA < endB && startB < endA" src/lib/conflictDetector.js` -- overlap check confirmed

## Known Stubs

None -- module is complete with full implementation and no placeholder logic.
