import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import BrandLoader from '../components/BrandLoader'
import InfoTab from '../components/TournamentsDashboard/Tabs/InfoTab'
import SolicitudesTab from '../components/TournamentsDashboard/Tabs/SolicitudesTab'
import ProgresoTab from '../components/TournamentsDashboard/Tabs/ProgresoTab'
import ConfigurationModal from '../components/TournamentSetup/ConfigurationModal'

const TABS = [
  { key: 'info',        label: 'Info' },
  { key: 'solicitudes', label: 'Solicitudes' },
  { key: 'progreso',    label: 'Progreso' },
]

export default function TournamentManagePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [tournament, setTournament] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('info')
  const [configOpen, setConfigOpen] = useState(false)

  const loadTournament = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, location, status, start_date, end_date, inscription_fee, scoring_config, description, categories(id, name, max_couples), sports(name)')
      .eq('id', id)
      .single()

    if (!data) {
      navigate('/tournaments', { replace: true })
      return
    }
    setTournament(data)
    setLoading(false)
  }, [id, navigate])

  useEffect(() => { loadTournament() }, [loadTournament])

  function handleUpdate(updated) {
    setTournament(prev => prev ? { ...prev, ...updated } : prev)
  }

  function handleTournamentStarted() {
    navigate('/tournaments', { replace: true })
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-6 animate-fade-up">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate('/tournaments')}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5"/>
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold truncate" style={{ color: '#1F2937' }}>
              {tournament?.name ?? 'Torneo'}
            </h1>
            <p className="text-[11px]" style={{ color: '#6B7280' }}>
              {tournament?.status === 'inscription' ? 'Inscripciones abiertas' : tournament?.status === 'draft' ? 'Borrador' : tournament?.status ?? ''}
            </p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl p-1 mb-5" style={{ background: '#E8EAEE' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#1F2937' : '#6B7280',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading || !tournament ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <BrandLoader size={40} />
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando torneo...</p>
          </div>
        ) : (
          <>
            {activeTab === 'info' && (
              <InfoTab tournament={tournament} onUpdate={handleUpdate} />
            )}
            {activeTab === 'solicitudes' && (
              <SolicitudesTab tournament={tournament} />
            )}
            {activeTab === 'progreso' && (
              <ProgresoTab tournament={tournament} />
            )}

            {/* Start button */}
            {tournament.status !== 'active' && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setConfigOpen(true)}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white
                             transition-all duration-200 active:scale-[0.98]"
                  style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
                >
                  Listo para iniciar
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfigurationModal
        tournament={tournament}
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        onTournamentStarted={handleTournamentStarted}
      />
    </Layout>
  )
}
