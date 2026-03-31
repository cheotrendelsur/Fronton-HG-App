import ParticipantsAccordion from './ParticipantsAccordion'
import MatchesAccordion from './MatchesAccordion'

export default function GroupCard({ group, members, matches }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8EAEE',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Group title */}
      <h4
        className="text-center text-sm font-bold uppercase tracking-wider"
        style={{ color: '#1F2937' }}
      >
        Grupo {group.group_letter}
      </h4>

      <ParticipantsAccordion members={members} />
      <MatchesAccordion matches={matches} />
    </div>
  )
}
