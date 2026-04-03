# Phase 7: Reanudacion y Deteccion de Conflictos - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the "Reanudar cancha" button to trigger cascade recalculation from current time, persist updated match times, handle spill-over beyond court hours and tournament end_date (with date extension prompt), and detect + display cross-court team conflicts after recalculation. Also send resume notifications to affected players.

</domain>

<decisions>
## Implementation Decisions

### Resume Cascade Wiring
- **D-01:** Reuse existing `recalculateCourt()` from `cascadeRecalculator.js` — same engine, but anchor time is "now" (current timestamp) instead of a completed match's `actual_end_time`
- **D-02:** Create a new `applyCascadeOnResume(supabaseClient, tournamentId, courtId)` function in `cascadeSchedulePersistence.js` that fetches court data, constructs anchor from current time, calls `recalculateCourt()`, and persists updates
- **D-03:** Wire into CourtCard's `handleResume`: after `resolveSetback()` succeeds, call `applyCascadeOnResume()`, then `onDataRefresh()`
- **D-04:** The cascade anchor time for resume = `new Date().toISOString()` (the moment the organizer taps resume)

### Spill-Over and Date Extension
- **D-05:** `recalculateCourt()` already handles day overflow within tournament days. If matches spill past `end_date`, the engine currently has no more days to place them.
- **D-06:** After cascade returns, check if any matches have `scheduled_date > tournament.end_date` or if unplaceable matches remain. If so, show a modal prompt asking to extend the tournament end_date.
- **D-07:** Date extension modal: simple confirmation with the new proposed end_date, "Extender torneo" / "Cancelar" buttons. If confirmed, UPDATE `tournaments.end_date` and re-run cascade with extended day range.
- **D-08:** If organizer declines extension, show a warning that some matches could not be scheduled and leave them with their best-effort times.

### Conflict Detection
- **D-09:** After cascade recalculation completes, scan ALL tournament matches (not just the resumed court) for team time overlaps across courts
- **D-10:** A conflict = same team_id (team1_id or team2_id) has two matches on different courts where time ranges overlap (start_time to start_time + duration)
- **D-11:** Display conflicts as a dismissible alert section at the top of the CourtCard or in a modal summary after resume, showing: team name, match 1 details (court + time), match 2 details (court + time)
- **D-12:** Conflict detection is advisory only — organizer resolves manually (per out-of-scope decision: no automatic resolution)

### Resume Notifications
- **D-13:** On successful resume + cascade, send notifications to all players with pending matches on the resumed court
- **D-14:** Notification message includes the player's updated next match time: "La cancha {name} ha sido reanudada. Tu proximo partido: {time} en {court}."
- **D-15:** Notifications sent immediately after cascade completes (no separate confirmation step)

### Claude's Discretion
- Exact implementation of spill-over detection (whether to modify recalculateCourt or wrap it)
- Conflict detection algorithm efficiency (acceptable to scan all matches since tournament size is small)
- Visual styling of conflict alerts (follow existing warning/alert patterns)
- Whether to batch DB updates or use individual UPDATE calls (follow existing cascadeSchedulePersistence pattern)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cascade Engine (v1.0)
- `src/lib/cascadeRecalculator.js` — Pure recalculation engine: recalculateCourt({ courtId, actualEndTime, courtMatches, court, tournamentDays }). Handles break windows, day overflow, match ordering.
- `src/lib/cascadeRecalculator.test.mjs` — 12 tests covering break handling, day overflow, multi-day cascading
- `src/lib/cascadeSchedulePersistence.js` — DB layer: applyCascadeRecalculation(supabase, tournamentId, matchId). Fetches court + matches + tournament days, calls engine, batch-updates.

### Setback Persistence (Phase 5)
- `src/lib/setbackPersistence.js` — resolveSetback(supabase, setbackId), getActiveSetback, createSetback
- `src/lib/notificationPersistence.js` — createBulkNotifications for player notifications

### Resume Button (Phase 6)
- `src/components/TournamentActive/CourtCard.jsx` — handleResume() calls resolveSetback + onDataRefresh. This is the wiring point for cascade.

### Score Save Flow (v1.0 reference)
- `src/components/Scoreboard/ScoreboardPage.jsx` — Lines 229, 266: calls applyCascadeRecalculation after saving match result. Pattern to follow for resume cascade.

### Task Specification
- `tasks/TASK-7.md` — Full spec for court setback management including resume flow and conflict detection

### Design System
- `DESIGN-ARCHITECTURE.md` — Color tokens, spacing, typography conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `recalculateCourt()`: Pure function — can be called with any anchor time, not just actual_end_time from a completed match
- `applyCascadeRecalculation()`: Pattern for fetching court data + tournament days and persisting updates — can be adapted for resume flow
- `resolveSetback()`: Already marks setback as resolved with ended_at timestamp
- `createBulkNotifications()`: Ready for sending resume notifications to affected players

### Established Patterns
- Cascade persistence: fetch court constraints, fetch all court matches, generate tournament days array, call engine, batch UPDATE
- Notification sending: collect unique player IDs from match registrations, build message array, call createBulkNotifications
- Modal pattern: createPortal with body scroll lock (ScoreInputModal, SetbackFormModal)

### Integration Points
- `CourtCard.jsx` handleResume(): add cascade call after resolveSetback succeeds
- `cascadeSchedulePersistence.js`: add new `applyCascadeOnResume()` function
- `ActiveTournamentPage.jsx`: may need to pass tournament date info to CanchasView for spill-over detection
- `cascadeRecalculator.js`: may need to handle case where tournamentDays runs out (spill-over beyond end_date)

</code_context>

<specifics>
## Specific Ideas

- The cascade engine already works — resume just uses "now" as anchor instead of a match end time
- Conflict detection is a new capability: scan all matches for same-team overlap across courts
- Spill-over is the edge case where cascade runs out of tournament days — need to either extend days or warn organizer
- Keep the resume flow fast: resolve setback, cascade, notify, refresh — all in one button tap

</specifics>

<deferred>
## Deferred Ideas

- Bell icon and notification panel UI -> Phase 8
- Automatic cross-court conflict resolution -> v2 (CONF-03)
- Push notifications -> v2 (NOTF-05)

</deferred>

---

*Phase: 07-reanudacion-y-deteccion-de-conflictos*
*Context gathered: 2026-04-02*
