import { useState, useEffect } from 'react'

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

export default function NormalSetsForm({ onChange }) {
  const [setsTotal,  setSetsTotal]  = useState(3)
  const [gamesPerSet, setGamesPerSet] = useState(6)
  const [touched, setTouched] = useState({ sets: false, games: false })

  useEffect(() => {
    const s = Number(setsTotal), g = Number(gamesPerSet)
    const valid = s >= 1 && s <= 5 && Number.isInteger(s)
               && g >= 1 && g <= 12 && Number.isInteger(g)
    onChange(valid
      ? { modalidad: 'sets', subModalidad: 'normal', setsTotal: s, gamesPerSet: g }
      : null
    )
  }, [setsTotal, gamesPerSet, onChange])

  return (
    <div className="grid grid-cols-2 gap-3">
      <NumField
        label="Sets totales"
        value={setsTotal}
        onChange={v => { setTouched(t => ({ ...t, sets: true })); setSetsTotal(v === '' ? '' : Number(v)) }}
        min={1}
        max={5}
        hint="Mín 1 · Máx 5"
        touched={touched.sets}
      />
      <NumField
        label="Games por set"
        value={gamesPerSet}
        onChange={v => { setTouched(t => ({ ...t, games: true })); setGamesPerSet(v === '' ? '' : Number(v)) }}
        min={1}
        max={12}
        hint="Mín 1 · Máx 12"
        touched={touched.games}
      />
    </div>
  )
}
