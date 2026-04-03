// conflictDetector.js — Detect cross-court team scheduling conflicts
// Pure function — no side effects, no DB calls

/**
 * Parsea un string de hora "HH:MM" a minutos desde medianoche.
 */
function parseTime(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Detects teams with overlapping matches on different courts.
 * A conflict = same team_id has two matches on different courts where
 * time ranges overlap (start to start + duration). Per D-10.
 *
 * @param {Array} matches - All tournament matches with fields:
 *   { id, team1_id, team2_id, court_id, scheduled_date, scheduled_time,
 *     estimated_duration_minutes, status, team1_name?, team2_name?, court? }
 * @param {Object} courtNames - Map of court_id -> court name string (for display)
 * @returns {Array} conflicts - Array of:
 *   { teamId: string, teamName: string,
 *     match1: { matchId, courtId, courtName, date, time, duration },
 *     match2: { matchId, courtId, courtName, date, time, duration } }
 */
export function detectTeamConflicts(matches, courtNames = {}) {
  // Step 1: Filter to only pending/scheduled matches with required fields
  const eligible = matches.filter(m =>
    m.status !== 'completed' &&
    m.court_id &&
    m.scheduled_date &&
    m.scheduled_time &&
    (m.team1_id || m.team2_id)
  )

  // Step 2: Build map teamId -> [match info]
  const teamMatches = new Map()

  for (const m of eligible) {
    const entry = {
      matchId: m.id,
      courtId: m.court_id,
      date: m.scheduled_date,
      time: m.scheduled_time,
      duration: m.estimated_duration_minutes || 60,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      team1_name: m.team1_name || m.team1_id || '',
      team2_name: m.team2_name || m.team2_id || '',
    }

    if (m.team1_id) {
      if (!teamMatches.has(m.team1_id)) teamMatches.set(m.team1_id, [])
      teamMatches.get(m.team1_id).push({ ...entry, teamName: entry.team1_name })
    }
    if (m.team2_id) {
      if (!teamMatches.has(m.team2_id)) teamMatches.set(m.team2_id, [])
      teamMatches.get(m.team2_id).push({ ...entry, teamName: entry.team2_name })
    }
  }

  // Step 3: For each team with 2+ matches, check all pairs
  const conflicts = []
  const seen = new Set() // deduplication: "matchA-matchB" keys

  for (const [teamId, entries] of teamMatches) {
    if (entries.length < 2) continue

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]
        const b = entries[j]

        // Skip pairs on the same court (sequential, not overlapping)
        if (a.courtId === b.courtId) continue

        // Skip pairs on different dates (no overlap possible)
        if (a.date !== b.date) continue

        // Compute time ranges and check overlap
        const startA = parseTime(a.time)
        const endA = startA + a.duration
        const startB = parseTime(b.time)
        const endB = startB + b.duration

        if (startA < endB && startB < endA) {
          // Deduplicate: use teamId + sorted match IDs as key
          // Same match pair can be a conflict for different teams
          const key = teamId + ':' + [a.matchId, b.matchId].sort().join('-')
          if (seen.has(key)) continue
          seen.add(key)

          // Determine team name from match data
          let teamName = teamId
          if (a.team1_id === teamId) teamName = a.team1_name
          else if (a.team2_id === teamId) teamName = a.team2_name

          conflicts.push({
            teamId,
            teamName,
            match1: {
              matchId: a.matchId,
              courtId: a.courtId,
              courtName: courtNames[a.courtId] || a.courtId,
              date: a.date,
              time: a.time,
              duration: a.duration,
            },
            match2: {
              matchId: b.matchId,
              courtId: b.courtId,
              courtName: courtNames[b.courtId] || b.courtId,
              date: b.date,
              time: b.time,
              duration: b.duration,
            },
          })
        }
      }
    }
  }

  return conflicts
}
