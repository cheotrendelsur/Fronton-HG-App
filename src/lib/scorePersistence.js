// scorePersistence.js — Persistencia de resultados y consultas de estado
// Depende de scoreManager.js para cálculos de estadísticas

/**
 * Computes stat deltas for a team from a match result.
 */
function computeDeltas(matchResult, teamKey, scoringConfig) {
  const { type } = scoringConfig
  const isTeam1 = teamKey === 'team1'
  const isWinner = matchResult.winner === teamKey

  const deltas = {
    matches_won_delta: isWinner ? 1 : 0,
    matches_lost_delta: isWinner ? 0 : 1,
    sets_won_delta: 0,
    sets_lost_delta: 0,
    games_won_delta: 0,
    games_lost_delta: 0,
    points_scored_delta: 0,
    points_against_delta: 0,
  }

  if (type === 'sets_normal' || type === 'sets_suma') {
    const myScore = isTeam1 ? matchResult.score_team1 : matchResult.score_team2
    deltas.sets_won_delta = myScore.sets_won
    deltas.sets_lost_delta = myScore.sets_lost
    deltas.games_won_delta = myScore.total_games_won
    deltas.games_lost_delta = myScore.total_games_lost
  }

  if (type === 'points') {
    const myScore = isTeam1 ? matchResult.score_team1 : matchResult.score_team2
    const oppScore = isTeam1 ? matchResult.score_team2 : matchResult.score_team1
    deltas.points_scored_delta = myScore.points
    deltas.points_against_delta = oppScore.points
  }

  return deltas
}

/**
 * Saves a match result via RPC and updates group member statistics.
 *
 * @param {object} supabaseClient
 * @param {string} matchId - UUID of the match
 * @param {object} matchResult - from calculateMatchResult
 * @param {string} winnerId - registration UUID of the winning team
 * @param {string} team1MemberId - tournament_group_members.id for team1
 * @param {string} team2MemberId - tournament_group_members.id for team2
 * @param {object} scoringConfig - tournament scoring_config
 * @returns {{ success: boolean, error?: string }}
 */
export async function saveMatchResult(supabaseClient, matchId, matchResult, winnerId, team1MemberId, team2MemberId, scoringConfig, actualEndTime = null) {
  try {
    const team1Stats = computeDeltas(matchResult, 'team1', scoringConfig)
    const team2Stats = computeDeltas(matchResult, 'team2', scoringConfig)

    const { error } = await supabaseClient.rpc('save_match_result', {
      p_match_id: matchId,
      p_winner_id: winnerId,
      p_score_team1: matchResult.score_team1,
      p_score_team2: matchResult.score_team2,
      p_team1_member_id: team1MemberId,
      p_team2_member_id: team2MemberId,
      p_team1_stats: team1Stats,
      p_team2_stats: team2Stats,
    })

    if (error) return { success: false, error: error.message }

    if (actualEndTime) {
      await supabaseClient
        .from('tournament_matches')
        .update({ actual_end_time: actualEndTime })
        .eq('id', matchId)
      // Non-critical: score already saved; silently continue if this fails
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Checks if all group phase matches for a category are completed.
 *
 * @param {object} supabaseClient
 * @param {string} tournamentId
 * @param {string} categoryId
 * @returns {{ complete: boolean, remaining: number }}
 */
export async function checkGroupPhaseComplete(supabaseClient, tournamentId, categoryId) {
  const { count, error } = await supabaseClient
    .from('tournament_matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('category_id', categoryId)
    .eq('phase', 'group_phase')
    .neq('status', 'completed')

  if (error) return { complete: false, remaining: -1 }
  const remaining = count ?? 0
  return { complete: remaining === 0, remaining }
}
