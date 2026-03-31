import CategorySection from './CategorySection'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatDayHeader(dateStr, isToday) {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()]
  const dayNum = d.getDate()
  const month = MONTH_NAMES[d.getMonth()]
  const label = `${dayName} ${dayNum} ${month}`
  return isToday ? `HOY — ${label}` : label
}

export default function DayView({ date, matchesByCategory, categories, isToday, onRegister }) {
  // Get categories that have matches this day, in original order
  const catIds = Object.keys(matchesByCategory)
  const orderedCats = categories.filter(c => catIds.includes(c.id))

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold" style={{ color: '#1F2937' }}>
          {formatDayHeader(date, isToday)}
        </h3>
        {isToday && (
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: '#E8F4FA', color: '#3A8BB5', letterSpacing: '0.06em' }}
          >
            Hoy
          </span>
        )}
      </div>

      {/* Category accordions */}
      {orderedCats.length > 0 ? (
        <div className="space-y-3">
          {orderedCats.map(cat => (
            <CategorySection
              key={cat.id}
              categoryName={cat.name}
              matches={matchesByCategory[cat.id] ?? []}
              onRegister={onRegister}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Sin partidos programados</p>
        </div>
      )}
    </div>
  )
}
