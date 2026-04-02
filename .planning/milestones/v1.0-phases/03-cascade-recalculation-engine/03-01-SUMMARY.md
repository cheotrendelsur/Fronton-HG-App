---
phase: 03-cascade-recalculation-engine
plan: 01
subsystem: scheduling
tags: [cascade, scheduling, pure-logic, supabase, tournament-matches, courts]

requires:
  - phase: 02-persist-actual-end-time
    provides: actual_end_time column in tournament_matches, populated by ScoreInputModal flow

provides:
  - cascadeRecalculator.js: pure logic engine for court cascade recalculation
  - cascadeSchedulePersistence.js: DB query + cascade call + batch UPDATE persistence layer

affects:
  - phase 04 (wire-up): needs to call applyCascadeRecalculation after save_match_result RPC and elimination UPDATE

tech-stack:
  added: []
  patterns:
    - "Pure logic module pattern: no React/Supabase imports, only JS primitives + exported functions"
    - "TDD red-green cycle: failing tests first, minimal implementation to pass, 12/12 tests"
    - "ISO-01/ISO-02 constraints enforced: only affected court queried, only date+time fields updated"
    - "Triggering match identification: latest completed match on anchorDate with scheduled_time <= anchorTime"
    - "Cursor-based cascade: processes all matches (completed + pending) in queue order, advancing time"

key-files:
  created:
    - src/lib/cascadeRecalculator.js
    - src/lib/cascadeRecalculator.test.mjs
    - src/lib/cascadeSchedulePersistence.js
  modified: []

key-decisions:
  - "Cascade recalculation client-side (not RPC): plain JS engine called from React, DB updates via individual UPDATEs"
  - "Day overflow uses next tournament day (not next calendar day): tournamentDays array passed to engine"
  - "Cursor advances through completed matches too: they occupy time slots even if we don't update them"
  - "Triggering match identified by: completed match on anchorDate with latest scheduled_time <= anchorTimeStr"
  - "Affected matches include all queue entries after triggering match (completed + pending), so breaks/overflow cascade correctly"

patterns-established:
  - "Pure logic engine: cascadeRecalculator.js has zero external dependencies — only parseTime/minutesToTime helpers"
  - "Persistence layer wraps engine: cascadeSchedulePersistence.js handles all DB I/O; engine stays pure"
  - "Return shape {id, scheduled_date, scheduled_time} only — caller never mutates other fields"

requirements-completed: [SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, SCHED-09, SCHED-10, ISO-01, ISO-02]

duration: 8min
completed: 2026-04-02
---

# Phase 03 Plan 01: Cascade Recalculation Engine Summary

**Pure cascade recalculation engine (cascadeRecalculator.js) + DB persistence layer (cascadeSchedulePersistence.js) that shifts pending match times forward/backward from a completed match's actual end time, respecting court breaks and day overflow**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-02T16:55:09Z
- **Completed:** 2026-04-02T17:02:55Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments

- Pure cascade engine `recalculateCourt()` handles basic cascade, break window push, day overflow, multi-day cascade, completed match cursor advancement, and court isolation
- 12 unit tests covering all specified behaviors — all passing (exit code 0)
- Persistence layer `applyCascadeRecalculation()` fetches court+matches+tournament, calls engine, batch-updates DB
- Build passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cascadeRecalculator.js — pure logic cascade engine with tests** - `8184ab9` (feat + test, TDD)
2. **Task 2: Create cascadeSchedulePersistence.js — DB query + cascade + batch UPDATE** - `5bef4cd` (feat)

**Plan metadata:** (docs commit below)

_Note: Task 1 is TDD: tests were written first (RED — failed because module didn't exist), then implementation (GREEN — all 12 pass)_

## Files Created/Modified

- `src/lib/cascadeRecalculator.js` — Pure logic engine: `recalculateCourt()` + `parseTime()` + `minutesToTime()`. No React, no Supabase.
- `src/lib/cascadeRecalculator.test.mjs` — 12 unit tests covering: basic cascade, completed skip, break window, day overflow, day overflow + break, multi-day cascade, court isolation, field preservation, match order, no pending matches, pending status, no-change case.
- `src/lib/cascadeSchedulePersistence.js` — DB persistence: `applyCascadeRecalculation()`. Queries completed match → court → all court matches → tournament days → calls engine → batch UPDATE.

## Decisions Made

- **Cascade recalculation on client (not RPC):** The engine is pure JS and called from React. DB updates via individual Supabase `.update()` calls per match. No new RPC function needed — keeps logic in the app layer where it's easier to evolve.
- **Day overflow to next tournament day:** `tournamentDays` array is generated from `start_date` to `end_date` inclusive. Matches never overflow to calendar days outside the tournament window.
- **Cursor advances through completed matches:** Processing all matches after the trigger (completed + pending) ensures completed matches still "occupy" their scheduled time slots, so pending matches are placed correctly after them.
- **Triggering match detection:** The triggering match is identified as the completed match on `anchorDate` with the latest `scheduled_time <= anchorTimeStr`. This correctly handles "same scheduled_time, different match_number" scenarios (test 6).
- **Affected match range:** All matches (completed + pending) that sort after the triggering match by `(scheduled_date, scheduled_time, match_number)`. This includes matches on later days automatically.

## Deviations from Plan

### Algorithm refinement during TDD

**[Rule 1 - Bug] Cascade trigger detection required iterative refinement during TDD**
- **Found during:** Task 1 (TDD GREEN phase, tests 2 and 6 failing)
- **Issue:** Initial filter using `scheduled_time >= anchorTimeStr` missed: (a) completed matches between anchor and pending that occupy time slots, (b) pending matches with same scheduled_time as triggering match but higher match_number (test 6 tight court scenario)
- **Fix:** Identified triggering match as latest completed on anchorDate with `scheduled_time <= anchorTimeStr`. Process all matches after trigger (not just pending) so completed ones advance the cursor. Used `(scheduled_date, scheduled_time, match_number)` ordering for correct multi-match-per-slot handling.
- **Files modified:** src/lib/cascadeRecalculator.js
- **Verification:** All 12 unit tests pass
- **Committed in:** 8184ab9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — algorithm correctness)
**Impact on plan:** The algorithm refinement was necessary to correctly handle edge cases defined by the test specification. No scope creep.

## Issues Encountered

- Test 6 (multi-day cascade, tight court) required careful analysis of what "triggering match" means when two matches share the same `scheduled_time`. Resolved by using `(time, match_number)` ordering.

## Known Stubs

None — this plan creates pure logic + DB layer with no UI stubs or placeholder data.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `cascadeRecalculator.js` and `cascadeSchedulePersistence.js` are ready for Phase 04 to wire into save flows
- Phase 04 needs to call `applyCascadeRecalculation(supabase, tournamentId, matchId)` after:
  1. Group phase: after `save_match_result` RPC returns success
  2. Elimination phase: after direct UPDATE of `tournament_matches` returns success
- The updated schedule will be visible automatically when ScoreboardPage calls `loadData()` after save

---
*Phase: 03-cascade-recalculation-engine*
*Completed: 2026-04-02*
