import ActiveTournaments  from './ActiveTournaments'
import HistoryTournaments from './HistoryTournaments'

export default function TournamentsPageLayout({
  activeTournaments,
  historyTournaments,
  loading,
  organizerUsername,
}) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#1F2937' }}>Torneos</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Gestiona tus torneos activos e historial</p>
      </header>

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: '#E0E2E6' }} />

      {/* Content */}
      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <ActiveTournaments
          tournaments={activeTournaments}
          loading={loading}
          organizerUsername={organizerUsername}
        />

        <div className="h-px" style={{ background: '#E0E2E6' }} />

        <HistoryTournaments
          tournaments={historyTournaments}
          loading={loading}
          organizerUsername={organizerUsername}
        />
      </div>
    </div>
  )
}
