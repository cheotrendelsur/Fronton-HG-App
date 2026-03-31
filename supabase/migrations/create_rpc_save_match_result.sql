-- ============================================================================
-- TASK-4 FASE 4 — RPC: Guardar resultado de partido + actualizar estadísticas
-- Transaccional por defecto. Si falla, rollback automático.
-- ============================================================================

CREATE OR REPLACE FUNCTION save_match_result(
  p_match_id uuid,
  p_winner_id uuid,
  p_score_team1 jsonb,
  p_score_team2 jsonb,
  p_team1_member_id uuid,
  p_team2_member_id uuid,
  p_team1_stats jsonb,
  p_team2_stats jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Update the match with score and status
  UPDATE tournament_matches
  SET
    score_team1 = p_score_team1,
    score_team2 = p_score_team2,
    winner_id = p_winner_id,
    status = 'completed',
    updated_at = now()
  WHERE id = p_match_id;

  -- 2. Update team1 group member statistics
  UPDATE tournament_group_members
  SET
    matches_played = matches_played + 1,
    matches_won = matches_won + COALESCE((p_team1_stats->>'matches_won_delta')::integer, 0),
    matches_lost = matches_lost + COALESCE((p_team1_stats->>'matches_lost_delta')::integer, 0),
    sets_won = sets_won + COALESCE((p_team1_stats->>'sets_won_delta')::integer, 0),
    sets_lost = sets_lost + COALESCE((p_team1_stats->>'sets_lost_delta')::integer, 0),
    games_won = games_won + COALESCE((p_team1_stats->>'games_won_delta')::integer, 0),
    games_lost = games_lost + COALESCE((p_team1_stats->>'games_lost_delta')::integer, 0),
    points_scored = points_scored + COALESCE((p_team1_stats->>'points_scored_delta')::integer, 0),
    points_against = points_against + COALESCE((p_team1_stats->>'points_against_delta')::integer, 0),
    updated_at = now()
  WHERE id = p_team1_member_id;

  -- 3. Update team2 group member statistics
  UPDATE tournament_group_members
  SET
    matches_played = matches_played + 1,
    matches_won = matches_won + COALESCE((p_team2_stats->>'matches_won_delta')::integer, 0),
    matches_lost = matches_lost + COALESCE((p_team2_stats->>'matches_lost_delta')::integer, 0),
    sets_won = sets_won + COALESCE((p_team2_stats->>'sets_won_delta')::integer, 0),
    sets_lost = sets_lost + COALESCE((p_team2_stats->>'sets_lost_delta')::integer, 0),
    games_won = games_won + COALESCE((p_team2_stats->>'games_won_delta')::integer, 0),
    games_lost = games_lost + COALESCE((p_team2_stats->>'games_lost_delta')::integer, 0),
    points_scored = points_scored + COALESCE((p_team2_stats->>'points_scored_delta')::integer, 0),
    points_against = points_against + COALESCE((p_team2_stats->>'points_against_delta')::integer, 0),
    updated_at = now()
  WHERE id = p_team2_member_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
