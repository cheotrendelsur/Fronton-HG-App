# Phase 4: Integration and Compatibility - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the cascade recalculation engine (Phase 3) into both save flows (group + elimination) in ScoreboardPage, ensure the scoreboard and active tournament pages reflect updated times immediately after save, and verify all existing tournament flows remain unbroken with a clean production build.

</domain>

<decisions>
## Implementation Decisions

### Cascade Call Placement
- **D-01:** Call `applyCascadeRecalculation(supabase, tournamentId, matchId)` in `handleSaveResult` after the score is persisted but BEFORE `loadData()` — so when `loadData()` refetches, it picks up the already-updated times
- **D-02:** Call cascade in BOTH paths: after group phase save (after RPC + classification logic) and after elimination save (after advanceBracketWinner)
- **D-03:** The cascade call uses the same `match.id` that was just saved — `applyCascadeRecalculation` fetches the `actual_end_time` and `court_id` from the DB internally

### Error Handling
- **D-04:** If cascade fails but score was saved successfully, treat as non-critical: log error to console, show success banner to organizer, continue normally
- **D-05:** Do NOT block the save flow or show error banners for cascade failures — the score is the critical operation

### Player Page Refresh (VIS-02)
- **D-06:** ActiveTournamentPage already fetches `scheduled_date`/`scheduled_time` from DB on mount — no changes needed
- **D-07:** Players see updated times when they open or refresh the page — no auto-refresh, no real-time subscriptions
- **D-08:** This satisfies VIS-02 ("Players viewing the tournament see updated match times when they open or refresh")

### Build & Regression Verification
- **D-09:** Run `npm run build` to catch compile/import errors — verify all existing imports still resolve
- **D-10:** Run `npx vitest` to confirm Phase 3 cascade engine tests still pass after wiring
- **D-11:** No runtime manual smoke testing required — the integration adds a single function call without modifying existing logic

### Claude's Discretion
- Exact placement of the cascade call within the group-phase success branch (after classification check vs before)
- Whether to wrap the cascade call in try/catch or use .then/.catch pattern
- Console log format for cascade failures

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Save Flow (primary integration target)
- `src/components/Scoreboard/ScoreboardPage.jsx` — `handleSaveResult` at line 140; both group and elimination save paths; `loadData()` at line 225
- `src/lib/scorePersistence.js` — `saveMatchResult` for group matches; `checkGroupPhaseComplete` for classification trigger

### Cascade Engine (Phase 3 output — to be wired in)
- `src/lib/cascadeSchedulePersistence.js` — `applyCascadeRecalculation(supabaseClient, tournamentId, matchId)` — the single function to call
- `src/lib/cascadeRecalculator.js` — `recalculateCourt()` pure engine (called internally by persistence layer)

### Player View (verify VIS-02)
- `src/pages/ActiveTournamentPage.jsx` — Fetches match data including `scheduled_date`/`scheduled_time` from DB on mount (line 102)

### Bracket Progression (ISO-03 — must not break)
- `src/lib/postGroupPhase.js` — `processGroupPhaseCompletion`, `advanceBracketWinner`, `checkAllCategoriesComplete`

### Design Reference
- `DESIGN-ARCHITECTURE.md` — Design system and visual conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `applyCascadeRecalculation()` — Complete persistence layer that fetches court, matches, tournament days, runs cascade, and batch-updates DB. Ready to call with just (supabase, tournamentId, matchId)
- `loadData()` in ScoreboardPage — Already refetches all match data after every save. Once cascade persists to DB, loadData picks up updated times automatically

### Established Patterns
- Group save: RPC → post-RPC UPDATE for actual_end_time → classification check → loadData
- Elimination save: direct UPDATE → advanceBracketWinner → checkAllCategoriesComplete → loadData
- Error handling: `setBanner({ type: 'error', text: ... })` for user-facing errors, console for non-critical
- Non-critical failures: Phase 2 set precedent — actual_end_time post-RPC UPDATE failure is silently ignored

### Integration Points
- Group path: Insert cascade call after line 191 (end of classification check block) but before line 225 (loadData)
- Elimination path: Insert cascade call after line 221 (checkAllCategoriesComplete) but before line 225 (loadData)
- Import `applyCascadeRecalculation` from `../lib/cascadeSchedulePersistence.js` at top of ScoreboardPage

</code_context>

<specifics>
## Specific Ideas

- The integration is minimal — a single import + two function calls (one per save path)
- loadData() already handles UI refresh — no additional state management needed
- Phase 3 tests (`cascadeRecalculator.test.mjs`) serve as regression tests for the engine

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-integration-and-compatibility*
*Context gathered: 2026-04-02*
