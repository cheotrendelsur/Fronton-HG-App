# TASK-6: Reajuste Dinamico del Cronograma en Tiempo Real

## What This Is

A real-time schedule adjustment system for the RacketTourneys PWA that automatically recalculates remaining match times on a court whenever the organizer records a match result. When a match finishes earlier or later than expected, all subsequent pending matches on that court cascade their times forward or backward accordingly, respecting court availability windows and breaks.

## Core Value

When a match finishes, every pending match on that court instantly shows its corrected start time — players always know when they actually play.

## Requirements

### Validated

- End-time input fields (date + time) pre-filled with current date/time appear in ScoreInputModal — Validated in Phase 1
- End-time inputs are editable so organizer can adjust if not recording in real time — Validated in Phase 1

- Actual end time is persisted to the database when saving a match result — Validated in Phase 2

- Pure cascade recalculation engine recalculates pending matches on a court after a match ends — Validated in Phase 3
- Cascade handles break windows, day overflow to next tournament day, multi-day cascading — Validated in Phase 3
- Only scheduled_date and scheduled_time change; all other fields preserved — Validated in Phase 3
- Completed matches immune to recalculation; court isolation enforced — Validated in Phase 3
- DB persistence layer queries tournament data and batch-updates only time fields — Validated in Phase 3

- Updated schedule is immediately visible in the scoreboard page after adjustment — Validated in Phase 4
- After saving a result, cascade is automatically triggered (wired into save flow) — Validated in Phase 4
- A player viewing the active tournament page sees corrected match times on refresh — Validated in Phase 4
- All existing flows (creation, edit, inscription, scoring, classification, bracket) unbroken — Validated in Phase 4
- Production build passes without errors or warnings — Validated in Phase 4

### Active

(All requirements validated — milestone complete)

### Out of Scope

- Changing the initial schedule generation algorithm (TASK-3) — only post-result adjustments
- Modifying group/elimination logic or bracket progression — only schedule times
- Cross-court automatic resolution of team conflicts — detection only, manual resolution
- Push notifications for schedule changes — players see updated times when they check
- Undo/revert schedule adjustments — adjustments cascade forward only

## Context

- **Existing codebase**: Brownfield — this adds to a fully functional tournament management PWA with group phases, elimination brackets, and a complete scoreboard system
- **Current state**: Schedule is static after initial generation. `tournament_matches` has `scheduled_date`, `scheduled_time`, `estimated_duration_minutes` fields already
- **Score recording flow**: `ScoreInputModal` → `save_match_result` RPC (group) or direct UPDATE (elimination) → `postGroupPhase.js` progression
- **Court model**: `courts` table has `available_from`, `available_to`, `break_start`, `break_end` time fields
- **Scheduling engine**: `schedulingEngine.js` already has `generateTimeSlots()` which respects court hours and breaks — can be reused for recalculation
- **Key constraint**: The `save_match_result` RPC handles group matches atomically; elimination matches use direct UPDATE. Schedule adjustment must work after both paths.

## Constraints

- **Tech stack**: React 19 + Vite 8 + Supabase + Tailwind CSS 4 (existing stack, no new dependencies)
- **DB schema**: Can add new columns to `tournament_matches` (e.g., `actual_end_time`) but cannot rename/remove existing columns
- **Performance**: Only recalculate affected court + day, not the entire tournament schedule
- **Atomicity**: Schedule updates must be persisted to DB, not just in-memory state
- **UI language**: Spanish (all labels, placeholders, etc.)
- **Compatibility**: Must not break any existing functionality (scoring, classification, bracket progression)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Store actual_end_time as new column vs reuse scheduled_time | New column preserves original schedule as historical record | New column (Phase 2) |
| Cascade recalculation on client vs server (RPC) | Client has court data already loaded; pure JS engine is fully testable | Client-side pure JS engine (Phase 3) |
| Handle day overflow by moving to next calendar day vs next tournament day | Tournament may not have consecutive days | Next tournament day from tournamentDays array (Phase 3) |
| Cascade failure as non-critical | Score save is the critical operation; cascade is additive | try/catch with console.error, no user-facing error (Phase 4) |
| No changes needed for player view (VIS-02) | ActiveTournamentPage already fetches scheduled_date/time from DB on mount | Confirmed in Phase 4 verification |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after Phase 4 completion — all phases complete, milestone ready for closure*
