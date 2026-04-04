import { useState } from 'react'

const TYPES = ['Masculina', 'Femenina', 'Master', 'Junior']
const LEVELS = ['Septima', 'Sexta', 'Quinta', 'Cuarta', 'Tercera', 'Segunda', 'Primera']
const TYPES_WITH_LEVEL = ['Masculina', 'Femenina']

function buildCategoryName(type, level) {
  if (TYPES_WITH_LEVEL.includes(type) && level) {
    return `${type} ${level}`
  }
  return type
}

/**
 * Parse an existing category name back into type + level.
 * Handles "Masculina Primera", "Junior", etc.
 */
export function parseCategoryName(name) {
  if (!name) return { type: '', level: '' }
  for (const t of TYPES_WITH_LEVEL) {
    if (name.startsWith(t + ' ')) {
      const level = name.slice(t.length + 1)
      if (LEVELS.includes(level)) {
        return { type: t, level }
      }
    }
  }
  if (TYPES.includes(name)) {
    return { type: name, level: '' }
  }
  // Unknown format — return as-is with empty level
  return { type: name, level: '' }
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5"
           style={{ color: '#6B7280' }}>
      {children}
    </label>
  )
}

function SelectInput({ value, onChange, children, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-200 appearance-none"
        style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: value ? '#1F2937' : '#9CA3AF' }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: '#9CA3AF' }}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    </div>
  )
}

/**
 * Category selector with type + level dropdowns and add button.
 *
 * @param {Array} categories - Array of { name, max_couples, id? }
 * @param {(categories: Array) => void} onChange - Called with updated array
 * @param {boolean} canRemove - Whether categories can be removed
 */
export default function CategorySelector({ categories, onChange, canRemove = true }) {
  const [type, setType] = useState('')
  const [level, setLevel] = useState('')
  const [maxCouples, setMaxCouples] = useState(16)
  const [error, setError] = useState('')

  const needsLevel = TYPES_WITH_LEVEL.includes(type)
  const generatedName = type ? buildCategoryName(type, needsLevel ? level : '') : ''

  function handleAdd() {
    setError('')

    if (!type) {
      setError('Selecciona un tipo.')
      return
    }
    if (needsLevel && !level) {
      setError('Selecciona un nivel.')
      return
    }
    if (!maxCouples || Number(maxCouples) < 2) {
      setError('Minimo 2 duplas.')
      return
    }

    const name = generatedName
    // Check duplicates
    if (categories.some(c => c.name === name)) {
      setError(`"${name}" ya esta agregada.`)
      return
    }

    onChange([...categories, { name, max_couples: Number(maxCouples) }])
    setType('')
    setLevel('')
    setMaxCouples(16)
  }

  function handleRemove(index) {
    onChange(categories.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#F9FAFB', border: '1px solid #E0E2E6' }}>
        <div>
          <FieldLabel>Tipo *</FieldLabel>
          <SelectInput
            value={type}
            onChange={e => { setType(e.target.value); setLevel(''); setError('') }}
            placeholder="Seleccionar tipo..."
          >
            {TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </SelectInput>
        </div>

        {needsLevel && (
          <div>
            <FieldLabel>Nivel *</FieldLabel>
            <SelectInput
              value={level}
              onChange={e => { setLevel(e.target.value); setError('') }}
              placeholder="Seleccionar nivel..."
            >
              {LEVELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </SelectInput>
          </div>
        )}

        <div>
          <FieldLabel>Maximo de duplas *</FieldLabel>
          <input
            type="number"
            min={2}
            max={128}
            value={maxCouples}
            onChange={e => setMaxCouples(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-200"
            style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#1F2937' }}
          />
        </div>

        {generatedName && (
          <p className="text-xs" style={{ color: '#6B7280' }}>
            Nombre: <span className="font-semibold" style={{ color: '#1F2937' }}>{generatedName}</span>
          </p>
        )}

        {error && (
          <p className="text-[11px]" style={{ color: '#EF4444' }}>{error}</p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: type ? '#6BB3D9' : '#F3F4F6',
            color: type ? '#FFFFFF' : '#9CA3AF',
            opacity: type ? 1 : 0.6,
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
            className="w-4 h-4" strokeLinecap="round">
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 5v6M5 8h6"/>
          </svg>
          Agregar categoria
        </button>
      </div>

      {/* List of added categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <FieldLabel>Categorias agregadas</FieldLabel>
          {categories.map((cat, i) => (
            <div
              key={cat.id ?? `cat-${i}`}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold tabular-nums" style={{ color: '#9CA3AF' }}>
                  {i + 1}.
                </span>
                <span className="text-sm font-medium truncate" style={{ color: '#1F2937' }}>
                  {cat.name}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: '#6B7280' }}>
                  max: {cat.max_couples}
                </span>
              </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-red-500 transition-all duration-200 flex-shrink-0 ml-2"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}
                    className="w-3 h-3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 2l8 8M10 2l-8 8"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {categories.length === 0 && (
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Agrega al menos 1 categoria para el torneo.
        </p>
      )}
    </div>
  )
}
