# Roadmap: TASK-6 — Reajuste Dinamico del Cronograma

## Overview

This milestone adds real-time schedule recalculation to the RacketTourneys PWA. When an organizer records a match result, the organizer provides the actual end time, which triggers a cascade recalculation of all pending matches on that court for that day — respecting court hours, breaks, and day overflow. Players always see current start times without any manual intervention.

## Phases

- [ ] **Phase 1: End-Time Input UI** - Add editable actual-end-time fields to ScoreInputModal
- [ ] **Phase 2: Persist Actual End Time** - Add DB column and persist end-time through both save paths
- [ ] **Phase 3: Cascade Recalculation Engine** - Build and connect the court-scoped schedule recalculator
- [ ] **Phase 4: Integration and Compatibility** - Wire engine into save flows, verify scoreboard refresh, validate build

## Phase Details

### Phase 1: End-Time Input UI
**Goal**: Organizer sees pre-filled, editable date and time fields in ScoreInputModal that capture when a match actually ended
**Depends on**: Nothing (first phase)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Opening ScoreInputModal shows a date field pre-filled with today's date and a time field pre-filled with the current time
  2. Both fields are labeled clearly in Spanish (e.g., "Cuando termino este partido?") and appear above the score inputs
  3. Organizer can change both fields to any valid date and time before saving
  4. Attempting to save a result without filling both end-time fields is blocked with a visible error
**Plans**: 1 plan
Plans:
- [ ] 01-01-PLAN.md — End-time inputs in ScoreInputModal + onSave signature update in ScoreboardPage
**UI hint**: yes

### Phase 2: Persist Actual End Time
**Goal**: Actual end time captured in the UI is stored in the database for both group and elimination match save paths
**Depends on**: Phase 1
**Requirements**: PERS-01, PERS-02, PERS-03
**Success Criteria** (what must be TRUE):
  1. The `tournament_matches` table has an `actual_end_time` column that accepts a timestamp
  2. Saving a group match result via the RPC path stores `actual_end_time` in the database row
  3. Saving an elimination match result via the direct UPDATE path stores `actual_end_time` in the database row
  4. Existing match rows without `actual_end_time` are unaffected (column is nullable)
**Plans**: TBD

### Phase 3: Cascade Recalculation Engine
**Goal**: After any match is saved with an actual end time, all pending matches on the same court that day are recalculated in cascade, respecting court constraints
**Depends on**: Phase 2
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, SCHED-09, SCHED-10, ISO-01, ISO-02
**Success Criteria** (what must be TRUE):
  1. The next pending match on the court starts at the actual end time of the just-completed match; each following match cascades from the previous one's start + duration
  2. If a recalculated time falls inside the court break window, the match is moved to after the break ends
  3. If a recalculated time exceeds the court's closing time, the match moves to the next tournament day at the court's opening time, continuing to cascade
  4. Completed matches are never modified; only matches with status 'scheduled' or 'pending' are adjusted
  5. Match order, court assignment, team assignments, phase, and non-time status fields are identical after recalculation; only `scheduled_date` and `scheduled_time` change in the DB
  6. Matches on other courts are completely untouched by the recalculation
**Plans**: TBD

### Phase 4: Integration and Compatibility
**Goal**: The recalculation engine is invoked automatically after every result save, the scoreboard reflects updated times immediately, and all existing tournament flows remain unbroken
**Depends on**: Phase 3
**Requirements**: ISO-03, VIS-01, VIS-02, BUILD-01, BUILD-02
**Success Criteria** (what must be TRUE):
  1. After saving any match result (group or elimination), the scoreboard page displays updated start times for affected pending matches without a manual page reload
  2. A player viewing the active tournament page sees corrected match times when they open or refresh the page
  3. All existing flows — tournament creation, edit, inscription, start, scoring, classification, and bracket progression — work exactly as before
  4. `npm run build` completes without errors or warnings introduced by this milestone
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. End-Time Input UI | 0/1 | Not started | - |
| 2. Persist Actual End Time | 0/? | Not started | - |
| 3. Cascade Recalculation Engine | 0/? | Not started | - |
| 4. Integration and Compatibility | 0/? | Not started | - |
