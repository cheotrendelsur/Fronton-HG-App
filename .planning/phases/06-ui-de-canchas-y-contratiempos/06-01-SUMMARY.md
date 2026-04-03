---
phase: 06-ui-de-canchas-y-contratiempos
plan: 01
subsystem: court-ui
tags: [react, ui, canchas, swiper, courts, setbacks]
dependency_graph:
  requires: [05-01]
  provides: [CanchasView, CourtSwiper, CourtCard, CourtMatchMiniCard, courts-tab]
  affects: [ActiveTournamentPage, TournamentActive components]
tech_stack:
  added: []
  patterns: [scroll-snap swiper (mirrors GroupSwiper), enriched data objects passed down, disabled button states]
key_files:
  created:
    - src/components/TournamentActive/CanchasView.jsx
    - src/components/TournamentActive/CourtSwiper.jsx
    - src/components/TournamentActive/CourtCard.jsx
    - src/components/TournamentActive/CourtMatchMiniCard.jsx
  modified:
    - src/pages/ActiveTournamentPage.jsx
decisions:
  - CanchasView receives enriched court objects (pendingMatches, activeSetback, categoryMap) rather than raw DB data for clean separation
  - onDeclareSetback prop on CourtCard is a no-op in Plan 01 — Plan 02 will wire the setback declaration modal
metrics:
  duration: 3 minutes
  completed_date: "2026-04-03T01:22:01Z"
  tasks: 2
  files: 5
---

# Phase 06 Plan 01: Canchas Tab UI Foundation Summary

**One-liner:** Canchas tab with horizontal court swiper (scroll-snap + dots), court cards showing Operativa/Pausada badges and smart disabled button states, backed by live court + setback data fetching.

## What Was Built

Added a third "Canchas" tab to `ActiveTournamentPage` (alongside Inscritos and Clasificacion) that shows a swipeable court view. Each court card displays the court name, a green "Operativa" or red "Pausada" status badge, up to 3 upcoming pending matches, and an action button that disables intelligently:

- "Cancha ya pausada" when an active setback exists
- "Sin partidos pendientes" when all matches are completed
- "Declarar contratiempo" (enabled, amber) when the court is operational and has pending matches

The match list uses `CourtMatchMiniCard` which shows the scheduled time, category name, phase/group label, and team names (with "Por definir" fallback for unassigned elimination matches). When the court is paused, each mini card shows a "Retrasado" amber badge.

Data is fetched in `loadData`:
- `courts` table: filtered by tournament_id, ordered by name
- `court_setbacks` table: active setbacks for the tournament, stored as a `courtId → setback` map

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add Canchas tab and court+setback data fetching to ActiveTournamentPage | 6d5bbcd |
| 2 | Create CanchasView, CourtSwiper, CourtCard, CourtMatchMiniCard components | f73f446 |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `onDeclareSetback` prop in CourtCard is a no-op (`court.onDeclareSetback?.()` where `onDeclareSetback` is never passed). Plan 02 will wire the setback declaration modal through this prop. The button renders correctly and is enabled for courts with pending matches and no active setback — it just doesn't open a modal yet.

## Self-Check: PASSED

Files exist:
- src/components/TournamentActive/CanchasView.jsx — FOUND
- src/components/TournamentActive/CourtSwiper.jsx — FOUND
- src/components/TournamentActive/CourtCard.jsx — FOUND
- src/components/TournamentActive/CourtMatchMiniCard.jsx — FOUND
- src/pages/ActiveTournamentPage.jsx (modified) — FOUND

Commits exist:
- 6d5bbcd — FOUND (feat(06-01): add Canchas tab)
- f73f446 — FOUND (feat(06-01): create court components)

Build: vite build passes without errors.
