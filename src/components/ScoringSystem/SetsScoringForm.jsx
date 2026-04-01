import { useState } from 'react'
import NormalSetsForm from './NormalSetsForm'
import SumaSetsForm from './SumaSetsForm'

export default function SetsScoringForm({ value, onChange }) {
  const [subModalidad, setSubModalidad] = useState(
    value?.subModalidad ?? (value?.type === 'sets_suma' ? 'suma' : 'normal')
  )

  function switchSub(next) {
    if (next === subModalidad) return
    setSubModalidad(next)
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
            className="py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200"
            style={subModalidad === opt.id
              ? { background: '#E8F4FA', borderColor: '#6BB3D9', color: '#3A8BB5' }
              : { background: '#FFFFFF', borderColor: '#E0E2E6', color: '#6B7280' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {subModalidad === 'normal' && <NormalSetsForm value={value} onChange={onChange} />}
      {subModalidad === 'suma'   && <SumaSetsForm   value={value} onChange={onChange} />}
    </div>
  )
}
