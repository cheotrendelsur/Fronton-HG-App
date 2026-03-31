import { useState, useCallback, useMemo } from 'react'
import {
  generateGroups,
  generateRoundRobinMatches,
  calculateClassification,
} from '../../lib/tournamentGenerator'
import BrandLoader from '../BrandLoader'

function GroupCard({ group, matches }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Group header */}
      <div className="px-4 py-3 flex items-center justify-between"
           style={{ borderBottom: '1px solid #F3F4F6' }}>
        <h5 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
          Grupo {group.letter}
        </h5>
        <span className="text-[11px] font-medium" style={{ color: '#6B7280' }}>
          {group.members.length} parejas · {matches.length} partidos
        </span>
      </div>

      {/* Members */}
      <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
        {group.members.map((m, i) => (
          <div key={m.draw_position} className="flex items-start gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
              style={{ background: '#E8F4FA', color: '#3A8BB5' }}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#1F2937' }}>
                {m.registration.team_name}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>
                {m.registration.player1_name} / {m.registration.player2_name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Matches toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium transition-colors duration-150"
        style={{ color: '#6BB3D9', background: open ? '#F0F9FF' : 'transparent' }}
      >
        <span>Ver partidos ({matches.length})</span>
        <svg
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
          className="w-3 h-3 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {matches.map(match => (
            <div
              key={match.match_number}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
            >
              <span className="font-mono text-[10px] flex-shrink-0" style={{ color: '#9CA3AF' }}>
                #{match.match_number}
              </span>
              <span className="flex-1 truncate" style={{ color: '#374151' }}>
                {match.team1.registration.team_name}
              </span>
              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#D1D5DB' }}>vs</span>
              <span className="flex-1 truncate text-right" style={{ color: '#374151' }}>
                {match.team2.registration.team_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GenerationPreview({
  tournament,
  categoriesConfig,
  approvedTeamsByCategory,
  onBack,
  onNext,
}) {

  // Generate data for all categories
  const generate = useCallback(() => {
    let matchCounter = 1
    const result = {}

    for (const [catId, cfg] of Object.entries(categoriesConfig)) {
      const teams = approvedTeamsByCategory[catId] ?? []
      if (teams.length < 2 || !cfg.numGroups || !cfg.eliminationPhase) continue

      const groups = generateGroups(teams, cfg.numGroups)
      const groupsWithMatches = groups.map(group => {
        const matches = generateRoundRobinMatches(group.members, matchCounter)
        matchCounter += matches.length
        return { group, matches }
      })

      const classification = calculateClassification(cfg.numGroups, cfg.eliminationPhase)
      const totalMatches = groupsWithMatches.reduce((sum, g) => sum + g.matches.length, 0)

      result[catId] = { groupsWithMatches, classification, totalMatches }
    }
    return result
  }, [categoriesConfig, approvedTeamsByCategory])

  const [generated, setGenerated] = useState(() => generate())

  function handleRegenerate() {
    setGenerated(generate())
  }

  // Find category name from tournament data
  const categoryMap = useMemo(() => {
    const map = {}
    for (const cat of tournament.categories ?? []) {
      map[cat.id] = cat.name
    }
    return map
  }, [tournament.categories])

  const totalAllMatches = Object.values(generated).reduce((s, c) => s + c.totalMatches, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>
          Vista previa del sorteo
        </h3>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
          Total partidos fase de grupos:{' '}
          <span className="font-semibold" style={{ color: '#3A8BB5' }}>{totalAllMatches}</span>
        </p>
      </div>

      {/* Per category */}
      {Object.entries(generated).map(([catId, data]) => {
        const catName = categoryMap[catId] ?? catId
        const { groupsWithMatches, classification } = data

        return (
          <div key={catId} className="space-y-3">
            {/* Category header */}
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
                {catName}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#F3F4F6', color: '#6B7280' }}>
                {data.totalMatches} partidos
              </span>
            </div>

            {/* Groups */}
            <div className="space-y-3">
              {groupsWithMatches.map(({ group, matches }) => (
                <GroupCard key={group.letter} group={group} matches={matches} />
              ))}
            </div>

            {/* Classification summary */}
            <div
              className="rounded-lg px-3 py-2.5 space-y-0.5"
              style={{ background: '#F0F9FF', border: '1px solid #D0E5F0' }}
            >
              <p className="text-xs" style={{ color: '#4B5563' }}>
                Clasifican: los primeros{' '}
                <span className="font-semibold" style={{ color: '#3A8BB5' }}>
                  {classification.teamsPerGroupQualify}
                </span>{' '}
                de cada grupo
              </p>
              {classification.bestPositionedNeeded > 0 && (
                <p className="text-xs" style={{ color: '#4B5563' }}>
                  <span className="capitalize font-semibold" style={{ color: '#3A8BB5' }}>
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
                Total:{' '}
                <span style={{ color: '#3A8BB5' }}>{classification.slotsEliminatoria}</span>{' '}
                clasificados para{' '}
                {categoriesConfig[catId]?.eliminationPhase === 'final' ? 'la final'
                  : categoriesConfig[catId]?.eliminationPhase === 'semifinals' ? 'semifinales'
                  : categoriesConfig[catId]?.eliminationPhase === 'quarterfinals' ? 'cuartos de final'
                  : categoriesConfig[catId]?.eliminationPhase === 'round_of_16' ? 'octavos de final'
                  : 'la fase eliminatoria'}
              </p>
            </div>
          </div>
        )
      })}

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={() => { if (onNext) onNext(generated) }}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white
                     transition-all duration-200 active:scale-[0.98]
                     flex items-center justify-center gap-2"
          style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
        >
          Siguiente: Cronograma →
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl text-sm font-medium
                       transition-all duration-200"
            style={{ background: '#F3F4F6', color: '#4B5563' }}
          >
            ← Volver
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex-1 py-3 rounded-xl text-sm font-medium
                       transition-all duration-200 flex items-center justify-center gap-1.5"
            style={{ background: '#E8F4FA', color: '#3A8BB5', border: '1px solid #D0E5F0' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 8a6 6 0 1 1-1.7-4.2"/>
              <path d="M14 2v4h-4"/>
            </svg>
            Regenerar sorteo
          </button>
        </div>
      </div>
    </div>
  )
}
