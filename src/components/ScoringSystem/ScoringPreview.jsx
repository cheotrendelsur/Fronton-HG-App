function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-muted text-xs">{label}</span>
      <span className="text-ink-primary text-xs font-medium tabular-nums">{value}</span>
    </div>
  )
}

function PreviewBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 text-neon-300 text-[10px] font-semibold uppercase tracking-widest">
      <span className="w-1.5 h-1.5 rounded-full bg-neon-300 inline-block" />
      {children}
    </span>
  )
}

export default function ScoringPreview({ config }) {
  if (!config) return null

  const { modalidad } = config

  return (
    <div className="bg-surface-800 border border-border-default rounded-xl p-4 space-y-2.5">
      <PreviewBadge>Vista previa</PreviewBadge>

      {modalidad === 'sets' && config.subModalidad === 'normal' && (
        <>
          <Row label="Modalidad"  value="Sets — Normal" />
          <Row label="Sets"       value={config.setsTotal} />
          <Row label="Games/set"  value={config.gamesPerSet} />
          <p className="text-ink-muted text-[10px] pt-1 border-t border-border-subtle leading-relaxed">
            Mejor de {config.setsTotal} · Gana el set quien alcanza {config.gamesPerSet} games primero
          </p>
        </>
      )}

      {modalidad === 'sets' && config.subModalidad === 'suma' && (
        <>
          <Row label="Modalidad"        value="Sets — Suma" />
          <Row label="Sets totales"     value={config.setsTotalSum} />
          <Row label="Games/set totales" value={config.gamesTotalPerSetSum} />
          <p className="text-ink-muted text-[10px] pt-1 border-t border-border-subtle leading-relaxed">
            Se suman los sets y games de ambos jugadores
          </p>
        </>
      )}

      {modalidad === 'puntos' && (
        <>
          <Row label="Modalidad"  value="Puntos — Directo" />
          <Row label="Partidos"   value={config.matchesTotalSum} />
          <Row label="Puntos"     value={config.pointsToWinMatch} />
          <Row
            label="Regla cierre"
            value={config.closingRule === 'diferencia' ? 'Diferencia de 2' : 'Muerte Súbita'}
          />
          <p className="text-ink-muted text-[10px] pt-1 border-t border-border-subtle leading-relaxed">
            {config.closingRule === 'diferencia'
              ? `En empate ${config.pointsToWinMatch - 1}-${config.pointsToWinMatch - 1}: se juega hasta +2`
              : `En empate ${config.pointsToWinMatch - 1}-${config.pointsToWinMatch - 1}: un punto decide`
            }
          </p>
        </>
      )}
    </div>
  )
}
