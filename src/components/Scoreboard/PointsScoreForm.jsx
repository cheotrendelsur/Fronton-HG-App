export default function PointsScoreForm({ scoringConfig, scores, onScoresChange, errors, team1Label, team2Label }) {
  const { points_to_win = 21, max_points } = scoringConfig
  const winBy = scoringConfig.win_by ?? 1

  // Determine max for inputs
  let inputMax
  if (winBy === 1) {
    inputMax = points_to_win
  } else if (max_points != null) {
    inputMax = max_points
  } else {
    inputMax = undefined // no limit
  }

  function handleChange(team, value) {
    const parsed = value === '' ? null : Math.max(0, parseInt(value, 10) || 0)
    if (team === 1) {
      onScoresChange({ ...scores, team1_points: parsed })
    } else {
      onScoresChange({ ...scores, team2_points: parsed })
    }
  }

  // Reference text
  let refText = `Primero en llegar a ${points_to_win} puntos`
  if (winBy === 2) {
    refText += ' · Diferencia de 2'
    if (max_points != null) refText += ` · Máximo ${max_points}`
    else refText += ' · Sin máximo'
  } else {
    refText += ' · Punto directo'
  }

  return (
    <div className="space-y-4">
      {/* Team 1 */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4B5563' }}>
          {team1Label}
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={inputMax}
          step={1}
          value={scores.team1_points ?? ''}
          onChange={e => handleChange(1, e.target.value)}
          placeholder="0"
          className="w-full text-center font-bold rounded-xl tabular-nums"
          style={{
            height: '56px',
            fontSize: '24px',
            background: '#FFFFFF',
            border: `1.5px solid ${errors.length > 0 ? '#FECACA' : '#E0E2E6'}`,
            color: '#1F2937',
            outline: 'none',
          }}
        />
      </div>

      {/* vs divider */}
      <div className="text-center">
        <span className="text-xs font-bold" style={{ color: '#D1D5DB' }}>vs</span>
      </div>

      {/* Team 2 */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4B5563' }}>
          {team2Label}
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={inputMax}
          step={1}
          value={scores.team2_points ?? ''}
          onChange={e => handleChange(2, e.target.value)}
          placeholder="0"
          className="w-full text-center font-bold rounded-xl tabular-nums"
          style={{
            height: '56px',
            fontSize: '24px',
            background: '#FFFFFF',
            border: `1.5px solid ${errors.length > 0 ? '#FECACA' : '#E0E2E6'}`,
            color: '#1F2937',
            outline: 'none',
          }}
        />
      </div>

      {/* Reference */}
      <p className="text-[11px] text-center" style={{ color: '#9CA3AF' }}>
        {refText}
      </p>

      {/* Inline errors */}
      {errors.length > 0 && (
        <div className="space-y-0.5">
          {errors.map((err, i) => (
            <p key={i} className="text-[10px] text-center" style={{ color: '#EF4444' }}>{err}</p>
          ))}
        </div>
      )}
    </div>
  )
}
