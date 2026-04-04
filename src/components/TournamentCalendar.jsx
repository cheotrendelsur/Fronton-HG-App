import { useState, useMemo } from 'react'

const DAY_NAMES_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const DAY_NAMES_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Get today as YYYY-MM-DD in local timezone */
function todayStr() {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Interactive calendar for selecting tournament days.
 *
 * @param {string[]} selectedDays - Array of 'YYYY-MM-DD' strings
 * @param {(days: string[]) => void} onChange - Called with updated array
 */
export default function TournamentCalendar({ selectedDays = [], onChange }) {
  const today = todayStr()

  // Current month being viewed
  const [viewYear,  setViewYear]  = useState(() => {
    if (selectedDays.length > 0) {
      const first = parseDateStr(selectedDays[0])
      return first.getFullYear()
    }
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDays.length > 0) {
      const first = parseDateStr(selectedDays[0])
      return first.getMonth()
    }
    return new Date().getMonth()
  })

  const selectedSet = useMemo(() => new Set(selectedDays), [selectedDays])

  // Build calendar grid for viewMonth
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    // Monday = 0, Sunday = 6 (ISO-like)
    let startWeekday = firstDayOfMonth.getDay() - 1
    if (startWeekday < 0) startWeekday = 6

    const cells = []
    // Leading empty cells
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    return cells
  }, [viewYear, viewMonth])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  function toggleDay(day) {
    const dateStr = toDateStr(viewYear, viewMonth, day)
    if (dateStr < today) return // past day

    const newDays = selectedSet.has(dateStr)
      ? selectedDays.filter(d => d !== dateStr)
      : [...selectedDays, dateStr].sort()

    onChange(newDays)
  }

  // Sorted selected days for display
  const sortedDays = useMemo(() => [...selectedDays].sort(), [selectedDays])

  // Active weekdays summary
  const activeWeekdays = useMemo(() => {
    const weekdaySet = new Set()
    for (const d of selectedDays) {
      const dt = parseDateStr(d)
      weekdaySet.add(dt.getDay())
    }
    const abbrevMap = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab' }
    // Order Mon-Sun
    const order = [1, 2, 3, 4, 5, 6, 0]
    return order.filter(w => weekdaySet.has(w)).map(w => abbrevMap[w])
  }, [selectedDays])

  // Format selected days for display list
  const formattedDays = useMemo(() => {
    if (sortedDays.length === 0) return ''
    const groups = {}
    for (const d of sortedDays) {
      const dt = parseDateStr(d)
      const key = `${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`
      if (!groups[key]) groups[key] = []
      groups[key].push(dt.getDate())
    }
    return Object.entries(groups).map(([monthYear, days]) =>
      `${days.join(', ')} ${monthYear}`
    ).join(' / ')
  }, [sortedDays])

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
        Dias del torneo *
      </label>

      <div className="rounded-xl p-4" style={{ background: '#F9FAFB', border: '1px solid #E0E2E6' }}>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5"/>
            </svg>
          </button>

          <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
              className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5"/>
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide py-1"
                 style={{ color: '#9CA3AF' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />

            const dateStr = toDateStr(viewYear, viewMonth, day)
            const isPast = dateStr < today
            const isSelected = selectedSet.has(dateStr)
            const isToday = dateStr === today

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast}
                onClick={() => toggleDay(day)}
                className={`
                  w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                  transition-all duration-150
                  ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                `}
                style={{
                  background: isSelected ? '#6BB3D9' : isToday ? '#E8F4FA' : 'transparent',
                  color: isSelected ? '#FFFFFF' : isPast ? '#9CA3AF' : '#1F2937',
                  border: isToday && !isSelected ? '1px solid #6BB3D9' : '1px solid transparent',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected days summary */}
      {sortedDays.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#4B5563' }}>
              Dias seleccionados:
            </span>
            <span className="text-xs font-semibold" style={{ color: '#6BB3D9' }}>
              {sortedDays.length}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
            {formattedDays}
          </p>
          {activeWeekdays.length > 0 && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Dias de semana activos: {activeWeekdays.join(', ')}
            </p>
          )}
        </div>
      )}

      {sortedDays.length === 0 && (
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Selecciona al menos 1 dia para el torneo.
        </p>
      )}
    </div>
  )
}

/**
 * Utility: extract unique weekday numbers from selected days.
 * Returns array of JS getDay() values (0=Sun..6=Sat).
 */
export function getActiveWeekdays(selectedDays) {
  const weekdaySet = new Set()
  for (const d of selectedDays) {
    const dt = parseDateStr(d)
    weekdaySet.add(dt.getDay())
  }
  return [...weekdaySet].sort((a, b) => a - b)
}
