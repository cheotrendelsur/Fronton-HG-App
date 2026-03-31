import { useState, useMemo } from 'react'
import GroupSwiper from './GroupSwiper'

export default function ClasificacionView({ categories, groups, groupMembers, matches }) {
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id ?? null)

  // Group members and matches by group_id, filtered by selected category
  const { catGroups, membersByGroup, matchesByGroup } = useMemo(() => {
    const catGroups = groups.filter(g => g.category_id === selectedCatId)
      .sort((a, b) => a.group_number - b.group_number)

    const membersByGroup = {}
    const matchesByGroup = {}

    for (const g of catGroups) {
      membersByGroup[g.id] = groupMembers
        .filter(m => m.group_id === g.id)
        .sort((a, b) => a.draw_position - b.draw_position)
        .map(m => ({
          ...m,
          team_name: m.registration?.team_name ?? m.team_name ?? '—',
          player1_name: m.registration?.player1?.username ?? m.player1_name ?? '?',
          player2_name: m.registration?.player2?.username ?? m.player2_name ?? '?',
        }))

      matchesByGroup[g.id] = matches
        .filter(m => m.group_id === g.id)
        .sort((a, b) => a.match_number - b.match_number)
        .map(m => ({
          ...m,
          team1_name: m.team1?.team_name ?? m.team1_name ?? 'Equipo 1',
          team2_name: m.team2?.team_name ?? m.team2_name ?? 'Equipo 2',
        }))
    }

    return { catGroups, membersByGroup, matchesByGroup }
  }, [selectedCatId, groups, groupMembers, matches])

  return (
    <div className="space-y-4">
      {/* Category tabs — only if more than 1 */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const isActive = cat.id === selectedCatId
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? '#E8F4FA' : '#F3F4F6',
                  color: isActive ? '#3A8BB5' : '#6B7280',
                  border: isActive ? '1px solid #D0E5F0' : '1px solid transparent',
                }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Swiper */}
      <GroupSwiper
        groups={catGroups}
        membersByGroup={membersByGroup}
        matchesByGroup={matchesByGroup}
      />
    </div>
  )
}
