import { useEffect } from 'react'
import InfoTab        from './Tabs/InfoTab'
import SolicitudesTab from './Tabs/SolicitudesTab'
import ProgresoTab    from './Tabs/ProgresoTab'

const TABS = [
  { id: 'info',        label: 'Info' },
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'progreso',    label: 'Progreso' },
]

export default function TournamentDetailModal({
  tournament,
  currentTab,
  onTabChange,
  onClose,
  onUpdate,
}) {
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  if (!tournament) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-card
                      flex flex-col max-h-[90vh] sm:max-h-[85vh]"
           style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D1D5DB' }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-base font-semibold leading-snug truncate" style={{ color: '#1F2937' }}>
              {tournament.name}
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>
              {tournament.location ?? 'Sin ubicación'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center
                       transition-all duration-200 flex-shrink-0"
            style={{ background: '#F3F4F6', border: '1px solid #E0E2E6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-3.5 h-3.5" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13"/>
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex" style={{ borderBottom: '1px solid #E0E2E6' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="flex-1 py-2.5 text-xs font-medium transition-all duration-200 relative"
                style={{ color: currentTab === tab.id ? '#6BB3D9' : '#6B7280' }}
              >
                {tab.label}
                {currentTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                        style={{ background: '#6BB3D9' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable tab content */}
        <div className="flex-1 overflow-y-auto">
          {currentTab === 'info' && (
            <InfoTab tournament={tournament} onUpdate={onUpdate} />
          )}
          {currentTab === 'solicitudes' && (
            <SolicitudesTab tournament={tournament} />
          )}
          {currentTab === 'progreso' && (
            <ProgresoTab tournament={tournament} />
          )}
        </div>
      </div>
    </div>
  )
}
