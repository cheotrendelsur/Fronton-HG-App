import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import ScoringSystemSelector from '../components/ScoringSystem/ScoringSystemSelector'
import TournamentCalendar from '../components/TournamentCalendar'
import CourtScheduleEditor, { allWeekdaysConfigured, hasScheduleErrors } from '../components/CourtScheduleEditor'
import CategorySelector from '../components/CategorySelector'

const DEFAULT_COURT = {
  name: '',
  schedules: {},
}


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
    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5"
           style={{ color: '#6B7280' }}>
      {children}
    </label>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-200 ${className}`}
      style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#1F2937' }}
    />
  )
}

function TextArea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-200 resize-none ${className}`}
      style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#1F2937' }}
    />
  )
}

function Select({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-200 appearance-none ${className}`}
      style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#1F2937' }}
    >
      {children}
    </select>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8EAEE' }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
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
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: checked ? '#6BB3D9' : '#E5E7EB' }}
    >
      <span className={`
        absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
        ${checked ? 'translate-x-5' : 'translate-x-0.5'}
      `} />
    </button>
  )
}


function CourtCard({ court, index, onChange, onRemove, canRemove, selectedDays }) {
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
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-red-500 transition-all duration-200"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
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

      <CourtScheduleEditor
        selectedDays={selectedDays}
        schedules={court.schedules || {}}
        onChange={schedules => update('schedules', schedules)}
      />
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
  const [selectedDays,   setSelectedDays]   = useState([])
  const [scoringConfig,  setScoringConfig]  = useState(null)
  const [categories,     setCategories]     = useState([])
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
      const sortedDays = [...selectedDays].sort()
      const startDate = sortedDays[0]
      const endDate   = sortedDays[sortedDays.length - 1]

      const tournamentPayload = {
        organizer_id:    profile.id,
        name:            name.trim(),
        description:     description.trim() || null,
        location:        location.trim(),
        inscription_fee: Number(inscriptionFee),
        sport_id:        sportId,
        start_date:      startDate,
        end_date:        endDate,
        scoring_config:  normalizeScoringConfig(scoringConfig),
        status: 'inscription',
      }

      const { data: tournament, error: tErr } = await supabase
        .from('tournaments')
        .insert(tournamentPayload)
        .select('id')
        .single()

      if (tErr) throw tErr

      // Insert tournament_days
      const daysPayload = sortedDays.map((d, i) => ({
        tournament_id: tournament.id,
        day_date:      d,
        day_order:     i + 1,
      }))
      const { error: daysErr } = await supabase.from('tournament_days').insert(daysPayload)
      if (daysErr) throw daysErr

      // Build courts payload with fallback from first configured schedule
      const courtsPayload = courts.map(c => {
        const scheduleKeys = Object.keys(c.schedules || {})
        const firstSched = scheduleKeys.length > 0 ? c.schedules[scheduleKeys[0]] : null
        return {
          tournament_id:  tournament.id,
          name:           c.name.trim(),
          available_from: firstSched?.available_from || '08:00',
          available_to:   firstSched?.available_to   || '22:00',
          break_start:    firstSched?.has_break ? firstSched.break_start : null,
          break_end:      firstSched?.has_break ? firstSched.break_end   : null,
        }
      })

      const { data: insertedCourts, error: cErr } = await supabase
        .from('courts')
        .insert(courtsPayload)
        .select('id')
      if (cErr) throw cErr

      // Insert court_schedules for each court
      const schedulesPayload = []
      insertedCourts.forEach((dbCourt, idx) => {
        const courtData = courts[idx]
        for (const [dow, sched] of Object.entries(courtData.schedules || {})) {
          schedulesPayload.push({
            court_id:       dbCourt.id,
            day_of_week:    Number(dow),
            available_from: sched.available_from,
            available_to:   sched.available_to,
            break_start:    sched.has_break ? sched.break_start : null,
            break_end:      sched.has_break ? sched.break_end   : null,
          })
        }
      })
      if (schedulesPayload.length > 0) {
        const { error: csErr } = await supabase.from('court_schedules').insert(schedulesPayload)
        if (csErr) throw csErr
      }

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
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#1F2937' }}>Nuevo torneo</h1>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Configura todos los detalles</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setName('')
              setDescription('')
              setLocation('')
              setInscriptionFee('')
              setSelectedDays([])
              setScoringConfig(null)
              setCategories([])
              setCourts([{ ...DEFAULT_COURT }])
              setError('')
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium active:scale-[0.95] active:opacity-80 transition-all duration-150"
            style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-5 h-5 flex-shrink-0" style={{ color: '#6BB3D9' }} strokeLinecap="round" strokeLinejoin="round">
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
                <div className="h-12 rounded-xl animate-pulse" style={{ background: '#F3F4F6', border: '1px solid #E0E2E6' }} />
              ) : sportsError ? (
                <button
                  type="button"
                  onClick={loadSports}
                  className="w-full h-12 rounded-xl text-red-500 text-xs px-4 text-left transition-colors"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: '#9CA3AF' }}
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6l4 4 4-4"/>
                  </svg>
                </div>
              )}
            </div>

            <TournamentCalendar
              selectedDays={selectedDays}
              onChange={setSelectedDays}
            />
          </SectionCard>

          <SectionCard title="Formato de puntuación">
            <ScoringSystemSelector value={scoringConfig} onChange={setScoringConfig} />
          </SectionCard>

          <SectionCard title="Categorias y Cupos">
            <CategorySelector
              categories={categories}
              onChange={setCategories}
            />
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
                  selectedDays={selectedDays}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addCourt}
              className="w-full py-3 rounded-xl border border-dashed text-sm font-medium
                transition-all duration-200 flex items-center justify-center gap-2"
              style={{ borderColor: '#E0E2E6', color: '#6B7280' }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-4 h-4" strokeLinecap="round">
                <circle cx="8" cy="8" r="6"/>
                <path d="M8 5v6M5 8h6"/>
              </svg>
              Agregar cancha
            </button>
          </SectionCard>

          {error && (
            <div className="rounded-xl px-4 py-3"
                 style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-red-500 text-xs leading-relaxed">{error}</p>
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
              || selectedDays.length === 0
              || !scoringConfig
              || categories.length === 0
              || courts.some(c => !c.name.trim())
              || courts.some(c => !allWeekdaysConfigured(selectedDays, c.schedules))
              || courts.some(c => hasScheduleErrors(c.schedules || {}))
            }
            className="w-full text-white font-semibold py-4 rounded-xl
              transition-all duration-200 text-sm tracking-wide
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#6BB3D9', boxShadow: '0 0 12px rgba(107,179,217,0.15)' }}
          >
            {submitting ? 'Creando torneo...' : 'Crear torneo'}
          </button>

        </form>
      </div>
    </Layout>
  )
}
