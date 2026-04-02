# Phase 4: Integration and Compatibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 04-integration-and-compatibility
**Areas discussed:** Cascade call placement, Player page refresh, Build & regression scope

---

## Cascade Call Placement

### Q1: Where should applyCascadeRecalculation be called?

| Option | Description | Selected |
|--------|-------------|----------|
| After save, before loadData | Call cascade right after score saved, then loadData fetches updated times | ✓ |
| After save, after loadData | Let loadData run first, then cascade separately | |
| You decide | Claude picks best placement | |

**User's choice:** After save, before loadData (Recommended)
**Notes:** Simplest approach — loadData already refetches everything, so cascade must persist before that.

### Q2: If cascade fails but score saved successfully?

| Option | Description | Selected |
|--------|-------------|----------|
| Silent — log and continue | Non-critical, log to console, show success banner | ✓ |
| Warning banner | Show yellow warning to organizer | |
| Block and retry | Show error and offer retry | |

**User's choice:** Silent — log and continue (Recommended)
**Notes:** Score is the critical operation. Consistent with Phase 2 precedent where actual_end_time failure is silently ignored.

---

## Player Page Refresh

### Q1: How should players see updated match times?

| Option | Description | Selected |
|--------|-------------|----------|
| On page load/refresh only | Fetches from DB on mount, simple, no new infra | ✓ |
| Auto-refresh on tab focus | visibilitychange listener to refetch on return | |
| Real-time subscription | Supabase real-time push for instant updates | |

**User's choice:** On page load/refresh only (Recommended)
**Notes:** ActiveTournamentPage already fetches from DB on mount. Matches VIS-02 requirement exactly.

---

## Build & Regression Scope

### Q1: How thorough should compatibility verification be?

| Option | Description | Selected |
|--------|-------------|----------|
| npm run build + import check | Production build to catch compile/import errors | ✓ |
| Build + manual smoke test checklist | Build plus documented manual flow verification | |
| Build + automated test run | Build plus full test suite | |

**User's choice:** npm run build + import check (Recommended)
**Notes:** Only adding a function call, not modifying existing logic.

### Q2: Run existing cascadeRecalculator tests?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, run vitest | Confirm Phase 3 tests still pass | ✓ |
| No, just build | Build is sufficient | |

**User's choice:** Yes, run vitest (Recommended)
**Notes:** Quick confidence check that wiring didn't break the engine.

---

## Claude's Discretion

- Exact placement of cascade call within group-phase success branch
- try/catch vs .then/.catch pattern for cascade call
- Console log format for cascade failures

## Deferred Ideas

None — discussion stayed within phase scope
