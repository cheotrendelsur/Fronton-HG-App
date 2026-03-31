import { useMemo } from 'react'
import {
  getEliminationOptions,
  calculateClassification,
} from '../../lib/tournamentGenerator'

export default function CategoryConfigForm({ category, approvedTeams, config, onConfigChange }) {
  const numApproved = approvedTeams.length

  const eliminationOptions = useMemo(
    () => getEliminationOptions(numApproved),
    [numApproved],
  )

  const numGroups       = config.numGroups ?? 1
  const elimPhase       = config.eliminationPhase ?? ''
  const maxGroups       = Math.floor(numApproved / 2)

  // Validación
  const groupError = numGroups < 1
    ? 'Mínimo 1 grupo'
    : numGroups > maxGroups
      ? `Máximo ${maxGroups} grupos (cada grupo necesita al menos 2 parejas)`
      : numApproved > 0 && numGroups > numApproved
        ? 'Más grupos que parejas'
        : ''

  const phaseError = !elimPhase ? 'Seleccione una fase eliminatoria' : ''

  // Cálculos en tiempo real
  const classification = useMemo(() => {
    if (groupError || phaseError || !elimPhase || numGroups < 1) return null
    try {
      return calculateClassification(numGroups, elimPhase)
    } catch {
      return null
    }
  }, [numGroups, elimPhase, groupError, phaseError])

  function handleGroupsChange(e) {
    const val = parseInt(e.target.value, 10)
    onConfigChange({ ...config, numGroups: isNaN(val) ? '' : val })
  }

  function handlePhaseChange(e) {
    onConfigChange({ ...config, eliminationPhase: e.target.value })
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#FFFFFF', border: '1px solid #E8EAEE' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
          {category.name}
        </h4>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ background: '#E8F4FA', color: '#3A8BB5' }}
        >
          {numApproved} parejas aprobadas
        </span>
      </div>

      {numApproved < 2 ? (
        <p className="text-xs" style={{ color: '#EF4444' }}>
          Se necesitan al menos 2 parejas aprobadas para configurar esta categoría.
        </p>
      ) : (
        <>
          {/* Grupos */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: '#6B7280' }}>
              Cantidad de grupos
            </label>
            <input
              type="number"
              min={1}
              max={maxGroups}
              value={config.numGroups ?? ''}
              onChange={handleGroupsChange}
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                         outline-none"
              style={{
                background: '#FFFFFF',
                border: groupError ? '1px solid #EF4444' : '1px solid #E0E2E6',
                color: '#1F2937',
              }}
              onFocus={e => { e.target.style.borderColor = '#6BB3D9'; e.target.style.boxShadow = '0 0 0 3px rgba(107,179,217,0.15)' }}
              onBlur={e => { e.target.style.borderColor = groupError ? '#EF4444' : '#E0E2E6'; e.target.style.boxShadow = 'none' }}
            />
            {groupError && (
              <p className="text-[11px]" style={{ color: '#EF4444' }}>{groupError}</p>
            )}
          </div>

          {/* Fase eliminatoria */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: '#6B7280' }}>
              Fase eliminatoria
            </label>
            <select
              value={elimPhase}
              onChange={handlePhaseChange}
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                         outline-none appearance-none cursor-pointer"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E0E2E6',
                color: elimPhase ? '#1F2937' : '#9CA3AF',
              }}
              onFocus={e => { e.target.style.borderColor = '#6BB3D9'; e.target.style.boxShadow = '0 0 0 3px rgba(107,179,217,0.15)' }}
              onBlur={e => { e.target.style.borderColor = '#E0E2E6'; e.target.style.boxShadow = 'none' }}
            >
              <option value="">Seleccionar fase...</option>
              {eliminationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.slots} clasifican)
                </option>
              ))}
            </select>
          </div>

          {/* Cálculos en tiempo real */}
          {classification && !groupError && (
            <div
              className="rounded-lg px-3 py-2.5 space-y-1"
              style={{ background: '#F0F9FF', border: '1px solid #D0E5F0' }}
            >
              <p className="text-xs" style={{ color: '#4B5563' }}>
                ~<span className="font-semibold" style={{ color: '#3A8BB5' }}>
                  {Math.ceil(numApproved / numGroups)}
                </span> parejas por grupo
              </p>
              <p className="text-xs" style={{ color: '#4B5563' }}>
                Clasifican directamente: los primeros{' '}
                <span className="font-semibold" style={{ color: '#3A8BB5' }}>
                  {classification.teamsPerGroupQualify}
                </span>{' '}
                de cada grupo
              </p>
              {classification.bestPositionedNeeded > 0 && (
                <p className="text-xs" style={{ color: '#4B5563' }}>
                  <span className="capitalize" style={{ color: '#3A8BB5', fontWeight: 600 }}>
                    {classification.label}
                  </span>
                  :{' '}
                  <span className="font-semibold" style={{ color: '#3A8BB5' }}>
                    {classification.bestPositionedNeeded}
                  </span>{' '}
                  parejas
                </p>
              )}
              <p className="text-xs font-medium" style={{ color: '#1F2937' }}>
                Total clasificados:{' '}
                <span style={{ color: '#3A8BB5' }}>
                  {classification.slotsEliminatoria}
                </span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
