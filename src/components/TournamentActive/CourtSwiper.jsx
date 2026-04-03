import { useRef, useState, useEffect } from 'react'
import CourtCard from './CourtCard'

export default function CourtSwiper({ courts, tournamentId, onDataRefresh, onSpillOver }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)

  // Track active court via scroll position
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function onScroll() {
      const scrollLeft = el.scrollLeft
      const width = el.offsetWidth
      const idx = Math.round(scrollLeft / width)
      setActiveIdx(Math.min(idx, courts.length - 1))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [courts.length])

  function scrollTo(idx) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' })
  }

  if (courts.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>No hay canchas en este torneo</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Dots */}
      {courts.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {courts.map((court, i) => (
            <button
              key={court.id}
              type="button"
              onClick={() => scrollTo(i)}
              className="transition-all duration-200"
              style={{
                width: i === activeIdx ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === activeIdx ? '#6BB3D9' : '#D1D5DB',
              }}
              aria-label={`Cancha ${court.name}`}
            />
          ))}
        </div>
      )}

      {/* Scrollable container */}
      <style>{`
        .court-swiper-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        ref={scrollRef}
        className="court-swiper-scroll flex overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {courts.map(court => (
          <div
            key={court.id}
            className="flex-shrink-0 w-full px-1"
            style={{ scrollSnapAlign: 'start' }}
          >
            <CourtCard
              court={court}
              tournamentId={tournamentId}
              onDataRefresh={onDataRefresh}
              onSpillOver={onSpillOver}
            />
          </div>
        ))}
      </div>

      {/* Court label */}
      <p className="text-center text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
        {courts[activeIdx]?.name ?? ''}
        {courts.length > 1 && ` · ${activeIdx + 1} de ${courts.length}`}
      </p>
    </div>
  )
}
