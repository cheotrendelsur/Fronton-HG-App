import ActiveTournaments  from './ActiveTournaments'
import HistoryTournaments from './HistoryTournaments'

export default function TournamentsPageLayout({
  activeTournaments,
  historyTournaments,
  onSelectTournament,
  loading,
  organizerUsername,
}) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-ink-primary text-2xl font-semibold tracking-tight">Torneos</h1>
        <p className="text-ink-muted text-xs mt-0.5">Gestiona tus torneos activos e historial</p>
      </header>

      {/* Divider */}
      <div className="h-px bg-border-default mx-4" />

      {/* Content */}
      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <ActiveTournaments
          tournaments={activeTournaments}
          onSelect={onSelectTournament}
          loading={loading}
          organizerUsername={organizerUsername}
        />

        <div className="h-px bg-border-default" />

        <HistoryTournaments
          tournaments={historyTournaments}
          onSelect={onSelectTournament}
          loading={loading}
          organizerUsername={organizerUsername}
        />
      </div>
    </div>
  )
}
