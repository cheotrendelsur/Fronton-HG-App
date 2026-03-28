import { useState, useEffect } from 'react'
import ClosingRuleSwitch from './ClosingRuleSwitch'

const LABEL = 'block text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1.5'

function NumField({ label, value, onChange, min, max, hint, touched }) {
  const n = Number(value)
  const invalid = value === '' || n < min || n > max || !Number.isInteger(n)
  const showError = touched && invalid

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        className={`
          w-full bg-surface-800 border rounded-xl
          px-4 py-3 text-sm text-ink-primary placeholder-ink-muted
          focus:outline-none focus:ring-1 transition-all duration-200
          ${showError
            ? 'border-red-700 focus:border-red-600 focus:ring-red-600/20'
            : 'border-border-default focus:border-neon-600 focus:ring-neon-600/30'
          }
        `}
      />
      {showError ? (
        <p className="text-red-400 text-[11px] mt-1 leading-tight">
          Debe ser un entero entre {min} y {max}
        </p>
      ) : (
        <p className="text-ink-muted text-[10px] mt-1">{hint}</p>
      )}
    </div>
  )
}

export default function PointsScoringForm({ onChange }) {
  const [matchesTotalSum,  setMatchesTotalSum]  = useState(3)
  const [pointsToWinMatch, setPointsToWinMatch] = useState(21)
  const [closingRule,      setClosingRule]      = useState('diferencia')
  const [touched, setTouched] = useState({ matches: false, points: false })

  useEffect(() => {
    const m = Number(matchesTotalSum), p = Number(pointsToWinMatch)
    const valid = m >= 1 && m <= 10  && Number.isInteger(m)
               && p >= 5 && p <= 100 && Number.isInteger(p)
    onChange(valid
      ? { modalidad: 'puntos', matchesTotalSum: m, pointsToWinMatch: p, closingRule }
      : null
    )
  }, [matchesTotalSum, pointsToWinMatch, closingRule, onChange])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumField
          label="Partidos totales (suma)"
          value={matchesTotalSum}
          onChange={v => { setTouched(t => ({ ...t, matches: true })); setMatchesTotalSum(v === '' ? '' : Number(v)) }}
          min={1}
          max={10}
          hint="Suma de ambos equipos"
          touched={touched.matches}
        />
        <NumField
          label="Puntos para ganar"
          value={pointsToWinMatch}
          onChange={v => { setTouched(t => ({ ...t, points: true })); setPointsToWinMatch(v === '' ? '' : Number(v)) }}
          min={5}
          max={100}
          hint="Ej: 21, 25, 30"
          touched={touched.points}
        />
      </div>

      <div>
        <label className={LABEL}>Regla de cierre</label>
        <ClosingRuleSwitch value={closingRule} onChange={setClosingRule} />
      </div>
    </div>
  )
}
