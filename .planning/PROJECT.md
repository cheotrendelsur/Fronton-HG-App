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

### Active
- [ ] After saving a result, all pending matches on the same court for that day are recalculated in cascade
- [ ] If a match ends late, subsequent matches shift later proportionally
- [ ] If a match ends early, subsequent matches shift earlier proportionally
- [ ] Matches that overflow past court closing time (`available_to`) move to the next tournament day at court opening time (`available_from`)
- [ ] Recalculated matches respect court break windows (skip over break periods)
- [ ] Only pending/scheduled matches are adjusted — completed matches are never modified
- [ ] Only the affected court's matches are adjusted — other courts remain independent
- [ ] Match order, court assignment, team assignment, phase, and status are never changed by the adjustment
- [ ] Updated schedule is immediately visible in the scoreboard page after adjustment
- [ ] Team conflict detection: if a rescheduled match overlaps with the same team playing on another court, detect and flag (edge case)

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
| Store actual_end_time as new column vs reuse scheduled_time | New column preserves original schedule as historical record | — Pending |
| Cascade recalculation on client vs server (RPC) | Client has court data already loaded; server RPC is more atomic | — Pending |
| Handle day overflow by moving to next calendar day vs next tournament day | Tournament may not have consecutive days | — Pending |

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
*Last updated: 2026-04-02 after Phase 2 completion*
