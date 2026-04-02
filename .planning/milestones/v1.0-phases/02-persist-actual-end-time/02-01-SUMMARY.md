---
phase: 02-persist-actual-end-time
plan: 01
subsystem: database
tags: [supabase, postgres, tournament-matches, scoreboard, persistence]

# Dependency graph
requires:
  - phase: 01-score-input-modal-end-time
    provides: handleSaveResult with endTime param; ScoreInputModal passes endTime on save
provides:
  - tournament_matches.actual_end_time nullable timestamptz column (via migration)
  - saveMatchResult accepts actualEndTime param and persists it via post-RPC UPDATE
  - Both group and elimination save paths store actual end time to DB
affects:
  - 03-cascade-recalculation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Post-RPC UPDATE pattern: non-critical fields persisted after atomic RPC, silently ignore failure"
    - "actualEndTime null-guarded: only persisted if both date and time present"

key-files:
  created:
    - supabase/migrations/add_actual_end_time_to_matches.sql
  modified:
    - src/lib/scorePersistence.js
    - src/components/Scoreboard/ScoreboardPage.jsx

key-decisions:
  - "Post-RPC UPDATE for actual_end_time: score already persisted by atomic RPC; end-time failure is non-critical and silently ignored"
  - "actualEndTime constructed as ISO string YYYY-MM-DDTHH:MM:00 from endTime.date + endTime.time with null guard"
  - "Elimination UPDATE includes actual_end_time directly in the existing direct UPDATE object (single DB round-trip)"

patterns-established:
  - "Non-critical field UPDATE after atomic RPC: await silently, do not affect return value"

requirements-completed:
  - PERS-01
  - PERS-02
  - PERS-03

# Metrics
duration: 8min
completed: 2026-04-02
---

# Phase 02 Plan 01: Persist Actual End Time Summary

**actual_end_time timestamptz column added to tournament_matches, wired through both group RPC and elimination direct UPDATE save paths**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-02T00:00:00Z
- **Completed:** 2026-04-02T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `add_actual_end_time_to_matches.sql` migration with IF NOT EXISTS guard — safe to re-run
- Extended `saveMatchResult` with optional 8th param `actualEndTime = null`; post-RPC UPDATE persists value non-critically
- ScoreboardPage builds `actualEndTime` from `endTime.date + endTime.time`, passes to group path (saveMatchResult) and inlines into elimination UPDATE object
- Removed the `eslint-disable-next-line no-unused-vars` placeholder from `handleSaveResult`

## Task Commits

1. **Task 1: Add actual_end_time migration** - `6bef448` (chore)
2. **Task 2: Wire actual_end_time through both JS save paths** - `18af71a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `supabase/migrations/add_actual_end_time_to_matches.sql` - ALTER TABLE adds nullable actual_end_time timestamptz
- `src/lib/scorePersistence.js` - saveMatchResult 8th param + post-RPC UPDATE block
- `src/components/Scoreboard/ScoreboardPage.jsx` - actualEndTime construction + pass to both save paths

## Decisions Made
- Post-RPC UPDATE is intentionally non-critical: the atomic RPC already persisted score and group stats; losing the end-time timestamp is acceptable without surfacing an error to the user
- ISO timestamp format `YYYY-MM-DDTHH:MM:00` (with seconds=00) chosen for compatibility with timestamptz parsing in PostgreSQL
- Single DB round-trip for elimination path: `actual_end_time` added directly to the existing `.update({...})` object rather than a separate call

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
The migration `add_actual_end_time_to_matches.sql` must be applied to the Supabase project via the Supabase SQL Editor or CLI before Phase 3 cascade recalculation can read `actual_end_time` values.

## Next Phase Readiness
- `actual_end_time` is now stored for every match result going forward
- Phase 3 (cascade recalculation) can query `actual_end_time` on the completed match to determine the actual finish time and cascade pending matches on the same court

---
*Phase: 02-persist-actual-end-time*
*Completed: 2026-04-02*

## Self-Check: PASSED
- FOUND: supabase/migrations/add_actual_end_time_to_matches.sql
- FOUND: src/lib/scorePersistence.js
- FOUND: src/components/Scoreboard/ScoreboardPage.jsx
- FOUND: .planning/phases/02-persist-actual-end-time/02-01-SUMMARY.md
- FOUND: commit 6bef448
- FOUND: commit 18af71a
