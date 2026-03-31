-- ============================================================================
-- TASK-2 FASE 5 — RPC: Persistencia atómica de estructura de torneo
-- La función es transaccional por defecto en PostgreSQL.
-- Si cualquier statement falla, todo hace rollback automáticamente.
-- Los UUIDs de grupos son generados por el frontend y vienen en el payload.
-- ============================================================================

CREATE OR REPLACE FUNCTION persist_tournament_structure(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id uuid;
  v_config        jsonb;
  v_group         jsonb;
  v_member        jsonb;
  v_match         jsonb;
  v_bracket_slot  jsonb;
BEGIN
  -- Extraer tournament_id y config
  v_tournament_id := (p_payload->>'tournament_id')::uuid;
  v_config        := p_payload->'config';

  -- 1. INSERT tournament_config
  INSERT INTO tournament_config (tournament_id, config, status)
  VALUES (v_tournament_id, v_config, 'executed');

  -- 2. INSERT tournament_groups (UUIDs vienen del frontend)
  FOR v_group IN SELECT * FROM jsonb_array_elements(p_payload->'groups')
  LOOP
    INSERT INTO tournament_groups (id, tournament_id, category_id, group_letter, group_number)
    VALUES (
      (v_group->>'id')::uuid,
      (v_group->>'tournament_id')::uuid,
      (v_group->>'category_id')::uuid,
      v_group->>'group_letter',
      (v_group->>'group_number')::integer
    );
  END LOOP;

  -- 3. INSERT tournament_group_members
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_payload->'group_members')
  LOOP
    INSERT INTO tournament_group_members (group_id, registration_id, draw_position)
    VALUES (
      (v_member->>'group_id')::uuid,
      (v_member->>'registration_id')::uuid,
      (v_member->>'draw_position')::integer
    );
  END LOOP;

  -- 4. INSERT tournament_matches (includes optional schedule fields + optional frontend UUID)
  FOR v_match IN SELECT * FROM jsonb_array_elements(p_payload->'matches')
  LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, category_id, group_id, phase,
      match_number, team1_id, team2_id, status,
      court_id, scheduled_date, scheduled_time, estimated_duration_minutes
    )
    VALUES (
      CASE WHEN v_match->>'id' IS NOT NULL
           THEN (v_match->>'id')::uuid
           ELSE gen_random_uuid() END,
      (v_match->>'tournament_id')::uuid,
      (v_match->>'category_id')::uuid,
      CASE WHEN v_match->>'group_id' IS NOT NULL
           THEN (v_match->>'group_id')::uuid
           ELSE NULL END,
      v_match->>'phase',
      (v_match->>'match_number')::integer,
      CASE WHEN v_match->>'team1_id' IS NOT NULL
           THEN (v_match->>'team1_id')::uuid
           ELSE NULL END,
      CASE WHEN v_match->>'team2_id' IS NOT NULL
           THEN (v_match->>'team2_id')::uuid
           ELSE NULL END,
      COALESCE(v_match->>'status', 'scheduled'),
      CASE WHEN v_match->>'court_id' IS NOT NULL
           THEN (v_match->>'court_id')::uuid
           ELSE NULL END,
      CASE WHEN v_match->>'scheduled_date' IS NOT NULL
           THEN (v_match->>'scheduled_date')::date
           ELSE NULL END,
      CASE WHEN v_match->>'scheduled_time' IS NOT NULL
           THEN (v_match->>'scheduled_time')::time
           ELSE NULL END,
      CASE WHEN v_match->>'estimated_duration_minutes' IS NOT NULL
           THEN (v_match->>'estimated_duration_minutes')::integer
           ELSE NULL END
    );
  END LOOP;

  -- 5. INSERT tournament_bracket (with optional match_id link)
  FOR v_bracket_slot IN SELECT * FROM jsonb_array_elements(p_payload->'bracket')
  LOOP
    INSERT INTO tournament_bracket (
      tournament_id, category_id, phase,
      round_number, position, status, match_id
    )
    VALUES (
      (v_bracket_slot->>'tournament_id')::uuid,
      (v_bracket_slot->>'category_id')::uuid,
      v_bracket_slot->>'phase',
      (v_bracket_slot->>'round_number')::integer,
      (v_bracket_slot->>'position')::integer,
      'pending',
      CASE WHEN v_bracket_slot->>'match_id' IS NOT NULL
           THEN (v_bracket_slot->>'match_id')::uuid
           ELSE NULL END
    );
  END LOOP;

  -- 6. UPDATE tournament status to 'active'
  UPDATE tournaments
  SET status = 'active'
  WHERE id = v_tournament_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
