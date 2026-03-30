import { useState, useEffect } from 'react'

function NumField({ label, value, onChange, min, max, hint, touched }) {
  const n = Number(value)
  const invalid = value === '' || n < min || n > max || !Number.isInteger(n)
  const showError = touched && invalid

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5"
             style={{ color: '#6B7280' }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-200"
        style={{
          background: '#FFFFFF',
          color: '#1F2937',
          border: showError ? '1px solid #EF4444' : '1px solid #E0E2E6',
        }}
      />
      {showError ? (
        <p className="text-red-500 text-[11px] mt-1 leading-tight">
          Debe ser un entero entre {min} y {max}
        </p>
      ) : (
        <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>{hint}</p>
      )}
    </div>
  )
}

export default function SumaSetsForm({ onChange }) {
  const [setsTotalSum,       setSetsTotalSum]       = useState(6)
  const [gamesTotalPerSetSum, setGamesTotalPerSetSum] = useState(12)
  const [touched, setTouched] = useState({ sets: false, games: false })

  useEffect(() => {
    const s = Number(setsTotalSum), g = Number(gamesTotalPerSetSum)
    const valid = s >= 1 && s <= 10 && Number.isInteger(s)
               && g >= 2 && g <= 20 && Number.isInteger(g)
    onChange(valid
      ? { modalidad: 'sets', subModalidad: 'suma', setsTotalSum: s, gamesTotalPerSetSum: g }
      : null
    )
  }, [setsTotalSum, gamesTotalPerSetSum, onChange])

  return (
    <div className="grid grid-cols-2 gap-3">
      <NumField
        label="Sets totales (suma)"
        value={setsTotalSum}
        onChange={v => { setTouched(t => ({ ...t, sets: true })); setSetsTotalSum(v === '' ? '' : Number(v)) }}
        min={1}
        max={10}
        hint="Suma entre ambos · Máx 10"
        touched={touched.sets}
      />
      <NumField
        label="Games por set (suma)"
        value={gamesTotalPerSetSum}
        onChange={v => { setTouched(t => ({ ...t, games: true })); setGamesTotalPerSetSum(v === '' ? '' : Number(v)) }}
        min={2}
        max={20}
        hint="Suma entre ambos · Máx 20"
        touched={touched.games}
      />
    </div>
  )
}
