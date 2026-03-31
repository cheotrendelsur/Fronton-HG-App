// ============================================================================
// TASK-2 FASE 3 — Motor de clasificación (lógica pura)
// Sin React, sin Supabase, sin imports de componentes.
// ============================================================================

// ── Comparadores de desempate ───────────────────────────────────────────────

function compareSets(a, b) {
  // 1. Partidos ganados (desc)
  if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won
  // 2. Diferencia de sets (desc)
  const diffSetsA = a.sets_won - a.sets_lost
  const diffSetsB = b.sets_won - b.sets_lost
  if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA
  // 3. Diferencia de games (desc)
  const diffGamesA = a.games_won - a.games_lost
  const diffGamesB = b.games_won - b.games_lost
  if (diffGamesB !== diffGamesA) return diffGamesB - diffGamesA
  // 4. Games a favor bruto (desc)
  if (b.games_won !== a.games_won) return b.games_won - a.games_won
  // 5. Sorteo aleatorio
  return Math.random() - 0.5
}

function comparePoints(a, b) {
  // 1. Partidos ganados (desc)
  if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won
  // 2. Diferencia de puntos (desc)
  const diffPtsA = a.points_scored - a.points_against
  const diffPtsB = b.points_scored - b.points_against
  if (diffPtsB !== diffPtsA) return diffPtsB - diffPtsA
  // 3. Puntos a favor bruto (desc)
  if (b.points_scored !== a.points_scored) return b.points_scored - a.points_scored
  // 4. Sorteo aleatorio
  return Math.random() - 0.5
}

function getComparator(scoringType) {
  return scoringType === 'points' ? comparePoints : compareSets
}

// ── 1. rankGroupMembers ─────────────────────────────────────────────────────
// Ordena miembros de un grupo por criterios de desempate.
// Retorna copia con final_rank asignado (1, 2, 3...).
export function rankGroupMembers(members, scoringType) {
  const compare = getComparator(scoringType)
  const sorted = [...members].sort(compare)

  return sorted.map((member, idx) => ({
    ...member,
    final_rank: idx + 1,
  }))
}

// ── 2. selectDirectQualifiers ───────────────────────────────────────────────
// Toma los primeros K de cada grupo rankeado.
// Retorna array plano con source_group agregado.
export function selectDirectQualifiers(rankedGroups, teamsPerGroupQualify) {
  const qualifiers = []

  rankedGroups.forEach((group) => {
    const groupRef = {
      group_id: group.group_id,
      letter: group.letter,
      number: group.number,
    }

    group.members
      .filter(m => m.final_rank <= teamsPerGroupQualify)
      .forEach(member => {
        qualifiers.push({
          ...member,
          source_group: groupRef,
          qualified: true,
        })
      })
  })

  return qualifiers
}

// ── 3. selectBestPositioned ─────────────────────────────────────────────────
// Genérico: compara parejas en posición N de cada grupo.
// Retorna todos los candidatos con ranking y qualified.
export function selectBestPositioned(rankedGroups, positionToCompare, howManyNeeded, scoringType) {
  if (howManyNeeded <= 0) return []

  const compare = getComparator(scoringType)
  const candidates = []

  rankedGroups.forEach((group) => {
    const groupRef = {
      group_id: group.group_id,
      letter: group.letter,
      number: group.number,
    }

    const atPosition = group.members.find(m => m.final_rank === positionToCompare)
    if (atPosition) {
      candidates.push({
        ...atPosition,
        source_group: groupRef,
      })
    }
  })

  // Ordenar candidatos entre sí con los mismos criterios de desempate
  candidates.sort(compare)

  // Asignar ranking y qualified
  return candidates.map((candidate, idx) => ({
    ...candidate,
    ranking: idx + 1,
    qualified: idx < howManyNeeded,
  }))
}

// ── 4. assignToBracket ──────────────────────────────────────────────────────
// Asigna equipos a la primera ronda del bracket evitando mismo grupo.
// directQualifiers: array con final_rank y source_group
// bestPositioned: array con qualified=true/false (solo los true se asignan)
// bracketStructure: array de slots generado por generateBracketStructure
export function assignToBracket(directQualifiers, bestPositioned, bracketStructure) {
  const bracket = bracketStructure.map(slot => ({ ...slot }))
  const firstRound = bracket.filter(s => s.round_number === 1)
  const totalSlots = firstRound.length

  // Pool ALL qualified teams: direct qualifiers + qualified best positioned
  const qualifiedBest = bestPositioned.filter(bp => bp.qualified)
  const allQualified = [...directQualifiers, ...qualifiedBest]

  // Sort: 1sts first, then 2nds, then 3rds, etc. Within same rank, maintain order.
  allQualified.sort((a, b) => (a.final_rank ?? 99) - (b.final_rank ?? 99))

  // Split into top half (seeds) and bottom half (opponents)
  // Top seeds get team1 positions, bottom get team2 positions
  const topSeeds = allQualified.slice(0, totalSlots)
  const bottomPool = allQualified.slice(totalSlots)

  // Assign team1 with top seeds
  for (let i = 0; i < totalSlots && i < topSeeds.length; i++) {
    firstRound[i].team1_id = topSeeds[i].registration_id || topSeeds[i].id || null
    firstRound[i].team1_source_group = topSeeds[i].source_group || null
  }

  // Assign team2 from bottom pool, avoiding same group in same position
  const remaining = [...bottomPool]

  for (let i = 0; i < totalSlots; i++) {
    const slot = firstRound[i]
    if (!slot.team1_id && remaining.length > 0) {
      // No team1 assigned — take from remaining for team1
      const team = remaining.splice(0, 1)[0]
      slot.team1_id = team.registration_id || team.id || null
      slot.team1_source_group = team.source_group || null
      continue
    }

    if (remaining.length === 0) continue

    const team1Group = slot.team1_source_group

    // Prefer opponent from a different group
    let bestIdx = -1
    if (team1Group) {
      bestIdx = remaining.findIndex(
        t => t.source_group && t.source_group.group_id !== team1Group.group_id
      )
    }

    if (bestIdx === -1 && remaining.length > 0) bestIdx = 0

    if (bestIdx !== -1) {
      const opponent = remaining.splice(bestIdx, 1)[0]
      slot.team2_id = opponent.registration_id || opponent.id || null
      slot.team2_source_group = opponent.source_group || null
    }
  }

  return bracket
}
