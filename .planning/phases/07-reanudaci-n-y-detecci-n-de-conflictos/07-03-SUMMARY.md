---
phase: 07-reanudaci-n-y-detecci-n-de-conflictos
plan: 03
subsystem: ui
tags: [resume, cascade, spill-over, conflicts, modal, court-card]

requires:
  - phase: 07-reanudaci-n-y-detecci-n-de-conflictos
    plan: 01
    provides: "applyCascadeOnResume function"
  - phase: 07-reanudaci-n-y-detecci-n-de-conflictos
    plan: 02
    provides: "detectTeamConflicts function"
provides:
  - "DateExtensionModal component for spill-over date extension"
  - "ConflictAlert component for cross-court team conflict display"
  - "CourtCard handleResume wired to applyCascadeOnResume + spill-over callback"
  - "CanchasView conflict detection + date extension modal + cascade re-run"
  - "ActiveTournamentPage fetches start_date/end_date"

key-files:
  created:
    - src/components/TournamentActive/DateExtensionModal.jsx
    - src/components/TournamentActive/ConflictAlert.jsx
  modified:
    - src/components/TournamentActive/CourtCard.jsx
    - src/components/TournamentActive/CanchasView.jsx
    - src/components/TournamentActive/CourtSwiper.jsx
    - src/pages/ActiveTournamentPage.jsx

deviations: []
---

## Summary

Wired the resume cascade, spill-over date extension prompt, and conflict detection alerts into the UI. CourtCard's handleResume calls applyCascadeOnResume after resolving the setback, passes spillOver info to CanchasView via onSpillOver callback with courtId. CanchasView manages conflict state via detectTeamConflicts on every matches change, shows ConflictAlert banners, and handles DateExtensionModal with cascade re-run after date extension confirmation per D-07. ActiveTournamentPage now fetches start_date/end_date for spill-over handling.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create DateExtensionModal and ConflictAlert standalone components | 513196c | Done |
| 2 | Wire CourtCard handleResume, CanchasView conflicts/spill-over, CourtSwiper passthrough, ActiveTournamentPage dates | c136c67 | Done |
| 3 | Verify resume flow, spill-over prompt, and conflict alerts | — | Approved by human |

## Verification

- `npx vite build` succeeds with no errors
- Human verified: resume flow, match time updates, spill-over modal, conflict alerts

## Self-Check: PASSED
