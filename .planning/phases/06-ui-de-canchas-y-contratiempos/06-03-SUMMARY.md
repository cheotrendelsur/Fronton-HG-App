---
phase: 06-ui-de-canchas-y-contratiempos
plan: 03
subsystem: ui
tags: [react, setback, court-management, accordion, timer, pwa]

# Dependency graph
requires:
  - phase: 06-01
    provides: CourtCard base component with normal state
  - phase: 06-02
    provides: SetbackFormModal and setbackPersistence helpers

provides:
  - CourtCard with full paused state (live timer, resume button, notified count, modal wiring)
  - SetbackHistory collapsible accordion component with history entries

affects: [phase-07-cascade-recalculation-on-resume]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Live elapsed timer with setInterval + clearInterval cleanup in useEffect
    - Collapsible accordion with contentRef.scrollHeight for smooth animation
    - Notified player count computed from unique team IDs in pending matches

key-files:
  created:
    - src/components/TournamentActive/SetbackHistory.jsx
  modified:
    - src/components/TournamentActive/CourtCard.jsx

key-decisions:
  - "notifiedCount computed from unique team IDs * 2 (2 players per team), not affected_match_ids.length * 4 — more accurate since team count is exact"
  - "SetbackHistory loads history on mount (not on accordion open) to show count in header even when collapsed"

patterns-established:
  - "Timer pattern: useEffect with setInterval + cleanup, depends on [isPaused, activeSetback?.started_at]"
  - "Accordion pattern: contentRef + maxHeight/opacity transition, matching CategoryAccordion"

requirements-completed: [CANCH-03, CANCH-04]

# Metrics
duration: 2min
completed: 2026-04-03
---

# Phase 06 Plan 03: Paused Court State + SetbackHistory Accordion Summary

**CourtCard completed with live pause timer (mm:ss), resume button wired to resolveSetback, SetbackFormModal integration, and new SetbackHistory collapsible accordion with full history entries**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-03T01:27:18Z
- **Completed:** 2026-04-03T01:29:18Z
- **Tasks:** 2
- **Files modified:** 2 (1 modified, 1 created)

## Accomplishments
- CourtCard shows live elapsed timer (mm:ss, updating every second) when court is paused, with exact "Pausada desde: HH:MM" start time
- Resume button ("Reanudar cancha") calls resolveSetback and triggers onDataRefresh; shows loading state "Reanudando..."
- "Declarar contratiempo" button now opens SetbackFormModal (replaces Plan 01 no-op placeholder)
- Notified players count computed from unique pending match team IDs * 2
- SetbackHistory accordion shows count in collapsed header, expands to show full history with type/description/times/duration/status badges

## Task Commits

1. **Task 1: Enhance CourtCard with paused state, live timer, resume button, SetbackFormModal** - `0d3fa7d` (feat)
2. **Task 2: Create SetbackHistory collapsible accordion component** - `5ae932f` (feat)

## Files Created/Modified
- `src/components/TournamentActive/CourtCard.jsx` - Enhanced with full paused state UI, live timer, resume/declare buttons, notified count, SetbackHistory and SetbackFormModal integration
- `src/components/TournamentActive/SetbackHistory.jsx` - New collapsible accordion component for court setback history

## Decisions Made
- notifiedCount computed as `uniqueTeamIds.size * 2` (more accurate than `affected_match_ids.length * 4` — team count is exact from pending match data)
- SetbackHistory loads on mount rather than on accordion open so count in header is accurate before expanding

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Wave 1 files (CourtCard, SetbackFormModal, CanchasView, etc.) were not yet in the worktree branch at execution start. Resolved by merging `main` into the worktree branch before proceeding — this was expected behavior for a Wave 2 plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Court paused state display is complete — Phase 07 (cascade recalculation on resume) can now wire into the "Reanudar cancha" button to apply schedule recalculation after resolveSetback succeeds
- SetbackHistory will automatically show resolved setback entries after resume
- All existing scoring, classification, and bracket flows remain unaffected

---
*Phase: 06-ui-de-canchas-y-contratiempos*
*Completed: 2026-04-03*
