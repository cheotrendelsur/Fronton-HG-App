// ============================================================================
// TASK-2 FASE 5 — Persistencia atómica de estructura de torneo
// Construye el payload y llama a la función RPC de PostgreSQL.
// ============================================================================

import { generateBracketStructure, getRoundPhaseName } from './tournamentGenerator'

/**
 * Persiste toda la estructura generada del torneo en una transacción atómica.
 *
 * @param {object} supabaseClient      - Instancia del cliente Supabase
 * @param {string} tournamentId        - UUID del torneo
 * @param {object} generatedData       - { [categoryId]: { groupsWithMatches, classification } }
 * @param {object} configs             - { [categoryId]: { numGroups, eliminationPhase } }
 * @param {Array}  [scheduleAssignments] - Asignaciones de cronograma (opcional, de distributeMatches)
 * @returns {{ success: boolean, error?: string }}
 */
export async function persistTournamentStructure(supabaseClient, tournamentId, generatedData, configs, scheduleAssignments) {
  try {
    const groups = []
    const groupMembers = []
    const matches = []
    const bracket = []

    // Build a lookup: match_number → schedule assignment
    const scheduleByMatchNum = new Map()
    if (scheduleAssignments?.length) {
      for (const a of scheduleAssignments) {
        scheduleByMatchNum.set(a.match_number, a)
      }
    }

    // Track highest match_number for elimination matches
    let currentMatchNumber = 0
    // First pass: find max match_number from group matches
    for (const data of Object.values(generatedData)) {
      if (!data) continue
      for (const { matches: gm } of data.groupsWithMatches ?? []) {
        for (const m of gm) {
          if (m.match_number > currentMatchNumber) currentMatchNumber = m.match_number
        }
      }
    }
    currentMatchNumber++ // start elimination from next number

    for (const [catId, data] of Object.entries(generatedData)) {
      const cfg = configs[catId]
      if (!cfg || !data) continue

      // Process each group
      for (const { group, matches: groupMatches } of data.groupsWithMatches) {
        // Generate UUID for this group on the frontend
        const groupId = crypto.randomUUID()

        groups.push({
          id: groupId,
          tournament_id: tournamentId,
          category_id: catId,
          group_letter: group.letter,
          group_number: group.number,
        })

        // Members of this group
        for (const member of group.members) {
          groupMembers.push({
            group_id: groupId,
            registration_id: member.registration.id,
            draw_position: member.draw_position,
          })
        }

        // Matches of this group (round-robin, phase = 'group_phase')
        for (const match of groupMatches) {
          const sched = scheduleByMatchNum.get(match.match_number)
          matches.push({
            tournament_id: tournamentId,
            category_id: catId,
            group_id: groupId,
            phase: 'group_phase',
            match_number: match.match_number,
            team1_id: match.team1.registration.id,
            team2_id: match.team2.registration.id,
            status: 'scheduled',
            court_id: sched?.court_id ?? null,
            scheduled_date: sched?.scheduled_date ?? null,
            scheduled_time: sched?.scheduled_time ?? null,
            estimated_duration_minutes: sched?.estimated_duration_minutes ?? null,
          })
        }
      }

      // Generate bracket structure + elimination matches for this category
      if (cfg.eliminationPhase) {
        const bracketSlots = generateBracketStructure(cfg.eliminationPhase)

        for (const slot of bracketSlots) {
          // Create a match_number for each bracket slot
          const elimMatchNumber = currentMatchNumber++
          const elimMatchId = crypto.randomUUID()

          // Create the elimination match (team_ids NULL, will be filled after group phase)
          const elimSched = scheduleByMatchNum.get(elimMatchNumber)
          const roundPhase = getRoundPhaseName(cfg.eliminationPhase, slot.round_number)

          matches.push({
            id: elimMatchId,
            tournament_id: tournamentId,
            category_id: catId,
            group_id: null,
            phase: roundPhase,
            match_number: elimMatchNumber,
            team1_id: null,
            team2_id: null,
            status: 'pending',
            court_id: elimSched?.court_id ?? null,
            scheduled_date: elimSched?.scheduled_date ?? null,
            scheduled_time: elimSched?.scheduled_time ?? null,
            estimated_duration_minutes: elimSched?.estimated_duration_minutes ?? null,
            round_number: slot.round_number,
          })

          // Link bracket slot to match
          bracket.push({
            tournament_id: tournamentId,
            category_id: catId,
            phase: roundPhase,
            round_number: slot.round_number,
            position: slot.position,
            match_id: elimMatchId,
          })
        }
      }
    }

    const payload = {
      tournament_id: tournamentId,
      config: configs,
      groups,
      group_members: groupMembers,
      matches,
      bracket,
    }

    const { data, error } = await supabaseClient.rpc('persist_tournament_structure', {
      p_payload: payload,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
