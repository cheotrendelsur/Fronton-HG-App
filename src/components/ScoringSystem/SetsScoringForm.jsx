import { useState } from 'react'
import NormalSetsForm from './NormalSetsForm'
import SumaSetsForm from './SumaSetsForm'

const ACTIVE   = 'bg-neon-900/40 border-neon-700 text-neon-300 shadow-neon-sm'
const INACTIVE = 'bg-surface-800 border-border-default text-ink-secondary hover:border-border-strong'

export default function SetsScoringForm({ onChange }) {
  const [subModalidad, setSubModalidad] = useState('normal')

  function switchSub(next) {
    if (next === subModalidad) return
    setSubModalidad(next)
    onChange(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'normal', label: 'Normal' },
          { id: 'suma',   label: 'Suma'   },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => switchSub(opt.id)}
            className={`
              py-2.5 rounded-xl text-xs font-semibold border
              transition-all duration-200
              ${subModalidad === opt.id ? ACTIVE : INACTIVE}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {subModalidad === 'normal' && <NormalSetsForm onChange={onChange} />}
      {subModalidad === 'suma'   && <SumaSetsForm   onChange={onChange} />}
    </div>
  )
}
