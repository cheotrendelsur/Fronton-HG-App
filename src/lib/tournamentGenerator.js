// ============================================================================
// TASK-2 FASE 2 — Motor de generación de torneos (lógica pura)
// Sin React, sin Supabase, sin imports de componentes.
// ============================================================================

const ELIMINATION_PHASES = [
  { value: 'final',        label: 'Final',             slots: 2  },
  { value: 'semifinals',   label: 'Semifinales',       slots: 4  },
  { value: 'quarterfinals', label: 'Cuartos de final', slots: 8  },
  { value: 'round_of_16',  label: 'Octavos de final',  slots: 16 },
  { value: 'round_of_32',  label: 'Dieciseisavos',     slots: 32 },
]

const GROUP_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Maps number of teams in a round to the phase name
const ROUND_SIZE_TO_PHASE = {
  2: 'final',
  4: 'semifinals',
  8: 'quarterfinals',
  16: 'round_of_16',
  32: 'round_of_32',
}

/**
 * Returns the phase name for a specific round within an elimination bracket.
 * E.g. if eliminationPhase='quarterfinals' (8 slots):
 *   round 1 = 4 matches → 'quarterfinals'
 *   round 2 = 2 matches → 'semifinals'
 *   round 3 = 1 match   → 'final'
 */
export function getRoundPhaseName(eliminationPhase, roundNumber) {
  const phase = ELIMINATION_PHASES.find(p => p.value === eliminationPhase)
  if (!phase) return eliminationPhase
  const totalSlots = phase.slots
  // Matches in this round = totalSlots / 2^roundNumber, each match has 2 teams
  const teamsInRound = totalSlots / Math.pow(2, roundNumber - 1)
  return ROUND_SIZE_TO_PHASE[teamsInRound] ?? eliminationPhase
}

// ── 1. shuffleArray ─────────────────────────────────────────────────────────
// Fisher-Yates shuffle. Retorna copia nueva, no muta el original.
export function shuffleArray(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ── 2. generateGroups ───────────────────────────────────────────────────────
// Mezcla parejas y las distribuye equitativamente en N grupos.
// 13 parejas en 3 grupos → 5, 4, 4
// Retorna: [{ letter, number, members: [{ registration, draw_position }] }]
export function generateGroups(approvedTeams, numGroups) {
  const shuffled = shuffleArray(approvedTeams)
  const groups = []

  for (let i = 0; i < numGroups; i++) {
    groups.push({
      letter: GROUP_LETTERS[i] || String(i + 1),
      number: i + 1,
      members: [],
    })
  }

  // Distribución round-robin: repartir 1 a 1 en cada grupo
  shuffled.forEach((team, idx) => {
    const groupIdx = idx % numGroups
    groups[groupIdx].members.push({
      registration: team,
      draw_position: groups[groupIdx].members.length + 1,
    })
  })

  return groups
}

// ── 3. generateRoundRobinMatches ────────────────────────────────────────────
// Genera n*(n-1)/2 partidos sin duplicados.
// Retorna: [{ match_number, team1, team2 }]
export function generateRoundRobinMatches(groupMembers, startingMatchNumber = 1) {
  const matches = []
  let matchNum = startingMatchNumber

  for (let i = 0; i < groupMembers.length; i++) {
    for (let j = i + 1; j < groupMembers.length; j++) {
      matches.push({
        match_number: matchNum++,
        team1: groupMembers[i],
        team2: groupMembers[j],
      })
    }
  }

  return matches
}

// ── 4. calculateClassification ──────────────────────────────────────────────
// Calcula cuántos clasifican directo por grupo y cuántos "mejores N-ésimos".
// Retorna: { slotsEliminatoria, teamsPerGroupQualify, bestPositionedNeeded,
//            bestPositionedRank, label }
export function calculateClassification(numGroups, eliminationPhase) {
  const phase = ELIMINATION_PHASES.find(p => p.value === eliminationPhase)
  if (!phase) throw new Error(`Fase eliminatoria desconocida: ${eliminationPhase}`)

  const slots = phase.slots
  let teamsPerGroupQualify = Math.floor(slots / numGroups)

  // Garantizar al menos 1 por grupo
  if (teamsPerGroupQualify < 1) teamsPerGroupQualify = 1

  let bestPositionedNeeded = slots - (teamsPerGroupQualify * numGroups)

  // Si necesitamos más "mejores N-ésimos" que grupos existentes,
  // aumentar los directos en 1 y recalcular
  while (bestPositionedNeeded > numGroups) {
    teamsPerGroupQualify++
    bestPositionedNeeded = slots - (teamsPerGroupQualify * numGroups)
  }

  // Si sobran o no se necesitan mejores
  if (bestPositionedNeeded < 0) bestPositionedNeeded = 0

  const bestPositionedRank = bestPositionedNeeded > 0
    ? teamsPerGroupQualify + 1
    : 0

  const ORDINALS = {
    2: 'mejores segundos',
    3: 'mejores terceros',
    4: 'mejores cuartos',
    5: 'mejores quintos',
    6: 'mejores sextos',
  }
  const label = bestPositionedRank > 0
    ? (ORDINALS[bestPositionedRank] || `mejores ${bestPositionedRank}°`)
    : ''

  return {
    slotsEliminatoria: slots,
    teamsPerGroupQualify,
    bestPositionedNeeded,
    bestPositionedRank,
    label,
  }
}

// ── 5. generateBracketStructure ─────────────────────────────────────────────
// Genera estructura vacía del bracket eliminatorio.
// Retorna: [{ round_number, position, team1_id, team2_id, winner_id, next_round, next_position }]
export function generateBracketStructure(eliminationPhase) {
  const phase = ELIMINATION_PHASES.find(p => p.value === eliminationPhase)
  if (!phase) throw new Error(`Fase eliminatoria desconocida: ${eliminationPhase}`)

  const totalSlots = phase.slots
  const bracket = []

  // Calcular cuántas rondas: log2(slots)
  const numRounds = Math.log2(totalSlots)

  for (let round = 1; round <= numRounds; round++) {
    // En la primera ronda hay totalSlots/2 partidos,
    // en la segunda totalSlots/4, etc.
    const matchesInRound = totalSlots / Math.pow(2, round)

    for (let pos = 1; pos <= matchesInRound; pos++) {
      const slot = {
        round_number: round,
        position: pos,
        team1_id: null,
        team2_id: null,
        winner_id: null,
        status: 'pending',
      }

      // Conectar al siguiente round (excepto la final)
      if (round < numRounds) {
        slot.next_round = round + 1
        slot.next_position = Math.ceil(pos / 2)
      } else {
        slot.next_round = null
        slot.next_position = null
      }

      bracket.push(slot)
    }
  }

  return bracket
}

// ── 6. getEliminationOptions ────────────────────────────────────────────────
// Retorna opciones válidas donde slots <= numApproved.
export function getEliminationOptions(numApproved) {
  return ELIMINATION_PHASES
    .filter(p => p.slots <= numApproved)
    .map(p => ({ value: p.value, label: p.label, slots: p.slots }))
}
