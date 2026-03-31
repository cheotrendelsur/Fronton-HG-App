import { useRef, useState, useEffect } from 'react'
import DayView from './DayView'

export default function DaySwiper({ days, matchesByDate, categories, defaultDayIndex, onRegister }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(defaultDayIndex ?? 0)

  // Scroll to default day on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el || defaultDayIndex == null) return
    // Delay to ensure layout is ready
    requestAnimationFrame(() => {
      el.scrollTo({ left: defaultDayIndex * el.offsetWidth, behavior: 'instant' })
    })
  }, [defaultDayIndex])

  // Track active day via scroll position
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function onScroll() {
      const scrollLeft = el.scrollLeft
      const width = el.offsetWidth
      const idx = Math.round(scrollLeft / width)
      setActiveIdx(Math.min(Math.max(idx, 0), days.length - 1))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [days.length])

  function scrollTo(idx) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' })
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Dots */}
      {days.length > 1 && (
        <div className="flex items-center justify-center gap-1.5" style={{ paddingTop: '12px', paddingBottom: '8px' }}>
          {days.map((date, i) => (
            <button
              key={date}
              type="button"
              onClick={() => scrollTo(i)}
              className="transition-all duration-200"
              style={{
                width: i === activeIdx ? '24px' : '8px',
                height: '8px',
                borderRadius: i === activeIdx ? '4px' : '50%',
                background: i === activeIdx ? '#6BB3D9' : '#D1D5DB',
              }}
              aria-label={`Día ${date}`}
            />
          ))}
        </div>
      )}

      {/* Scrollable container */}
      <style>{`
        .day-swiper-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        ref={scrollRef}
        className="day-swiper-scroll flex overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {days.map(date => (
          <div
            key={date}
            style={{ flex: '0 0 100%', width: '100%', scrollSnapAlign: 'start' }}
          >
            <DayView
              date={date}
              matchesByCategory={matchesByDate[date] ?? {}}
              categories={categories}
              isToday={date === todayStr}
              onRegister={onRegister}
            />
          </div>
        ))}
      </div>

      {/* Day indicator */}
      {days.length > 1 && (
        <p className="text-center text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
          Día {activeIdx + 1} de {days.length}
        </p>
      )}
    </div>
  )
}
