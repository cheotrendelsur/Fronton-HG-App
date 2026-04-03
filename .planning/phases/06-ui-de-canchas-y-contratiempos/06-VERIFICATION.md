---
phase: 06-ui-de-canchas-y-contratiempos
verified: 2026-04-02T00:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 6: UI de Canchas y Contratiempos — Verification Report

**Phase Goal:** Organizers can see all courts with live status, declare setbacks with a form, and the paused state is clearly communicated; a warning appears when recording a result on a paused court
**Verified:** 2026-04-02
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                               | Status     | Evidence                                                                 |
|----|-----------------------------------------------------------------------------------------------------|------------|--------------------------------------------------------------------------|
| 1  | A "Canchas" tab appears as the 3rd tab in ActiveTournamentPage                                      | VERIFIED   | Line 186 of ActiveTournamentPage.jsx: `{ key: 'canchas', label: 'Canchas' }`; rendered at line 226 |
| 2  | Organizer can swipe horizontally between courts with dots navigation                                | VERIFIED   | CourtSwiper.jsx: scroll-snap container + dots at top, mirrors GroupSwiper pattern |
| 3  | Each court card shows court name, status badge (Operativa/Pausada), and up to 3 pending matches     | VERIFIED   | CourtCard.jsx lines 84–101 (badge), CanchasView.jsx `.slice(0, 3)` |
| 4  | Paused court shows live elapsed timer (mm:ss) updating every second                                 | VERIFIED   | CourtCard.jsx: `setInterval(updateElapsed, 1000)` with `clearInterval` cleanup |
| 5  | Paused court displays "Pausada desde: HH:MM" and the setback type in the badge                      | VERIFIED   | CourtCard.jsx lines 107–108 ("Pausada desde:") and line 92 ("Pausada — {setback_type}") |
| 6  | Paused court matches show "Retrasado" badge                                                         | VERIFIED   | CourtMatchMiniCard.jsx lines 31–38: amber badge when `isPaused` |
| 7  | Paused court shows "Jugadores notificados: N" count                                                 | VERIFIED   | CourtCard.jsx lines 177–180: rendered when `isPaused && activeSetback?.affected_match_ids` |
| 8  | "Reanudar cancha" button appears on paused court and calls resolveSetback                           | VERIFIED   | CourtCard.jsx lines 118–127: green button, `handleResume` calls `resolveSetback(supabase, activeSetback.id)` |
| 9  | Organizer can open a modal with type dropdown and description textarea to declare a setback          | VERIFIED   | SetbackFormModal.jsx: full portal modal, triggered from CourtCard's "Declarar contratiempo" |
| 10 | Type dropdown has exactly 6 options: Lluvia, Mantenimiento, Lesion de jugador, Falla electrica, Problema de equipamiento, Otro | VERIFIED   | SetbackFormModal.jsx lines 7–14: SETBACK_TYPES array |
| 11 | Selecting "Otro" shows a custom text input                                                          | VERIFIED   | SetbackFormModal.jsx lines 150–164: conditional `{setbackType === 'Otro' && (...)}` |
| 12 | Each court has a collapsible setback history accordion with type, description, start/end times, and duration | VERIFIED   | SetbackHistory.jsx: accordion with formatDuration, formatDateTime, start/end/duration display |
| 13 | Tapping "Registrar" on a paused court match shows a Spanish confirmation warning before opening ScoreInputModal | VERIFIED   | ScoreboardPage.jsx: `handleRegister` checks `activeSetbacks[match.court_id]`, shows PausedCourtWarning; user must press "Registrar de todos modos" |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact                                                          | Expected                                                         | Status     | Details                                                   |
|-------------------------------------------------------------------|------------------------------------------------------------------|------------|-----------------------------------------------------------|
| `src/components/TournamentActive/CanchasView.jsx`                 | Canchas tab content view                                         | VERIFIED   | 40 lines, real enrichment logic, exports default          |
| `src/components/TournamentActive/CourtSwiper.jsx`                 | Horizontal scroll-snap swiper for courts                         | VERIFIED   | 97 lines, scroll-snap, dots, CourtCard rendering          |
| `src/components/TournamentActive/CourtCard.jsx`                   | Court card with paused state, timer, resume button               | VERIFIED   | 202 lines, full paused state, timer, modal wiring         |
| `src/components/TournamentActive/CourtMatchMiniCard.jsx`          | Mini match card with Retrasado badge                             | VERIFIED   | 58 lines, Retrasado badge, Por definir fallback           |
| `src/components/TournamentActive/SetbackFormModal.jsx`            | Modal for declaring court setback                                | VERIFIED   | 232 lines, portal, 6 types, 10-char validation, createSetback + createBulkNotifications |
| `src/components/TournamentActive/SetbackHistory.jsx`              | Collapsible setback history accordion                            | VERIFIED   | 121 lines, accordion, formatDuration, Inicio/Fin/Duracion |
| `src/components/Scoreboard/PausedCourtWarning.jsx`                | Confirmation warning dialog for paused court result registration | VERIFIED   | 64 lines, portal, "Esta cancha esta pausada por", two buttons |
| `src/lib/setbackPersistence.js`                                   | Persistence layer for court_setbacks table                       | VERIFIED   | Real Supabase inserts/updates, 4 exported functions       |
| `src/lib/notificationPersistence.js`                              | Bulk notification persistence                                    | VERIFIED   | Real Supabase batch insert into notifications table       |

---

### Key Link Verification

| From                                          | To                                                    | Via                                     | Status   | Details                                                              |
|-----------------------------------------------|-------------------------------------------------------|-----------------------------------------|----------|----------------------------------------------------------------------|
| `src/pages/ActiveTournamentPage.jsx`          | `src/components/TournamentActive/CanchasView.jsx`     | import + render when `activeTab === 'canchas'` | WIRED    | Line 8 import, line 226 render in else branch                       |
| `src/pages/ActiveTournamentPage.jsx`          | `court_setbacks` table                                | supabase query in `loadData`            | WIRED    | Line 130: `.from('court_setbacks').eq('tournament_id', id).eq('status', 'active')` |
| `src/components/TournamentActive/CanchasView.jsx` | `src/components/TournamentActive/CourtSwiper.jsx` | `import CourtSwiper`                    | WIRED    | Line 1 import, line 34 render                                        |
| `src/components/TournamentActive/SetbackFormModal.jsx` | `src/lib/setbackPersistence.js`           | `import { createSetback }`              | WIRED    | Line 4 import, line 39 call in handleSubmit                          |
| `src/components/Scoreboard/ScoreboardPage.jsx` | `court_setbacks` table                               | supabase query for active setbacks      | WIRED    | Line 83: `.from('court_setbacks').eq('tournament_id', ...).eq('status', 'active')` |
| `src/components/TournamentActive/CourtCard.jsx` | `src/components/TournamentActive/SetbackFormModal.jsx` | import and render on button click     | WIRED    | Line 5 import, lines 189–199 conditional render on `showSetbackModal` |
| `src/components/TournamentActive/CourtCard.jsx` | `src/lib/setbackPersistence.js`                    | `import { resolveSetback }`             | WIRED    | Line 3 import, line 64 call in `handleResume`                        |
| `src/components/TournamentActive/CourtCard.jsx` | `src/components/TournamentActive/SetbackHistory.jsx` | `import SetbackHistory`               | WIRED    | Line 6 import, line 185 render                                       |
| `src/components/Scoreboard/ScoreboardPage.jsx` | `src/components/Scoreboard/PausedCourtWarning.jsx`  | `import PausedCourtWarning`             | WIRED    | Line 9 import, lines 350–354 conditional render                      |

---

### Data-Flow Trace (Level 4)

| Artifact                    | Data Variable       | Source                                   | Produces Real Data | Status   |
|-----------------------------|---------------------|------------------------------------------|--------------------|----------|
| `CanchasView.jsx`           | `courts`, `activeSetbacks` | `ActiveTournamentPage.loadData` fetches from `courts` table and `court_setbacks` table | Yes — real Supabase queries | FLOWING |
| `SetbackFormModal.jsx`      | submit result       | `createSetback` → INSERT into `court_setbacks` | Yes — real DB insert | FLOWING |
| `PausedCourtWarning.jsx`    | `setbackType` prop  | `ScoreboardPage.activeSetbacks` from `court_setbacks` query | Yes — real Supabase query | FLOWING |
| `SetbackHistory.jsx`        | `history`           | `getSetbackHistory` → SELECT from `court_setbacks` | Yes — real DB query | FLOWING |

---

### Behavioral Spot-Checks

| Behavior                                    | Check                                                        | Result                                      | Status   |
|---------------------------------------------|--------------------------------------------------------------|---------------------------------------------|----------|
| Vite build compiles without errors          | `npx vite build`                                             | "built in 4.96s", 28 entries precached      | PASS     |
| setbackPersistence exports all 4 functions  | `grep "^export async function" setbackPersistence.js`       | createSetback, resolveSetback, getActiveSetback, getSetbackHistory | PASS     |
| SetbackFormModal contains all 6 type options | `grep` SETBACK_TYPES constant                               | Lluvia, Mantenimiento, Lesion de jugador, Falla electrica, Problema de equipamiento, Otro | PASS     |
| ScoreboardPage intercepts paused courts     | grep `setPendingWarningMatch` in ScoreboardPage.jsx          | Found on 3 lines — state set, warning rendered, and warning canceled | PASS     |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                          | Status       | Evidence                                                              |
|-------------|------------|--------------------------------------------------------------------------------------|--------------|-----------------------------------------------------------------------|
| CANCH-01    | 06-01      | Organizer sees a "Canchas" tab in active tournament page with swipe between courts   | SATISFIED    | 3rd tab in ActiveTournamentPage; CourtSwiper with scroll-snap + dots  |
| CANCH-02    | 06-01      | Each court card shows current status (Operativa/Pausada), name, and upcoming pending matches | SATISFIED    | CourtCard: name header, green/red badge, pendingMatches list          |
| CANCH-03    | 06-03      | Paused court shows live timer (time since pause), delayed match badges, and pause reason | SATISFIED    | CourtCard: setInterval timer, "Retrasado" badge via CourtMatchMiniCard, reason in badge |
| CANCH-04    | 06-03      | Each court shows a collapsible setback history with type, description, start/end times, and duration | SATISFIED    | SetbackHistory.jsx: accordion, formatDateTime, formatDuration, type/description/status |
| CONT-01     | 06-02      | Organizer can declare a setback via modal with type dropdown and description textarea | SATISFIED    | SetbackFormModal.jsx: portal modal, select + textarea, triggered from CourtCard |
| CONT-02     | 06-02      | Setback types include 6 options (Lluvia, Mantenimiento, Lesion de jugador, Falla electrica, Problema de equipamiento, Otro) | SATISFIED    | SetbackFormModal.jsx SETBACK_TYPES constant — exactly 6 entries       |
| CONT-03     | 06-02      | Declaring a setback persists to `court_setbacks` table and marks the court as paused | SATISFIED    | `createSetback` inserts with `status: 'active'`; `ActiveTournamentPage.loadData` re-fetches on `onDataRefresh()` |
| CONT-04     | 06-01      | Only one active setback per court at a time (button disabled if already paused)      | SATISFIED*   | When `isPaused`, the declare button is replaced entirely by "Reanudar cancha" — no second setback can be declared. Implementation exceeds requirement: replaces the button rather than disabling it. |
| CONT-05     | 06-01      | Setback button disabled when court has no pending matches                            | SATISFIED    | CourtCard.jsx lines 138–145: disabled button with "Sin partidos pendientes" when `!hasPending` |
| SEGR-01     | 06-02      | Registering a result on a paused court shows a confirmation warning before proceeding | SATISFIED    | ScoreboardPage `handleRegister` checks `activeSetbacks[match.court_id]`; shows PausedCourtWarning before setting selectedMatch |

*CONT-04 note: The plan's must_have specified the text "Cancha ya pausada" as the disabled button label. The final implementation replaces the button entirely with "Reanudar cancha" when paused — functionally superior (gives a resolution action) while still preventing double-setback declaration. The requirement itself is fully met.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None found | — | — | — |

No TODO/FIXME markers, no empty return stubs, no placeholder implementations detected in phase 06 files. All `placeholder` occurrences in SetbackFormModal.jsx are HTML `placeholder` attributes on form inputs — not stub indicators.

---

### Human Verification Required

#### 1. Canchas tab visible on small screen with 3 tabs

**Test:** Open an active tournament on a mobile viewport. Verify the 3-tab toggle (Inscritos / Clasificacion / Canchas) fits without overflow or text truncation.
**Expected:** All three tab labels are fully visible.
**Why human:** Layout depends on viewport width and font rendering.

#### 2. Live timer updates visually in browser

**Test:** Declare a setback on a court, navigate to Canchas tab. Observe the elapsed timer.
**Expected:** The mm:ss counter increments every second.
**Why human:** JavaScript timer behavior cannot be verified without running the app.

#### 3. "Retrasado" badge visible on court match cards when paused

**Test:** After declaring a setback, navigate to the Canchas tab for the paused court.
**Expected:** Each pending match mini-card shows an amber "Retrasado" badge next to the scheduled time.
**Why human:** Requires a live court_setbacks record with `status: 'active'`.

#### 4. PausedCourtWarning intercepts result registration on paused court

**Test:** Open Marcadores, find a match on a paused court, tap "Registrar →".
**Expected:** PausedCourtWarning dialog appears first; tapping "Registrar de todos modos" proceeds to ScoreInputModal; tapping "Cancelar" dismisses without opening it.
**Why human:** Requires a live court_setbacks record; depends on real interaction flow.

#### 5. SetbackHistory accordion shows history after setback resolution

**Test:** Declare a setback, then resume the court. Open the SetbackHistory accordion on that court.
**Expected:** One resolved entry appears with correct start/end times, duration, and "Resuelto" badge.
**Why human:** Requires live DB data and full round-trip through createSetback + resolveSetback.

---

## Gaps Summary

No gaps found. All 10 requirements are satisfied. All 9 artifacts exist, are substantive, and are correctly wired. All data flows connect to real Supabase operations. The build passes without errors.

The only notable deviation from the Plan 01 must_have is that "Cancha ya pausada" (disabled button text) was superseded by the Plan 03 implementation which replaced the button entirely with "Reanudar cancha" — this is an improvement over the original spec, not a regression.

---

_Verified: 2026-04-02_
_Verifier: Claude (gsd-verifier)_
