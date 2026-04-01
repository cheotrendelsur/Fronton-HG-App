// postGroupPhase.js — Clasificación automática, llenado de bracket y programación de eliminatoria
// Se ejecuta cuando todos los partidos de fase de grupos de una categoría están completados.

import { calculateClassification } from './tournamentGenerator'
import { rankGroupMembers, selectDirectQualifiers, selectBestPositioned, assignToBracket } from './classificationEngine'

/**
 * Processes group phase completion for a category:
 * ranks groups, fills bracket, creates elimination matches, schedules them.
 *
 * @param {object} supabaseClient
 * @param {string} tournamentId
 * @param {string} categoryId
 * @param {object} scoringConfig - tournament.scoring_config
 * @returns {{ success: boolean, error?: string }}
 */
export async function processGroupPhaseCompletion(supabaseClient, tournamentId, categoryId, scoringConfig) {
  try {
    // a) Load tournament_config to get category config
    const { data: configRow } = await supabaseClient
      .from('tournament_config')
      .select('config')
      .eq('tournament_id', tournamentId)
      .single()

    if (!configRow?.config) return { success: false, error: 'No se encontró la configuración del torneo' }

    const catConfig = configRow.config[categoryId]
    if (!catConfig?.eliminationPhase) return { success: false, error: 'No se encontró configuración de eliminatoria para esta categoría' }

    const { numGroups, eliminationPhase } = catConfig

    // b) Load groups + members with stats
    const { data: groups } = await supabaseClient
      .from('tournament_groups')
      .select('id, group_letter, group_number')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .order('group_number')

    if (!groups?.length) return { success: false, error: 'No se encontraron grupos' }

    const groupIds = groups.map(g => g.id)
    const { data: members } = await supabaseClient
      .from('tournament_group_members')
      .select('id, group_id, registration_id, matches_played, matches_won, matches_lost, sets_won, sets_lost, games_won, games_lost, points_scored, points_against')
      .in('group_id', groupIds)

    if (!members?.length) return { success: false, error: 'No se encontraron miembros de grupo' }

    // c) Rank each group
    const scoringType = scoringConfig?.type === 'points' ? 'points' : 'sets'
    const rankedGroups = groups.map(g => {
      const groupMembers = members.filter(m => m.group_id === g.id)
      const ranked = rankGroupMembers(groupMembers, scoringType)
      return {
        group_id: g.id,
        letter: g.group_letter,
        number: g.group_number,
        members: ranked,
      }
    })

    // d) Calculate classification parameters
    const classification = calculateClassification(numGroups, eliminationPhase)
    const { teamsPerGroupQualify, bestPositionedNeeded, bestPositionedRank } = classification

    // e) Select qualifiers
    const directQualifiers = selectDirectQualifiers(rankedGroups, teamsPerGroupQualify)
    const bestPositioned = bestPositionedNeeded > 0
      ? selectBestPositioned(rankedGroups, bestPositionedRank, bestPositionedNeeded, scoringType)
      : []

    // f) Load existing bracket (include match_id for linking to tournament_matches)
    const { data: bracketRows } = await supabaseClient
      .from('tournament_bracket')
      .select('id, round_number, position, team1_id, team2_id, match_id, status')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .order('round_number')
      .order('position')

    if (!bracketRows?.length) return { success: false, error: 'No se encontró bracket' }

    const filledBracket = assignToBracket(directQualifiers, bestPositioned, bracketRows)

    // g) Persist: update group members with final_rank + qualified
    for (const group of rankedGroups) {
      for (const member of group.members) {
        const isQualified = directQualifiers.some(q => q.id === member.id) ||
          bestPositioned.some(bp => bp.id === member.id && bp.qualified)

        await supabaseClient
          .from('tournament_group_members')
          .update({ final_rank: member.final_rank, qualified: isQualified })
          .eq('id', member.id)
      }
    }

    // Insert best positioned records if any
    if (bestPositioned.length > 0) {
      const bpRecords = bestPositioned.map(bp => ({
        tournament_id: tournamentId,
        category_id: categoryId,
        registration_id: bp.registration_id,
        source_group_id: bp.source_group?.group_id ?? bp.group_id,
        original_position: bp.final_rank,
        matches_won: bp.matches_won ?? 0,
        matches_lost: bp.matches_lost ?? 0,
        sets_won: bp.sets_won ?? 0,
        sets_lost: bp.sets_lost ?? 0,
        games_won: bp.games_won ?? 0,
        games_lost: bp.games_lost ?? 0,
        points_scored: bp.points_scored ?? 0,
        points_against: bp.points_against ?? 0,
        set_diff: (bp.sets_won ?? 0) - (bp.sets_lost ?? 0),
        game_diff: (bp.games_won ?? 0) - (bp.games_lost ?? 0),
        point_diff: (bp.points_scored ?? 0) - (bp.points_against ?? 0),
        ranking: bp.ranking ?? null,
        qualified: bp.qualified ?? false,
      }))

      await supabaseClient
        .from('tournament_best_positioned')
        .insert(bpRecords)
    }

    // Update bracket first round with team assignments
    const firstRoundSlots = filledBracket.filter(s => s.round_number === 1)
    for (const slot of firstRoundSlots) {
      await supabaseClient
        .from('tournament_bracket')
        .update({
          team1_id: slot.team1_id ?? null,
          team2_id: slot.team2_id ?? null,
          team1_source_group: slot.team1_source_group?.group_id ?? null,
          team2_source_group: slot.team2_source_group?.group_id ?? null,
          status: (slot.team1_id && slot.team2_id) ? 'scheduled' : 'pending',
        })
        .eq('id', slot.id)
    }

    // h) Sync first-round elimination matches — UPDATE existing matches with team_ids
    // Use in-memory filledBracket which has match_id from original DB load + team_ids from assignToBracket
    const firstRoundReady = filledBracket.filter(s => s.round_number === 1 && s.team1_id && s.team2_id)

    for (const slot of firstRoundReady) {
      const team1 = slot.team1_id
      const team2 = slot.team2_id

      if (slot.match_id) {
        // Primary path: match_id exists, UPDATE directly
        await supabaseClient
          .from('tournament_matches')
          .update({ team1_id: team1, team2_id: team2, status: 'scheduled' })
          .eq('id', slot.match_id)
      } else {
        // Fallback: match_id missing — find the pending elimination match by phase + category
        const phaseName = slot.phase ?? firstRoundSlots[0]?.phase ?? eliminationPhase
        const { data: pendingMatches } = await supabaseClient
          .from('tournament_matches')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('category_id', categoryId)
          .eq('phase', phaseName)
          .is('team1_id', null)
          .eq('status', 'pending')
          .order('scheduled_date')
          .order('scheduled_time')
          .limit(1)

        if (pendingMatches?.[0]) {
          await supabaseClient
            .from('tournament_matches')
            .update({ team1_id: team1, team2_id: team2, status: 'scheduled' })
            .eq('id', pendingMatches[0].id)

          // Also link the bracket slot to this match for future use
          await supabaseClient
            .from('tournament_bracket')
            .update({ match_id: pendingMatches[0].id })
            .eq('id', slot.id)
        }
      }
    }

    // Also do a fresh DB query as a safety net — catches any slots whose bracket
    // was updated but the in-memory path missed (e.g. timing issues)
    const { data: freshBracketR1 } = await supabaseClient
      .from('tournament_bracket')
      .select('match_id, team1_id, team2_id')
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('round_number', 1)
      .not('team1_id', 'is', null)
      .not('team2_id', 'is', null)
      .not('match_id', 'is', null)

    for (const slot of (freshBracketR1 ?? [])) {
      await supabaseClient
        .from('tournament_matches')
        .update({ team1_id: slot.team1_id, team2_id: slot.team2_id, status: 'scheduled' })
        .eq('id', slot.match_id)
    }

    // i) Mark groups as completed
    await supabaseClient
      .from('tournament_groups')
      .update({ phase: 'completed', status: 'completed' })
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Advances the bracket after an elimination match is completed.
 * Updates bracket winner, advances to next round, creates & schedules the next match if both teams are ready.
 *
 * @param {object} supabaseClient
 * @param {string} tournamentId
 * @param {string} matchId - The completed elimination match ID
 * @param {string} winnerId - registration_id of the winner
 * @returns {{ success: boolean, error?: string, newMatchCreated?: boolean }}
 */
export async function advanceBracketWinner(supabaseClient, tournamentId, matchId, winnerId) {
  try {
    // Find the bracket slot that has this match
    const { data: currentSlot } = await supabaseClient
      .from('tournament_bracket')
      .select('id, tournament_id, category_id, phase, round_number, position')
      .eq('tournament_id', tournamentId)
      .eq('match_id', matchId)
      .single()

    if (!currentSlot) {
      return { success: true, nextMatchReady: false }
    }

    // Update winner in current bracket slot
    await supabaseClient
      .from('tournament_bracket')
      .update({ winner_id: winnerId, status: 'completed' })
      .eq('id', currentSlot.id)

    // Find the next round slot
    const nextRound = currentSlot.round_number + 1
    const nextPosition = Math.ceil(currentSlot.position / 2)

    const { data: nextSlot } = await supabaseClient
      .from('tournament_bracket')
      .select('id, team1_id, team2_id, match_id, status')
      .eq('tournament_id', tournamentId)
      .eq('category_id', currentSlot.category_id)
      .eq('round_number', nextRound)
      .eq('position', nextPosition)
      .single()

    if (!nextSlot) {
      // This was the final — no next round
      await checkAllCategoriesComplete(supabaseClient, tournamentId)
      return { success: true, nextMatchReady: false }
    }

    // Assign winner to the correct team slot in next round
    const isTeam1 = currentSlot.position % 2 === 1
    const updateField = isTeam1 ? 'team1_id' : 'team2_id'

    await supabaseClient
      .from('tournament_bracket')
      .update({ [updateField]: winnerId })
      .eq('id', nextSlot.id)

    // Re-fetch the next slot from DB to get the actual state after the update
    const { data: refreshedSlot } = await supabaseClient
      .from('tournament_bracket')
      .select('id, team1_id, team2_id, match_id, status')
      .eq('id', nextSlot.id)
      .single()

    if (!refreshedSlot) {
      return { success: true, nextMatchReady: false }
    }

    const bothTeamsReady = refreshedSlot.team1_id && refreshedSlot.team2_id

    if (bothTeamsReady) {
      let targetMatchId = refreshedSlot.match_id

      // Fallback: if match_id is missing, find the pending match by phase + category
      if (!targetMatchId) {
        const { data: pendingMatches } = await supabaseClient
          .from('tournament_matches')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('category_id', currentSlot.category_id)
          .neq('phase', 'group_phase')
          .is('team1_id', null)
          .eq('status', 'pending')
          .order('scheduled_date')
          .order('scheduled_time')
          .limit(1)

        if (pendingMatches?.[0]) {
          targetMatchId = pendingMatches[0].id
          // Link bracket to match for future use
          await supabaseClient
            .from('tournament_bracket')
            .update({ match_id: targetMatchId })
            .eq('id', refreshedSlot.id)
        }
      }

      if (targetMatchId) {
        // Both teams ready — UPDATE the existing match with team assignments
        await supabaseClient
          .from('tournament_matches')
          .update({
            team1_id: refreshedSlot.team1_id,
            team2_id: refreshedSlot.team2_id,
            status: 'scheduled',
          })
          .eq('id', targetMatchId)

        await supabaseClient
          .from('tournament_bracket')
          .update({ status: 'scheduled' })
          .eq('id', refreshedSlot.id)

        return { success: true, nextMatchReady: true }
      }
    }

    return { success: true, nextMatchReady: false }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Checks if all categories have completed both group phase AND elimination.
 * If so, marks the tournament as 'finished'.
 *
 * @param {object} supabaseClient
 * @param {string} tournamentId
 * @returns {{ allComplete: boolean }}
 */
export async function checkAllCategoriesComplete(supabaseClient, tournamentId) {
  const { count } = await supabaseClient
    .from('tournament_matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .neq('status', 'completed')

  const remaining = count ?? 0

  if (remaining === 0) {
    await supabaseClient
      .from('tournaments')
      .update({ status: 'finished' })
      .eq('id', tournamentId)
    return { allComplete: true }
  }

  return { allComplete: false }
}
