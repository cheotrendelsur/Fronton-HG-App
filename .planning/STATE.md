# Project State — FRONTÓN HGV Rediseño Visual

## Project Reference

**What This Is:** Transformación visual completa de RacketTourneys — migrar de tema oscuro neon-verde a identidad mixta (dark auth / light interior) con colores y escudo de la Comisión de Frontón HGV.

**Core Value:** La app debe sentirse identitaria y gallega desde el primer segundo.

## Current Position

- **Phase:** 0 of 7 — Setup complete, ready to execute Phase 1
- **Plan:** N/A — No plans created yet
- **Status:** Initialized — all artifacts created, research complete

## Progress

```
[░░░░░░░░░░░░░░░░░░░░] 0%

Phase 1: Design Tokens & Config Base       [PENDING]
Phase 2: Splash Screen + Brand Assets      [PENDING]
Phase 3: Auth & Onboarding (Dark Zone)     [PENDING]
Phase 4: Layout Shell (Header + Nav)       [PENDING]
Phase 5: Dashboard & Tournaments           [PENDING]
Phase 6: TournamentsDashboard Components   [PENDING]
Phase 7: ScoringSystem + Admin + PWA       [PENDING]
```

## Recent Decisions

| Decision | Rationale |
|----------|-----------|
| Keep `neon-*` token NAMES, change hex values | 344 usages across 29 files — rename would require touching every component |
| Add `neon-900/700/800` aliases to celeste | ScoringSystem ACTIVE/INACTIVE string constants depend on these tokens |
| sessionStorage for splash first-load flag | Shows splash once per browser session; appropriate for periodic login pattern |
| No animation library for splash | Native CSS keyframes handle it; no need for 60KB Framer Motion for 2s effect |
| Pearl/light-zone tokens added (not renamed) | Interior light zone (#F2F3F5) has no token coverage yet — must add, not just change |
| PWA icons need separate 'any' + 'maskable' manifest entries | Current "any maskable" combined format fails Lighthouse audits |
| theme_color must be updated in 3 synchronized locations | vite.config.js + index.html + index.css all define it independently |

## Key Pitfalls (from research)

1. **35 hardcoded hex values in 7 files** — invisible to Tailwind token updates, must be hunted manually
2. **Layout.jsx has 7+ inline style props** — highest risk single file
3. **#b8f533 lime-green leftover in App.jsx SVG** — must be fixed in Phase 2
4. **ProtectedRoute.jsx error card** — dark container may look wrong on light interior background
5. **Phase 4 requires 3-role nav testing** (player, organizer, admin)

## Pending Todos

None.

## Blockers / Concerns

- `lobo.png` must exist at `src/assets/lobo.png` before Phase 2 — verify asset availability

## Session Continuity

Last session: 2026-03-30
Stopped at: Initialization complete — all artifacts created
Next action: `/gsd:plan-phase 1` to plan Design Tokens & Config Base

## Artifacts Created

| Artifact | Status |
|----------|--------|
| .planning/PROJECT.md | ✓ Created |
| .planning/config.json | ✓ Created |
| .planning/REQUIREMENTS.md | ✓ Created |
| .planning/research/STACK.md | ✓ Created |
| .planning/research/FEATURES.md | ✓ Created |
| .planning/research/ARCHITECTURE.md | ✓ Created |
| .planning/research/PITFALLS.md | ✓ Created |
| .planning/research/SUMMARY.md | ✓ Created |
| .planning/ROADMAP.md | ✓ Created |
| .planning/STATE.md | ✓ Created |
