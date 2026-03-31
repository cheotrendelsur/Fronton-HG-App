// scoreManager.js — Lógica de resultados, validaciones y estadísticas
// Módulo de lógica pura (sin React, sin Supabase)

/**
 * Validates score input in real time as the organizer enters data.
 *
 * @param {Object} scores - Score data (format depends on scoring type)
 * @param {Object} scoringConfig - Tournament scoring configuration
 * @returns {{ valid: boolean, errors: string[], complete: boolean, warnings: string[] }}
 */
export function validateScoreInput(scores, scoringConfig) {
  if (!scoringConfig?.type) {
    return { valid: false, errors: ['Configuración de puntuación no definida'], complete: false, warnings: [] }
  }

  const { type } = scoringConfig

  if (type === 'sets_normal') return validateSetsNormal(scores, scoringConfig)
  if (type === 'sets_suma') return validateSetsSuma(scores, scoringConfig)
  if (type === 'points') return validatePoints(scores, scoringConfig)

  return { valid: false, errors: ['Tipo de puntuación desconocido: ' + type], complete: false, warnings: [] }
}

function validateSetsNormal(scores, config) {
  const { sets_to_win = 2, games_per_set = 6 } = config
  const { team1_games = [], team2_games = [] } = scores
  const maxSets = sets_to_win * 2 - 1
  const errors = []
  const warnings = []

  const setsPlayed = Math.max(team1_games.length, team2_games.length)

  if (setsPlayed > maxSets) {
    errors.push(`Máximo ${maxSets} sets permitidos`)
  }

  let team1SetsWon = 0
  let team2SetsWon = 0
  let matchDecided = false

  for (let i = 0; i < setsPlayed; i++) {
    const g1 = team1_games[i]
    const g2 = team2_games[i]

    // Skip empty sets
    if (g1 == null && g2 == null) continue

    if (g1 == null || g2 == null) {
      errors.push(`Set ${i + 1}: ambos valores son requeridos`)
      continue
    }

    if (g1 < 0 || g2 < 0) {
      errors.push(`Set ${i + 1}: los games no pueden ser negativos`)
      continue
    }

    const maxGames = games_per_set + 1
    if (g1 > maxGames || g2 > maxGames) {
      errors.push(`Set ${i + 1}: máximo ${maxGames} games por equipo`)
      continue
    }

    if (g1 === g2) {
      errors.push(`Set ${i + 1}: un set no puede terminar en empate (${g1}-${g2})`)
      continue
    }

    // At least one team must reach games_per_set to complete a set
    if (g1 < games_per_set && g2 < games_per_set) {
      errors.push(`Set ${i + 1}: al menos una dupla debe alcanzar ${games_per_set} games para completar el set`)
      continue
    }

    // Check if match was already decided before this set
    if (matchDecided) {
      errors.push(`Set ${i + 1}: el partido ya fue decidido (${team1SetsWon}-${team2SetsWon})`)
      continue
    }

    if (g1 > g2) team1SetsWon++
    else team2SetsWon++

    if (team1SetsWon >= sets_to_win || team2SetsWon >= sets_to_win) {
      matchDecided = true
    }
  }

  const complete = matchDecided && errors.length === 0
  const valid = errors.length === 0

  return { valid, errors, complete, warnings }
}

function validateSetsSuma(scores, config) {
  const { total_sets = 3, games_per_set = 4 } = config
  const { team1_games = [], team2_games = [] } = scores
  const errors = []
  const warnings = []

  let team1SetsWon = 0
  let team2SetsWon = 0
  let allFilled = true

  for (let i = 0; i < total_sets; i++) {
    const g1 = team1_games[i]
    const g2 = team2_games[i]

    if (g1 == null || g2 == null) {
      allFilled = false
      continue
    }

    if (g1 < 0 || g2 < 0) {
      errors.push(`Set ${i + 1}: los games no pueden ser negativos`)
      continue
    }

    const maxGames = games_per_set + 1
    if (g1 > maxGames || g2 > maxGames) {
      errors.push(`Set ${i + 1}: máximo ${maxGames} games por equipo`)
      continue
    }

    if (g1 === g2) {
      errors.push(`Set ${i + 1}: un set no puede terminar en empate (${g1}-${g2})`)
      continue
    }

    // At least one team must reach games_per_set to complete a set
    if (g1 < games_per_set && g2 < games_per_set) {
      errors.push(`Set ${i + 1}: al menos una dupla debe alcanzar ${games_per_set} games para completar el set`)
      continue
    }

    if (g1 > g2) team1SetsWon++
    else team2SetsWon++
  }

  // For sets_suma, all sets must be played and filled
  let complete = false
  if (allFilled && errors.length === 0) {
    if (team1SetsWon !== team2SetsWon) {
      complete = true
    } else {
      // Tie in sets — check total games
      const totalG1 = team1_games.reduce((s, v) => s + (v ?? 0), 0)
      const totalG2 = team2_games.reduce((s, v) => s + (v ?? 0), 0)
      if (totalG1 !== totalG2) {
        complete = true
        warnings.push('Empate en sets — gana por diferencia de games')
      } else {
        warnings.push('Empate total en sets y games — requiere desempate manual')
        complete = true // still allow saving, organizer must decide
      }
    }
  }

  const valid = errors.length === 0

  return { valid, errors, complete, warnings }
}

function validatePoints(scores, config) {
  const { points_to_win = 21, max_points } = config
  const winBy = config.win_by ?? 1
  const { team1_points, team2_points } = scores
  const errors = []
  const warnings = []

  if (team1_points == null || team2_points == null) {
    return { valid: true, errors: [], complete: false, warnings: [] }
  }

  const p1 = team1_points
  const p2 = team2_points

  if (p1 < 0 || p2 < 0) {
    errors.push('Los puntos no pueden ser negativos')
    return { valid: false, errors, complete: false, warnings }
  }

  if (winBy === 1) {
    // Punto directo: winner must have exactly points_to_win, loser < points_to_win
    if (p1 > points_to_win || p2 > points_to_win) {
      errors.push(`Nadie puede exceder ${points_to_win} puntos (punto directo)`)
      return { valid: false, errors, complete: false, warnings }
    }

    if (p1 === p2) {
      // Not complete yet or invalid
      if (p1 === points_to_win) {
        errors.push(`Empate a ${points_to_win} no es válido con punto directo`)
        return { valid: false, errors, complete: false, warnings }
      }
      return { valid: true, errors: [], complete: false, warnings }
    }

    const winner = p1 > p2 ? p1 : p2
    const loser = p1 > p2 ? p2 : p1

    if (winner === points_to_win && loser < points_to_win) {
      return { valid: true, errors: [], complete: true, warnings }
    }

    // Neither reached points_to_win
    if (winner < points_to_win) {
      return { valid: true, errors: [], complete: false, warnings }
    }

    return { valid: true, errors: [], complete: false, warnings }
  }

  // win_by = 2
  const hasMax = max_points != null

  if (hasMax) {
    if (p1 > max_points || p2 > max_points) {
      errors.push(`Nadie puede exceder ${max_points} puntos (máximo)`)
      return { valid: false, errors, complete: false, warnings }
    }
  }

  // Neither reached points_to_win yet
  if (p1 < points_to_win && p2 < points_to_win) {
    return { valid: true, errors: [], complete: false, warnings }
  }

  const diff = Math.abs(p1 - p2)
  const higher = Math.max(p1, p2)
  const lower = Math.min(p1, p2)

  // Check punto de oro at max_points
  if (hasMax && higher === max_points) {
    if (diff >= 1) {
      return { valid: true, errors: [], complete: true, warnings: diff === 1 ? ['Punto de oro al máximo'] : [] }
    }
    // Tie at max — invalid
    errors.push(`Empate a ${max_points} no es válido`)
    return { valid: false, errors, complete: false, warnings }
  }

  // Normal win_by=2 check
  if (higher >= points_to_win && diff >= 2) {
    return { valid: true, errors: [], complete: true, warnings }
  }

  // One or both >= points_to_win but diff < 2 — keep playing
  if (higher >= points_to_win && diff < 2) {
    return { valid: true, errors: [], complete: false, warnings: ['Sigue jugando — diferencia de 2 requerida'] }
  }

  return { valid: true, errors: [], complete: false, warnings }
}

/**
 * Calculates the match result. Only call when validateScoreInput returns complete=true.
 *
 * @param {Object} scores
 * @param {Object} scoringConfig
 * @returns {Object} { valid, winner, score_team1, score_team2, summary }
 */
export function calculateMatchResult(scores, scoringConfig) {
  const { type } = scoringConfig

  if (type === 'sets_normal' || type === 'sets_suma') {
    return calculateSetsResult(scores, scoringConfig)
  }

  if (type === 'points') {
    return calculatePointsResult(scores, scoringConfig)
  }

  return { valid: false, winner: null, score_team1: null, score_team2: null, summary: '' }
}

function calculateSetsResult(scores, config) {
  const { team1_games = [], team2_games = [] } = scores
  let team1SetsWon = 0
  let team2SetsWon = 0
  let totalGamesWon1 = 0
  let totalGamesWon2 = 0

  const setsPlayed = Math.max(team1_games.length, team2_games.length)
  const setParts = []

  for (let i = 0; i < setsPlayed; i++) {
    const g1 = team1_games[i] ?? 0
    const g2 = team2_games[i] ?? 0
    totalGamesWon1 += g1
    totalGamesWon2 += g2
    if (g1 > g2) team1SetsWon++
    else if (g2 > g1) team2SetsWon++
    setParts.push(`${g1}-${g2}`)
  }

  let winner = null
  if (team1SetsWon > team2SetsWon) winner = 'team1'
  else if (team2SetsWon > team1SetsWon) winner = 'team2'
  else {
    // Tie in sets (sets_suma): use total games
    if (totalGamesWon1 > totalGamesWon2) winner = 'team1'
    else if (totalGamesWon2 > totalGamesWon1) winner = 'team2'
    // Complete tie — still return, organizer decides
  }

  return {
    valid: true,
    winner,
    score_team1: {
      sets_won: team1SetsWon,
      sets_lost: team2SetsWon,
      games: [...team1_games],
      total_games_won: totalGamesWon1,
      total_games_lost: totalGamesWon2,
    },
    score_team2: {
      sets_won: team2SetsWon,
      sets_lost: team1SetsWon,
      games: [...team2_games],
      total_games_won: totalGamesWon2,
      total_games_lost: totalGamesWon1,
    },
    summary: setParts.join(' / '),
  }
}

function calculatePointsResult(scores, config) {
  const p1 = scores.team1_points
  const p2 = scores.team2_points
  const winner = p1 > p2 ? 'team1' : 'team2'

  return {
    valid: true,
    winner,
    score_team1: { points: p1 },
    score_team2: { points: p2 },
    summary: `${p1}-${p2}`,
  }
}

/**
 * Calculates updated group member statistics after a match.
 *
 * @param {Object} currentStats - Current stats from tournament_group_members
 * @param {Object} matchResult - Result from calculateMatchResult
 * @param {boolean} isWinner - Whether this team won
 * @param {Object} scoringConfig
 * @returns {Object} Updated stats object with deltas
 */
export function calculateUpdatedStats(currentStats, matchResult, isWinner, scoringConfig) {
  const stats = { ...currentStats }
  const { type } = scoringConfig

  stats.matches_played = (stats.matches_played ?? 0) + 1
  if (isWinner) {
    stats.matches_won = (stats.matches_won ?? 0) + 1
  } else {
    stats.matches_lost = (stats.matches_lost ?? 0) + 1
  }

  if (type === 'sets_normal' || type === 'sets_suma') {
    const myScore = isWinner
      ? (matchResult.winner === 'team1' ? matchResult.score_team1 : matchResult.score_team2)
      : (matchResult.winner === 'team1' ? matchResult.score_team2 : matchResult.score_team1)

    stats.sets_won = (stats.sets_won ?? 0) + myScore.sets_won
    stats.sets_lost = (stats.sets_lost ?? 0) + myScore.sets_lost
    stats.games_won = (stats.games_won ?? 0) + myScore.total_games_won
    stats.games_lost = (stats.games_lost ?? 0) + myScore.total_games_lost
  }

  if (type === 'points') {
    const myScore = isWinner
      ? (matchResult.winner === 'team1' ? matchResult.score_team1 : matchResult.score_team2)
      : (matchResult.winner === 'team1' ? matchResult.score_team2 : matchResult.score_team1)
    const oppScore = isWinner
      ? (matchResult.winner === 'team1' ? matchResult.score_team2 : matchResult.score_team1)
      : (matchResult.winner === 'team1' ? matchResult.score_team1 : matchResult.score_team2)

    stats.points_scored = (stats.points_scored ?? 0) + myScore.points
    stats.points_against = (stats.points_against ?? 0) + oppScore.points
  }

  return stats
}

/**
 * Determines how many sets are required given the current state.
 *
 * @param {Object} scores
 * @param {Object} scoringConfig
 * @returns {{ totalSetsNeeded: number, currentSetsPlayed: number, matchDecided: boolean, canAddSet: boolean }}
 */
export function determineRequiredSets(scores, scoringConfig) {
  const { type } = scoringConfig

  if (type === 'sets_suma') {
    const { total_sets = 3 } = scoringConfig
    const played = Math.max(scores.team1_games?.length ?? 0, scores.team2_games?.length ?? 0)
    return {
      totalSetsNeeded: total_sets,
      currentSetsPlayed: played,
      matchDecided: false, // all sets always played in suma
      canAddSet: played < total_sets,
    }
  }

  if (type === 'sets_normal') {
    const { sets_to_win = 2 } = scoringConfig
    const maxSets = sets_to_win * 2 - 1
    const { team1_games = [], team2_games = [] } = scores

    let team1SetsWon = 0
    let team2SetsWon = 0
    const played = Math.max(team1_games.length, team2_games.length)

    for (let i = 0; i < played; i++) {
      const g1 = team1_games[i]
      const g2 = team2_games[i]
      if (g1 != null && g2 != null) {
        if (g1 > g2) team1SetsWon++
        else if (g2 > g1) team2SetsWon++
      }
    }

    const matchDecided = team1SetsWon >= sets_to_win || team2SetsWon >= sets_to_win
    const needed = matchDecided ? played : Math.min(played + 1, maxSets)

    return {
      totalSetsNeeded: needed,
      currentSetsPlayed: played,
      matchDecided,
      canAddSet: !matchDecided && played < maxSets,
    }
  }

  // points — no sets
  return { totalSetsNeeded: 0, currentSetsPlayed: 0, matchDecided: false, canAddSet: false }
}

/**
 * Returns the maximum valid games for a set given current state.
 *
 * @param {Object} scoringConfig
 * @returns {number}
 */
export function getMaxGamesForSet(scoringConfig) {
  const { games_per_set = 6 } = scoringConfig
  return games_per_set + 1
}
