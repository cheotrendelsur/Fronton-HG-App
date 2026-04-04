import { useState, useMemo } from 'react'
import { getActiveWeekdays } from './TournamentCalendar'

const WEEKDAY_LABELS = { 0: 'Do', 1: 'Lu', 2: 'Ma', 3: 'Mi', 4: 'Ju', 5: 'Vi', 6: 'Sa' }
const WEEKDAY_FULL   = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado' }
// Display order: Mon-Sun
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const DEFAULT_SCHEDULE = {
  available_from: '08:00',
  available_to:   '22:00',
  has_break:      false,
  break_start:    '14:00',
  break_end:      '16:00',
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5"
           style={{ color: '#6B7280' }}>
      {children}
    </label>
  )
}

function TimeInput({ value, onChange, ...props }) {
  return (
    <input
      type="time"
      value={value}
      onChange={onChange}
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-200"
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

/**
 * Per-weekday schedule editor for a court.
 *
 * @param {string[]} selectedDays - Tournament selected days (YYYY-MM-DD)
 * @param {Object} schedules - { [dayOfWeek]: { available_from, available_to, has_break, break_start, break_end } }
 * @param {(schedules: Object) => void} onChange - Called with updated schedules object
 */
export default function CourtScheduleEditor({ selectedDays, schedules = {}, onChange }) {
  const [activeDow, setActiveDow] = useState(null)
  const [applyAll, setApplyAll] = useState(false)

  // Active weekdays from selected tournament days
  const activeWeekdays = useMemo(() => {
    const wds = getActiveWeekdays(selectedDays)
    return DISPLAY_ORDER.filter(d => wds.includes(d))
  }, [selectedDays])

  // Auto-select first weekday if none selected
  const effectiveDow = activeDow !== null && activeWeekdays.includes(activeDow)
    ? activeDow
    : activeWeekdays[0] ?? null

  function getSchedule(dow) {
    return schedules[dow] || null
  }

  function isConfigured(dow) {
    return !!schedules[dow]
  }

  function updateSchedule(dow, field, value) {
    const current = schedules[dow] || { ...DEFAULT_SCHEDULE }
    const updated = { ...current, [field]: value }

    if (applyAll) {
      // Apply to all weekdays
      const newSchedules = {}
      for (const wd of activeWeekdays) {
        newSchedules[wd] = { ...updated }
      }
      onChange(newSchedules)
    } else {
      onChange({ ...schedules, [dow]: updated })
      setApplyAll(false)
    }
  }

  function handleApplyAll(checked) {
    setApplyAll(checked)
    if (checked && effectiveDow !== null) {
      const source = schedules[effectiveDow] || { ...DEFAULT_SCHEDULE }
      const newSchedules = {}
      for (const wd of activeWeekdays) {
        newSchedules[wd] = { ...source }
      }
      onChange(newSchedules)
    }
  }

  function handleSelectDow(dow) {
    setActiveDow(dow)
  }

  const currentSchedule = effectiveDow !== null ? (schedules[effectiveDow] || { ...DEFAULT_SCHEDULE }) : null

  // Validation helpers
  const timeError = useMemo(() => {
    if (!currentSchedule || effectiveDow === null) return null
    const { available_from, available_to, has_break, break_start, break_end } = currentSchedule
    if (available_from && available_to && available_from >= available_to) {
      return 'El cierre debe ser mayor que la apertura.'
    }
    if (has_break && break_start && break_end) {
      if (break_start >= break_end) return 'El fin del break debe ser mayor que el inicio.'
      if (available_from && break_start < available_from) return 'El break debe comenzar despues de la apertura.'
      if (available_to && break_end > available_to) return 'El break debe terminar antes del cierre.'
    }
    return null
  }, [currentSchedule, effectiveDow])

  if (activeWeekdays.length === 0) {
    return (
      <div className="py-3">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Selecciona dias del torneo para configurar horarios.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <FieldLabel>Horarios por dia</FieldLabel>

      {/* Weekday circulitos */}
      <div className="flex items-center gap-2 flex-wrap">
        {activeWeekdays.map(dow => {
          const configured = isConfigured(dow)
          const isActive = dow === effectiveDow

          return (
            <button
              key={dow}
              type="button"
              onClick={() => handleSelectDow(dow)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                background: isActive ? '#6BB3D9' : 'transparent',
                color: isActive ? '#FFFFFF' : configured ? '#1F2937' : '#9CA3AF',
                border: isActive
                  ? '2px solid #6BB3D9'
                  : configured
                    ? '2px solid #22C55E'
                    : '2px solid #E0E2E6',
              }}
            >
              {WEEKDAY_LABELS[dow]}
              {/* Green dot for configured */}
              {configured && !isActive && (
                <span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#22C55E' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Configuration status */}
      <div className="flex items-center gap-2 flex-wrap">
        {activeWeekdays.map(dow => (
          <span key={dow} className="text-[10px] font-medium" style={{ color: isConfigured(dow) ? '#16A34A' : '#9CA3AF' }}>
            {WEEKDAY_LABELS[dow]}: {isConfigured(dow) ? '\u2713' : '\u23F3'}
          </span>
        ))}
      </div>

      {/* Schedule form for active day */}
      {effectiveDow !== null && currentSchedule && (
        <div className="rounded-lg p-3 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E8EAEE' }}>
          <p className="text-xs font-semibold" style={{ color: '#4B5563' }}>
            {WEEKDAY_FULL[effectiveDow]}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Apertura</FieldLabel>
              <TimeInput
                value={currentSchedule.available_from}
                onChange={e => updateSchedule(effectiveDow, 'available_from', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Cierre</FieldLabel>
              <TimeInput
                value={currentSchedule.available_to}
                onChange={e => updateSchedule(effectiveDow, 'available_to', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium" style={{ color: '#1F2937' }}>Tiene break</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Bloque sin partidos</p>
            </div>
            <Toggle
              checked={currentSchedule.has_break}
              onChange={v => updateSchedule(effectiveDow, 'has_break', v)}
            />
          </div>

          {currentSchedule.has_break && (
            <div className="grid grid-cols-2 gap-3 pt-1" style={{ borderTop: '1px solid #E8EAEE' }}>
              <div>
                <FieldLabel>Break de</FieldLabel>
                <TimeInput
                  value={currentSchedule.break_start}
                  onChange={e => updateSchedule(effectiveDow, 'break_start', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>a</FieldLabel>
                <TimeInput
                  value={currentSchedule.break_end}
                  onChange={e => updateSchedule(effectiveDow, 'break_end', e.target.value)}
                />
              </div>
            </div>
          )}

          {timeError && (
            <p className="text-[11px] mt-1" style={{ color: '#EF4444' }}>{timeError}</p>
          )}

          {/* Apply to all checkbox */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer" style={{ borderTop: '1px solid #E8EAEE' }}>
            <input
              type="checkbox"
              checked={applyAll}
              onChange={e => handleApplyAll(e.target.checked)}
              className="w-4 h-4 rounded accent-[#6BB3D9]"
            />
            <span className="text-xs font-medium" style={{ color: '#4B5563' }}>
              Aplicar a todos los dias
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

/**
 * Check if all active weekdays have been configured in a court's schedules.
 */
export function allWeekdaysConfigured(selectedDays, schedules) {
  const activeWds = getActiveWeekdays(selectedDays)
  if (activeWds.length === 0) return false
  return activeWds.every(dow => !!schedules?.[dow])
}

/**
 * Check if any schedule has time validation errors.
 */
export function hasScheduleErrors(schedules) {
  for (const dow of Object.keys(schedules)) {
    const s = schedules[dow]
    if (!s) continue
    if (s.available_from && s.available_to && s.available_from >= s.available_to) return true
    if (s.has_break && s.break_start && s.break_end) {
      if (s.break_start >= s.break_end) return true
      if (s.available_from && s.break_start < s.available_from) return true
      if (s.available_to && s.break_end > s.available_to) return true
    }
  }
  return false
}
