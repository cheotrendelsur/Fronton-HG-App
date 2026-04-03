# Requirements: RacketTourneys

**Defined:** 2026-04-02
**Core Value:** When a court has a setback, the organizer pauses it with one tap; when it's resolved, resuming automatically fixes every pending match time — players are notified and always know their real schedule.

## v1.1 Requirements

Requirements for milestone v1.1: Gestión Dinámica de Contratiempos por Cancha.

### Canchas (Court Management)

- [x] **CANCH-01**: Organizer sees a "Canchas" tab in active tournament page with swipe between courts
- [x] **CANCH-02**: Each court card shows current status (Operativa/Pausada), name, and upcoming pending matches
- [x] **CANCH-03**: Paused court shows live timer (time since pause), delayed match badges, and pause reason
- [x] **CANCH-04**: Each court shows a collapsible setback history with type, description, start/end times, and duration

### Contratiempos (Setback Management)

- [x] **CONT-01**: Organizer can declare a setback via modal with type dropdown and description textarea
- [x] **CONT-02**: Setback types include: Lluvia, Mantenimiento, Lesión de jugador, Falla eléctrica, Problema de equipamiento, Otro (with custom text)
- [x] **CONT-03**: Declaring a setback persists to `court_setbacks` table and marks the court as paused
- [x] **CONT-04**: Only one active setback per court at a time (button disabled if already paused)
- [x] **CONT-05**: Setback button disabled when court has no pending matches

### Reanudación (Resume & Recalculation)

- [x] **REAN-01**: Organizer can resume a paused court, recording ended_at and changing status to 'resolved'
- [x] **REAN-02**: On resume, all pending matches on that court are recalculated in cascade starting from current time
- [x] **REAN-03**: Cascade respects court break windows and availability hours (available_from/available_to)
- [x] **REAN-04**: Spill-over moves matches to next tournament day when they exceed court closing time
- [x] **REAN-05**: When spill-over exceeds tournament end_date, organizer is prompted to extend the date
- [x] **REAN-06**: Recalculated times are persisted to `tournament_matches` in the database

### Conflictos (Conflict Detection)

- [ ] **CONF-01**: After recalculation, system detects when a team has overlapping matches on different courts
- [ ] **CONF-02**: Detected conflicts are shown to the organizer as visual alerts with details of the overlap

### Notificaciones (Notifications)

- [x] **NOTF-01**: When a setback is activated, in-app notifications are sent to all players with matches on that court that day
- [x] **NOTF-02**: When a court is resumed, notifications are sent with the player's updated next match time
- [ ] **NOTF-03**: Bell icon with unread count badge appears in the navigation bar
- [ ] **NOTF-04**: Clicking the bell opens a notification panel listing all notifications with read/unread state

### Seguridad (Safety)

- [x] **SEGR-01**: Registering a result on a paused court shows a confirmation warning before proceeding

## Future Requirements

### v2 Candidates

- **CONF-03**: Automatic cross-court conflict resolution (move conflicting match to next available slot)
- **NOTF-05**: Push notifications (browser/mobile) for schedule changes
- **CANCH-05**: Manual match reordering within a court's schedule
- **REAN-07**: Undo/revert schedule adjustments

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automatic conflict resolution | Too complex and error-prone; organizer manual adjustment is safer |
| Push notifications (browser/mobile) | In-app notifications sufficient for v1.1; push is a v2 enhancement |
| Undo/revert schedule adjustments | Adjustments cascade forward only; adds significant complexity |
| Initial schedule generation changes | TASK-3 logic untouched; only post-result/setback adjustments |
| Group/elimination logic changes | Only schedule times are affected, not tournament structure |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANCH-01 | Phase 6 | Complete |
| CANCH-02 | Phase 6 | Complete |
| CANCH-03 | Phase 6 | Complete |
| CANCH-04 | Phase 6 | Complete |
| CONT-01 | Phase 6 | Complete |
| CONT-02 | Phase 6 | Complete |
| CONT-03 | Phase 5 | Complete |
| CONT-04 | Phase 6 | Complete |
| CONT-05 | Phase 6 | Complete |
| REAN-01 | Phase 7 | Complete |
| REAN-02 | Phase 7 | Complete |
| REAN-03 | Phase 7 | Complete |
| REAN-04 | Phase 7 | Complete |
| REAN-05 | Phase 7 | Complete |
| REAN-06 | Phase 5 | Complete |
| CONF-01 | Phase 7 | Pending |
| CONF-02 | Phase 7 | Pending |
| NOTF-01 | Phase 5 | Complete |
| NOTF-02 | Phase 5 | Complete |
| NOTF-03 | Phase 8 | Pending |
| NOTF-04 | Phase 8 | Pending |
| SEGR-01 | Phase 6 | Complete |

**Coverage:**
- v1.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
