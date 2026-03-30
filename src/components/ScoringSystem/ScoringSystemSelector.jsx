import { useState } from 'react'
import SetsScoringForm   from './SetsScoringForm'
import PointsScoringForm from './PointsScoringForm'
import ScoringPreview    from './ScoringPreview'

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
            className="py-3 rounded-xl text-sm font-medium border transition-all duration-200"
            style={modalidad === opt.id
              ? { background: '#E8F4FA', borderColor: '#6BB3D9', color: '#3A8BB5' }
              : { background: '#FFFFFF', borderColor: '#E0E2E6', color: '#6B7280' }
            }
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
