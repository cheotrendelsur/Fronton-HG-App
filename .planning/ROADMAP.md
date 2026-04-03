# Roadmap: RacketTourneys

## Milestones

- ✅ **v1.0 Reajuste Dinamico del Cronograma** — Phases 1-4 (shipped 2026-04-02)
- 🚧 **v1.1 Gestión Dinámica de Contratiempos por Cancha** — Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Reajuste Dinamico del Cronograma (Phases 1-4) — SHIPPED 2026-04-02</summary>

- [x] Phase 1: End-Time Input UI (1/1 plans) — completed 2026-04-02
- [x] Phase 2: Persist Actual End Time (1/1 plans) — completed 2026-04-02
- [x] Phase 3: Cascade Recalculation Engine (1/1 plans) — completed 2026-04-02
- [x] Phase 4: Integration and Compatibility (1/1 plans) — completed 2026-04-02

</details>

### 🚧 v1.1 Gestión Dinámica de Contratiempos por Cancha (In Progress)

**Milestone Goal:** Organizers can pause a court on setback and resume with automatic schedule recalculation; players are notified and always see their real next match time.

## Phase Summary

- [x] **Phase 5: Capa de Datos** - DB tables, RLS policies, and CRUD operations for court setbacks and notifications (completed 2026-04-02)
- [ ] **Phase 6: UI de Canchas y Contratiempos** - "Canchas" tab, court status cards, setback declaration form, paused state display, setback history, and paused-court warning
- [ ] **Phase 7: Reanudación y Detección de Conflictos** - Resume flow, cascade recalculation on resume, spill-over handling, date extension prompt, and conflict detection alerts
- [ ] **Phase 8: Notificaciones** - In-app notification system: bell icon, unread badge, notification panel, and setback/resume notifications

## Phase Details

### Phase 5: Capa de Datos
**Goal**: The data infrastructure for court setbacks and notifications exists and is accessible to all subsequent phases
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: CONT-03, REAN-06, NOTF-01, NOTF-02
**Success Criteria** (what must be TRUE):
  1. `court_setbacks` table exists with columns: id, tournament_id, court_id, type, description, started_at, ended_at, status ('active'/'resolved')
  2. `notifications` table exists with columns: id, tournament_id, user_id, type, payload (jsonb), read_at, created_at
  3. RLS policies allow organizers to insert/update court_setbacks and read their own tournaments' data; players can read their own notifications
  4. Basic CRUD helper functions (supabase queries) for setbacks and notifications are available in `src/lib/`
**Plans:** 1/1 plans complete

Plans:
- [x] 05-01-PLAN.md — SQL migration (2 tables + RLS) and CRUD helper modules (setbackPersistence.js, notificationPersistence.js)

### Phase 6: UI de Canchas y Contratiempos
**Goal**: Organizers can see all courts with live status, declare setbacks with a form, and the paused state is clearly communicated; a warning appears when recording a result on a paused court
**Depends on**: Phase 5
**Requirements**: CANCH-01, CANCH-02, CANCH-03, CANCH-04, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, SEGR-01
**Success Criteria** (what must be TRUE):
  1. A "Canchas" tab appears in the active tournament page and organizer can swipe between courts
  2. Each court card shows its status (Operativa/Pausada), name, and list of upcoming pending matches
  3. Organizer can open a setback form, select a type (Lluvia, Mantenimiento, etc.), add a description, and submit — court status changes to Pausada immediately
  4. A paused court displays a live elapsed timer, delayed match badges, and the pause reason; the declare-setback button is disabled while the court is already paused or has no pending matches
  5. Each court shows a collapsible setback history with type, description, start/end times, and duration
  6. Attempting to register a result on a paused court shows a Spanish-language confirmation warning before proceeding
**Plans**: 0/3 plans complete

Plans:
- [ ] 06-01-PLAN.md — Canchas tab, CanchasView, CourtSwiper, CourtCard, CourtMatchMiniCard (Wave 1)
- [ ] 06-02-PLAN.md — SetbackFormModal, PausedCourtWarning, ScoreboardPage integration (Wave 1)
- [ ] 06-03-PLAN.md — Paused court state (live timer, badges, resume button), SetbackHistory accordion (Wave 2)

### Phase 7: Reanudación y Detección de Conflictos
**Goal**: Organizers can resume a paused court and all pending matches instantly show corrected times; spill-over moves matches to the next tournament day, and cross-court conflicts are surfaced as alerts
**Depends on**: Phase 6
**Requirements**: REAN-01, REAN-02, REAN-03, REAN-04, REAN-05, REAN-06, CONF-01, CONF-02
**Success Criteria** (what must be TRUE):
  1. Tapping "Reanudar" on a paused court records ended_at, marks the setback resolved, and triggers cascade recalculation starting from the current time
  2. All pending matches on the resumed court show updated scheduled_date and scheduled_time in the scoreboard immediately after resume
  3. Recalculation respects court break windows and availability hours; matches that exceed court closing time are moved to the next tournament day
  4. When recalculated matches would spill past the tournament end_date, a prompt appears asking the organizer to extend the date
  5. After recalculation, any team with overlapping matches on different courts is flagged with a visual alert showing which matches overlap and on which courts
**Plans**: TBD
**UI hint**: yes

### Phase 8: Notificaciones
**Goal**: Players receive in-app notifications when their court is paused or resumed, and can view all notifications via a bell icon panel in the navigation
**Depends on**: Phase 7
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04
**Success Criteria** (what must be TRUE):
  1. When a setback is declared, all players with matches on that court that day receive an in-app notification
  2. When a court is resumed, affected players receive a notification with their updated next match time
  3. A bell icon with an unread count badge appears in the navigation bar and updates in real time as notifications arrive
  4. Clicking the bell opens a notification panel listing all notifications with read/unread visual distinction; marking as read clears the badge count
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. End-Time Input UI | v1.0 | 1/1 | Complete | 2026-04-02 |
| 2. Persist Actual End Time | v1.0 | 1/1 | Complete | 2026-04-02 |
| 3. Cascade Recalculation Engine | v1.0 | 1/1 | Complete | 2026-04-02 |
| 4. Integration and Compatibility | v1.0 | 1/1 | Complete | 2026-04-02 |
| 5. Capa de Datos | v1.1 | 1/1 | Complete   | 2026-04-02 |
| 6. UI de Canchas y Contratiempos | v1.1 | 0/3 | Planned | - |
| 7. Reanudación y Detección de Conflictos | v1.1 | 0/? | Not started | - |
| 8. Notificaciones | v1.1 | 0/? | Not started | - |
