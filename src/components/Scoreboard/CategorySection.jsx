import { useState, useRef } from 'react'
import PendingMatchCard from './PendingMatchCard'
import CompletedMatchCard from './CompletedMatchCard'

export default function CategorySection({ categoryName, matches, onRegister }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)

  const pending = matches.filter(m => m.status !== 'completed')
  const completed = matches.filter(m => m.status === 'completed')
  const allDone = pending.length === 0 && completed.length > 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E8EAEE' }}
    >
      {/* Accordion toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-150"
        style={{ background: open ? '#F9FAFB' : '#FFFFFF' }}
      >
        <div className="flex items-center gap-2.5">
          <svg
            viewBox="0 0 12 12" fill="currentColor"
            className="w-2.5 h-2.5 transition-transform duration-200"
            style={{ color: '#9CA3AF', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
          >
            <path d="M3 1l6 5-6 5V1z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>
            {categoryName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {allDone ? (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: '#F0FDF4', color: '#16A34A' }}>
              ✓ Todos
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}>
              {pending.length}p / {completed.length}r
            </span>
          )}
        </div>
      </button>

      {/* Collapsible content */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight ?? 5000}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #F3F4F6' }}>
          <div className="pt-3" />

          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase" style={{ color: '#6B7280', letterSpacing: '0.08em' }}>
                Pendientes ({pending.length})
              </p>
              {pending.map(m => (
                <PendingMatchCard key={m.id} match={m} onRegister={onRegister} />
              ))}
            </div>
          )}

          {/* Separator */}
          {pending.length > 0 && completed.length > 0 && (
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-dashed" style={{ borderColor: '#E0E2E6' }} />
              <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
                Completados ({completed.length})
              </span>
              <div className="flex-1 border-t border-dashed" style={{ borderColor: '#E0E2E6' }} />
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && pending.length === 0 && (
            <p className="text-[10px] font-semibold uppercase" style={{ color: '#16A34A', letterSpacing: '0.08em' }}>
              ✓ Todos los partidos registrados
            </p>
          )}

          {completed.length > 0 && (
            <div className="space-y-2.5">
              {completed.map(m => (
                <CompletedMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
