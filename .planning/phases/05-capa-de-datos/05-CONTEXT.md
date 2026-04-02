# Phase 5: Capa de Datos - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the database infrastructure for court setbacks and in-app notifications: two new tables (`court_setbacks`, `notifications`), RLS policies, and CRUD helper functions in `src/lib/`. This phase delivers data access only — no UI, no business logic beyond basic CRUD.

</domain>

<decisions>
## Implementation Decisions

### Notification Schema
- **D-01:** Use TASK-7 schema: `message text NOT NULL`, `type varchar NOT NULL DEFAULT 'general'`, `read boolean NOT NULL DEFAULT false`. NOT the ROADMAP's `payload(jsonb)` + `read_at` design.
- **D-02:** Notification types: `'setback'`, `'schedule_change'`, `'general'`

### Court Setbacks Schema
- **D-03:** Follow TASK-7 spec exactly: `court_setbacks` table with `id`, `tournament_id`, `court_id`, `setback_type varchar NOT NULL`, `description text NOT NULL`, `started_at timestamptz NOT NULL DEFAULT now()`, `ended_at timestamptz`, `status varchar NOT NULL DEFAULT 'active'`, `affected_match_ids uuid[]`, `created_at timestamptz NOT NULL DEFAULT now()`
- **D-04:** Status values: `'active'` and `'resolved'`

### CRUD Helper Organization
- **D-05:** Two separate files following existing project convention: `src/lib/setbackPersistence.js` and `src/lib/notificationPersistence.js`
- **D-06:** Both files import from `supabaseClient.js` singleton (same pattern as `scorePersistence.js`, `cascadeSchedulePersistence.js`)

### Migration Approach
- **D-07:** SQL migration files in `supabase/migrations/` applied via Supabase Dashboard SQL Editor (existing project pattern — no CLI migrations)
- **D-08:** One migration file for both tables + RLS policies

### RLS Policies
- **D-09:** `court_setbacks`: SELECT for all authenticated users, INSERT/UPDATE/DELETE only for tournament organizer (same pattern as tournament_config, tournament_groups, etc.)
- **D-10:** `notifications`: SELECT only where `user_id = auth.uid()` (players see only their own), INSERT for organizers of the tournament

### Claude's Discretion
- Exact RLS policy SQL syntax (follow existing patterns in `create_tournament_structure_tables.sql` and `fix_rls_policies_registrations_progress.sql`)
- Helper function signatures and error handling approach
- Whether to include ON DELETE CASCADE on foreign keys (follow existing convention)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema & Migrations
- `supabase/migrations/create_tournament_structure_tables.sql` — Table creation pattern, RLS policy pattern for tournament-scoped tables
- `supabase/migrations/fix_rls_policies_registrations_progress.sql` — Additional RLS policy examples
- `supabase/migrations/add_actual_end_time_to_matches.sql` — ALTER TABLE migration pattern (v1.0)

### Persistence Layer Patterns
- `src/lib/scorePersistence.js` — CRUD helper pattern: Supabase queries, error handling, function signatures
- `src/lib/cascadeSchedulePersistence.js` — Complex persistence with multiple queries, court data fetching pattern
- `src/lib/supabaseClient.js` — Supabase client singleton import pattern

### Task Specification
- `tasks/TASK-7.md` — Full table schemas for `court_setbacks` and `notifications` (sections "Base de datos")

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabaseClient.js`: Supabase singleton — all persistence files import from here
- Existing migration files: Provide exact SQL patterns for table creation, RLS, and constraints

### Established Patterns
- Persistence files are pure async functions taking `supabaseClient` as first arg
- RLS: authenticated SELECT, organizer INSERT/UPDATE/DELETE (checked via `tournaments.organizer_id = auth.uid()`)
- Foreign keys use `ON DELETE CASCADE` for tournament-scoped entities
- UUID primary keys with `gen_random_uuid()`
- `created_at timestamptz NOT NULL DEFAULT now()` on all tables

### Integration Points
- New persistence files will be imported by Phase 6 (UI) and Phase 7 (resume logic)
- `notifications` table will be queried by Phase 8 (notification UI)
- `court_setbacks` table will be queried by `ActiveTournamentPage` in Phase 6

</code_context>

<specifics>
## Specific Ideas

- Follow TASK-7.md table definitions verbatim for column names and types
- `affected_match_ids uuid[]` is a PostgreSQL array column storing match IDs affected by the setback

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-capa-de-datos*
*Context gathered: 2026-04-02*
