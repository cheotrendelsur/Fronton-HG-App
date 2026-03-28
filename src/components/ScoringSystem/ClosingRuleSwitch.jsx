const ACTIVE   = 'bg-neon-900/40 border-neon-700 text-neon-300 shadow-neon-sm'
const INACTIVE = 'bg-surface-800 border-border-default text-ink-secondary hover:border-border-strong'

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
            className={`
              py-2.5 px-3 rounded-xl text-xs font-semibold border
              transition-all duration-200 text-center
              ${value === opt.id ? ACTIVE : INACTIVE}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-ink-muted text-[10px] leading-relaxed">
        {OPTIONS.find(o => o.id === value)?.desc}
      </p>
    </div>
  )
}
