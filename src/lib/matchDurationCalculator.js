// matchDurationCalculator.js — Calcula duración estimada de partidos según scoring_config
// Módulo de lógica pura (sin React, sin Supabase)

const AVG_GAME_MINUTES = 3.5
const AVG_POINT_MINUTES = 1.2

function roundUpTo5(n) {
  return Math.ceil(n / 5) * 5
}

function clampMin(val, min) {
  return Math.max(min, Math.round(val))
}

/**
 * Calcula la duración estimada de un partido según la configuración de puntuación.
 *
 * @param {Object|null} scoringConfig - scoring_config del torneo (JSONB)
 * @returns {Object} { recommended, minimum, maximum, breakdown }
 */
export function calculateEstimatedDuration(scoringConfig) {
  if (!scoringConfig?.type) {
    return {
      recommended: 45,
      minimum: 30,
      maximum: 60,
      breakdown: {
        description: 'Configuración no definida — usando estimación estándar',
        avgGameMinutes: AVG_GAME_MINUTES,
        totalGamesAvg: null,
        baseMinutes: 45,
        bufferMinutes: 0,
      },
    }
  }

  const { type } = scoringConfig

  if (type === 'sets_normal') {
    const { sets_to_win = 2, games_per_set = 6 } = scoringConfig
    const setsWorstCase = sets_to_win * 2 - 1
    const setsBestCase = sets_to_win
    const setsAvg = (setsBestCase + setsWorstCase) / 2

    const gamesAvgPerSet = games_per_set * 0.85
    const gamesWorstPerSet = games_per_set + 2
    const gamesFastPerSet = games_per_set * 0.65

    const minBase = setsBestCase * gamesFastPerSet * AVG_GAME_MINUTES + 5
    const recBase = setsAvg * gamesAvgPerSet * AVG_GAME_MINUTES
    const recBuffer = recBase * 0.15
    const maxBase = setsWorstCase * gamesWorstPerSet * AVG_GAME_MINUTES
    const maxBuffer = maxBase * 0.20

    const recommended = roundUpTo5(recBase + recBuffer)
    const minimum = clampMin(minBase, 15)
    const maximum = clampMin(maxBase + maxBuffer, recommended + 5)

    return {
      recommended,
      minimum,
      maximum,
      breakdown: {
        description: `Mejor de ${setsWorstCase} sets de ${games_per_set} games`,
        avgGameMinutes: AVG_GAME_MINUTES,
        totalGamesAvg: Math.round(setsAvg * gamesAvgPerSet),
        baseMinutes: Math.round(recBase),
        bufferMinutes: Math.round(recBuffer),
      },
    }
  }

  if (type === 'sets_suma') {
    const { total_sets = 3, games_per_set = 4 } = scoringConfig

    const gamesAvgPerSet = games_per_set * 0.85
    const gamesWorstPerSet = games_per_set + 2
    const gamesFastPerSet = games_per_set * 0.65

    const minBase = total_sets * gamesFastPerSet * AVG_GAME_MINUTES + 5
    const recBase = total_sets * gamesAvgPerSet * AVG_GAME_MINUTES
    const recBuffer = recBase * 0.15
    const maxBase = total_sets * gamesWorstPerSet * AVG_GAME_MINUTES
    const maxBuffer = maxBase * 0.20

    const recommended = roundUpTo5(recBase + recBuffer)
    const minimum = clampMin(minBase, 15)
    const maximum = clampMin(maxBase + maxBuffer, recommended + 5)

    return {
      recommended,
      minimum,
      maximum,
      breakdown: {
        description: `${total_sets} sets de ${games_per_set} games (todos se juegan)`,
        avgGameMinutes: AVG_GAME_MINUTES,
        totalGamesAvg: Math.round(total_sets * gamesAvgPerSet),
        baseMinutes: Math.round(recBase),
        bufferMinutes: Math.round(recBuffer),
      },
    }
  }

  if (type === 'points') {
    const { points_to_win = 21 } = scoringConfig

    const minBase = points_to_win * 0.8 * AVG_POINT_MINUTES + 5
    const recBase = points_to_win * 1.3 * AVG_POINT_MINUTES
    const recBuffer = recBase * 0.10
    const maxBase = points_to_win * 1.8 * AVG_POINT_MINUTES
    const maxBuffer = maxBase * 0.15

    const recommended = roundUpTo5(recBase + recBuffer)
    const minimum = clampMin(minBase, 10)
    const maximum = clampMin(maxBase + maxBuffer, recommended + 5)

    return {
      recommended,
      minimum,
      maximum,
      breakdown: {
        description: `Partido a ${points_to_win} puntos`,
        avgGameMinutes: AVG_POINT_MINUTES,
        totalGamesAvg: null,
        baseMinutes: Math.round(recBase),
        bufferMinutes: Math.round(recBuffer),
      },
    }
  }

  // Unknown type fallback
  return {
    recommended: 45,
    minimum: 30,
    maximum: 60,
    breakdown: {
      description: 'Configuración no definida — usando estimación estándar',
      avgGameMinutes: AVG_GAME_MINUTES,
      totalGamesAvg: null,
      baseMinutes: 45,
      bufferMinutes: 0,
    },
  }
}

/**
 * Formatea el resultado en un string legible para el organizador.
 *
 * @param {Object} result - Resultado de calculateEstimatedDuration
 * @returns {string}
 */
export function formatDurationBreakdown(result) {
  const { recommended, minimum, maximum, breakdown } = result
  return `${breakdown.description} → ~${recommended} min estimados (${minimum}-${maximum} min rango)`
}
