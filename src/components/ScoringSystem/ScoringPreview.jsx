function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
      <span className="text-xs font-medium tabular-nums" style={{ color: '#6BB3D9' }}>{value}</span>
    </div>
  )
}

function PreviewBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#6BB3D9' }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#6BB3D9' }} />
      {children}
    </span>
  )
}

export default function ScoringPreview({ config }) {
  if (!config) return null

  const { modalidad } = config

  return (
    <div className="rounded-xl p-4 space-y-2.5"
         style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
      <PreviewBadge>Vista previa</PreviewBadge>

      {modalidad === 'sets' && config.subModalidad === 'normal' && (
        <>
          <Row label="Modalidad"  value="Sets — Normal" />
          <Row label="Sets"       value={config.setsTotal} />
          <Row label="Games/set"  value={config.gamesPerSet} />
          <p className="text-[10px] pt-1 leading-relaxed"
             style={{ color: '#9CA3AF', borderTop: '1px solid #E8EAEE' }}>
            Mejor de {config.setsTotal} · Gana el set quien alcanza {config.gamesPerSet} games primero
          </p>
        </>
      )}

      {modalidad === 'sets' && config.subModalidad === 'suma' && (
        <>
          <Row label="Modalidad"        value="Sets — Suma" />
          <Row label="Sets totales"     value={config.setsTotalSum} />
          <Row label="Games/set totales" value={config.gamesTotalPerSetSum} />
          <p className="text-[10px] pt-1 leading-relaxed"
             style={{ color: '#9CA3AF', borderTop: '1px solid #E8EAEE' }}>
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
          <p className="text-[10px] pt-1 leading-relaxed"
             style={{ color: '#9CA3AF', borderTop: '1px solid #E8EAEE' }}>
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
