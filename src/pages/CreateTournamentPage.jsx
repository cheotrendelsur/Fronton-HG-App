import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import ScoringSystemSelector from '../components/ScoringSystem/ScoringSystemSelector'

const DEFAULT_COURT = {
  name: '',
  available_from: '08:00',
  available_to: '22:00',
  has_break: false,
  break_start: '14:00',
  break_end: '16:00',
}

const DEFAULT_CATEGORY = {
  name: '',
  max_couples: 16,
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1500

async function fetchSportsWithRetry(attempt = 0) {
  const { data, error } = await supabase
    .from('sports')
    .select('id, name')
    .order('name')
  if (error) {
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)))
      return fetchSportsWithRetry(attempt + 1)
    }
    throw error
  }
  return data ?? []
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1.5">
      {children}
    </label>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full bg-surface-800 border border-border-default rounded-xl
        px-4 py-3 text-sm text-ink-primary placeholder-ink-muted
        focus:outline-none focus:border-neon-600 focus:ring-1 focus:ring-neon-600/30
        transition-all duration-200 ${className}
      `}
    />
  )
}

function TextArea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`
        w-full bg-surface-800 border border-border-default rounded-xl
        px-4 py-3 text-sm text-ink-primary placeholder-ink-muted
        focus:outline-none focus:border-neon-600 focus:ring-1 focus:ring-neon-600/30
        transition-all duration-200 resize-none ${className}
      `}
    />
  )
}

function Select({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`
        w-full bg-surface-800 border border-border-default rounded-xl
        px-4 py-3 text-sm text-ink-primary
        focus:outline-none focus:border-neon-600 focus:ring-1 focus:ring-neon-600/30
        transition-all duration-200 appearance-none ${className}
      `}
    >
      {children}
    </select>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-surface-900 border border-border-default rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <h2 className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
          {title}
        </h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-neon-300' : 'bg-surface-600'}
      `}
    >
      <span className={`
        absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0.5'}
      `} />
    </button>
  )
}

function CategoryCard({ category, index, onChange, onRemove, canRemove }) {
  function update(field, value) {
    onChange(index, { ...category, [field]: value })
  }

  return (
    <div className="bg-surface-800 border border-border-default rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
          Categoría {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center text-ink-muted hover:text-red-400 hover:bg-red-950/40 transition-all duration-200"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 9.5a.5.5 0 00.5.5h7.4a.5.5 0 00.5-.5L13 4"/>
            </svg>
          </button>
        )}
      </div>

      <div>
        <FieldLabel>Nombre de la categoría</FieldLabel>
        <Input
          type="text"
          placeholder="Ej. 3.ª Categoría"
          value={category.name}
          onChange={e => update('name', e.target.value)}
          required
        />
      </div>

      <div>
        <FieldLabel>Límite de parejas</FieldLabel>
        <Input
          type="number"
          min={2}
          max={128}
          value={category.max_couples}
          onChange={e => update('max_couples', e.target.value)}
          required
        />
      </div>
    </div>
  )
}

function CourtCard({ court, index, onChange, onRemove, canRemove }) {
  function update(field, value) {
    onChange(index, { ...court, [field]: value })
  }

  return (
    <div className="bg-surface-800 border border-border-default rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
          Cancha {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center text-ink-muted hover:text-red-400 hover:bg-red-950/40 transition-all duration-200"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 9.5a.5.5 0 00.5.5h7.4a.5.5 0 00.5-.5L13 4"/>
            </svg>
          </button>
        )}
      </div>

      <div>
        <FieldLabel>Nombre de la cancha</FieldLabel>
        <Input
          type="text"
          placeholder="Ej. Pista 1"
          value={court.name}
          onChange={e => update('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Apertura</FieldLabel>
          <Input type="time" value={court.available_from}
            onChange={e => update('available_from', e.target.value)} required />
        </div>
        <div>
          <FieldLabel>Cierre</FieldLabel>
          <Input type="time" value={court.available_to}
            onChange={e => update('available_to', e.target.value)} required />
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-ink-primary text-sm font-medium">Hay descanso</p>
          <p className="text-ink-muted text-xs mt-0.5">Bloque de tiempo sin partidos</p>
        </div>
        <Toggle checked={court.has_break} onChange={v => update('has_break', v)} />
      </div>

      {court.has_break && (
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border-subtle">
          <div>
            <FieldLabel>Inicio descanso</FieldLabel>
            <Input type="time" value={court.break_start}
              onChange={e => update('break_start', e.target.value)} />
          </div>
          <div>
            <FieldLabel>Fin descanso</FieldLabel>
            <Input type="time" value={court.break_end}
              onChange={e => update('break_end', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateTournamentPage() {
  const { profile } = useAuth()
  const navigate    = useNavigate()

  const [sports,        setSports]        = useState([])
  const [loadingSports, setLoadingSports] = useState(true)
  const [sportsError,   setSportsError]   = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState('')

  const [name,           setName]           = useState('')
  const [description,    setDescription]    = useState('')
  const [location,       setLocation]       = useState('')
  const [inscriptionFee, setInscriptionFee] = useState('')
  const [sportId,        setSportId]        = useState('')
  const [startDate,      setStartDate]      = useState('')
  const [endDate,        setEndDate]        = useState('')
  const [scoringConfig,  setScoringConfig]  = useState(null)
  const [categories,     setCategories]     = useState([{ ...DEFAULT_CATEGORY }])
  const [courts,         setCourts]         = useState([{ ...DEFAULT_COURT }])

  const loadSports = useCallback(async () => {
    setLoadingSports(true)
    setSportsError('')
    try {
      const data = await fetchSportsWithRetry()
      setSports(data)
      setSportId(prev => {
        const stillExists = data.some(s => s.id === prev)
        return stillExists ? prev : (data[0]?.id ?? '')
      })
    } catch {
      setSportsError('No se pudo cargar la lista de deportes. Toca para reintentar.')
    } finally {
      setLoadingSports(false)
    }
  }, [])

  useEffect(() => {
    if (profile && profile.role !== 'organizer') {
      navigate('/dashboard', { replace: true })
      return
    }
    loadSports()
  }, [profile, navigate, loadSports])

  function addCategory() {
    setCategories(prev => [...prev, { ...DEFAULT_CATEGORY }])
  }

  function updateCategory(index, updated) {
    setCategories(prev => prev.map((c, i) => i === index ? updated : c))
  }

  function removeCategory(index) {
    setCategories(prev => prev.filter((_, i) => i !== index))
  }

  function addCourt() {
    setCourts(prev => [...prev, { ...DEFAULT_COURT }])
  }

  function updateCourt(index, updated) {
    setCourts(prev => prev.map((c, i) => i === index ? updated : c))
  }

  function removeCourt(index) {
    setCourts(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const tournamentPayload = {
        organizer_id:    profile.id,
        name:            name.trim(),
        description:     description.trim() || null,
        location:        location.trim(),
        inscription_fee: Number(inscriptionFee),
        sport_id:        sportId,
        start_date:      startDate || null,
        end_date:        endDate   || null,
        scoring_config:  scoringConfig,
        status: 'inscription',
      }

      const { data: tournament, error: tErr } = await supabase
        .from('tournaments')
        .insert(tournamentPayload)
        .select('id')
        .single()

      if (tErr) throw tErr

      const courtsPayload = courts.map(c => ({
        tournament_id:  tournament.id,
        name:           c.name.trim(),
        available_from: c.available_from,
        available_to:   c.available_to,
        break_start:    c.has_break ? c.break_start : null,
        break_end:      c.has_break ? c.break_end   : null,
      }))

      const { error: cErr } = await supabase.from('courts').insert(courtsPayload)
      if (cErr) throw cErr

      const categoriesPayload = categories.map(cat => ({
        tournament_id: tournament.id,
        name:          cat.name.trim(),
        max_couples:   Number(cat.max_couples),
      }))

      const { error: catErr } = await supabase.from('categories').insert(categoriesPayload)
      if (catErr) throw catErr

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (profile?.role !== 'organizer') return null

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-6 animate-fade-up">

        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-surface-800 border border-border-default flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:border-border-strong transition-all duration-200"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-ink-primary text-xl font-semibold tracking-tight">Nuevo torneo</h1>
            <p className="text-ink-muted text-xs mt-0.5">Configura todos los detalles</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setName('')
              setDescription('')
              setLocation('')
              setInscriptionFee('')
              setStartDate('')
              setEndDate('')
              setScoringConfig(null)
              setCategories([{ ...DEFAULT_CATEGORY }])
              setCourts([{ ...DEFAULT_COURT }])
              setError('')
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800 border border-border-default text-ink-muted text-xs font-medium hover:text-ink-secondary hover:border-border-strong active:scale-[0.95] active:opacity-80 transition-all duration-150"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#b8f533" strokeWidth={2}
              className="w-5 h-5 flex-shrink-0" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.1-5.8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            Restablecer
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">

          <SectionCard title="Información general">
            <div>
              <FieldLabel>Nombre del torneo</FieldLabel>
              <Input
                type="text"
                placeholder="Ej. Open Verano 2025"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel>Ubicación del torneo</FieldLabel>
              <Input
                type="text"
                placeholder="Ej. Cancha Municipal, Calle Principal 123"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel>Cuota de Inscripción por Dupla</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Ej: 50"
                value={inscriptionFee}
                onChange={e => setInscriptionFee(e.target.value)}
                required
              />
            </div>

            <div>
              <FieldLabel>Descripción (Opcional)</FieldLabel>
              <TextArea
                placeholder="Ej. Torneo de pádel para categorías 3.ª y 4.ª..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Deporte</FieldLabel>
              {loadingSports ? (
                <div className="h-12 bg-surface-800 border border-border-default rounded-xl animate-pulse" />
              ) : sportsError ? (
                <button
                  type="button"
                  onClick={loadSports}
                  className="w-full h-12 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs px-4 text-left hover:bg-red-950/60 transition-colors"
                >
                  {sportsError}
                </button>
              ) : (
                <div className="relative">
                  <Select value={sportId} onChange={e => setSportId(e.target.value)} required>
                    {sports.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6l4 4 4-4"/>
                  </svg>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Fecha inicio</FieldLabel>
                <Input type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Fecha fin</FieldLabel>
                <Input type="date" value={endDate}
                  onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Formato de puntuación">
            <ScoringSystemSelector value={scoringConfig} onChange={setScoringConfig} />
          </SectionCard>

          <SectionCard title="Categorías y Cupos">
            <div className="space-y-3">
              {categories.map((category, i) => (
                <CategoryCard
                  key={i}
                  category={category}
                  index={i}
                  onChange={updateCategory}
                  onRemove={removeCategory}
                  canRemove={categories.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addCategory}
              className="
                w-full py-3 rounded-xl border border-dashed border-border-strong
                text-ink-muted text-sm font-medium
                hover:border-neon-800 hover:text-neon-400 hover:bg-neon-900/10
                transition-all duration-200 flex items-center justify-center gap-2
              "
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-4 h-4" strokeLinecap="round">
                <circle cx="8" cy="8" r="6"/>
                <path d="M8 5v6M5 8h6"/>
              </svg>
              Agregar categoría
            </button>
          </SectionCard>

          <SectionCard title="Canchas y horarios">
            <div className="space-y-3">
              {courts.map((court, i) => (
                <CourtCard
                  key={i}
                  court={court}
                  index={i}
                  onChange={updateCourt}
                  onRemove={removeCourt}
                  canRemove={courts.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addCourt}
              className="
                w-full py-3 rounded-xl border border-dashed border-border-strong
                text-ink-muted text-sm font-medium
                hover:border-neon-800 hover:text-neon-400 hover:bg-neon-900/10
                transition-all duration-200 flex items-center justify-center gap-2
              "
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-4 h-4" strokeLinecap="round">
                <circle cx="8" cy="8" r="6"/>
                <path d="M8 5v6M5 8h6"/>
              </svg>
              Agregar cancha
            </button>
          </SectionCard>

          {startDate && endDate && startDate > endDate && (
            <div className="bg-red-950/60 border border-red-900/50 rounded-xl px-4 py-3">
              <p className="text-red-400 text-xs leading-relaxed">La fecha de inicio debe ser anterior a la fecha de fin.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/60 border border-red-900/50 rounded-xl px-4 py-3">
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting
              || !name.trim()
              || !location.trim()
              || !(Number(inscriptionFee) > 0)
              || !sportId
              || !startDate
              || !endDate
              || (startDate > endDate)
              || !scoringConfig
              || categories.some(c => !c.name.trim())
              || courts.some(c => !c.name.trim())
            }
            className="
              w-full bg-neon-300 hover:bg-neon-200 active:bg-neon-400
              disabled:opacity-40 disabled:cursor-not-allowed
              text-ink-inverse font-semibold py-4 rounded-xl
              transition-all duration-200 text-sm tracking-wide
              shadow-neon-sm hover:shadow-neon-md
            "
          >
            {submitting ? 'Creando torneo...' : 'Crear torneo'}
          </button>

        </form>
      </div>
    </Layout>
  )
}