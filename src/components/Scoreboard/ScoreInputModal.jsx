import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { validateScoreInput, calculateMatchResult } from '../../lib/scoreManager'
import SetsScoreForm from './SetsScoreForm'
import PointsScoreForm from './PointsScoreForm'

function getScoringBanner(config) {
  if (!config?.type) return 'Configuración no definida'
  const { type } = config

  if (type === 'sets_normal') {
    const maxSets = (config.sets_to_win ?? 2) * 2 - 1
    return `Mejor de ${maxSets} sets de ${config.games_per_set ?? 6} games`
  }
  if (type === 'sets_suma') {
    return `${config.total_sets ?? 3} sets de ${config.games_per_set ?? 4} games (todos se juegan)`
  }
  if (type === 'points') {
    const winBy = config.win_by ?? 1
    let text = `Partido a ${config.points_to_win ?? 21} puntos`
    if (winBy === 1) {
      text += ' · Punto directo'
    } else {
      text += ' · Diferencia de 2'
      text += config.max_points != null ? ` · Máximo ${config.max_points}` : ' · Sin máximo'
    }
    return text
  }
  return 'Configuración desconocida'
}

function getInitialScores(config) {
  if (!config?.type) return {}
  if (config.type === 'points') return { team1_points: null, team2_points: null }
  return { team1_games: [], team2_games: [] }
}

export default function ScoreInputModal({ match, scoringConfig, categoryName, onSave, onClose }) {
  const safeConfig = scoringConfig ?? null
  const [scores, setScores] = useState(() => getInitialScores(safeConfig))
  const [saving, setSaving] = useState(false)

  // Block body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const validation = useMemo(
    () => validateScoreInput(scores, safeConfig),
    [scores, safeConfig],
  )

  const result = useMemo(() => {
    if (!validation.complete || !validation.valid) return null
    return calculateMatchResult(scores, safeConfig)
  }, [validation, scores, safeConfig])

  const canSave = validation.valid && validation.complete && result?.winner

  const winnerName = result?.winner === 'team1'
    ? `${match?.team1_p1 ?? '?'} / ${match?.team1_p2 ?? '?'}`
    : result?.winner === 'team2'
    ? `${match?.team2_p1 ?? '?'} / ${match?.team2_p2 ?? '?'}`
    : null

  const team1Label = `${match?.team1_p1 ?? '?'} / ${match?.team1_p2 ?? '?'}`
  const team2Label = `${match?.team2_p1 ?? '?'} / ${match?.team2_p2 ?? '?'}`
  const isPoints = safeConfig?.type === 'points'

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    if (onSave) await onSave(match, result)
    setSaving(false)
  }

  return createPortal(
    <>
      {/* Inline keyframes for entrance animation */}
      <style>{`
        @keyframes score-modal-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes score-modal-panel-in {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Overlay — click does NOT close, portaled to body */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          animation: 'score-modal-overlay-in 150ms ease-out',
        }}
      >
        {/* Centered panel */}
        <div
          className="relative flex flex-col"
          style={{
            width: '90%',
            maxWidth: '420px',
            maxHeight: '85vh',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '0.5px solid #E0E2E6',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
            animation: 'score-modal-panel-in 200ms ease-out',
            overflow: 'hidden',
          }}
        >
          {/* Close button — absolute top-right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute flex items-center justify-center transition-colors duration-150"
            style={{
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'transparent',
              color: '#9CA3AF',
              zIndex: 2,
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#4B5563' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-4 h-4" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-3 space-y-4" style={{ overscrollBehavior: 'contain' }}>

            {/* Title */}
            <h2 className="text-base font-semibold pr-8" style={{ color: '#1F2937' }}>
              Registrar resultado
            </h2>

            {/* Error state: no scoring config */}
            {!safeConfig?.type ? (
              <div className="rounded-xl px-4 py-6 text-center"
                   style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <p className="text-xs font-medium" style={{ color: '#EF4444' }}>
                  No se encontró la configuración de puntuación para este torneo. Verifica que el torneo tenga un sistema de scoring configurado.
                </p>
              </div>
            ) : (
            <>
            {/* Match info */}
            <div className="text-center space-y-0.5">
              <p className="text-[11px] font-medium" style={{ color: '#6B7280' }}>
                Partido {match?.match_number ?? ''}
                {match?.scheduled_time ? ` · ${match.scheduled_time}` : ''}
                {match?.court_name ? ` · ${match.court_name}` : ''}
                {match?.group_letter ? ` · Grupo ${match.group_letter}` : ''}
                {categoryName ? ` · ${categoryName}` : ''}
              </p>
            </div>

            {/* Teams side-by-side: Dupla 1 left | vs | Dupla 2 right */}
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center">
                <p className="text-xs font-semibold" style={{ color: '#1F2937' }}>{match?.team1_p1 ?? '?'}</p>
                <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>/</p>
                <p className="text-xs font-semibold" style={{ color: '#1F2937' }}>{match?.team1_p2 ?? '?'}</p>
              </div>
              <p className="text-[10px] font-bold flex-shrink-0" style={{ color: '#D1D5DB' }}>vs</p>
              <div className="flex-1 text-center">
                <p className="text-xs font-semibold" style={{ color: '#1F2937' }}>{match?.team2_p1 ?? '?'}</p>
                <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>/</p>
                <p className="text-xs font-semibold" style={{ color: '#1F2937' }}>{match?.team2_p2 ?? '?'}</p>
              </div>
            </div>

            {/* Scoring banner */}
            <div
              className="rounded-lg px-3 py-2.5 text-center"
              style={{ background: '#FFF5D6', border: '1px solid #F5E6A3' }}
            >
              <p className="text-[11px] font-medium" style={{ color: '#92750F' }}>
                {getScoringBanner(safeConfig)}
              </p>
            </div>

            {/* Score form */}
            {isPoints ? (
              <PointsScoreForm
                scoringConfig={safeConfig}
                scores={scores}
                onScoresChange={setScores}
                errors={validation.errors}
                team1Label={team1Label}
                team2Label={team2Label}
              />
            ) : (
              <SetsScoreForm
                scoringConfig={safeConfig}
                scores={scores}
                onScoresChange={setScores}
                errors={validation.errors}
                team1Label={team1Label}
                team2Label={team2Label}
              />
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="space-y-0.5">
                {validation.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-center" style={{ color: '#F59E0B' }}>{w}</p>
                ))}
              </div>
            )}

            {/* Winner result or incomplete message */}
            {canSave && winnerName ? (
              <div
                className="rounded-xl px-4 py-3 text-center"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
              >
                <p className="text-xs font-semibold" style={{ color: '#16A34A' }}>
                  ✓ Ganador: {winnerName}
                </p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: '#16A34A' }}>
                  {result.summary}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-center" style={{ color: '#9CA3AF' }}>
                Completa el resultado para continuar
              </p>
            )}
            </>
            )}
          </div>

          {/* Sticky footer buttons */}
          <div
            className="flex gap-2 px-5 py-4 flex-shrink-0"
            style={{
              background: '#FFFFFF',
              borderTop: '1px solid #E8EAEE',
              position: 'sticky',
              bottom: 0,
            }}
          >
            <button
              type="button" onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40"
              style={{ background: '#F3F4F6', color: '#4B5563' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#6BB3D9', boxShadow: canSave ? '0 0 12px rgba(107,179,217,0.15)' : 'none' }}
            >
              {saving ? 'Guardando...' : 'Guardar resultado'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
