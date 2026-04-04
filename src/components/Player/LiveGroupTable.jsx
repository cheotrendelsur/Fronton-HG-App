import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function LiveGroupTable({ registrationIds, playerRegistrations, loading: parentLoading }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!registrationIds?.length || !playerRegistrations?.length) {
      setGroups([])
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)

      // Find groups the player belongs to
      const { data: memberRows, error: memberErr } = await supabase
        .from('tournament_group_members')
        .select(`
          group_id,
          registration_id,
          tournament_groups (
            id, group_letter, tournament_id, category_id, status,
            tournaments ( name ),
            categories ( name )
          )
        `)
        .in('registration_id', registrationIds)

      if (memberErr || !memberRows?.length) {
        setGroups([])
        setLoading(false)
        return
      }

      // Filter to active groups only
      const activeGroupIds = []
      const groupMeta = {}
      for (const row of memberRows) {
        const g = row.tournament_groups
        if (!g || g.status !== 'active') continue
        activeGroupIds.push(g.id)
        groupMeta[g.id] = {
          groupId: g.id,
          letter: g.group_letter,
          tournamentName: g.tournaments?.name ?? '',
          categoryName: g.categories?.name ?? '',
          playerRegId: row.registration_id,
        }
      }

      if (!activeGroupIds.length) {
        setGroups([])
        setLoading(false)
        return
      }

      // Check if all group_phase matches are completed for each group
      for (const gId of [...activeGroupIds]) {
        const { count: pendingCount } = await supabase
          .from('tournament_matches')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', gId)
          .eq('phase', 'group_phase')
          .neq('status', 'completed')

        if (pendingCount === 0) {
          // All matches completed — group phase done, remove from display
          const idx = activeGroupIds.indexOf(gId)
          if (idx >= 0) activeGroupIds.splice(idx, 1)
          delete groupMeta[gId]
        }
      }

      if (!activeGroupIds.length) {
        setGroups([])
        setLoading(false)
        return
      }

      // Fetch all members for each active group
      const { data: allMembers, error: allErr } = await supabase
        .from('tournament_group_members')
        .select(`
          id, group_id, registration_id,
          matches_played, matches_won, matches_lost,
          sets_won, sets_lost, games_won, games_lost,
          points_scored, points_against,
          tournament_registrations ( team_name )
        `)
        .in('group_id', activeGroupIds)

      if (allErr || !allMembers?.length) {
        setGroups([])
        setLoading(false)
        return
      }

      // Build group tables
      const groupTables = activeGroupIds.map(gId => {
        const meta = groupMeta[gId]
        const members = allMembers
          .filter(m => m.group_id === gId)
          .map(m => ({
            ...m,
            teamName: m.tournament_registrations?.team_name ?? '?',
            setDiff: m.sets_won - m.sets_lost,
            gameDiff: m.games_won - m.games_lost,
            pts: m.matches_won * 3, // Standard 3 points per win
          }))
          .sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts
            if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff
            if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff
            return b.sets_won - a.sets_won
          })

        return { ...meta, members }
      })

      setGroups(groupTables)
      setLoading(false)
    }

    fetch()
  }, [registrationIds, playerRegistrations])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !groups.length) return
    const cardWidth = el.scrollWidth / groups.length
    const idx = Math.round(el.scrollLeft / cardWidth)
    setActiveIdx(idx)
  }, [groups.length])

  if (parentLoading || loading) {
    return (
      <div>
        <h2 style={{
          fontSize: '12px', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: '#6B7280', marginBottom: '8px',
        }}>
          Mi grupo
        </h2>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E8EAEE',
          borderRadius: '16px', padding: '16px', overflow: 'hidden',
        }}>
          <div className="shimmer" style={{ width: '60%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="shimmer" style={{ width: '100%', height: '28px', borderRadius: '6px' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (!groups.length) return null

  return (
    <div>
      <h2 style={{
        fontSize: '12px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: '#6B7280', marginBottom: '8px',
      }}>
        Mi grupo
      </h2>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: '12px',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {groups.map((g, gi) => (
          <div
            key={g.groupId}
            style={{
              flex: groups.length === 1 ? '0 0 100%' : '0 0 90%',
              scrollSnapAlign: 'center',
              background: '#FFFFFF',
              border: '1px solid #E8EAEE',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #E8EAEE',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                {g.tournamentName}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 600,
                background: '#E8F4FA', color: '#3A8BB5',
                borderRadius: '4px', padding: '2px 6px',
              }}>
                {g.categoryName}
              </span>
              <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>
                Grupo {g.letter}
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%', fontSize: '12px',
                borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace',
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E8EAEE' }}>
                    {['#', 'Equipo', 'PJ', 'PG', 'PP', 'Sets', 'Games', 'Pts'].map(h => (
                      <th key={h} style={{
                        padding: '8px 6px', textAlign: h === 'Equipo' ? 'left' : 'center',
                        fontSize: '10px', fontWeight: 600, color: '#6B7280',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap', position: 'sticky', top: 0,
                        background: '#FFFFFF',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.members.map((m, mi) => {
                    const isPlayer = registrationIds.includes(m.registration_id)
                    return (
                      <tr key={m.id} style={{
                        background: isPlayer ? '#E8F4FA' : mi % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                        borderBottom: '1px solid #F3F4F6',
                      }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>
                          {mi + 1}
                        </td>
                        <td style={{
                          padding: '8px 6px', textAlign: 'left',
                          fontWeight: isPlayer ? 600 : 400,
                          color: isPlayer ? '#1B3A5C' : '#1F2937',
                          fontFamily: 'DM Sans, sans-serif',
                          maxWidth: '120px', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {m.teamName}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#4B5563' }}>
                          {m.matches_played}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#16A34A', fontWeight: 500 }}>
                          {m.matches_won}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#EF4444', fontWeight: 500 }}>
                          {m.matches_lost}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#4B5563' }}>
                          {m.sets_won}-{m.sets_lost}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: '#4B5563' }}>
                          {m.games_won}-{m.games_lost}
                        </td>
                        <td style={{
                          padding: '8px 6px', textAlign: 'center',
                          fontWeight: 700, color: isPlayer ? '#1B3A5C' : '#1F2937',
                        }}>
                          {m.pts}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      {groups.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
          {groups.map((_, i) => (
            <span key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: i === activeIdx ? '#6BB3D9' : 'transparent',
              border: `1.5px solid ${i === activeIdx ? '#6BB3D9' : '#D1D5DB'}`,
              transition: 'all 200ms',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
