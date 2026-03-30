import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import ScoringSystemSelector from '../ScoringSystem/ScoringSystemSelector'

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

// ─── Category editor ───────────────────────────────────────────────────────

function CategoryEditRow({ category, index, onChange, onRemove, canRemove }) {
  function update(field, value) {
    onChange(index, { ...category, [field]: value })
  }

  return (
    <div className="rounded-xl p-4 space-y-3"
         style={{ background: '#F9FAFB', border: '1px solid #E0E2E6' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
          Categoría {index + 1}
        </span>
        {canRemove && <RemoveButton onClick={() => onRemove(index)} />}
      </div>

      <div>
        <FieldLabel>Nombre</FieldLabel>
        <Input
          type="text"
          placeholder="Ej. 3.ª Categoría"
          value={category.name}
          onChange={e => update('name', e.target.value)}
        />
      </div>

      <div>
        <FieldLabel>Límite de parejas</FieldLabel>
        <Input
          type="number"
          min={2}
          max={128}
          value={category.max_couples}
          onChange={e => update('max_couples', Number(e.target.value))}
        />
      </div>
    </div>
  )
}

// ─── Court editor ──────────────────────────────────────────────────────────

function CourtEditRow({ court, index, onChange, onRemove, canRemove }) {
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Apertura</FieldLabel>
          <Input type="time" value={court.available_from}
            onChange={e => update('available_from', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Cierre</FieldLabel>
          <Input type="time" value={court.available_to}
            onChange={e => update('available_to', e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm font-medium" style={{ color: '#1F2937' }}>Hay descanso</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Bloque sin partidos</p>
        </div>
        <Toggle checked={court.has_break} onChange={v => update('has_break', v)} />
      </div>

      {court.has_break && (
        <div className="grid grid-cols-2 gap-3 pt-1" style={{ borderTop: '1px solid #E8EAEE' }}>
          <div>
            <FieldLabel>Inicio descanso</FieldLabel>
            <Input type="time" value={court.break_start ?? '14:00'}
              onChange={e => update('break_start', e.target.value)} />
          </div>
          <div>
            <FieldLabel>Fin descanso</FieldLabel>
            <Input type="time" value={court.break_end ?? '16:00'}
              onChange={e => update('break_end', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────

const DEFAULT_COURT = {
  name: '',
  available_from: '08:00',
  available_to:   '22:00',
  has_break:      false,
  break_start:    '14:00',
  break_end:      '16:00',
}

export default function EditTournamentForm({ tournament, onUpdate }) {
  // Basic fields
  const [name,           setName]           = useState(tournament.name ?? '')
  const [description,    setDescription]    = useState(tournament.description ?? '')
  const [location,       setLocation]       = useState(tournament.location ?? '')
  const [startDate,      setStartDate]      = useState(tournament.start_date ?? '')
  const [endDate,        setEndDate]        = useState(tournament.end_date ?? '')
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
    setScoringConfig(v)
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
      setCourts((data ?? []).map(c => ({ ...c, has_break: !!c.break_start })))
    } catch {
      setCourtsError(true)
      setCourts([])
    } finally {
      setCourtsLoading(false)
    }
  }, [tournament.id])

  useEffect(() => { loadCourts() }, [loadCourts])

  function markDirty() { setIsDirty(true); setSaveStatus('idle') }

  // Category handlers
  function updateCategory(index, updated) {
    setCategories(prev => prev.map((c, i) => i === index ? updated : c))
    markDirty()
  }

  function addCategory() {
    setCategories(prev => [...prev, { name: '', max_couples: 16 }])
    markDirty()
  }

  function removeCategory(index) {
    const cat = categories[index]
    if (cat.id) setRemovedCategoryIds(prev => [...prev, cat.id])
    setCategories(prev => prev.filter((_, i) => i !== index))
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
  const datesValid     = !startDate || !endDate || startDate <= endDate
  const feeValid       = inscriptionFee === '' || Number(inscriptionFee) >= 0
  const catsValid      = categories.length > 0 && categories.every(c => c.name.trim())
  const courtsValid    = courts.length > 0 && courts.every(c => c.name.trim())

  const canSave = isDirty && nameValid && locationValid && datesValid && feeValid && catsValid && courtsValid && saveStatus !== 'saving'

  async function handleSave() {
    if (!canSave) return
    setSaveStatus('saving')
    setSaveError('')
    try {
      // 1. Check removed categories don't have active registrations
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

      // 2. Update tournament core + scoring
      const { error: tErr } = await supabase
        .from('tournaments')
        .update({
          name:            name.trim(),
          description:     description.trim() || null,
          location:        location.trim(),
          start_date:      startDate || null,
          end_date:        endDate   || null,
          inscription_fee: inscriptionFee !== '' ? Number(inscriptionFee) : null,
          scoring_config:  scoringConfig,
        })
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

      await Promise.all(
        existingCourts.map(c =>
          supabase.from('courts').update({
            name:           c.name.trim(),
            available_from: c.available_from,
            available_to:   c.available_to,
            break_start:    c.has_break ? (c.break_start ?? '14:00') : null,
            break_end:      c.has_break ? (c.break_end   ?? '16:00') : null,
          }).eq('id', c.id)
        )
      )

      if (newCourts.length > 0) {
        const { error: courtInsErr } = await supabase.from('courts').insert(
          newCourts.map(c => ({
            tournament_id:  tournament.id,
            name:           c.name.trim(),
            available_from: c.available_from,
            available_to:   c.available_to,
            break_start:    c.has_break ? (c.break_start ?? '14:00') : null,
            break_end:      c.has_break ? (c.break_end   ?? '16:00') : null,
          }))
        )
        if (courtInsErr) throw courtInsErr
      }

      if (removedCourtIds.length > 0) {
        const { error: courtDelErr } = await supabase
          .from('courts')
          .delete()
          .in('id', removedCourtIds)
        if (courtDelErr) throw courtDelErr
      }

      // 5. Reload courts to get server-assigned IDs for newly inserted ones
      const { data: freshCourts } = await supabase
        .from('courts')
        .select('id, name, available_from, available_to, break_start, break_end')
        .eq('tournament_id', tournament.id)
        .order('name')
      if (freshCourts) setCourts(freshCourts.map(c => ({ ...c, has_break: !!c.break_start })))

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
        start_date:      startDate || null,
        end_date:        endDate   || null,
        inscription_fee: inscriptionFee !== '' ? Number(inscriptionFee) : null,
        scoring_config:  scoringConfig,
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Fecha inicio</FieldLabel>
            <Input type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); markDirty() }} />
          </div>
          <div>
            <FieldLabel>Fecha fin</FieldLabel>
            <Input type="date" value={endDate}
              onChange={e => { setEndDate(e.target.value); markDirty() }} />
          </div>
        </div>
        {startDate && endDate && startDate > endDate && (
          <p className="text-red-400 text-[11px]">La fecha de inicio debe ser anterior o igual a la de fin.</p>
        )}
      </SectionCard>

      <SectionCard title="Formato de puntuación">
        <ScoringSystemSelector
          value={scoringConfig}
          onChange={handleScoringChange}
        />
      </SectionCard>

      <SectionCard title="Categorías y Cupos">
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <CategoryEditRow
              key={cat.id ?? `new-${i}`}
              category={cat}
              index={i}
              onChange={updateCategory}
              onRemove={removeCategory}
              canRemove={categories.length > 1}
            />
          ))}
        </div>
        <AddButton onClick={addCategory} label="Agregar categoría" />
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
                  canRemove={courts.length > 1}
                />
              ))}
            </div>
            <AddButton onClick={addCourt} label="Agregar cancha" />
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
