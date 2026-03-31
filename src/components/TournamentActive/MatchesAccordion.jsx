import { useState, useRef } from 'react'
import MatchCard from './MatchCard'

export default function MatchesAccordion({ matches = [] }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E8EAEE' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-150"
        style={{ background: open ? '#F9FAFB' : '#FFFFFF' }}
      >
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5 transition-transform duration-200"
            style={{ color: '#9CA3AF', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
          >
            <path d="M3 1l6 5-6 5V1z"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: '#1F2937' }}>Partidos</span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          {matches.length}
        </span>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 2000}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 pb-3 space-y-2" style={{ borderTop: '1px solid #F3F4F6' }}>
          <div className="pt-2" />
          {matches.map(match => (
            <MatchCard key={match.id || match.match_number} match={match} />
          ))}
        </div>
      </div>
    </div>
  )
}
