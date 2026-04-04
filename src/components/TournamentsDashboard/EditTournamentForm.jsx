import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import ScoringSystemSelector from '../ScoringSystem/ScoringSystemSelector'
import TournamentCalendar from '../TournamentCalendar'
import CourtScheduleEditor, { allWeekdaysConfigured, hasScheduleErrors } from '../CourtScheduleEditor'
import CategorySelector from '../CategorySelector'

// ─── Primitive UI ──────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5"
           style={{ color: '#6B7280' }}>
      {children}
    </label>
  )
}

function Input({ className = '', style: extraStyle, ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full rounded-xl
        px-4 py-3 text-sm
        focus:outline-none focus:ring-1
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 ${className}
      `}
      style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#1F2937', ...extraStyle }}
    />
  )
}

function TextArea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`
        w-full rounded-xl
        px-4 py-3 text-sm
        focus:outline-none focus:ring-1
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 resize-none ${className}
      `}
      style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#1F2937' }}
    />
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: checked ? '#6BB3D9' : '#E5E7EB' }}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8EAEE' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>{title}</h3>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

function RemoveButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-red-500 transition-all duration-200 flex-shrink-0"
      style={{ background: '#F3F4F6', color: '#6B7280' }}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
        className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 9.5a.5.5 0 00.5.5h7.4a.5.5 0 00.5-.5L13 4"/>
      </svg>
    </button>
  )
}

function AddButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full py-3 rounded-xl border border-dashed
        text-sm font-medium
        transition-all duration-200 flex items-center justify-center gap-2
      "
      style={{ borderColor: '#E0E2E6', color: '#6B7280' }}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
        className="w-4 h-4" strokeLinecap="round">
        <circle cx="8" cy="8" r="6"/>
        <path d="M8 5v6M5 8h6"/>
      </svg>
      {label}
    </button>
  )
}

// ─── Court editor ──────────────────────────────────────────────────────────

function CourtEditRow({ court, index, onChange, onRemove, canRemove, selectedDays }) {
  function update(field, value) {
    onChange(index, { ...court, [field]: value })
  }

  return (
    <div className="rounded-xl p-4 space-y-4"
         style={{ background: '#F9FAFB', border: '1px solid #E0E2E6' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
          Cancha {index + 1}
        </span>
        {canRemove && <RemoveButton onClick={() => onRemove(index)} />}
      </div>

      <div>
        <FieldLabel>Nombre</FieldLabel>
        <Input
          type="text"
          placeholder="Ej. Pista 1"
          value={court.name}
          onChange={e => update('name', e.target.value)}
        />
      </div>

      <CourtScheduleEditor
        selectedDays={selectedDays}
        schedules={court.schedules || {}}
        onChange={schedules => update('schedules', schedules)}
      />
    </div>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────

function normalizeScoringConfig(config) {
  if (!config) return null
  if (config.type) return config
  if (config.modalidad === 'sets' && config.subModalidad === 'normal') {
    return { type: 'sets_normal', sets_to_win: Math.ceil(config.setsTotal / 2), games_per_set: config.gamesPerSet }
  }
  if (config.modalidad === 'sets' && config.subModalidad === 'suma') {
    return { type: 'sets_suma', total_sets: config.setsTotalSum, games_per_set: config.gamesTotalPerSetSum }
  }
  if (config.modalidad === 'puntos') {
    return { type: 'points', points_to_win: config.pointsToWinMatch, win_by: config.closingRule === 'diferencia' ? 2 : 1 }
  }
  return config
}

const DEFAULT_COURT = {
  name: '',
  schedules: {},
}

export default function EditTournamentForm({ tournament, onUpdate }) {
  // Basic fields
  const [name,           setName]           = useState(tournament.name ?? '')
  const [description,    setDescription]    = useState(tournament.description ?? '')
  const [location,       setLocation]       = useState(tournament.location ?? '')
  const [selectedDays,   setSelectedDays]   = useState([])
  const [daysLoading,    setDaysLoading]    = useState(true)
  const [inscriptionFee, setInscriptionFee] = useState(tournament.inscription_fee ?? '')

  // Scoring
  const [scoringConfig, setScoringConfig] = useState(tournament.scoring_config ?? null)

  // Categories
  const [categories,         setCategories]         = useState(
    (tournament.categories ?? []).map(c => ({ id: c.id, name: c.name, max_couples: c.max_couples }))
  )
  const [removedCategoryIds, setRemovedCategoryIds] = useState([])

  // Courts
  const [courts,        setCourts]        = useState([])
  const [courtsLoading, setCourtsLoading] = useState(true)
  const [courtsError,   setCourtsError]   = useState(false)
  const [removedCourtIds, setRemovedCourtIds] = useState([])

  // Save state
  const [isDirty,    setIsDirty]    = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error
  const [saveError,  setSaveError]  = useState('')

  // Stable ref so scoring sub-forms don't loop on onChange identity change
  const isDirtyRef = useRef(isDirty)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  const handleScoringChange = useCallback((v) => {
    // Only update if not null (prevent clearing on modalidad switch)
    if (v !== null) setScoringConfig(v)
    setIsDirty(true)
    setSaveStatus('idle')
  }, [])

  const loadCourts = useCallback(async () => {
    setCourtsLoading(true)
    setCourtsError(false)
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, available_from, available_to, break_start, break_end')
        .eq('tournament_id', tournament.id)
        .order('name')
      if (error) throw error

      const courtIds = (data ?? []).map(c => c.id)
      let schedulesMap = {}

      if (courtIds.length > 0) {
        const { data: csData } = await supabase
          .from('court_schedules')
          .select('court_id, day_of_week, available_from, available_to, break_start, break_end')
          .in('court_id', courtIds)
        if (csData) {
          for (const cs of csData) {
            if (!schedulesMap[cs.court_id]) schedulesMap[cs.court_id] = {}
            schedulesMap[cs.court_id][cs.day_of_week] = {
              available_from: cs.available_from,
              available_to:   cs.available_to,
              has_break:      !!cs.break_start,
              break_start:    cs.break_start || '14:00',
              break_end:      cs.break_end   || '16:00',
            }
          }
        }
      }

      setCourts((data ?? []).map(c => {
        // If no court_schedules exist, build fallback schedule from court's flat fields
        let schedules = schedulesMap[c.id] || {}
        if (Object.keys(schedules).length === 0 && c.available_from) {
          // Legacy court without court_schedules — no per-day data yet
          schedules = {}
        }
        return { ...c, schedules }
      }))
    } catch {
      setCourtsError(true)
      setCourts([])
    } finally {
      setCourtsLoading(false)
    }
  }, [tournament.id])

  useEffect(() => { loadCourts() }, [loadCourts])

  // Load existing tournament_days
  const loadDays = useCallback(async () => {
    setDaysLoading(true)
    try {
      const { data, error } = await supabase
        .from('tournament_days')
        .select('day_date')
        .eq('tournament_id', tournament.id)
        .order('day_order')
      if (error) throw error
      if (data && data.length > 0) {
        setSelectedDays(data.map(d => d.day_date))
      } else if (tournament.start_date && tournament.end_date) {
        // Fallback: generate days from start_date to end_date for legacy tournaments
        const days = []
        const start = new Date(tournament.start_date + 'T00:00:00')
        const end = new Date(tournament.end_date + 'T00:00:00')
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          days.push(`${y}-${m}-${dd}`)
        }
        setSelectedDays(days)
      }
    } catch {
      // Silent fallback — use start/end dates if available
      if (tournament.start_date) setSelectedDays([tournament.start_date])
    } finally {
      setDaysLoading(false)
    }
  }, [tournament.id, tournament.start_date, tournament.end_date])

  useEffect(() => { loadDays() }, [loadDays])

  function markDirty() { setIsDirty(true); setSaveStatus('idle') }

  // Category handler — CategorySelector provides full array
  function handleCategoriesChange(newCategories) {
    // Track removed IDs
    const newIds = new Set(newCategories.filter(c => c.id).map(c => c.id))
    for (const c of categories) {
      if (c.id && !newIds.has(c.id)) {
        setRemovedCategoryIds(prev => prev.includes(c.id) ? prev : [...prev, c.id])
      }
    }
    setCategories(newCategories)
    markDirty()
  }

  // Court handlers
  function updateCourt(index, updated) {
    setCourts(prev => prev.map((c, i) => i === index ? updated : c))
    markDirty()
  }

  function addCourt() {
    setCourts(prev => [...prev, { ...DEFAULT_COURT }])
    markDirty()
  }

  function removeCourt(index) {
    const court = courts[index]
    if (court.id) setRemovedCourtIds(prev => [...prev, court.id])
    setCourts(prev => prev.filter((_, i) => i !== index))
    markDirty()
  }

  // Validation
  const nameValid      = name.trim().length >= 3 && name.trim().length <= 100
  const locationValid  = location.trim().length > 0
  const daysValid      = selectedDays.length > 0
  const feeValid       = inscriptionFee === '' || Number(inscriptionFee) >= 0
  const catsValid      = categories.length > 0
  const courtsValid    = courts.length > 0 && courts.every(c => c.name.trim())
  const schedulesValid = selectedDays.length === 0 || courts.every(c =>
    allWeekdaysConfigured(selectedDays, c.schedules) && !hasScheduleErrors(c.schedules || {})
  )

  const canSave = isDirty && nameValid && locationValid && daysValid && feeValid && catsValid && courtsValid && schedulesValid && saveStatus !== 'saving'

  async function handleSave() {
    if (!canSave) return
    setSaveStatus('saving')
    setSaveError('')
    try {
      const isActive = tournament.status === 'active'

      // 1a. Block category/court deletion if tournament is active
      if (isActive && removedCategoryIds.length > 0) {
        throw new Error('No se pueden eliminar categorías de un torneo activo.')
      }
      if (isActive && removedCourtIds.length > 0) {
        throw new Error('No se pueden eliminar canchas de un torneo activo.')
      }

      // 1b. Check removed categories don't have active registrations
      if (removedCategoryIds.length > 0) {
        const { data: regCheck } = await supabase
          .from('tournament_registrations')
          .select('id')
          .in('category_id', removedCategoryIds)
          .limit(1)
        if (regCheck?.length > 0) {
          throw new Error('No se puede eliminar una categoría con inscripciones activas.')
        }
      }

      // 1c. Check removed courts don't have scheduled matches
      if (removedCourtIds.length > 0) {
        const { data: matchCheck } = await supabase
          .from('tournament_matches')
          .select('id')
          .in('court_id', removedCourtIds)
          .limit(1)
        if (matchCheck?.length > 0) {
          throw new Error('No se puede eliminar una cancha con partidos programados.')
        }
      }

      // 1d. Persist tournament_days (delete + re-insert)
      const sortedDays = [...selectedDays].sort()
      const startDate = sortedDays[0] || null
      const endDate   = sortedDays[sortedDays.length - 1] || null

      const { error: delDaysErr } = await supabase
        .from('tournament_days')
        .delete()
        .eq('tournament_id', tournament.id)
      if (delDaysErr) throw delDaysErr

      if (sortedDays.length > 0) {
        const daysPayload = sortedDays.map((d, i) => ({
          tournament_id: tournament.id,
          day_date:      d,
          day_order:     i + 1,
        }))
        const { error: insDaysErr } = await supabase.from('tournament_days').insert(daysPayload)
        if (insDaysErr) throw insDaysErr
      }

      // 2. Update tournament core fields
      const updatePayload = {
        name:            name.trim(),
        description:     description.trim() || null,
        location:        location.trim(),
        start_date:      startDate,
        end_date:        endDate,
        inscription_fee: inscriptionFee !== '' ? Number(inscriptionFee) : null,
      }
      // scoring_config is only editable during inscription phase
      if (tournament.status === 'inscription' || tournament.status === 'draft') {
        updatePayload.scoring_config = normalizeScoringConfig(scoringConfig)
      }
      const { error: tErr } = await supabase
        .from('tournaments')
        .update(updatePayload)
        .eq('id', tournament.id)
      if (tErr) throw tErr

      // 3. Categories: update existing, insert new, delete removed
      const existingCats = categories.filter(c => c.id)
      const newCats      = categories.filter(c => !c.id)

      await Promise.all(
        existingCats.map(c =>
          supabase.from('categories')
            .update({ name: c.name.trim(), max_couples: Number(c.max_couples) })
            .eq('id', c.id)
        )
      )

      if (newCats.length > 0) {
        const { error: catInsErr } = await supabase.from('categories').insert(
          newCats.map(c => ({
            tournament_id: tournament.id,
            name:          c.name.trim(),
            max_couples:   Number(c.max_couples),
          }))
        )
        if (catInsErr) throw catInsErr
      }

      if (removedCategoryIds.length > 0) {
        const { error: catDelErr } = await supabase
          .from('categories')
          .delete()
          .in('id', removedCategoryIds)
        if (catDelErr) throw catDelErr
      }

      // 4. Courts: update existing, insert new, delete removed
      const existingCourts = courts.filter(c => c.id)
      const newCourts      = courts.filter(c => !c.id)

      function courtFallback(c) {
        const scheduleKeys = Object.keys(c.schedules || {})
        const firstSched = scheduleKeys.length > 0 ? c.schedules[scheduleKeys[0]] : null
        return {
          available_from: firstSched?.available_from || c.available_from || '08:00',
          available_to:   firstSched?.available_to   || c.available_to   || '22:00',
          break_start:    firstSched?.has_break ? firstSched.break_start : null,
          break_end:      firstSched?.has_break ? firstSched.break_end   : null,
        }
      }

      await Promise.all(
        existingCourts.map(c => {
          const fb = courtFallback(c)
          return supabase.from('courts').update({
            name:           c.name.trim(),
            available_from: fb.available_from,
            available_to:   fb.available_to,
            break_start:    fb.break_start,
            break_end:      fb.break_end,
          }).eq('id', c.id)
        })
      )

      if (newCourts.length > 0) {
        const { data: insertedNew, error: courtInsErr } = await supabase.from('courts').insert(
          newCourts.map(c => {
            const fb = courtFallback(c)
            return {
              tournament_id:  tournament.id,
              name:           c.name.trim(),
              available_from: fb.available_from,
              available_to:   fb.available_to,
              break_start:    fb.break_start,
              break_end:      fb.break_end,
            }
          })
        ).select('id')
        if (courtInsErr) throw courtInsErr

        // Merge new court IDs back
        if (insertedNew) {
          let newIdx = 0
          setCourts(prev => prev.map(c => {
            if (!c.id && newIdx < insertedNew.length) {
              return { ...c, id: insertedNew[newIdx++].id }
            }
            return c
          }))
        }
      }

      if (removedCourtIds.length > 0) {
        // court_schedules cascade-deleted via FK
        const { error: courtDelErr } = await supabase
          .from('courts')
          .delete()
          .in('id', removedCourtIds)
        if (courtDelErr) throw courtDelErr
      }

      // 4b. Persist court_schedules (delete all for tournament courts + re-insert)
      const allCourtIds = courts.filter(c => c.id).map(c => c.id)
      if (allCourtIds.length > 0) {
        await supabase
          .from('court_schedules')
          .delete()
          .in('court_id', allCourtIds)
      }
      const schedulesPayload = []
      for (const c of courts) {
        if (!c.id) continue
        for (const [dow, sched] of Object.entries(c.schedules || {})) {
          schedulesPayload.push({
            court_id:       c.id,
            day_of_week:    Number(dow),
            available_from: sched.available_from,
            available_to:   sched.available_to,
            break_start:    sched.has_break ? sched.break_start : null,
            break_end:      sched.has_break ? sched.break_end   : null,
          })
        }
      }
      if (schedulesPayload.length > 0) {
        const { error: csErr } = await supabase.from('court_schedules').insert(schedulesPayload)
        if (csErr) throw csErr
      }

      // 5. Reload courts to get server-assigned IDs for newly inserted ones
      const { data: freshCourts } = await supabase
        .from('courts')
        .select('id, name, available_from, available_to, break_start, break_end')
        .eq('tournament_id', tournament.id)
        .order('name')

      // Reload court_schedules
      let freshSchedulesMap = {}
      if (freshCourts && freshCourts.length > 0) {
        const freshIds = freshCourts.map(c => c.id)
        const { data: csData } = await supabase
          .from('court_schedules')
          .select('court_id, day_of_week, available_from, available_to, break_start, break_end')
          .in('court_id', freshIds)
        if (csData) {
          for (const cs of csData) {
            if (!freshSchedulesMap[cs.court_id]) freshSchedulesMap[cs.court_id] = {}
            freshSchedulesMap[cs.court_id][cs.day_of_week] = {
              available_from: cs.available_from,
              available_to:   cs.available_to,
              has_break:      !!cs.break_start,
              break_start:    cs.break_start || '14:00',
              break_end:      cs.break_end   || '16:00',
            }
          }
        }
      }
      if (freshCourts) setCourts(freshCourts.map(c => ({
        ...c,
        schedules: freshSchedulesMap[c.id] || {},
      })))

      // 6. Reload categories to get IDs for newly inserted ones
      const { data: freshCats } = await supabase
        .from('categories')
        .select('id, name, max_couples')
        .eq('tournament_id', tournament.id)
        .order('name')
      if (freshCats) setCategories(freshCats)

      setRemovedCategoryIds([])
      setRemovedCourtIds([])
      setSaveStatus('saved')
      setIsDirty(false)

      onUpdate({
        ...tournament,
        name:            name.trim(),
        description:     description.trim() || null,
        location:        location.trim(),
        start_date:      startDate,
        end_date:        endDate,
        inscription_fee: inscriptionFee !== '' ? Number(inscriptionFee) : null,
        scoring_config:  normalizeScoringConfig(scoringConfig),
        categories:      freshCats ?? categories,
      })

      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveError(err.message)
      setSaveStatus('error')
    }
  }

  return (
    <div className="px-4 py-5 space-y-4 pb-8">

      <SectionCard title="Información general">
        <div>
          <FieldLabel>Nombre del torneo</FieldLabel>
          <Input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); markDirty() }}
            placeholder="Nombre del torneo"
            maxLength={100}
          />
          {name.trim().length > 0 && name.trim().length < 3 && (
            <p className="text-red-400 text-[11px] mt-1">Mínimo 3 caracteres.</p>
          )}
        </div>

        <div>
          <FieldLabel>Ubicación</FieldLabel>
          <Input
            type="text"
            value={location}
            onChange={e => { setLocation(e.target.value); markDirty() }}
            placeholder="Ubicación del torneo"
            className={isDirty && !location.trim() ? 'border-red-700 focus:border-red-600 focus:ring-red-600/30' : ''}
          />
          {isDirty && !location.trim() && (
            <p className="text-red-400 text-[11px] mt-1">La ubicación es obligatoria.</p>
          )}
        </div>

        <div>
          <FieldLabel>Cuota de Inscripción por Dupla</FieldLabel>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={inscriptionFee}
            onChange={e => { setInscriptionFee(e.target.value); markDirty() }}
            placeholder="Ej: 50"
          />
        </div>

        <div>
          <FieldLabel>Descripción (Opcional)</FieldLabel>
          <TextArea
            value={description}
            onChange={e => { setDescription(e.target.value); markDirty() }}
            placeholder="Descripción del torneo..."
          />
        </div>

        {daysLoading ? (
          <div className="h-24 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />
        ) : (
          <TournamentCalendar
            selectedDays={selectedDays}
            onChange={(days) => { setSelectedDays(days); markDirty() }}
          />
        )}
      </SectionCard>

      <SectionCard title="Formato de puntuación">
        {tournament.status === 'inscription' || tournament.status === 'draft' ? (
          <ScoringSystemSelector
            value={scoringConfig}
            onChange={handleScoringChange}
          />
        ) : (
          <div className="rounded-lg px-3 py-2.5" style={{ background: '#F9FAFB', border: '1px solid #E0E2E6' }}>
            <p className="text-xs font-medium" style={{ color: '#4B5563' }}>
              {scoringConfig?.subModalidad === 'normal' || scoringConfig?.type === 'sets_normal'
                ? `Mejor de ${scoringConfig.setsTotal ?? ((scoringConfig.sets_to_win ?? 2) * 2 - 1)} sets de ${scoringConfig.gamesPerSet ?? scoringConfig.games_per_set ?? 6} games`
                : scoringConfig?.subModalidad === 'suma' || scoringConfig?.type === 'sets_suma'
                ? `${scoringConfig.setsTotalSum ?? scoringConfig.total_sets ?? 3} sets de ${scoringConfig.gamesTotalPerSetSum ?? scoringConfig.games_per_set ?? 4} games (suma)`
                : scoringConfig?.modalidad === 'puntos' || scoringConfig?.type === 'points'
                ? `Partido a ${scoringConfig.pointsToWinMatch ?? scoringConfig.points_to_win ?? 21} puntos`
                : 'No configurado'}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
              No se puede modificar después de iniciar el torneo.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Categorias y Cupos">
        <CategorySelector
          categories={categories}
          onChange={handleCategoriesChange}
          canRemove={tournament.status !== 'active'}
        />
      </SectionCard>

      <SectionCard title="Canchas y horarios">
        {courtsLoading ? (
          <div className="h-24 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />
        ) : courtsError ? (
          <div className="flex items-center justify-between rounded-xl px-4 py-3"
               style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-red-500 text-xs">Error al cargar las canchas.</p>
            <button
              type="button"
              onClick={loadCourts}
              className="text-red-400 text-xs underline underline-offset-2 hover:text-red-300 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {courts.map((court, i) => (
                <CourtEditRow
                  key={court.id ?? `new-${i}`}
                  court={court}
                  index={i}
                  onChange={updateCourt}
                  onRemove={removeCourt}
                  canRemove={courts.length > 1 && tournament.status !== 'active'}
                  selectedDays={selectedDays}
                />
              ))}
            </div>
            {tournament.status !== 'active' && (
              <AddButton onClick={addCourt} label="Agregar cancha" />
            )}
          </>
        )}
      </SectionCard>

      {saveStatus === 'error' && (
        <div className="rounded-xl px-4 py-3"
             style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-red-500 text-xs leading-relaxed">{saveError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className="
          w-full py-4 rounded-xl text-sm font-semibold
          text-white
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200
        "
        style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
      >
        {saveStatus === 'saving' ? 'Guardando...'
          : saveStatus === 'saved' ? '✓ Guardado'
          : 'Guardar cambios'}
      </button>
    </div>
  )
}
