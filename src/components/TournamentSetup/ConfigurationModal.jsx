import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { persistTournamentStructure } from '../../lib/tournamentPersistence'
import { generateBracketStructure, getRoundPhaseName } from '../../lib/tournamentGenerator'
import CategoryConfigForm from './CategoryConfigForm'
import GenerationPreview from './GenerationPreview'
import ScheduleConfigStep from './ScheduleConfigStep'
import SchedulePreview from './SchedulePreview'
import BrandLoader from '../BrandLoader'

export default function ConfigurationModal({ tournament, isOpen, onClose, onTournamentStarted }) {
  // step: 'confirm' | 'configure' | 'preview' | 'schedule_config' | 'schedule_preview'
  const [step, setStep]                             = useState('confirm')
  const [loading, setLoading]                       = useState(false)
  const [categoriesData, setCategoriesData]         = useState([])
  const [approvedTeamsByCategory, setApprovedTeams] = useState({})
  const [configs, setConfigs]                       = useState({})
  // Step 3 data
  const [generatedData, setGeneratedData]           = useState(null)
  const [scheduleSlots, setScheduleSlots]           = useState([])
  const [scheduleDuration, setScheduleDuration]     = useState(45)
  const [flatMatches, setFlatMatches]               = useState([])
  const [saving, setSaving]                         = useState(false)
  const [saveError, setSaveError]                   = useState('')

  // Load categories + approved teams from Supabase
  const loadData = useCallback(async () => {
    if (!tournament?.id) return
    setLoading(true)

    const categories = tournament.categories ?? []

    // Fetch approved registrations for this tournament with player names
    const { data: regs } = await supabase
      .from('tournament_registrations')
      .select(`
        id, team_name, category_id, status,
        player1:profiles!tournament_registrations_player1_id_fkey(username),
        player2:profiles!tournament_registrations_player2_id_fkey(username)
      `)
      .eq('tournament_id', tournament.id)
      .eq('status', 'approved')

    const byCategory = {}
    const initialConfigs = {}

    for (const cat of categories) {
      const catRegs = (regs ?? [])
        .filter(r => r.category_id === cat.id)
        .map(r => ({
          ...r,
          player1_name: r.player1?.username ?? '?',
          player2_name: r.player2?.username ?? '?',
        }))
      byCategory[cat.id] = catRegs
      initialConfigs[cat.id] = {
        numGroups: catRegs.length >= 4 ? 2 : 1,
        eliminationPhase: '',
      }
    }

    setCategoriesData(categories)
    setApprovedTeams(byCategory)
    setConfigs(initialConfigs)
    setLoading(false)
  }, [tournament])

  useEffect(() => {
    if (isOpen && step === 'configure') loadData()
  }, [isOpen, step, loadData])

  function handleConfirmYes() {
    setStep('configure')
  }

  function handleConfigChange(catId, newConfig) {
    setConfigs(prev => ({ ...prev, [catId]: newConfig }))
  }

  // Validate all categories
  const allValid = categoriesData.every(cat => {
    const cfg = configs[cat.id]
    const approved = (approvedTeamsByCategory[cat.id] ?? []).length
    if (approved < 2) return true // skip categories with < 2 approved
    if (!cfg?.numGroups || cfg.numGroups < 1) return false
    if (cfg.numGroups > Math.floor(approved / 2)) return false
    if (!cfg.eliminationPhase) return false
    return true
  })

  // At least one category must be configurable
  const hasConfigurable = categoriesData.some(
    cat => (approvedTeamsByCategory[cat.id] ?? []).length >= 2,
  )

  function handleGeneratePreview() {
    if (allValid && hasConfigurable) setStep('preview')
  }

  // Called from GenerationPreview "Siguiente: Cronograma →"
  function handlePreviewNext(generated) {
    setGeneratedData(generated)
    // Flatten all group_phase matches across categories for the scheduler
    const flat = []
    let maxMatchNum = 0
    for (const [catId, catData] of Object.entries(generated)) {
      for (const { group, matches } of catData.groupsWithMatches) {
        for (const match of matches) {
          if (match.match_number > maxMatchNum) maxMatchNum = match.match_number
          flat.push({
            id: match.id || null,
            match_number: match.match_number,
            team1_id: match.team1?.registration?.id ?? match.team1_id ?? null,
            team2_id: match.team2?.registration?.id ?? match.team2_id ?? null,
            group_id: group.id || group.letter || catId,
            phase: 'group_phase',
          })
        }
      }
    }

    // Generate elimination placeholder matches for scheduling
    const elimFlat = []
    let elimCounter = maxMatchNum + 1
    for (const [catId, cfg] of Object.entries(configs)) {
      if (!cfg?.eliminationPhase) continue
      const bracketSlots = generateBracketStructure(cfg.eliminationPhase)
      for (const slot of bracketSlots) {
        elimFlat.push({
          match_number: elimCounter++,
          team1_id: null,
          team2_id: null,
          group_id: null,
          phase: getRoundPhaseName(cfg.eliminationPhase, slot.round_number),
          round_number: slot.round_number,
          position: slot.position,
          category_id: catId,
        })
      }
    }

    setFlatMatches([...flat, ...elimFlat])
    setStep('schedule_config')
  }

  // Called from ScheduleConfigStep "Generar Cronograma →"
  function handleScheduleGenerate({ matchDuration, selectedCourts, slots }) {
    setScheduleSlots(slots)
    setScheduleDuration(matchDuration)
    setStep('schedule_preview')
  }

  // Called from SchedulePreview "Confirmar e Iniciar Torneo ✓"
  async function handleScheduleConfirm({ assignments, matchDuration }) {
    setSaving(true)
    setSaveError('')
    const result = await persistTournamentStructure(
      supabase, tournament.id, generatedData, configs, assignments,
    )
    if (result.success) {
      onClose()
      if (onTournamentStarted) onTournamentStarted()
    } else {
      setSaveError(result.error || 'Error al guardar el torneo')
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[600px] max-h-[90vh] rounded-t-2xl sm:rounded-2xl
                   flex flex-col overflow-hidden animate-fade-up"
        style={{ background: '#F2F3F5', border: '1px solid #E0E2E6' }}
      >
        {/* Fixed header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
             style={{ background: '#FFFFFF', borderBottom: '1px solid #E8EAEE' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1F2937' }}>
            {step === 'confirm' ? 'Iniciar Torneo'
              : step === 'configure' ? 'Configuración de grupos'
              : step === 'preview' ? 'Vista previa del sorteo'
              : step === 'schedule_config' ? 'Configuración de cronograma'
              : 'Cronograma generado'}
          </h2>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: '#9CA3AF' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-4 h-4" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── STEP: Confirm ── */}
          {step === 'confirm' && (
            <div className="flex flex-col items-center text-center py-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: '#E8F4FA', border: '1px solid #D0E5F0' }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"
                  style={{ color: '#6BB3D9' }}>
                  <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1F2937' }}>
                ¿Está seguro de que desea INICIAR el torneo?
              </h3>
              <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>
                "{tournament.name}"
              </p>
              <p className="text-xs mb-8" style={{ color: '#9CA3AF' }}>
                Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3 w-full max-w-xs">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: '#F3F4F6', color: '#4B5563' }}>
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmYes}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                  style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}>
                  Sí, configurar torneo
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Configure ── */}
          {step === 'configure' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <BrandLoader size={40} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando categorías...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoriesData.map(cat => (
                  <CategoryConfigForm
                    key={cat.id}
                    category={cat}
                    approvedTeams={approvedTeamsByCategory[cat.id] ?? []}
                    config={configs[cat.id] ?? {}}
                    onConfigChange={cfg => handleConfigChange(cat.id, cfg)}
                  />
                ))}

                {!hasConfigurable && (
                  <div className="rounded-xl px-4 py-6 text-center"
                       style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <p className="text-xs font-medium" style={{ color: '#EF4444' }}>
                      Ninguna categoría tiene suficientes parejas aprobadas (mínimo 2).
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setStep('confirm')}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ background: '#F3F4F6', color: '#4B5563' }}>
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={!allValid || !hasConfigurable}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200
                               disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}>
                    Generar Vista Previa →
                  </button>
                </div>
              </div>
            )
          )}

          {/* ── STEP: Preview ── */}
          {step === 'preview' && (
            <GenerationPreview
              tournament={tournament}
              categoriesConfig={configs}
              approvedTeamsByCategory={approvedTeamsByCategory}
              onBack={() => setStep('configure')}
              onNext={handlePreviewNext}
            />
          )}

          {/* ── STEP: Schedule Config ── */}
          {step === 'schedule_config' && (
            <ScheduleConfigStep
              tournament={tournament}
              matches={flatMatches}
              configs={configs}
              onBack={() => setStep('preview')}
              onGenerate={handleScheduleGenerate}
            />
          )}

          {/* ── STEP: Schedule Preview ── */}
          {step === 'schedule_preview' && (
            saving ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <BrandLoader size={40} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Generando torneo...</p>
              </div>
            ) : (
              <>
                {saveError && (
                  <div className="rounded-xl px-4 py-3 mb-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <p className="text-xs font-medium" style={{ color: '#EF4444' }}>{saveError}</p>
                  </div>
                )}
                <SchedulePreview
                  matches={flatMatches}
                  slots={scheduleSlots}
                  matchDuration={scheduleDuration}
                  tournament={tournament}
                  onBack={() => setStep('schedule_config')}
                  onConfirm={handleScheduleConfirm}
                />
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}
