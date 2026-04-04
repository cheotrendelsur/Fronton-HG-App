import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function GroupPhaseView({ tournamentId, categoryId, registrationIds, showAll }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId || !categoryId) {
      setGroups([])
      setLoading(false)
      return
    }

    async function fetch() {
      setLoading(true)

      // Find groups for this category
      const { data: groupRows } = await supabase
        .from('tournament_groups')
        .select('id, group_letter, group_number')
        .eq('tournament_id', tournamentId)
        .eq('category_id', categoryId)
        .order('group_number', { ascending: true })

      if (!groupRows?.length) {
        setGroups([])
        setLoading(false)
        return
      }

      // If not showAll, only get the player's group
      let targetGroupIds = groupRows.map(g => g.id)
      if (!showAll && registrationIds?.length) {
        const { data: playerMember } = await supabase
          .from('tournament_group_members')
          .select('group_id')
          .in('registration_id', registrationIds)
          .in('group_id', targetGroupIds)
          .limit(1)

        if (playerMember?.length) {
          targetGroupIds = [playerMember[0].group_id]
        }
      }

      // Fetch all members for target groups
      const { data: allMembers } = await supabase
        .from('tournament_group_members')
        .select(`
          id, group_id, registration_id,
          matches_played, matches_won, matches_lost,
          sets_won, sets_lost, games_won, games_lost,
          points_scored, points_against,
          tournament_registrations ( team_name )
        `)
        .in('group_id', targetGroupIds)

      // Get config to know how many qualify
      const { data: configRow } = await supabase
        .from('tournament_config')
        .select('config')
        .eq('tournament_id', tournamentId)
        .maybeSingle()

      let qualifyCount = 2 // default
      if (configRow?.config) {
        const catConfig = Object.values(configRow.config).find(
          c => c.categoryId === categoryId
        )
        if (catConfig?.teamsPerGroupQualify) {
          qualifyCount = catConfig.teamsPerGroupQualify
        }
      }

      const result = targetGroupIds.map(gId => {
        const meta = groupRows.find(g => g.id === gId)
        const members = (allMembers ?? [])
          .filter(m => m.group_id === gId)
          .map(m => ({
            ...m,
            teamName: m.tournament_registrations?.team_name ?? '?',
            setDiff: m.sets_won - m.sets_lost,
            gameDiff: m.games_won - m.games_lost,
            pts: m.matches_won * 3,
          }))
          .sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts
            if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff
            if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff
            return b.sets_won - a.sets_won
          })

        return {
          groupId: gId,
          letter: meta?.group_letter ?? '?',
          members,
          qualifyCount,
        }
      })

      setGroups(result)
      setLoading(false)
    }

    fetch()
  }, [tournamentId, categoryId, registrationIds, showAll])

  if (loading) {
    return (
      <div style={{
        background: '#FFFFFF', border: '1px solid #E8EAEE',
        borderRadius: '16px', padding: '16px',
      }}>
        <div className="shimmer" style={{ width: '40%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
        <div className="shimmer" style={{ width: '100%', height: '120px', borderRadius: '8px' }} />
      </div>
    )
  }

  if (!groups.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {groups.map(g => (
        <GroupTable
          key={g.groupId}
          group={g}
          registrationIds={registrationIds}
        />
      ))}
    </div>
  )
}

function GroupTable({ group, registrationIds }) {
  const cols = [
    { key: 'pos', label: '#', align: 'center', width: '28px' },
    { key: 'team', label: 'Equipo', align: 'left', width: 'auto' },
    { key: 'pj', label: 'PJ', align: 'center' },
    { key: 'pg', label: 'PG', align: 'center' },
    { key: 'pp', label: 'PP', align: 'center' },
    { key: 'sg', label: 'SG', align: 'center' },
    { key: 'sp', label: 'SP', align: 'center' },
    { key: 'ds', label: 'DS', align: 'center' },
    { key: 'gg', label: 'GG', align: 'center' },
    { key: 'gp', label: 'GP', align: 'center' },
    { key: 'dg', label: 'DG', align: 'center' },
    { key: 'pts', label: 'Pts', align: 'center' },
  ]

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8EAEE',
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #E8EAEE',
        fontSize: '12px', fontWeight: 600, color: '#6B7280',
      }}>
        Grupo {group.letter}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%', minWidth: '540px', fontSize: '12px',
          borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace',
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E8EAEE' }}>
              {cols.map(col => (
                <th key={col.key} style={{
                  padding: '8px 5px', textAlign: col.align,
                  fontSize: '10px', fontWeight: 600, color: '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  whiteSpace: 'nowrap', position: 'sticky', top: 0,
                  background: '#FFFFFF', width: col.width,
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.members.map((m, mi) => {
              const isPlayer = registrationIds?.includes(m.registration_id)
              const qualifies = mi < group.qualifyCount
              return (
                <tr key={m.id} style={{
                  background: isPlayer ? 'rgba(107,179,217,0.10)' : mi % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                  borderBottom: '1px solid #F3F4F6',
                  borderLeft: qualifies ? '3px solid #22C55E' : '3px solid transparent',
                }}>
                  <td style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>
                    {mi + 1}
                  </td>
                  <td style={{
                    padding: '8px 5px', textAlign: 'left',
                    fontWeight: isPlayer ? 600 : 400,
                    color: isPlayer ? '#1B3A5C' : '#1F2937',
                    fontFamily: 'DM Sans, sans-serif',
                    maxWidth: '110px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {m.teamName}
                  </td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', color: '#4B5563' }}>{m.matches_played}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', color: '#16A34A', fontWeight: 500 }}>{m.matches_won}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', color: '#EF4444', fontWeight: 500 }}>{m.matches_lost}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', color: '#4B5563' }}>{m.sets_won}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', color: '#4B5563' }}>{m.sets_lost}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 600, color: m.setDiff > 0 ? '#16A34A' : m.setDiff < 0 ? '#EF4444' : '#4B5563' }}>
                    {m.setDiff > 0 ? '+' : ''}{m.setDiff}
                  </td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', color: '#4B5563' }}>{m.games_won}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', color: '#4B5563' }}>{m.games_lost}</td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 600, color: m.gameDiff > 0 ? '#16A34A' : m.gameDiff < 0 ? '#EF4444' : '#4B5563' }}>
                    {m.gameDiff > 0 ? '+' : ''}{m.gameDiff}
                  </td>
                  <td style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 700, color: isPlayer ? '#1B3A5C' : '#1F2937' }}>
                    {m.pts}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
