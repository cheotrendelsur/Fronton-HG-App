# Requirements: TASK-6 — Reajuste Dinamico del Cronograma

**Defined:** 2026-04-02
**Core Value:** When a match finishes, every pending match on that court instantly shows its corrected start time — players always know when they actually play.

## v1 Requirements

### UI — End Time Input

- [x] **UI-01**: ScoreInputModal shows a date input pre-filled with today's date when opened
- [x] **UI-02**: ScoreInputModal shows a time input pre-filled with the current time when opened
- [x] **UI-03**: End-time inputs appear above score fields, labeled clearly (e.g., "Cuando termino este partido?")
- [x] **UI-04**: End-time inputs are editable — organizer can adjust date and time manually
- [x] **UI-05**: End-time inputs are required — result cannot be saved without them

### Persistence — Actual End Time

- [x] **PERS-01**: `actual_end_time` timestamp column added to `tournament_matches` table
- [x] **PERS-02**: Saving a group match result (via RPC) persists `actual_end_time`
- [x] **PERS-03**: Saving an elimination match result (via direct UPDATE) persists `actual_end_time`

### Schedule Recalculation Engine

- [x] **SCHED-01**: After saving a result, recalculate start times for all pending matches on the same court for that day
- [x] **SCHED-02**: Next pending match on the court starts at the actual end time of the just-completed match
- [x] **SCHED-03**: Each subsequent match cascades: start = previous match start + estimated_duration_minutes
- [x] **SCHED-04**: If recalculated start time falls during court break, move match to after break ends
- [x] **SCHED-05**: If recalculated start time exceeds court `available_to`, move match to next tournament day at `available_from`
- [x] **SCHED-06**: Matches that overflow to next day continue cascading from `available_from` respecting breaks
- [x] **SCHED-07**: Only matches with status 'scheduled' or 'pending' are adjusted
- [x] **SCHED-08**: Completed matches are never modified
- [x] **SCHED-09**: Match order (match_number sequence) is preserved — only `scheduled_date` and `scheduled_time` change
- [x] **SCHED-10**: Updated `scheduled_date` and `scheduled_time` are persisted to database

### Scope Isolation

- [x] **ISO-01**: Only the affected court's pending matches are recalculated — other courts untouched
- [x] **ISO-02**: Match `court_id`, `team1_id`, `team2_id`, `phase`, `status` (for non-adjusted) are never changed
- [x] **ISO-03**: Existing scoring, classification, and bracket progression logic is unaffected

### UI — Visual Feedback

- [x] **VIS-01**: After saving a result, scoreboard page refreshes and shows updated schedule times immediately
- [x] **VIS-02**: Players viewing the tournament see updated match times without manual refresh

### Build & Compatibility

- [x] **BUILD-01**: `npm run build` passes without errors after all changes
- [x] **BUILD-02**: All existing tournament flows (create, edit, inscribe, start, score, classify, bracket) continue working

## v2 Requirements

### Team Conflict Detection

- **CONF-01**: Detect when a rescheduled match overlaps with the same team playing on another court
- **CONF-02**: Display visual warning to organizer when team conflict detected

### Visual Indicators

- **IND-01**: Show "Horario actualizado" badge on matches whose schedule was adjusted
- **IND-02**: Show original vs adjusted time comparison on rescheduled matches

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changing initial schedule generation (TASK-3) | Only post-result adjustments; generation is separate concern |
| Cross-court automatic conflict resolution | Too complex for v1; detection deferred to v2 |
| Push notifications for schedule changes | No notification infrastructure exists yet |
| Undo/revert schedule adjustments | Cascade-forward only; historical accuracy maintained via `actual_end_time` |
| Modifying group/elimination/bracket logic | Schedule adjustment is time-only, not structural |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 1 | Complete |
| UI-02 | Phase 1 | Complete |
| UI-03 | Phase 1 | Complete |
| UI-04 | Phase 1 | Complete |
| UI-05 | Phase 1 | Complete |
| PERS-01 | Phase 2 | Complete |
| PERS-02 | Phase 2 | Complete |
| PERS-03 | Phase 2 | Complete |
| SCHED-01 | Phase 3 | Complete |
| SCHED-02 | Phase 3 | Complete |
| SCHED-03 | Phase 3 | Complete |
| SCHED-04 | Phase 3 | Complete |
| SCHED-05 | Phase 3 | Complete |
| SCHED-06 | Phase 3 | Complete |
| SCHED-07 | Phase 3 | Complete |
| SCHED-08 | Phase 3 | Complete |
| SCHED-09 | Phase 3 | Complete |
| SCHED-10 | Phase 3 | Complete |
| ISO-01 | Phase 3 | Complete |
| ISO-02 | Phase 3 | Complete |
| ISO-03 | Phase 4 | Complete |
| VIS-01 | Phase 4 | Complete |
| VIS-02 | Phase 4 | Complete |
| BUILD-01 | Phase 4 | Complete |
| BUILD-02 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation (BUILD-01, BUILD-02 moved from Phase 5 → Phase 4)*
