---
phase: 06-ui-de-canchas-y-contratiempos
plan: "02"
subsystem: scoreboard-ui
tags: [setback, modal, portal, paused-court, warning-dialog]
dependency_graph:
  requires:
    - "05-01 (setbackPersistence.js, notificationPersistence.js)"
  provides:
    - "SetbackFormModal — organizer setback declaration UI"
    - "PausedCourtWarning — confirmation dialog before registering on paused court"
  affects:
    - "ScoreboardPage — handleRegister now intercepts paused courts"
tech_stack:
  added: []
  patterns:
    - "createPortal for modals (consistent with ScoreInputModal)"
    - "body scroll lock via useEffect cleanup"
    - "activeSetbacks map for O(1) paused-court lookup"
key_files:
  created:
    - src/components/TournamentActive/SetbackFormModal.jsx
    - src/components/Scoreboard/PausedCourtWarning.jsx
    - src/lib/setbackPersistence.js
    - src/lib/notificationPersistence.js
  modified:
    - src/components/Scoreboard/ScoreboardPage.jsx
decisions:
  - "Copied setbackPersistence.js and notificationPersistence.js from main repo into worktree — these were created in Phase 05 but not yet present in worktree (Rule 3: auto-fix blocking dependency)"
  - "activeSetbacks stored as court_id-keyed object for O(1) lookup in handleRegister"
metrics:
  duration_minutes: 2
  completed_date: "2026-04-03"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 06 Plan 02: Setback Form Modal and Paused Court Warning Summary

**One-liner:** Portal modal for declaring court setbacks (6 types, custom Otro, 10-char description) + confirmation dialog intercepting score registration on paused courts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create SetbackFormModal | e845883 | SetbackFormModal.jsx, setbackPersistence.js, notificationPersistence.js |
| 2 | Create PausedCourtWarning + wire ScoreboardPage | 598e748 | PausedCourtWarning.jsx, ScoreboardPage.jsx |

## What Was Built

### SetbackFormModal (`src/components/TournamentActive/SetbackFormModal.jsx`)

Portal modal following the ScoreInputModal pattern. Props: `{ court, tournamentId, onClose, onSuccess }`.

Features:
- Type dropdown with exactly 6 options: Lluvia, Mantenimiento, Lesion de jugador, Falla electrica, Problema de equipamiento, Otro
- Selecting "Otro" reveals a custom type text input
- Description textarea with live character counter (minimum 10 chars)
- Submit button disabled until type selected AND description >= 10 chars
- Warning banner: "Al activar, el cronograma de esta cancha se pausara y los jugadores afectados seran notificados"
- On submit: calls `createSetback` from setbackPersistence.js, then queries tournament_matches/tournament_registrations to find affected player IDs, then calls `createBulkNotifications`
- Body scroll lock via useEffect cleanup

### PausedCourtWarning (`src/components/Scoreboard/PausedCourtWarning.jsx`)

Lightweight confirmation dialog. Props: `{ setbackType, onCancel, onProceed }`.

Features:
- Shows "Cancha pausada" header with warning icon
- Spanish text: "Esta cancha esta pausada por [setbackType]. ¿Deseas registrar el resultado de todos modos?"
- Two buttons: "Cancelar" (dismisses) and "Registrar de todos modos" (proceeds to ScoreInputModal)
- Portal with body scroll lock

### ScoreboardPage modifications

- Added `activeSetbacks` state (map of court_id → setback object)
- `loadData` now fetches active setbacks from `court_setbacks` table
- `handleRegister` intercepts matches on paused courts — shows PausedCourtWarning first
- `handleWarningProceed` and `handleWarningCancel` control warning dialog state
- PausedCourtWarning rendered in JSX after ScoreInputModal block

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing setbackPersistence.js and notificationPersistence.js in worktree**
- **Found during:** Task 1 setup
- **Issue:** Phase 05 lib files were not present in the agent worktree — the worktree was created before Phase 05 executed
- **Fix:** Copied both files from the main repo into the worktree (`src/lib/setbackPersistence.js`, `src/lib/notificationPersistence.js`)
- **Files modified:** src/lib/setbackPersistence.js, src/lib/notificationPersistence.js
- **Commit:** e845883

## Known Stubs

None — all components wire to real persistence functions.

## Self-Check: PASSED

- SetbackFormModal.jsx exists: YES
- PausedCourtWarning.jsx exists: YES
- SUMMARY.md exists: YES
- Commit e845883 exists: YES
- Commit 598e748 exists: YES
- Vite build: PASSED
