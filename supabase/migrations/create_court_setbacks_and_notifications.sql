-- ============================================================================
-- PHASE 5 — Tablas de court_setbacks y notifications + RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. court_setbacks
CREATE TABLE court_setbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  setback_type varchar NOT NULL,
  description text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status varchar NOT NULL DEFAULT 'active',
  affected_match_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type varchar NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_court_setbacks_tournament_court ON court_setbacks(tournament_id, court_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE court_setbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── court_setbacks ──

CREATE POLICY "court_setbacks_select"
  ON court_setbacks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "court_setbacks_insert"
  ON court_setbacks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = court_setbacks.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "court_setbacks_update"
  ON court_setbacks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = court_setbacks.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "court_setbacks_delete"
  ON court_setbacks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = court_setbacks.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- ── notifications ──

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = notifications.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
