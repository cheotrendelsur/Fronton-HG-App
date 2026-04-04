-- ============================================================
-- TASK-9: Nuevas tablas y modificaciones
-- ============================================================

-- 1. Tabla de dias activos del torneo
CREATE TABLE tournament_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  day_date date NOT NULL,
  day_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, day_date)
);

-- 2. Tabla de horarios de cancha por dia de la semana
CREATE TABLE court_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0=domingo, 1=lunes, 2=martes, 3=miercoles, 4=jueves, 5=viernes, 6=sabado
  available_from time NOT NULL,
  available_to time NOT NULL,
  break_start time,
  break_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(court_id, day_of_week)
);

-- 3. RLS policies
ALTER TABLE tournament_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tournament_days" ON tournament_days FOR SELECT USING (true);
CREATE POLICY "Organizers can manage tournament_days" ON tournament_days FOR ALL USING (true);

ALTER TABLE court_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read court_schedules" ON court_schedules FOR SELECT USING (true);
CREATE POLICY "Organizers can manage court_schedules" ON court_schedules FOR ALL USING (true);
