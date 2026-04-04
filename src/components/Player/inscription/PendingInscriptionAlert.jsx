/**
 * PendingInscriptionAlert — Shows the player's outgoing partnership requests still awaiting response.
 */

function formatRelativeTime(createdAt) {
  const now = Date.now()
  const then = new Date(createdAt).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `hace ${Math.max(1, minutes)} min`
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(diffMs / 86400000)
  return `hace ${days}d`
}

export default function PendingInscriptionAlert({ requests }) {
  if (!requests || requests.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {requests.map((req, i) => {
        const partnerName = req.partner?.username ?? 'Compañero'
        const tournamentName = req.tournaments?.name ?? 'Torneo'
        const categoryName = req.categories?.name ?? 'Categoría'

        return (
          <div
            key={req.id}
            className="player-stagger-enter"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: '#FFFBEB', border: '1px solid #F5E6A3',
              borderRadius: '12px', padding: '10px 14px',
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Clock icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A827" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.4, margin: 0 }}>
                Esperando respuesta de <strong>{partnerName}</strong> en {tournamentName} ({categoryName})
              </p>
              <p style={{ fontSize: '11px', color: '#92750F', margin: '2px 0 0' }}>
                Enviada {formatRelativeTime(req.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
