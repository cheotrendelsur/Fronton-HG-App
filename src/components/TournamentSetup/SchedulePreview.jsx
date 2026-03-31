import { useState, useMemo } from 'react'
import { distributeFullTournament, validateDistribution, getScheduleSummary } from '../../lib/schedulingEngine'
import ScheduleDayView from './ScheduleDayView'

export default function SchedulePreview({
  matches,
  slots,
  matchDuration,
  tournament,
  onBack,
  onConfirm,
}) {
  const [version, setVersion] = useState(0)

  // Generate distribution (re-runs when version changes via regenerate)
  const distribution = useMemo(() => {
    const groupMatches = matches.filter(m => m.phase === 'group_phase')
    const elimMatches = matches.filter(m => m.phase !== 'group_phase')
    const result = distributeFullTournament(groupMatches, elimMatches, slots, { maxConsecutive: 2 })
    const validation = validateDistribution(result.assignments, groupMatches)
    const summary = getScheduleSummary(result.assignments)
    return { ...result, validation, summary }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, slots, version])

  const { assignments, unassigned, validation, summary } = distribution

  // Stats
  const totalDays = summary.length
  const uniqueCourts = new Set(assignments.map(a => a.court_id)).size
  const groupAssigned = distribution.groupCount ?? assignments.filter(a => !a.phase || a.phase === 'group_phase').length
  const elimAssigned = distribution.elimCount ?? assignments.length - groupAssigned

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>
          Cronograma generado
        </h3>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
          <span className="font-semibold" style={{ color: '#3A8BB5' }}>{assignments.length}</span> partidos
          ({groupAssigned} grupos + {elimAssigned} eliminatoria) en{' '}
          <span className="font-semibold" style={{ color: '#3A8BB5' }}>{totalDays}</span> día{totalDays !== 1 ? 's' : ''},{' '}
          <span className="font-semibold" style={{ color: '#3A8BB5' }}>{uniqueCourts}</span> cancha{uniqueCourts !== 1 ? 's' : ''}
          {' · '}
          <span className="tabular-nums">{matchDuration} min/partido</span>
        </p>
      </div>

      {/* Validation errors */}
      {!validation.valid && (
        <div className="rounded-xl px-4 py-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#EF4444' }}>
            Se detectaron violaciones en la distribución:
          </p>
          {validation.violations.map((v, i) => (
            <p key={i} className="text-[10px]" style={{ color: '#EF4444' }}>
              • [{v.rule}] {v.description}
            </p>
          ))}
        </div>
      )}

      {/* Unassigned warning */}
      {unassigned.length > 0 && (
        <div className="rounded-xl px-4 py-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <p className="text-xs font-medium" style={{ color: '#F59E0B' }}>
            ⚠ {unassigned.length} partido{unassigned.length !== 1 ? 's' : ''} no pudo ser asignado por falta de slots disponibles.
          </p>
        </div>
      )}

      {/* Day views */}
      <div className="space-y-3">
        {summary.map(dayData => (
          <ScheduleDayView key={dayData.date} dayData={dayData} />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            if (onConfirm) onConfirm({ assignments, matchDuration })
          }}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white
                     transition-all duration-200 active:scale-[0.98]
                     flex items-center justify-center gap-2"
          style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
        >
          Confirmar e Iniciar Torneo ✓
        </button>

        <div className="flex gap-2">
          <button type="button" onClick={onBack}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ background: '#F3F4F6', color: '#4B5563' }}>
            ← Volver
          </button>
          <button
            type="button"
            onClick={() => setVersion(v => v + 1)}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200
                       flex items-center justify-center gap-1.5"
            style={{ background: '#E8F4FA', color: '#3A8BB5', border: '1px solid #D0E5F0' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 8a6 6 0 1 1-1.7-4.2" />
              <path d="M14 2v4h-4" />
            </svg>
            Regenerar distribución
          </button>
        </div>
      </div>
    </div>
  )
}
