# TASK-7: Gestión Dinámica de Contratiempos por Cancha

## What This Is

A court setback management system for the RacketTourneys PWA that lets organizers pause a court's schedule when unexpected events occur (rain, injury, equipment failure), then resume with automatic cascade recalculation of all pending match times. Includes in-app notifications for affected players and cross-court conflict detection.

## Core Value

When a court has a setback, the organizer pauses it with one tap; when it's resolved, resuming automatically fixes every pending match time — players are notified and always know their real schedule.

## Current Milestone: v1.1 Gestión Dinámica de Contratiempos por Cancha

**Goal:** Allow organizers to pause/resume courts during setbacks with automatic schedule recalculation, in-app notifications, and conflict detection.

**Target features:**
- New "Canchas" tab in active tournament with court status, upcoming matches, and setback history
- Setback declaration form (type + description) that pauses a court with live timer
- Resume court with automatic cascade recalculation respecting breaks, court hours, and day overflow
- In-app notification system (bell icon + badge + panel) for affected players
- Cross-court conflict detection when recalculated times overlap
- Tournament date extension prompt when spill-over exceeds end_date
- Setback history per court

## Requirements

### Validated

- End-time input fields (date + time) pre-filled with current date/time appear in ScoreInputModal — Validated in v1.0 Phase 1
- End-time inputs are editable so organizer can adjust if not recording in real time — Validated in v1.0 Phase 1
- Actual end time is persisted to the database when saving a match result — Validated in v1.0 Phase 2
- Pure cascade recalculation engine recalculates pending matches on a court after a match ends — Validated in v1.0 Phase 3
- Cascade handles break windows, day overflow to next tournament day, multi-day cascading — Validated in v1.0 Phase 3
- Only scheduled_date and scheduled_time change; all other fields preserved — Validated in v1.0 Phase 3
- Completed matches immune to recalculation; court isolation enforced — Validated in v1.0 Phase 3
- DB persistence layer queries tournament data and batch-updates only time fields — Validated in v1.0 Phase 3
- Updated schedule is immediately visible in the scoreboard page after adjustment — Validated in v1.0 Phase 4
- After saving a result, cascade is automatically triggered (wired into save flow) — Validated in v1.0 Phase 4
- A player viewing the active tournament page sees corrected match times on refresh — Validated in v1.0 Phase 4
- All existing flows (creation, edit, inscription, scoring, classification, bracket) unbroken — Validated in v1.0 Phase 4
- Production build passes without errors or warnings — Validated in v1.0 Phase 4

### Active

- Organizer can pause a court via setback declaration form (type + description)
- Court shows paused state with live timer and delayed match badges
- Organizer can resume a paused court triggering automatic cascade recalculation
- Cascade respects court breaks, availability windows, and day overflow (spill-over)
- In-app notifications sent to affected players on pause and resume
- Notification bell icon with unread badge in navigation
- Cross-court conflict detection after recalculation
- Tournament date extension when spill-over exceeds end_date
- Setback history visible per court
- New "Canchas" tab in active tournament page with swipe between courts

### Out of Scope

- Changing the initial schedule generation algorithm (TASK-3) — only post-result adjustments
- Modifying group/elimination logic or bracket progression — only schedule times
- Push notifications (browser/mobile) — in-app only for v1.1
- Undo/revert schedule adjustments — adjustments cascade forward only
- Automatic cross-court conflict resolution — detection + alert only (organizer resolves manually)

## Context

- **Codebase**: Brownfield PWA with group phases, elimination brackets, complete scoreboard, and real-time schedule adjustment (v1.0)
- **Existing cascade engine**: `cascadeRecalculator.js` (pure logic) + `cascadeSchedulePersistence.js` (DB layer) — resume recalculation will reuse this engine
- **Score recording flow**: `ScoreInputModal` → `save_match_result` RPC / direct UPDATE → `applyCascadeRecalculation` → `loadData()` refetch
- **Court model**: `courts` table has `available_from`, `available_to`, `break_start`, `break_end`
- **New DB tables needed**: `court_setbacks` (setback events), `notifications` (in-app notifications)
- **TASK-6 coexistence**: v1.0 micro-adjustments (per-match) coexist with v1.1 macro-adjustments (court pause/resume). Resume recalculation produces new "official" times; subsequent match results trigger TASK-6 micro-adjustments on top

## Constraints

- **Tech stack**: React 19 + Vite 8 + Supabase + Tailwind CSS 4 (existing stack, no new dependencies)
- **DB schema**: New tables allowed (`court_setbacks`, `notifications`); existing columns unchanged
- **Performance**: Only recalculate affected court, not entire tournament
- **Atomicity**: Schedule updates must be persisted to DB, not just in-memory state
- **UI language**: Spanish (all labels, placeholders, etc.)
- **Compatibility**: Must not break any existing functionality (scoring, classification, bracket progression, TASK-6 cascade)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Store actual_end_time as new column vs reuse scheduled_time | New column preserves original schedule as historical record | New column (v1.0 Phase 2) |
| Cascade recalculation on client vs server (RPC) | Client has court data already loaded; pure JS engine is fully testable | Client-side pure JS engine (v1.0 Phase 3) |
| Handle day overflow by moving to next calendar day vs next tournament day | Tournament may not have consecutive days | Next tournament day from tournamentDays array (v1.0 Phase 3) |
| Cascade failure as non-critical | Score save is the critical operation; cascade is additive | try/catch with console.error, no user-facing error (v1.0 Phase 4) |
| Conflict detection only (no auto-resolution) | Auto-resolution too complex and error-prone; organizer manual adjustment is safer | Detection + alert, manual resolution (v1.1) |

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
*Last updated: 2026-04-02 after v1.1 milestone start*
