-- ============================================================================
-- TASK-2 FASE 1 — Tablas de estructura de torneo (grupos, partidos, brackets)
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. tournament_config
CREATE TABLE tournament_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  config jsonb NOT NULL,
  status varchar NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id)
);

-- 2. tournament_groups
CREATE TABLE tournament_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  group_letter varchar(2) NOT NULL,
  group_number integer NOT NULL,
  phase varchar NOT NULL DEFAULT 'group_phase',
  status varchar NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. tournament_group_members
CREATE TABLE tournament_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  draw_position integer NOT NULL,
  matches_played integer NOT NULL DEFAULT 0,
  matches_won integer NOT NULL DEFAULT 0,
  matches_lost integer NOT NULL DEFAULT 0,
  sets_won integer NOT NULL DEFAULT 0,
  sets_lost integer NOT NULL DEFAULT 0,
  games_won integer NOT NULL DEFAULT 0,
  games_lost integer NOT NULL DEFAULT 0,
  points_scored integer NOT NULL DEFAULT 0,
  points_against integer NOT NULL DEFAULT 0,
  final_rank integer,
  qualified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, registration_id)
);

-- 4. tournament_matches
CREATE TABLE tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  group_id uuid REFERENCES tournament_groups(id) ON DELETE CASCADE,
  phase varchar NOT NULL,
  match_number integer NOT NULL,
  team1_id uuid REFERENCES tournament_registrations(id),
  team2_id uuid REFERENCES tournament_registrations(id),
  court_id uuid REFERENCES courts(id),
  scheduled_date date,
  scheduled_time time,
  estimated_duration_minutes integer,
  status varchar NOT NULL DEFAULT 'scheduled',
  score_team1 jsonb,
  score_team2 jsonb,
  winner_id uuid REFERENCES tournament_registrations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. tournament_bracket
CREATE TABLE tournament_bracket (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  phase varchar NOT NULL,
  round_number integer NOT NULL,
  position integer NOT NULL,
  team1_id uuid REFERENCES tournament_registrations(id),
  team2_id uuid REFERENCES tournament_registrations(id),
  team1_source_group uuid REFERENCES tournament_groups(id),
  team2_source_group uuid REFERENCES tournament_groups(id),
  match_id uuid REFERENCES tournament_matches(id),
  winner_id uuid REFERENCES tournament_registrations(id),
  status varchar NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. tournament_best_positioned
CREATE TABLE tournament_best_positioned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  source_group_id uuid NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  original_position integer NOT NULL,
  matches_won integer NOT NULL DEFAULT 0,
  matches_lost integer NOT NULL DEFAULT 0,
  sets_won integer NOT NULL DEFAULT 0,
  sets_lost integer NOT NULL DEFAULT 0,
  games_won integer NOT NULL DEFAULT 0,
  games_lost integer NOT NULL DEFAULT 0,
  points_scored integer NOT NULL DEFAULT 0,
  points_against integer NOT NULL DEFAULT 0,
  set_diff integer NOT NULL DEFAULT 0,
  game_diff integer NOT NULL DEFAULT 0,
  point_diff integer NOT NULL DEFAULT 0,
  ranking integer,
  qualified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en las 6 tablas
ALTER TABLE tournament_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_bracket ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_best_positioned ENABLE ROW LEVEL SECURITY;

-- ── tournament_config ──

CREATE POLICY "tournament_config_select"
  ON tournament_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournament_config_insert"
  ON tournament_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_config.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_config_update"
  ON tournament_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_config.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_config_delete"
  ON tournament_config FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_config.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- ── tournament_groups ──

CREATE POLICY "tournament_groups_select"
  ON tournament_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournament_groups_insert"
  ON tournament_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_groups.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_groups_update"
  ON tournament_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_groups.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_groups_delete"
  ON tournament_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_groups.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- ── tournament_group_members ──

CREATE POLICY "tournament_group_members_select"
  ON tournament_group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournament_group_members_insert"
  ON tournament_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournament_groups
      JOIN tournaments ON tournaments.id = tournament_groups.tournament_id
      WHERE tournament_groups.id = tournament_group_members.group_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_group_members_update"
  ON tournament_group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_groups
      JOIN tournaments ON tournaments.id = tournament_groups.tournament_id
      WHERE tournament_groups.id = tournament_group_members.group_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_group_members_delete"
  ON tournament_group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_groups
      JOIN tournaments ON tournaments.id = tournament_groups.tournament_id
      WHERE tournament_groups.id = tournament_group_members.group_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- ── tournament_matches ──

CREATE POLICY "tournament_matches_select"
  ON tournament_matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournament_matches_insert"
  ON tournament_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_matches.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_matches_update"
  ON tournament_matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_matches.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_matches_delete"
  ON tournament_matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_matches.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- ── tournament_bracket ──

CREATE POLICY "tournament_bracket_select"
  ON tournament_bracket FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournament_bracket_insert"
  ON tournament_bracket FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_bracket.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_bracket_update"
  ON tournament_bracket FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_bracket.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_bracket_delete"
  ON tournament_bracket FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_bracket.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

-- ── tournament_best_positioned ──

CREATE POLICY "tournament_best_positioned_select"
  ON tournament_best_positioned FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournament_best_positioned_insert"
  ON tournament_best_positioned FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_best_positioned.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_best_positioned_update"
  ON tournament_best_positioned FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_best_positioned.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "tournament_best_positioned_delete"
  ON tournament_best_positioned FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_best_positioned.tournament_id
        AND tournaments.organizer_id = auth.uid()
    )
  );
