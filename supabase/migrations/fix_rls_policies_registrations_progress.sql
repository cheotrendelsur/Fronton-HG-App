-- ============================================================================
-- FIX: RLS policies for profiles, tournament_registrations and tournament_progress
-- These tables have RLS enabled but missing policies, causing queries to
-- return 0 rows from the frontend (anon/authenticated role).
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────

-- SELECT: any authenticated user can read any profile (usernames are public)
-- This is needed so organizers can see player names in registrations.
-- Use IF NOT EXISTS pattern: drop-if-exists then create
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_authenticated'
  ) THEN
    CREATE POLICY "profiles_select_authenticated"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ── tournament_registrations ────────────────────────────────────────────────

-- SELECT: any authenticated user can see registrations
CREATE POLICY "tournament_registrations_select"
  ON tournament_registrations FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: any authenticated user can register (players register themselves)
CREATE POLICY "tournament_registrations_insert"
  ON tournament_registrations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: only the organizer of the tournament can update (approve/reject)
CREATE POLICY "tournament_registrations_update"
  ON tournament_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_registrations.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- DELETE: only the organizer of the tournament can delete
CREATE POLICY "tournament_registrations_delete"
  ON tournament_registrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_registrations.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- ── tournament_progress ─────────────────────────────────────────────────────

-- SELECT: any authenticated user can see progress
CREATE POLICY "tournament_progress_select"
  ON tournament_progress FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: only the organizer of the tournament
CREATE POLICY "tournament_progress_insert"
  ON tournament_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_progress.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- UPDATE: only the organizer of the tournament
CREATE POLICY "tournament_progress_update"
  ON tournament_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_progress.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- DELETE: only the organizer of the tournament
CREATE POLICY "tournament_progress_delete"
  ON tournament_progress FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_progress.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );
