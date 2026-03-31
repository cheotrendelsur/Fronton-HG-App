import { useState, useRef } from 'react'

export default function CategoryAccordion({ category, teams = [] }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8EAEE',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-150"
        style={{ background: open ? '#F9FAFB' : '#FFFFFF' }}
      >
        <div className="flex items-center gap-2.5">
          <svg
            viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5 transition-transform duration-200"
            style={{ color: '#6BB3D9', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
          >
            <path d="M3 1l6 5-6 5V1z"/>
          </svg>
          <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>
            {category.name}
          </span>
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
          style={{ background: '#E8F4FA', color: '#3A8BB5' }}
        >
          {teams.length}/{category.max_couples}
        </span>
      </button>

      {/* Expandable content */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 2000}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 pb-3 space-y-2.5" style={{ borderTop: '1px solid #F3F4F6' }}>
          <div className="pt-2" />
          {teams.map((team, i) => (
            <div key={team.id || i} className="flex items-start gap-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                style={{ background: '#E8F4FA', color: '#3A8BB5' }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#1F2937' }}>
                  {team.team_name}
                </p>
                <p className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>
                  {team.player1_name ?? team.player1?.username ?? '?'} / {team.player2_name ?? team.player2?.username ?? '?'}
                </p>
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="text-[11px] text-center py-2" style={{ color: '#9CA3AF' }}>
              Sin parejas inscritas
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
