# Phase 2: Persist Actual End Time - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an `actual_end_time` column to `tournament_matches` and persist the end-time data (from Phase 1's UI) through both save paths: group matches (RPC) and elimination matches (direct UPDATE). This is pure persistence — no schedule recalculation yet (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### DB Column
- **D-01:** Add `actual_end_time` as a nullable `timestamptz` column to `tournament_matches`
- **D-02:** Column is nullable — existing match rows are unaffected (no backfill needed)
- **D-03:** Create a new Supabase migration file for the ALTER TABLE

### RPC Modification Strategy
- **D-04:** Do NOT modify the existing `save_match_result` RPC — it's stable and other flows depend on it
- **D-05:** For group matches: after the RPC call succeeds, run a separate UPDATE to set `actual_end_time` on the match row
- **D-06:** For elimination matches: add `actual_end_time` to the existing direct UPDATE that already sets score/winner/status

### Timestamp Construction
- **D-07:** Combine the `endTime.date` (YYYY-MM-DD) and `endTime.time` (HH:MM) into a full ISO timestamp string on the client side in `handleSaveResult` before passing to persistence
- **D-08:** Format: `${endTime.date}T${endTime.time}:00` — produces `2026-04-02T14:30:00` which PostgreSQL accepts as timestamptz
- **D-09:** The combined timestamp is passed to `scorePersistence.saveMatchResult` as a new parameter, and used directly in the elimination UPDATE

### Integration with Phase 1
- **D-10:** Phase 1 already passes `endTime = { date, time }` as third argument to `handleSaveResult` in ScoreboardPage
- **D-11:** The `scorePersistence.saveMatchResult` function signature is extended with an optional `actualEndTime` parameter

### Claude's Discretion
- Whether to create a helper function for timestamp combination or inline it
- Exact error handling if the separate UPDATE for actual_end_time fails (non-critical — score already saved)
- Whether to add the column via Supabase MCP tool or just document the migration SQL

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Persistence (primary modification targets)
- `src/lib/scorePersistence.js` — `saveMatchResult` function that calls the RPC; needs `actualEndTime` parameter + post-RPC UPDATE
- `src/components/Scoreboard/ScoreboardPage.jsx` — `handleSaveResult` at line 141; combines endTime and calls persistence; elimination UPDATE at line 192

### Database
- `supabase/migrations/create_rpc_save_match_result.sql` — Existing RPC definition (do NOT modify)
- `supabase/migrations/` — Location for new migration file

### Task Specification
- `tasks/TASK-6.md` — Section 2 defines persistence requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scorePersistence.saveMatchResult()` — Group match save via RPC; extend with actualEndTime param + post-RPC UPDATE
- `ScoreboardPage.handleSaveResult()` — Already receives `endTime` as 3rd param from Phase 1; line 142 has comment marking Phase 2 work

### Established Patterns
- Group matches: `saveMatchResult()` calls `supabase.rpc('save_match_result', {...})` then checks success
- Elimination matches: direct `supabase.from('tournament_matches').update({...}).eq('id', match.id)`
- Migrations: SQL files in `supabase/migrations/` with descriptive names
- Supabase client: singleton from `src/lib/supabaseClient.js`

### Integration Points
- `handleSaveResult` line 161: calls `saveMatchResult(supabase, match.id, result, winnerId, team1Member.id, team2Member.id, tournament.scoring_config)` — add actualEndTime
- `handleSaveResult` line 192-200: elimination direct UPDATE — add actual_end_time field
- Post-save: `loadData()` refetches — no additional work needed for UI refresh

</code_context>

<specifics>
## Specific Ideas

- The Phase 1 comment at line 142 explicitly says "persisted in Phase 2" — this is the insertion point
- Keep the RPC untouched; a separate UPDATE after RPC success is safer and simpler
- The column must be `timestamptz` (not just `time`) to capture both date and time for historical records

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-persist-actual-end-time*
*Context gathered: 2026-04-02*
