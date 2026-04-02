---
phase: 05-capa-de-datos
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, court-setbacks, notifications, persistence]

requires: []
provides:
  - "court_setbacks table with RLS (organizer write, authenticated read)"
  - "notifications table with RLS (organizer insert, user-scoped read/update)"
  - "setbackPersistence.js: createSetback, resolveSetback, getActiveSetback, getSetbackHistory"
  - "notificationPersistence.js: createNotification, createBulkNotifications, getUserNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead"
affects:
  - 06-canchas-ui
  - 07-setback-resume-logic
  - 08-notification-ui

tech-stack:
  added: []
  patterns:
    - "Persistence files take supabaseClient as first arg (no import of singleton)"
    - "All CRUD helpers return { success: boolean, data?: any, error?: string }"
    - "try/catch with err instanceof Error ? err.message : String(err)"
    - "RLS: authenticated SELECT, organizer INSERT/UPDATE/DELETE via tournaments.organizer_id check"
    - "User-scoped RLS: notifications SELECT/UPDATE with user_id = auth.uid()"

key-files:
  created:
    - supabase/migrations/create_court_setbacks_and_notifications.sql
    - src/lib/setbackPersistence.js
    - src/lib/notificationPersistence.js
  modified: []

key-decisions:
  - "Used TASK-7 schema verbatim for court_setbacks and notifications (D-01, D-03)"
  - "Notification types: setback, schedule_change, general (D-02)"
  - "Status values for court_setbacks: active and resolved (D-04)"
  - "Two separate persistence files following existing project convention (D-05)"
  - "supabaseClient passed as argument (not imported) following scorePersistence.js pattern (D-06)"
  - "Single migration file for both tables + RLS (D-08)"
  - "notifications UPDATE policy scoped to user_id = auth.uid() for read-status self-management"

patterns-established:
  - "Setback CRUD pattern: createSetback uses .insert().select().single(), resolveSetback patches ended_at+status"
  - "Notification bulk insert: createBulkNotifications maps camelCase to snake_case then batch inserts"
  - "Unread count: getUnreadCount uses select('id', { count: 'exact', head: true }) same as checkGroupPhaseComplete"

requirements-completed: [CONT-03, REAN-06, NOTF-01, NOTF-02]

duration: 2min
completed: 2026-04-02
---

# Phase 05 Plan 01: Capa de Datos Summary

**SQL migration + two CRUD persistence modules for court_setbacks and notifications tables with organizer-scoped RLS and user-scoped notification access**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T22:37:00Z
- **Completed:** 2026-04-02T22:38:26Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created `court_setbacks` and `notifications` tables with ON DELETE CASCADE foreign keys, performance indexes, and full RLS
- Delivered `setbackPersistence.js` with 4 CRUD helpers ready for Phase 6 (court UI) and Phase 7 (resume logic)
- Delivered `notificationPersistence.js` with 6 CRUD helpers ready for Phase 8 (notification UI), including bulk insert and unread count

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migration for court_setbacks and notifications tables with RLS** - `288c57b` (feat)
2. **Task 2: Create setbackPersistence.js CRUD helpers** - `ac07399` (feat)
3. **Task 3: Create notificationPersistence.js CRUD helpers** - `fb11f89` (feat)

## Files Created/Modified
- `supabase/migrations/create_court_setbacks_and_notifications.sql` - DDL for both tables with RLS policies and indexes
- `src/lib/setbackPersistence.js` - 4 exported async functions for court setback CRUD
- `src/lib/notificationPersistence.js` - 6 exported async functions for notification CRUD

## Decisions Made
- Used TASK-7 schema verbatim for both tables — exact column names and types as specified in D-01 through D-04
- supabaseClient passed as first argument (not imported as singleton) to match existing scorePersistence.js and cascadeSchedulePersistence.js pattern
- notifications UPDATE policy scoped to `user_id = auth.uid()` so players can mark their own notifications as read
- No UPDATE policy needed on court_setbacks beyond organizer check — resolveSetback uses the standard organizer UPDATE policy

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External DB setup required.** Run the migration file in Supabase Dashboard SQL Editor:
- File: `supabase/migrations/create_court_setbacks_and_notifications.sql`
- Creates `court_setbacks` and `notifications` tables
- Sets up RLS policies and performance indexes

## Known Stubs

None — this plan delivers pure data layer (SQL + CRUD helpers). No UI or business logic stubs.

## Next Phase Readiness
- Phase 6 (court UI) can import `setbackPersistence.js` directly: `createSetback`, `getActiveSetback`, `getSetbackHistory`
- Phase 7 (resume logic) can import `resolveSetback` to complete the pause/resume flow
- Phase 8 (notification UI) can import all 6 functions from `notificationPersistence.js`
- No blockers — all downstream phases have their required data access layer

---
*Phase: 05-capa-de-datos*
*Completed: 2026-04-02*
