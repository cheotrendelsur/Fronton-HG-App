const OPTIONS = [
  { id: 'diferencia',    label: 'Diferencia de 2',       desc: 'Se sigue hasta +2 puntos de diferencia' },
  { id: 'muerte-subita', label: 'Muerte Súbita',          desc: 'Un punto extra decide el partido' },
]

export default function ClosingRuleSwitch({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 text-center"
            style={value === opt.id
              ? { background: '#E8F4FA', borderColor: '#6BB3D9', color: '#3A8BB5' }
              : { background: '#FFFFFF', borderColor: '#E0E2E6', color: '#6B7280' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: '#9CA3AF' }}>
        {OPTIONS.find(o => o.id === value)?.desc}
      </p>
    </div>
  )
}
