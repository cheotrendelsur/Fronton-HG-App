import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { generateAllSlots, validateSlotCapacity } from '../../lib/schedulingEngine'
import { calculateEstimatedDuration, formatDurationBreakdown } from '../../lib/matchDurationCalculator'
import BrandLoader from '../BrandLoader'

const ELIM_MATCHES = { final: 1, semifinals: 3, quarterfinals: 7, round_of_16: 15, round_of_32: 31 }

export default function ScheduleConfigStep({ tournament, matches, configs, onBack, onGenerate }) {
  const durationEstimate = useMemo(
    () => calculateEstimatedDuration(tournament?.scoring_config),
    [tournament?.scoring_config],
  )

  const [matchDuration, setMatchDuration] = useState(durationEstimate.recommended)
  const [courts, setCourts] = useState([])
  const [courtEnabled, setCourtEnabled] = useState({}) // court_id → boolean
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [tournamentDays, setTournamentDays] = useState([])
  const [courtSchedules, setCourtSchedules] = useState({})

  // Fetch courts, tournament_days, and court_schedules
  useEffect(() => {
    if (!tournament?.id) return
    setLoadingCourts(true)

    Promise.all([
      supabase
        .from('courts')
        .select('id, name, available_from, available_to, break_start, break_end')
        .eq('tournament_id', tournament.id),
      supabase
        .from('tournament_days')
        .select('day_date')
        .eq('tournament_id', tournament.id)
        .order('day_order'),
    ]).then(async ([courtsRes, daysRes]) => {
      const list = courtsRes.data ?? []
      setCourts(list)
      const enabled = {}
      for (const c of list) enabled[c.id] = true
      setCourtEnabled(enabled)

      // Tournament days
      const days = (daysRes.data ?? []).map(d => d.day_date)
      setTournamentDays(days)

      // Court schedules
      if (list.length > 0) {
        const courtIds = list.map(c => c.id)
        const { data: csData } = await supabase
          .from('court_schedules')
          .select('court_id, day_of_week, available_from, available_to, break_start, break_end')
          .in('court_id', courtIds)
        const schedMap = {}
        if (csData) {
          for (const cs of csData) {
            if (!schedMap[cs.court_id]) schedMap[cs.court_id] = {}
            schedMap[cs.court_id][cs.day_of_week] = {
              available_from: cs.available_from,
              available_to:   cs.available_to,
              break_start:    cs.break_start,
              break_end:      cs.break_end,
            }
          }
        }
        setCourtSchedules(schedMap)
      }

      setLoadingCourts(false)
    })
  }, [tournament?.id])

  const selectedCourts = useMemo(
    () => courts.filter(c => courtEnabled[c.id]),
    [courts, courtEnabled],
  )

  // Calculate slots — use tournament_days if available, otherwise fallback to start_date→end_date
  const slots = useMemo(() => {
    if (!selectedCourts.length) return []
    if (tournamentDays.length === 0 && (!tournament?.start_date || !tournament?.end_date)) return []
    return generateAllSlots(
      selectedCourts,
      tournament.start_date,
      tournament.end_date,
      matchDuration,
      { tournamentDays, courtSchedules },
    )
  }, [selectedCourts, tournament?.start_date, tournament?.end_date, matchDuration, tournamentDays, courtSchedules])

  const groupMatches = useMemo(
    () => matches.filter(m => m.phase === 'group_phase'),
    [matches],
  )

  // Estimate elimination matches from configs
  const elimEstimate = useMemo(() => {
    if (!configs) return 0
    let total = 0
    for (const cfg of Object.values(configs)) {
      if (cfg?.eliminationPhase) {
        total += ELIM_MATCHES[cfg.eliminationPhase] ?? 0
      }
    }
    return total
  }, [configs])

  const totalMatches = groupMatches.length + elimEstimate

  const capacity = useMemo(
    () => validateSlotCapacity(slots.length, totalMatches),
    [slots.length, totalMatches],
  )

  // Date display
  const dateRange = useMemo(() => {
    const fmt = d => {
      const dt = new Date(d + 'T00:00:00')
      const day = dt.getDate()
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      return `${day} ${months[dt.getMonth()]} ${dt.getFullYear()}`
    }
    if (tournamentDays.length > 0) {
      const sorted = [...tournamentDays].sort()
      const count = sorted.length
      return { label: `${fmt(sorted[0])} → ${fmt(sorted[sorted.length - 1])} (${count} dia${count !== 1 ? 's' : ''} activo${count !== 1 ? 's' : ''})`, days: count }
    }
    if (!tournament?.start_date || !tournament?.end_date) return null
    const start = new Date(tournament.start_date + 'T00:00:00')
    const end = new Date(tournament.end_date + 'T00:00:00')
    const days = Math.round((end - start) / 86400000) + 1
    return { label: `${fmt(tournament.start_date)} → ${fmt(tournament.end_date)} (${days} dia${days !== 1 ? 's' : ''})`, days }
  }, [tournament?.start_date, tournament?.end_date, tournamentDays])

  const canGenerate = capacity.sufficient && selectedCourts.length > 0

  function toggleCourt(courtId) {
    setCourtEnabled(prev => ({ ...prev, [courtId]: !prev[courtId] }))
  }

  if (loadingCourts) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <BrandLoader size={40} />
        <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando canchas...</p>
      </div>
    )
  }

  // No courts
  if (courts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl px-4 py-6 text-center"
             style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 mx-auto mb-3" style={{ color: '#EF4444' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-xs font-medium" style={{ color: '#EF4444' }}>
            No hay canchas configuradas para este torneo. Agrega canchas antes de generar el cronograma.
          </p>
        </div>
        <button type="button" onClick={onBack}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ background: '#F3F4F6', color: '#4B5563' }}>
          ← Volver a vista previa
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>
          Configuración de cronograma
        </h3>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
          Configura la duración y canchas para distribuir los partidos.
        </p>
      </div>

      {/* Duration — smart recommendation + slider */}
      <div
        className="rounded-xl px-4 py-4 space-y-3"
        style={{ background: '#FFFFFF', border: '1px solid #E8EAEE' }}
      >
        <label className="block text-[10px] font-semibold uppercase"
               style={{ color: '#6B7280', letterSpacing: '0.08em' }}>
          Duración estimada por partido
        </label>

        {/* Scoring description */}
        <p className="text-xs" style={{ color: '#4B5563' }}>
          {durationEstimate.breakdown.description}
        </p>

        {/* Recommendation */}
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 flex-shrink-0" style={{ color: '#6BB3D9' }}>
            <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-base font-semibold" style={{ color: '#3A8BB5' }}>
            Recomendado: {durationEstimate.recommended} min
          </span>
        </div>
        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
          Rango estimado: {durationEstimate.minimum} – {durationEstimate.maximum} minutos
        </p>

        {/* Slider + input */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={durationEstimate.minimum}
            max={durationEstimate.maximum}
            step={5}
            value={matchDuration}
            onChange={e => setMatchDuration(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6BB3D9 ${((matchDuration - durationEstimate.minimum) / (durationEstimate.maximum - durationEstimate.minimum)) * 100}%, #E5E7EB ${((matchDuration - durationEstimate.minimum) / (durationEstimate.maximum - durationEstimate.minimum)) * 100}%)`,
              accentColor: '#6BB3D9',
            }}
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={durationEstimate.minimum}
              max={durationEstimate.maximum}
              step={5}
              value={matchDuration}
              onChange={e => {
                const v = Number(e.target.value)
                if (v >= durationEstimate.minimum && v <= durationEstimate.maximum) setMatchDuration(v)
              }}
              className="w-14 px-2 py-1.5 rounded-lg text-sm font-semibold text-center tabular-nums"
              style={{ background: '#F9FAFB', border: '1px solid #E0E2E6', color: '#1F2937' }}
            />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>min</span>
          </div>
        </div>

        {/* Slider labels */}
        <div className="flex justify-between text-[10px]" style={{ color: '#9CA3AF' }}>
          <span>Rápido</span>
          <span style={{ color: matchDuration === durationEstimate.recommended ? '#3A8BB5' : '#9CA3AF', fontWeight: matchDuration === durationEstimate.recommended ? 600 : 400 }}>
            Recomendado{matchDuration === durationEstimate.recommended ? ' ✓' : ''}
          </span>
          <span>Largo</span>
        </div>

        {/* Warning if custom duration */}
        {matchDuration !== durationEstimate.recommended && (
          <div
            className="rounded-lg px-3 py-2 mt-1"
            style={{ background: '#FFF5D6', border: '1px solid #F5E6A3' }}
          >
            <p className="text-[11px] font-medium" style={{ color: '#92750F' }}>
              Duración personalizada. La recomendación del sistema es {durationEstimate.recommended} minutos.
            </p>
          </div>
        )}
      </div>

      {/* Courts list */}
      <div>
        <label className="block text-[10px] font-semibold uppercase mb-1.5"
               style={{ color: '#6B7280', letterSpacing: '0.08em' }}>
          Canchas disponibles
        </label>
        <div className="space-y-2">
          {courts.map(court => (
            <div
              key={court.id}
              onClick={() => toggleCourt(court.id)}
              className="flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150"
              style={{
                background: courtEnabled[court.id] ? '#FFFFFF' : '#F9FAFB',
                border: `1px solid ${courtEnabled[court.id] ? '#D0E5F0' : '#E0E2E6'}`,
                opacity: courtEnabled[court.id] ? 1 : 0.6,
              }}
            >
              {/* Checkbox */}
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150"
                style={{
                  background: courtEnabled[court.id] ? '#6BB3D9' : '#FFFFFF',
                  border: courtEnabled[court.id] ? 'none' : '2px solid #D1D5DB',
                }}
              >
                {courtEnabled[court.id] && (
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: '#1F2937' }}>
                  {court.name}
                </p>
                {courtSchedules[court.id] && Object.keys(courtSchedules[court.id]).length > 0 ? (
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    Horarios por dia configurados
                  </p>
                ) : (
                  <>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                      {court.available_from} - {court.available_to}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>
                      {court.break_start && court.break_end
                        ? `Descanso: ${court.break_start} - ${court.break_end}`
                        : 'Sin descanso'}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date range */}
      {dateRange && (
        <div className="rounded-xl px-4 py-3" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
          <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: '#6B7280', letterSpacing: '0.08em' }}>
            Fechas del torneo
          </p>
          <p className="text-sm font-medium" style={{ color: '#1F2937' }}>
            {dateRange.label}
          </p>
        </div>
      )}

      {/* Capacity summary */}
      <div className="rounded-xl px-4 py-3 space-y-1.5"
           style={{ background: capacity.sufficient ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${capacity.sufficient ? '#BBF7D0' : '#FECACA'}` }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#4B5563' }}>Slots disponibles</span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#1F2937' }}>{capacity.slots}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#4B5563' }}>Partidos fase de grupos</span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#1F2937' }}>{groupMatches.length}</span>
        </div>
        {elimEstimate > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#4B5563' }}>Partidos eliminatoria (est.)</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#1F2937' }}>{elimEstimate}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: '#4B5563' }}>Total partidos</span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#1F2937' }}>{capacity.matches}</span>
        </div>
        <div className="pt-1 mt-1" style={{ borderTop: `1px solid ${capacity.sufficient ? '#BBF7D0' : '#FECACA'}` }}>
          {capacity.sufficient ? (
            <p className="text-xs font-medium" style={{ color: '#16A34A' }}>
              ✓ Hay suficientes slots para todos los partidos
            </p>
          ) : (
            <p className="text-xs font-medium" style={{ color: '#EF4444' }}>
              ✗ Faltan {capacity.deficit} slots. Reduce la duración, agrega canchas o amplía las fechas del torneo.
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ background: '#F3F4F6', color: '#4B5563' }}>
          ← Volver
        </button>
        <button
          type="button"
          disabled={!canGenerate}
          onClick={() => onGenerate({ matchDuration, selectedCourts, slots })}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
        >
          Generar Cronograma →
        </button>
      </div>
    </div>
  )
}
