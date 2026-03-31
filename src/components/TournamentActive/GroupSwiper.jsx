import { useRef, useState, useEffect } from 'react'
import GroupCard from './GroupCard'

export default function GroupSwiper({ groups, membersByGroup, matchesByGroup }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)

  // Track active group via scroll position
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function onScroll() {
      const scrollLeft = el.scrollLeft
      const width = el.offsetWidth
      const idx = Math.round(scrollLeft / width)
      setActiveIdx(Math.min(idx, groups.length - 1))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [groups.length])

  function scrollTo(idx) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' })
  }

  if (groups.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>No hay grupos en esta categoría</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Dots */}
      {groups.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {groups.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => scrollTo(i)}
              className="transition-all duration-200"
              style={{
                width: i === activeIdx ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === activeIdx ? '#6BB3D9' : '#D1D5DB',
              }}
              aria-label={`Grupo ${g.group_letter}`}
            />
          ))}
        </div>
      )}

      {/* Scrollable container */}
      <style>{`
        .group-swiper-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        ref={scrollRef}
        className="group-swiper-scroll flex overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {groups.map(group => (
          <div
            key={group.id}
            className="flex-shrink-0 w-full px-1"
            style={{ scrollSnapAlign: 'start' }}
          >
            <GroupCard
              group={group}
              members={membersByGroup[group.id] ?? []}
              matches={matchesByGroup[group.id] ?? []}
            />
          </div>
        ))}
      </div>

      {/* Group label */}
      <p className="text-center text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
        Grupo {groups[activeIdx]?.group_letter ?? ''}
        {groups.length > 1 && ` · ${activeIdx + 1} de ${groups.length}`}
      </p>
    </div>
  )
}
