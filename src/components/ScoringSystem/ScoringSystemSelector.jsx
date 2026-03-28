import { useState } from 'react'
import SetsScoringForm   from './SetsScoringForm'
import PointsScoringForm from './PointsScoringForm'
import ScoringPreview    from './ScoringPreview'

const ACTIVE   = 'bg-neon-900/40 border-neon-700 text-neon-300 shadow-neon-sm'
const INACTIVE = 'bg-surface-800 border-border-default text-ink-secondary hover:border-border-strong'

export default function ScoringSystemSelector({ value, onChange }) {
  const [modalidad, setModalidad] = useState(value?.modalidad ?? 'sets')

  function switchModalidad(next) {
    if (next === modalidad) return
    setModalidad(next)
    onChange(null)
  }

  return (
    <div className="space-y-4">
      {/* Switch principal: Sets / Puntos */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'sets',   label: 'Sets'   },
          { id: 'puntos', label: 'Puntos' },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => switchModalidad(opt.id)}
            className={`
              py-3 rounded-xl text-sm font-medium border
              transition-all duration-200
              ${modalidad === opt.id ? ACTIVE : INACTIVE}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {modalidad === 'sets'   && <SetsScoringForm   onChange={onChange} />}
      {modalidad === 'puntos' && <PointsScoringForm  onChange={onChange} />}

      <ScoringPreview config={value} />
    </div>
  )
}
