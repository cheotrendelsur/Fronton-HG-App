import { useState } from 'react'
import GroupPhaseView from './GroupPhaseView'
import BracketView from './BracketView'

export default function ExternalNavigation({ tournamentId, categoryId, registrationIds }) {
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [showFullBracket, setShowFullBracket] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* All groups accordion */}
      <AccordionButton
        label="Ver todos los grupos"
        isOpen={showAllGroups}
        onToggle={() => setShowAllGroups(v => !v)}
      />
      <div style={{
        maxHeight: showAllGroups ? '2000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 400ms ease-in-out',
        opacity: showAllGroups ? 1 : 0,
      }}>
        {showAllGroups && (
          <GroupPhaseView
            tournamentId={tournamentId}
            categoryId={categoryId}
            registrationIds={registrationIds}
            showAll
          />
        )}
      </div>

      {/* Full bracket accordion */}
      <AccordionButton
        label="Ver bracket completo"
        isOpen={showFullBracket}
        onToggle={() => setShowFullBracket(v => !v)}
      />
      <div style={{
        maxHeight: showFullBracket ? '2000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 400ms ease-in-out',
        opacity: showFullBracket ? 1 : 0,
      }}>
        {showFullBracket && (
          <BracketView
            tournamentId={tournamentId}
            categoryId={categoryId}
            registrationIds={registrationIds}
            showAll
          />
        )}
      </div>
    </div>
  )
}

function AccordionButton({ label, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? `Ocultar ${label.toLowerCase()}` : label}
      aria-expanded={isOpen}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: '#FFFFFF',
        border: '1px solid #E0E2E6', borderRadius: '12px',
        padding: '12px 16px', cursor: 'pointer',
        fontSize: '13px', fontWeight: 500, color: '#4B5563',
        transition: 'all 200ms',
      }}
    >
      <span>{label}</span>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
        style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 200ms',
        }}
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
  )
}
