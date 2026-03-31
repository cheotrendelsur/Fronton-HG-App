import { useMemo } from 'react'
import { determineRequiredSets, getMaxGamesForSet } from '../../lib/scoreManager'

export default function SetsScoreForm({ scoringConfig, scores, onScoresChange, errors, team1Label, team2Label }) {
  const type = scoringConfig?.type
  const isSuma = type === 'sets_suma'

  const { totalSetsNeeded } = useMemo(
    () => determineRequiredSets(scores, scoringConfig),
    [scores, scoringConfig],
  )

  const maxGames = getMaxGamesForSet(scoringConfig)

  // How many set rows to show
  const numRows = isSuma
    ? (scoringConfig.total_sets ?? 3)
    : totalSetsNeeded

  function handleChange(setIdx, team, value) {
    const parsed = value === '' ? null : Math.max(0, parseInt(value, 10) || 0)
    const key = team === 1 ? 'team1_games' : 'team2_games'
    const arr = [...(scores[key] ?? [])]
    // Ensure array is long enough
    while (arr.length <= setIdx) arr.push(null)
    arr[setIdx] = parsed
    onScoresChange({ ...scores, [key]: arr })
  }

  // Find per-set errors from the errors array
  function getSetError(setIdx) {
    const prefix = `Set ${setIdx + 1}:`
    return errors.filter(e => e.startsWith(prefix)).map(e => e.replace(prefix, '').trim())
  }

  const gamesPerSet = scoringConfig.games_per_set ?? 6

  // Check if a set is validly completed
  function isSetValid(setIdx) {
    const g1 = scores.team1_games?.[setIdx]
    const g2 = scores.team2_games?.[setIdx]
    if (g1 == null || g2 == null) return false
    if (g1 === g2) return false
    if (g1 < 0 || g2 < 0) return false
    if (g1 > maxGames || g2 > maxGames) return false
    if (g1 < gamesPerSet && g2 < gamesPerSet) return false
    return getSetError(setIdx).length === 0
  }

  return (
    <div className="space-y-3">
      {/* Reference */}
      <p className="text-[11px] text-center" style={{ color: '#9CA3AF' }}>
        Cada set se juega a {gamesPerSet} games
      </p>

      {/* Set rows */}
      {Array.from({ length: numRows }, (_, i) => {
        const setErrors = getSetError(i)
        const valid = isSetValid(i)

        return (
          <div key={i}>
            <div className="flex items-center gap-2">
              {/* Set label */}
              <span className="w-14 flex-shrink-0 text-xs font-semibold" style={{ color: '#4B5563' }}>
                Set {i + 1}
              </span>

              {/* Team 1 input */}
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={maxGames}
                step={1}
                value={scores.team1_games?.[i] ?? ''}
                onChange={e => handleChange(i, 1, e.target.value)}
                className="flex-1 text-center text-lg font-semibold rounded-xl tabular-nums"
                style={{
                  height: '46px',
                  background: '#FFFFFF',
                  border: `1.5px solid ${setErrors.length > 0 ? '#FECACA' : valid ? '#BBF7D0' : '#E0E2E6'}`,
                  color: '#1F2937',
                  outline: 'none',
                }}
              />

              {/* Separator */}
              <span className="w-5 flex-shrink-0 text-center text-xs font-bold" style={{ color: '#D1D5DB' }}>
                –
              </span>

              {/* Team 2 input */}
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={maxGames}
                step={1}
                value={scores.team2_games?.[i] ?? ''}
                onChange={e => handleChange(i, 2, e.target.value)}
                className="flex-1 text-center text-lg font-semibold rounded-xl tabular-nums"
                style={{
                  height: '46px',
                  background: '#FFFFFF',
                  border: `1.5px solid ${setErrors.length > 0 ? '#FECACA' : valid ? '#BBF7D0' : '#E0E2E6'}`,
                  color: '#1F2937',
                  outline: 'none',
                }}
              />

              {/* Valid check */}
              <div className="w-5 flex-shrink-0 text-center">
                {valid && (
                  <span className="text-xs" style={{ color: '#16A34A' }}>✓</span>
                )}
              </div>
            </div>

            {/* Inline errors for this set */}
            {setErrors.length > 0 && (
              <div className="mt-1 ml-16">
                {setErrors.map((err, ei) => (
                  <p key={ei} className="text-[10px]" style={{ color: '#EF4444' }}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
