// conflictResolver.js — Cyclic resolution of cross-court team conflicts
// Pure function — no side effects, no DB calls

const MAX_DISPLACEMENT_MINUTES = 120
const MAX_ITERATIONS = 10

function parseTime(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Extracts match end time in minutes from midnight.
 * Priority: actual_end_time > (scheduled_time + duration)
 */
function getMatchEndTime(match) {
  if (match.actual_end_time) {
    const raw = match.actual_end_time
    const timePart = raw.includes('T')
      ? raw.split('T')[1].substring(0, 5)
      : raw.split(' ')[1].substring(0, 5)
    return parseTime(timePart)
  }
  const time = match.scheduled_time || match.time || '00:00'
  return parseTime(time) + (match.estimated_duration_minutes || match.duration || 60)
}

function rangesOverlap(dateA, startA, durA, dateB, startB, durB) {
  if (dateA !== dateB) return false
  return startA < startB + durB && startB < startA + durA
}

/**
 * Check if a match at (date, time) on courtId conflicts with a team's matches on OTHER courts.
 */
function hasTeamConflictAt(teamIds, date, time, duration, courtId, allMatchesState) {
  for (const m of allMatchesState) {
    if (m.courtId === courtId) continue
    if (m.date !== date) continue
    // Use endTime-based duration if available, else fall back to m.duration
    const mStart = parseTime(m.time)
    const mDur = m.endTime != null ? (m.endTime - mStart) : m.duration
    if (!rangesOverlap(date, time, duration, m.date, mStart, mDur)) continue
    const mTeams = [m.team1_id, m.team2_id].filter(Boolean)
    if (teamIds.some(t => mTeams.includes(t))) return true
  }
  return false
}

function fitsInCourt(time, duration, court, date, courtSchedulesMap, courtId) {
  // If per-day schedule exists, use it
  let effectiveCourt = court
  if (date && courtSchedulesMap && courtId) {
    const schedMap = courtSchedulesMap.get ? courtSchedulesMap.get(courtId) : courtSchedulesMap[courtId]
    if (schedMap) {
      const dow = new Date(date + 'T00:00:00').getDay()
      if (schedMap[dow]) {
        effectiveCourt = { ...court, ...schedMap[dow] }
      }
    }
  }
  const from = parseTime(effectiveCourt.available_from)
  const to = parseTime(effectiveCourt.available_to)
  if (time < from || time + duration > to) return false
  if (effectiveCourt.break_start && effectiveCourt.break_end) {
    const bs = parseTime(effectiveCourt.break_start)
    const be = parseTime(effectiveCourt.break_end)
    if (time < bs && time + duration > bs) return false
    if (time >= bs && time < be) return false
  }
  return true
}

// ── State helpers ──

function buildState(affectedCourtRaw, otherCourtRaw, updates) {
  const um = new Map()
  for (const u of updates) um.set(u.id, u)
  const out = []
  for (const m of [...affectedCourtRaw, ...otherCourtRaw]) {
    if (m.status !== 'scheduled' && m.status !== 'pending') continue
    const u = um.get(m.id)
    const effectiveTime = u ? u.scheduled_time : m.time
    // Compute endTime: if match was moved by an update, recalculate from new time + duration;
    // if it has actual_end_time and was NOT moved, use actual_end_time
    const endTime = u
      ? parseTime(effectiveTime) + m.duration
      : (m.actual_end_time ? getMatchEndTime(m) : parseTime(m.time) + m.duration)
    out.push({
      id: m.id,
      courtId: m.courtId,
      date: u ? u.scheduled_date : m.date,
      time: effectiveTime,
      endTime,
      duration: m.duration,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      match_number: m.match_number,
      phase: m.phase,
      status: m.status,
      category_id: m.category_id,
    })
  }
  return out
}

// ── Detectors ──

function detectCrossCourtConflicts(state, affectedCourtId) {
  const conflicts = []
  const seen = new Set()
  const affected = state.filter(m => m.courtId === affectedCourtId)
  const others = state.filter(m => m.courtId !== affectedCourtId)
  for (const a of affected) {
    if (!a.team1_id && !a.team2_id) continue
    const sA = parseTime(a.time)
    const dA = a.endTime - sA  // real duration from endTime
    for (const b of others) {
      if (a.date !== b.date) continue
      const sB = parseTime(b.time)
      const dB = b.endTime - sB  // real duration from endTime
      if (!rangesOverlap(a.date, sA, dA, b.date, sB, dB)) continue
      const tA = [a.team1_id, a.team2_id].filter(Boolean)
      const tB = [b.team1_id, b.team2_id].filter(Boolean)
      for (const tid of tA.filter(t => tB.includes(t))) {
        const key = [a.id, b.id].sort().join('-') + ':' + tid
        if (seen.has(key)) continue
        seen.add(key)
        conflicts.push({ teamId: tid, matchA: a, matchB: b })
      }
    }
  }
  return conflicts
}

function detectSameCourtOverlaps(state) {
  // Group by courtId + date, sort by time, find overlaps
  const groups = new Map()
  for (const m of state) {
    const key = `${m.courtId}|${m.date}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(m)
  }
  const overlaps = []
  for (const [, matches] of groups) {
    matches.sort((a, b) => parseTime(a.time) - parseTime(b.time) || a.match_number - b.match_number)
    for (let i = 1; i < matches.length; i++) {
      const prev = matches[i - 1]
      const curr = matches[i]
      const prevEnd = prev.endTime != null ? prev.endTime : (parseTime(prev.time) + prev.duration)
      const currStart = parseTime(curr.time)
      if (currStart < prevEnd) {
        overlaps.push({ prev, curr, gap: prevEnd - currStart })
      }
    }
  }
  return overlaps
}

export function detectElimBeforeGroup(state) {
  // Per-category: each category's elimination must be after its own last group
  const categories = [...new Set(state.map(m => m.category_id).filter(Boolean))]
  const violations = []

  for (const catId of categories) {
    const catMatches = state.filter(m => m.category_id === catId)

    // Find last group_phase for THIS category
    let lastGroupDate = ''
    let lastGroupTime = 0
    for (const m of catMatches) {
      if (m.phase !== 'group_phase') continue
      const t = parseTime(m.time)
      if (m.date > lastGroupDate || (m.date === lastGroupDate && t > lastGroupTime)) {
        lastGroupDate = m.date
        lastGroupTime = t
      }
    }
    if (!lastGroupDate) continue

    // Find end time of last group match for this category
    let lastGroupEnd = lastGroupTime
    for (const m of catMatches) {
      if (m.phase !== 'group_phase') continue
      if (m.date === lastGroupDate && parseTime(m.time) === lastGroupTime) {
        lastGroupEnd = lastGroupTime + m.duration
        break
      }
    }

    // Check elimination matches of THIS category only
    for (const m of catMatches) {
      if (!m.phase || m.phase === 'group_phase') continue
      const t = parseTime(m.time)
      if (m.date < lastGroupDate || (m.date === lastGroupDate && t < lastGroupEnd)) {
        violations.push({ match: m, lastGroupDate, lastGroupEnd })
      }
    }
  }
  return violations
}

// ── Resolver ──

export function resolveConflicts({
  affectedCourtId,
  cascadeUpdates,
  courtMatches,
  allTournamentMatches,
  court,
  allCourts = [],
  maxDisplacement = MAX_DISPLACEMENT_MINUTES,
  lastGroupDateTime, // unused now — we compute dynamically from state
  courtSchedulesMap = new Map(),
}) {
  // Build court config lookup for swap attempts on other courts
  const courtConfigMap = new Map()
  courtConfigMap.set(court.id || affectedCourtId, court)
  for (const c of allCourts) courtConfigMap.set(c.id, c)
  // Normalize raw matches
  function normalize(m, courtIdOverride) {
    return {
      id: m.id,
      courtId: courtIdOverride || m.court_id || m.courtId,
      date: m.scheduled_date || m.date,
      time: m.scheduled_time || m.time,
      duration: m.estimated_duration_minutes || m.duration || 60,
      actual_end_time: m.actual_end_time || null,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      match_number: m.match_number,
      phase: m.phase,
      status: m.status,
      category_id: m.category_id,
    }
  }

  const affectedCourtRaw = courtMatches
    .filter(m => (m.court_id || m.courtId) === affectedCourtId)
    .map(m => normalize(m, affectedCourtId))

  const otherCourtRaw = allTournamentMatches
    .filter(m => (m.court_id || m.courtId) !== affectedCourtId)
    .map(m => normalize(m))

  // Build reference time map: post-cascade time for each match (ABSOLUTE reference)
  const refTimeMap = new Map()
  const cascadeMap = new Map()
  for (const u of cascadeUpdates) cascadeMap.set(u.id, u)

  for (const m of affectedCourtRaw) {
    const cu = cascadeMap.get(m.id)
    refTimeMap.set(m.id, { date: cu ? cu.scheduled_date : m.date, time: parseTime(cu ? cu.scheduled_time : m.time) })
  }
  for (const m of otherCourtRaw) {
    refTimeMap.set(m.id, { date: m.date, time: parseTime(m.time) })
  }

  // All resolution updates accumulated across cycles
  const allUpdates = new Map()
  // Seed with cascade updates
  for (const u of cascadeUpdates) allUpdates.set(u.id, { scheduled_date: u.scheduled_date, scheduled_time: u.scheduled_time })

  let resolvedBySwap = 0
  let resolvedByMove = 0
  const unresolvedSet = new Map() // key -> detail

  // ── Validation helper: check a proposed time against ABSOLUTE reference ──
  function isWithinLimit(matchId, newTime, newDate) {
    const ref = refTimeMap.get(matchId)
    if (!ref) return true
    // Cross-day: add 1440 min per day of difference
    let dayDiffMinutes = 0
    if (newDate && ref.date && newDate !== ref.date) {
      const d1 = new Date(ref.date + 'T00:00:00')
      const d2 = new Date(newDate + 'T00:00:00')
      dayDiffMinutes = Math.round(Math.abs(d2 - d1) / 60000)
    }
    return (Math.abs(newTime - ref.time) + dayDiffMinutes) <= maxDisplacement
  }

  // Helper: get current updates array
  function getUpdates() {
    return Array.from(allUpdates.entries()).map(([id, u]) => ({ id, ...u }))
  }

  // ── Helper: check if a date+time is in the past (Venezuela UTC-4) ──
  const _nowVzla = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }))
  const _todayStr = `${_nowVzla.getFullYear()}-${String(_nowVzla.getMonth() + 1).padStart(2, '0')}-${String(_nowVzla.getDate()).padStart(2, '0')}`
  const _nowMin = _nowVzla.getHours() * 60 + _nowVzla.getMinutes()

  function wouldMoveFutureToPast(currentDate, currentTime, newDate, newTimeMin) {
    const wasInPast = currentDate < _todayStr || (currentDate === _todayStr && parseTime(currentTime) < _nowMin)
    if (wasInPast) return false // already in past, moving it is fine
    const wouldBeInPast = newDate < _todayStr || (newDate === _todayStr && newTimeMin < _nowMin)
    return wouldBeInPast
  }

  // ══════════════════════════════════════════════════════════════════════
  // MAIN CYCLE
  // ══════════════════════════════════════════════════════════════════════
  for (let cycle = 0; cycle < MAX_ITERATIONS; cycle++) {
    const state = buildState(affectedCourtRaw, otherCourtRaw, getUpdates())
    let madeChange = false

    // ── PHASE 1: Resolve cross-court team conflicts ──
    const conflicts = detectCrossCourtConflicts(state, affectedCourtId)
    for (const conflict of conflicts) {
      const a = state.find(m => m.id === conflict.matchA.id)
      const b = state.find(m => m.id === conflict.matchB.id)
      if (!a || !b) continue
      if (!rangesOverlap(a.date, parseTime(a.time), a.duration, b.date, parseTime(b.time), b.duration)) continue

      const aTime = parseTime(a.time)
      const aDur = a.duration
      const aTeams = [a.team1_id, a.team2_id].filter(Boolean)

      // ATTEMPT A: Swap with another match on same court + same day
      let resolved = false
      const candidates = state.filter(m =>
        m.courtId === affectedCourtId && m.date === a.date &&
        m.id !== a.id && (m.status === 'scheduled' || m.status === 'pending')
      )

      for (const cand of candidates) {
        const cTime = parseTime(cand.time)
        const cDur = cand.duration
        const cTeams = [cand.team1_id, cand.team2_id].filter(Boolean)

        // For swaps: enforce ≤120min from REFERENCE for both matches + no overlaps + court hours
        if (!isWithinLimit(a.id, cTime, a.date)) continue
        if (!isWithinLimit(cand.id, aTime, cand.date)) continue

        // Don't move a future match into the past
        if (wouldMoveFutureToPast(a.date, a.time, a.date, cTime)) continue
        if (wouldMoveFutureToPast(cand.date, cand.time, cand.date, aTime)) continue

        if (!fitsInCourt(cTime, aDur, court, a.date, courtSchedulesMap, affectedCourtId)) continue
        if (!fitsInCourt(aTime, cDur, court, cand.date, courtSchedulesMap, affectedCourtId)) continue

        // Verify displaced at cTime doesn't conflict with teams on other courts
        if (hasTeamConflictAt(aTeams, a.date, cTime, aDur, affectedCourtId, state)) continue
        // Verify candidate at aTime doesn't conflict with teams on other courts
        if (hasTeamConflictAt(cTeams, cand.date, aTime, cDur, affectedCourtId, state)) continue

        // Verify no same-court overlap (excluding both swapping matches)
        const stateWithout = state.filter(m => m.id !== a.id && m.id !== cand.id)
        let courtOverlap = false
        for (const m of stateWithout) {
          if (m.courtId !== affectedCourtId || m.date !== a.date) continue
          const mStart = parseTime(m.time)
          if (rangesOverlap(a.date, cTime, aDur, m.date, mStart, m.duration)) { courtOverlap = true; break }
          if (rangesOverlap(cand.date, aTime, cDur, m.date, mStart, m.duration)) { courtOverlap = true; break }
        }
        if (courtOverlap) continue

        // Verify the two swapped matches don't overlap each other
        if (rangesOverlap(a.date, cTime, aDur, cand.date, aTime, cDur)) continue

        // Valid swap — apply
        console.log('SWAP EXECUTED:', {
          conflictivo: { matchNumber: a.match_number, hora_actual: a.time, nueva_hora: minutesToTime(cTime) },
          candidato: { matchNumber: cand.match_number, hora_actual: cand.time, nueva_hora: minutesToTime(aTime) },
        })
        allUpdates.set(a.id, { scheduled_date: a.date, scheduled_time: minutesToTime(cTime) })
        allUpdates.set(cand.id, { scheduled_date: cand.date, scheduled_time: minutesToTime(aTime) })
        a.time = minutesToTime(cTime)
        cand.time = minutesToTime(aTime)
        resolvedBySwap++
        resolved = true
        madeChange = true
        break
      }

      if (resolved) continue

      // ATTEMPT A2: Swap the OTHER match (b) with a candidate on ITS court (court B)
      {
        const bTime = parseTime(b.time)
        const bDur = b.duration
        const bTeams = [b.team1_id, b.team2_id].filter(Boolean)
        const bCourtConfig = courtConfigMap.get(b.courtId) || court

        // BUG A FIX: Exclude candidates that share ANY team with matchA —
        // swapping them would just transfer the conflict to the candidate.
        const candidatesB = state.filter(m => {
          if (m.courtId !== b.courtId || m.date !== b.date) return false
          if (m.id === b.id || m.id === a.id) return false
          if (m.status !== 'scheduled' && m.status !== 'pending') return false
          const mTeams = [m.team1_id, m.team2_id].filter(Boolean)
          if (aTeams.some(t => mTeams.includes(t))) {
            console.log(`  CANDIDATE #${m.match_number}@${m.time} REJECTED: shares team with matchA`)
            return false
          }
          return true
        })

        console.log('ATTEMPT A2 (court B):', {
          matchB: b.match_number, courtB: b.courtId, bTime: b.time,
          matchA: a.match_number, courtA: a.courtId, aTime: a.time,
          candidatesFound: candidatesB.length,
          candidateNumbers: candidatesB.map(c => `#${c.match_number}@${c.time}`),
        })

        // Use state WITHOUT the two conflicting matches for team-conflict checks
        const stateForChecks = state.filter(m => m.id !== b.id && m.id !== a.id)

        for (const cand of candidatesB) {
          const cTime = parseTime(cand.time)
          const cDur = cand.duration
          const cTeams = [cand.team1_id, cand.team2_id].filter(Boolean)

          let rejectReason = null

          // b goes to cand's slot, cand goes to b's slot
          if (!isWithinLimit(b.id, cTime, b.date)) { rejectReason = 'b exceeds displacement limit at cand slot'; }
          else if (!isWithinLimit(cand.id, bTime, cand.date)) { rejectReason = 'cand exceeds displacement limit at b slot'; }
          // Don't move a future match into the past
          else if (wouldMoveFutureToPast(b.date, b.time, b.date, cTime)) { rejectReason = 'b would move from future to past'; }
          else if (wouldMoveFutureToPast(cand.date, cand.time, cand.date, bTime)) { rejectReason = 'cand would move from future to past'; }
          else if (!fitsInCourt(cTime, bDur, bCourtConfig, b.date, courtSchedulesMap, b.courtId)) { rejectReason = 'b does not fit in court at cand slot'; }
          else if (!fitsInCourt(bTime, cDur, bCourtConfig, cand.date, courtSchedulesMap, b.courtId)) { rejectReason = 'cand does not fit in court at b slot'; }
          // b at cand's time must not conflict with teams on other courts
          else if (hasTeamConflictAt(bTeams, b.date, cTime, bDur, b.courtId, stateForChecks)) { rejectReason = 'b has team conflict at cand slot'; }
          // cand at b's time must not conflict with teams on other courts
          else if (hasTeamConflictAt(cTeams, cand.date, bTime, cDur, b.courtId, stateForChecks)) { rejectReason = 'cand has team conflict at b slot'; }

          if (rejectReason) {
            console.log(`  CANDIDATE #${cand.match_number}@${cand.time} REJECTED:`, rejectReason)
            continue
          }

          // No same-court overlap on court B (excluding both swapping matches)
          const stateWithoutB = state.filter(m => m.id !== b.id && m.id !== cand.id)
          let courtOverlapB = false
          for (const m of stateWithoutB) {
            if (m.courtId !== b.courtId || m.date !== b.date) continue
            const mStart = parseTime(m.time)
            if (rangesOverlap(b.date, cTime, bDur, m.date, mStart, m.duration)) { courtOverlapB = true; break }
            if (rangesOverlap(cand.date, bTime, cDur, m.date, mStart, m.duration)) { courtOverlapB = true; break }
          }
          if (courtOverlapB) {
            console.log(`  CANDIDATE #${cand.match_number}@${cand.time} REJECTED: same-court overlap`)
            continue
          }

          // The two swapped matches must not overlap each other
          if (rangesOverlap(b.date, cTime, bDur, cand.date, bTime, cDur)) {
            console.log(`  CANDIDATE #${cand.match_number}@${cand.time} REJECTED: swapped matches overlap each other`)
            continue
          }

          // After swap, verify original conflict is resolved: the conflict team
          // must NOT have any match on courtB that overlaps with a on courtA.
          // Build effective courtB state after the swap
          {
            const conflictTeams = aTeams.filter(t => bTeams.includes(t))
            let stillConflicts = false
            for (const m of state) {
              if (m.courtId !== b.courtId || m.date !== a.date) continue
              // Apply swap: b is at cTime, cand is at bTime, others unchanged
              let mTime
              if (m.id === b.id) mTime = cTime
              else if (m.id === cand.id) mTime = bTime
              else mTime = parseTime(m.time)
              const mDur = m.duration
              const mTeams = [m.team1_id, m.team2_id].filter(Boolean)
              if (!rangesOverlap(a.date, aTime, aDur, m.date, mTime, mDur)) continue
              if (conflictTeams.some(t => mTeams.includes(t))) { stillConflicts = true; break }
            }
            if (stillConflicts) {
              console.log(`  CANDIDATE #${cand.match_number}@${cand.time} REJECTED: swap does not resolve original conflict`)
              continue
            }
          }

          // Valid swap on court B — apply
          console.log('SWAP EXECUTED (court B):', {
            conflictivo: { matchNumber: b.match_number, hora_actual: b.time, nueva_hora: minutesToTime(cTime) },
            candidato: { matchNumber: cand.match_number, hora_actual: cand.time, nueva_hora: minutesToTime(bTime) },
          })
          allUpdates.set(b.id, { scheduled_date: b.date, scheduled_time: minutesToTime(cTime) })
          allUpdates.set(cand.id, { scheduled_date: cand.date, scheduled_time: minutesToTime(bTime) })
          b.time = minutesToTime(cTime)
          cand.time = minutesToTime(bTime)
          resolvedBySwap++
          resolved = true
          madeChange = true
          break
        }
      }

      if (resolved) continue

      // ATTEMPT B0: Fallback push on court B — push b just past a's end time, then cascade court B
      if (!resolved) {
        const aEnd = aTime + aDur
        const bTime = parseTime(b.time)
        const bDur = b.duration
        const bCourtId = b.courtId
        const bCourtCfg = courtConfigMap.get(bCourtId) || court

        // The minimum new time for b to eliminate overlap with a
        if (aEnd > bTime && isWithinLimit(b.id, aEnd, b.date) &&
            fitsInCourt(aEnd, bDur, bCourtCfg, b.date, courtSchedulesMap, bCourtId)) {
          // Verify pushing b doesn't create a NEW cross-court team conflict
          const bTeamsPush = [b.team1_id, b.team2_id].filter(Boolean)
          if (!hasTeamConflictAt(bTeamsPush, b.date, aEnd, bDur, bCourtId, state.filter(m => m.id !== b.id))) {
            console.log(`FALLBACK PUSH: #${b.match_number} pushed from ${b.time} to ${minutesToTime(aEnd)} on court B`)
            allUpdates.set(b.id, { scheduled_date: b.date, scheduled_time: minutesToTime(aEnd) })
            b.time = minutesToTime(aEnd)

            // Cascade subsequent matches on court B that now overlap
            const courtBMatches = state
              .filter(m => m.courtId === bCourtId && m.date === b.date && m.id !== b.id &&
                (m.status === 'scheduled' || m.status === 'pending'))
              .sort((x, y) => parseTime(x.time) - parseTime(y.time) || x.match_number - y.match_number)

            let cursor = aEnd + bDur
            for (const m of courtBMatches) {
              const mTime = parseTime(m.time)
              if (mTime >= cursor) break // no overlap, stop cascading
              // Apply break if needed
              let newMTime = cursor
              const mCfg = courtConfigMap.get(bCourtId) || court
              if (mCfg.break_start && mCfg.break_end) {
                const bs = parseTime(mCfg.break_start)
                const be = parseTime(mCfg.break_end)
                if (newMTime >= bs && newMTime < be) newMTime = be
                if (newMTime < bs && newMTime + m.duration > bs) newMTime = be
              }
              if (!isWithinLimit(m.id, newMTime, m.date)) break
              if (!fitsInCourt(newMTime, m.duration, mCfg, m.date, courtSchedulesMap, bCourtId)) break
              console.log(`  CASCADE on court B: #${m.match_number} pushed from ${m.time} to ${minutesToTime(newMTime)}`)
              allUpdates.set(m.id, { scheduled_date: m.date, scheduled_time: minutesToTime(newMTime) })
              m.time = minutesToTime(newMTime)
              cursor = newMTime + m.duration
            }

            resolvedByMove++
            resolved = true
            madeChange = true
          }
        }
      }

      if (resolved) continue

      // ATTEMPT B: Forward displacement
      resolved = false
      const refTime = refTimeMap.get(a.id)?.time ?? aTime

      for (let offset = 5; offset <= maxDisplacement; offset += 5) {
        const newTime = aTime + offset
        if (!isWithinLimit(a.id, newTime, a.date)) continue
        // isInPast removed — forward move within ±120min of reference is always valid
        if (!fitsInCourt(newTime, aDur, court, a.date, courtSchedulesMap, affectedCourtId)) continue

        // No same-court overlap
        let overlap = false
        for (const m of state) {
          if (m.id === a.id) continue
          if (m.courtId !== affectedCourtId || m.date !== a.date) continue
          if (rangesOverlap(a.date, newTime, aDur, m.date, parseTime(m.time), m.duration)) { overlap = true; break }
        }
        if (overlap) continue

        // No cross-court team conflict
        if (hasTeamConflictAt(aTeams, a.date, newTime, aDur, affectedCourtId, state)) continue

        const ref = refTimeMap.get(a.id)
        console.log('DISPLACEMENT EXECUTED:', {
          matchNumber: a.match_number,
          hora_actual: a.time,
          nueva_hora: minutesToTime(newTime),
          referencia: ref ? minutesToTime(ref.time) : 'N/A',
          desplazamiento: ref ? Math.abs(newTime - ref.time) : 'N/A',
          limite: maxDisplacement,
        })
        allUpdates.set(a.id, { scheduled_date: a.date, scheduled_time: minutesToTime(newTime) })
        a.time = minutesToTime(newTime)
        resolvedByMove++
        resolved = true
        madeChange = true
        break
      }

      if (!resolved) {
        const key = [a.id, b.id].sort().join('-')
        if (!unresolvedSet.has(key)) {
          unresolvedSet.set(key, {
            teamId: conflict.teamId,
            match1Id: a.id, match1Number: a.match_number, match1Time: a.time, match1Court: a.courtId,
            match2Id: b.id, match2Number: b.match_number, match2Time: b.time, match2Court: b.courtId,
          })
        }
      }
    }

    // ── PHASE 2: Fix same-court overlaps (cascade push within each court) ──
    {
      const freshState = buildState(affectedCourtRaw, otherCourtRaw, getUpdates())
      const overlaps = detectSameCourtOverlaps(freshState)
      for (const { prev, curr, gap } of overlaps) {
        const prevEnd = parseTime(prev.time) + prev.duration
        const newTime = prevEnd // push curr to start right after prev ends
        if (newTime <= parseTime(curr.time)) continue // already fine
        if (!isWithinLimit(curr.id, newTime, curr.date)) continue // can't push, would exceed limit
        // isInPast removed — cascade push is corrective, not scheduling new matches
        if (!fitsInCourt(newTime, curr.duration, court, curr.date, courtSchedulesMap, curr.courtId || affectedCourtId)) continue
        allUpdates.set(curr.id, { scheduled_date: curr.date, scheduled_time: minutesToTime(newTime) })
        // Update in freshState for cascading
        const s = freshState.find(m => m.id === curr.id)
        if (s) s.time = minutesToTime(newTime)
        madeChange = true
      }
    }

    // ── PHASE 3: Fix elimination before group violations + cascade on same court ──
    {
      const freshState = buildState(affectedCourtRaw, otherCourtRaw, getUpdates())
      const violations = detectElimBeforeGroup(freshState)
      for (const { match: m, lastGroupDate, lastGroupEnd } of violations) {
        const newTime = lastGroupEnd
        if (!isWithinLimit(m.id, newTime, lastGroupDate)) continue
        const mCourtCfg = courtConfigMap.get(m.courtId) || court
        if (!fitsInCourt(newTime, m.duration, mCourtCfg, lastGroupDate, courtSchedulesMap, m.courtId)) continue
        console.log(`R3 FIX: #${m.match_number} pushed from ${m.time} to ${minutesToTime(newTime)} (group ends at ${minutesToTime(lastGroupEnd)})`)
        allUpdates.set(m.id, { scheduled_date: lastGroupDate, scheduled_time: minutesToTime(newTime) })
        m.time = minutesToTime(newTime)
        m.date = lastGroupDate
        madeChange = true

        // Cascade subsequent matches on the same court that now overlap
        const sameCourtAfter = freshState
          .filter(s => s.courtId === m.courtId && s.date === lastGroupDate && s.id !== m.id &&
            (s.status === 'scheduled' || s.status === 'pending'))
          .sort((x, y) => parseTime(x.time) - parseTime(y.time) || x.match_number - y.match_number)

        let cursor = newTime + m.duration
        for (const s of sameCourtAfter) {
          const sTime = parseTime(s.time)
          if (sTime >= cursor) break
          let pushTime = cursor
          if (mCourtCfg.break_start && mCourtCfg.break_end) {
            const bs = parseTime(mCourtCfg.break_start)
            const be = parseTime(mCourtCfg.break_end)
            if (pushTime >= bs && pushTime < be) pushTime = be
            if (pushTime < bs && pushTime + s.duration > bs) pushTime = be
          }
          if (!isWithinLimit(s.id, pushTime, lastGroupDate)) break
          if (!fitsInCourt(pushTime, s.duration, mCourtCfg, lastGroupDate, courtSchedulesMap, m.courtId)) break
          console.log(`  R3 CASCADE: #${s.match_number} pushed from ${s.time} to ${minutesToTime(pushTime)}`)
          allUpdates.set(s.id, { scheduled_date: lastGroupDate, scheduled_time: minutesToTime(pushTime) })
          s.time = minutesToTime(pushTime)
          cursor = pushTime + s.duration
        }
      }
    }

    // ── PHASE 4: Final validation — revert any match that moved backward or exceeds limit ──
    {
      const freshState = buildState(affectedCourtRaw, otherCourtRaw, getUpdates())
      for (const m of freshState) {
        const ref = refTimeMap.get(m.id)
        if (!ref) continue
        const currTime = parseTime(m.time)
        // Check backward from reference (reference is the floor)
        // Actually, backward from reference IS allowed (within ±120min).
        // "No backward" means no backward from the match's CURRENT post-cascade time,
        // but that only applies to Attempt B moves. For Phase 2/3 pushes, forward only.
        // The absolute limit is ±120min from reference.
        let dayDiffMin = 0
        if (m.date !== ref.date) {
          const d1 = new Date(ref.date + 'T00:00:00')
          const d2 = new Date(m.date + 'T00:00:00')
          dayDiffMin = Math.round(Math.abs(d2 - d1) / 60000)
        }
        if ((Math.abs(currTime - ref.time) + dayDiffMin) > maxDisplacement) {
          // Revert to reference time
          allUpdates.set(m.id, { scheduled_date: ref.date, scheduled_time: minutesToTime(ref.time) })
          madeChange = true
        }
      }
    }

    // ── Check all conditions ──
    {
      const finalState = buildState(affectedCourtRaw, otherCourtRaw, getUpdates())
      const cc = detectCrossCourtConflicts(finalState, affectedCourtId)
      const sc = detectSameCourtOverlaps(finalState)
      const ev = detectElimBeforeGroup(finalState)

      // Filter out already-unresolved conflicts
      const newCC = cc.filter(c => {
        const key = [c.matchA.id, c.matchB.id].sort().join('-')
        return !unresolvedSet.has(key)
      })

      if (newCC.length === 0 && sc.length === 0 && ev.length === 0 && !madeChange) break
      if (!madeChange) break // stuck, stop cycling
    }
  }

  // Build final resolved updates (only those that differ from cascade)
  const resolvedUpdates = []
  for (const [id, upd] of allUpdates) {
    const cascade = cascadeMap.get(id)
    // Include if not in cascade, or if different from cascade
    if (!cascade || cascade.scheduled_date !== upd.scheduled_date || cascade.scheduled_time !== upd.scheduled_time) {
      resolvedUpdates.push({ id, scheduled_date: upd.scheduled_date, scheduled_time: upd.scheduled_time })
    }
  }

  const unresolvedDetails = Array.from(unresolvedSet.values())
  const totalDetected = resolvedBySwap + resolvedByMove + unresolvedDetails.length

  return {
    resolvedUpdates,
    resolutionSummary: {
      detected: totalDetected,
      resolvedBySwap,
      resolvedByMove,
      unresolved: unresolvedDetails.length,
      unresolvedDetails,
    },
  }
}

/**
 * FINAL POST-RESOLUTION VALIDATION — Last line of defense.
 * Runs AFTER cascade + conflict resolution, BEFORE persisting to DB.
 * Detects R1-R3, R6, R7 violations. REVERTS matches that violate R6/R7.
 *
 * @param {Array} allTournamentMatches - ALL matches with ORIGINAL DB times
 * @param {Map} finalUpdatesMap - Map<matchId, { scheduled_date, scheduled_time }> of all proposed changes
 * @param {Map} cascadeRefMap - Map<matchId, { scheduled_date, scheduled_time }> post-cascade reference times
 * @param {Array} courtConfigs - Array of { id, available_from, available_to, break_start, break_end }
 * @returns {{ valid: boolean, violations: Array, reverted: Array, revertUpdates: Map }}
 */
export function finalValidation(allTournamentMatches, finalUpdatesMap, cascadeRefMap, courtConfigs) {
  const violations = []
  const reverted = []
  const revertUpdates = new Map()

  // Build effective state: apply finalUpdatesMap on top of original matches
  function getEffective(m) {
    const upd = finalUpdatesMap.get(m.id)
    return {
      ...m,
      scheduled_date: upd ? upd.scheduled_date : m.scheduled_date,
      scheduled_time: upd ? upd.scheduled_time : m.scheduled_time,
    }
  }

  const active = allTournamentMatches
    .filter(m => (m.status === 'scheduled' || m.status === 'pending') && m.scheduled_date && m.scheduled_time)
    .map(getEffective)

  // ── F1: R6 — No match displaced >120 min from cascade reference ──
  for (const m of active) {
    if (!finalUpdatesMap.has(m.id)) continue // not moved, skip
    const cascadeRef = cascadeRefMap.get(m.id)
    if (!cascadeRef) continue // no reference = original position, can't measure

    const refMin = parseTime(cascadeRef.scheduled_time)
    const currMin = parseTime(m.scheduled_time)

    let dayDiffMin = 0
    if (m.scheduled_date !== cascadeRef.scheduled_date) {
      const d1 = new Date(cascadeRef.scheduled_date + 'T00:00:00')
      const d2 = new Date(m.scheduled_date + 'T00:00:00')
      dayDiffMin = Math.round(Math.abs(d2 - d1) / 60000)
    }
    const displacement = Math.abs(currMin - refMin) + dayDiffMin

    if (displacement > 120) {
      console.log('FINAL VALIDATION R6 REVERT:', {
        matchNumber: m.match_number,
        matchId: m.id,
        currentTime: m.scheduled_time,
        currentDate: m.scheduled_date,
        referenceTime: cascadeRef.scheduled_time,
        referenceDate: cascadeRef.scheduled_date,
        displacement,
        limit: 120,
      })
      violations.push({
        rule: 'R6',
        matchNumber: m.match_number,
        matchId: m.id,
        displacement,
        limit: 120,
        description: `Partido #${m.match_number} desplazado ${displacement} min (limite 120)`,
      })
      // REVERT to cascade reference
      revertUpdates.set(m.id, { scheduled_date: cascadeRef.scheduled_date, scheduled_time: cascadeRef.scheduled_time })
      reverted.push({ matchId: m.id, matchNumber: m.match_number, reason: 'R6', displacement })
    }
  }

  // ── F2: R7 — No match in the past (Venezuela UTC-4) ──
  const nowVzla = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }))
  const todayStr = `${nowVzla.getFullYear()}-${String(nowVzla.getMonth() + 1).padStart(2, '0')}-${String(nowVzla.getDate()).padStart(2, '0')}`
  const nowMinutes = nowVzla.getHours() * 60 + nowVzla.getMinutes()

  for (const m of active) {
    if (!finalUpdatesMap.has(m.id)) continue // only check moved matches
    // Apply revert if already reverted by R6
    const effectiveDate = revertUpdates.has(m.id) ? revertUpdates.get(m.id).scheduled_date : m.scheduled_date
    const effectiveTime = revertUpdates.has(m.id) ? revertUpdates.get(m.id).scheduled_time : m.scheduled_time

    const newIsInPast = effectiveDate < todayStr || (effectiveDate === todayStr && parseTime(effectiveTime) < nowMinutes)
    if (!newIsInPast) continue // new position is in the future, no problem

    // Check if the match was ALREADY in the past before the move (original DB time)
    const originalMatch = allTournamentMatches.find(om => om.id === m.id)
    const origDate = originalMatch?.scheduled_date || ''
    const origTime = originalMatch?.scheduled_time || ''
    const originalWasInPast = origDate < todayStr || (origDate === todayStr && parseTime(origTime) < nowMinutes)

    // Only revert if the move CAUSED the match to be in the past (was future → now past)
    if (originalWasInPast) {
      // Already was in the past before any changes — not our fault, skip
      continue
    }

    // Match was in the future but the move put it in the past → REVERT
    const cascadeRef = cascadeRefMap.get(m.id)
    if (cascadeRef) {
      console.log('FINAL VALIDATION R7 REVERT:', {
        matchNumber: m.match_number,
        matchId: m.id,
        originalTime: `${origDate} ${origTime}`,
        scheduledTime: effectiveTime,
        scheduledDate: effectiveDate,
        nowVenezuela: `${todayStr} ${minutesToTime(nowMinutes)}`,
        reason: 'was in future, moved to past',
      })
      violations.push({
        rule: 'R7',
        matchNumber: m.match_number,
        matchId: m.id,
        description: `Partido #${m.match_number} movido al pasado (${effectiveDate} ${effectiveTime})`,
      })
      revertUpdates.set(m.id, { scheduled_date: cascadeRef.scheduled_date, scheduled_time: cascadeRef.scheduled_time })
      if (!reverted.find(r => r.matchId === m.id)) {
        reverted.push({ matchId: m.id, matchNumber: m.match_number, reason: 'R7' })
      }
    }
  }

  // Apply reverts to get the final effective state for R1-R3 checks
  const postRevertActive = active.map(m => {
    const rev = revertUpdates.get(m.id)
    return rev ? { ...m, scheduled_date: rev.scheduled_date, scheduled_time: rev.scheduled_time } : m
  })

  // ── F3: R1 — No same-court overlap ──
  const byCourtDate = new Map()
  for (const m of postRevertActive) {
    const key = `${m.court_id}|${m.scheduled_date}`
    if (!byCourtDate.has(key)) byCourtDate.set(key, [])
    byCourtDate.get(key).push(m)
  }
  for (const [, group] of byCourtDate) {
    group.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time) || a.match_number - b.match_number)
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1]
      const curr = group[i]
      const prevEnd = parseTime(prev.scheduled_time) + (prev.estimated_duration_minutes || 60)
      const currStart = parseTime(curr.scheduled_time)
      if (currStart < prevEnd) {
        violations.push({
          rule: 'R1',
          description: `Solapamiento en misma cancha: #${prev.match_number} termina ${minutesToTime(prevEnd)} pero #${curr.match_number} empieza ${curr.scheduled_time}`,
          matchIds: [prev.id, curr.id],
        })
      }
    }
  }

  // ── F4: R2 — No cross-court team overlap ──
  const withTeams = postRevertActive.filter(m => m.team1_id || m.team2_id)
  for (let i = 0; i < withTeams.length; i++) {
    for (let j = i + 1; j < withTeams.length; j++) {
      const a = withTeams[i]
      const b = withTeams[j]
      if (a.court_id === b.court_id) continue
      if (a.scheduled_date !== b.scheduled_date) continue
      const startA = parseTime(a.scheduled_time)
      const endA = startA + (a.estimated_duration_minutes || 60)
      const startB = parseTime(b.scheduled_time)
      const endB = startB + (b.estimated_duration_minutes || 60)
      if (startA >= endB || startB >= endA) continue
      const teamsA = [a.team1_id, a.team2_id].filter(Boolean)
      const teamsB = [b.team1_id, b.team2_id].filter(Boolean)
      const shared = teamsA.filter(t => teamsB.includes(t))
      if (shared.length > 0) {
        violations.push({
          rule: 'R2',
          description: `Solapamiento entre canchas: dupla ${shared[0]} en #${a.match_number} y #${b.match_number}`,
          matchIds: [a.id, b.id],
          teamId: shared[0],
        })
      }
    }
  }

  // ── F5: R3 — Group before elimination per-category (DETECT + CORRECT) ──
  const r3Categories = [...new Set(postRevertActive.map(m => m.category_id).filter(Boolean))]
  for (const catId of r3Categories) {
    const catMatches = postRevertActive.filter(m => m.category_id === catId)
    let lastGroupEnd = null
    let lastGroupDate = ''
    for (const m of catMatches) {
      if (m.phase !== 'group_phase') continue
      const end = parseTime(m.scheduled_time) + (m.estimated_duration_minutes || 60)
      if (m.scheduled_date > lastGroupDate || (m.scheduled_date === lastGroupDate && end > (lastGroupEnd || 0))) {
        lastGroupDate = m.scheduled_date
        lastGroupEnd = end
      }
    }
    if (!lastGroupDate) continue

    for (const m of catMatches) {
      if (!m.phase || m.phase === 'group_phase') continue
      const start = parseTime(m.scheduled_time)
      if (m.scheduled_date < lastGroupDate || (m.scheduled_date === lastGroupDate && start < lastGroupEnd)) {
        // Try to correct: revert to original position if it was valid for THIS category
        const originalMatch = allTournamentMatches.find(om => om.id === m.id)
        const origDate = originalMatch?.scheduled_date || m.scheduled_date
        const origTime = originalMatch?.scheduled_time || m.scheduled_time
        const origStart = parseTime(origTime)
        const origWasValid = origDate > lastGroupDate || (origDate === lastGroupDate && origStart >= lastGroupEnd)

        if (origWasValid && finalUpdatesMap.has(m.id)) {
          console.log('FINAL VALIDATION R3 REVERT:', {
            matchNumber: m.match_number, phase: m.phase, category: catId,
            currentPos: `${m.scheduled_date} ${m.scheduled_time}`,
            revertTo: `${origDate} ${origTime}`,
          })
          revertUpdates.set(m.id, { scheduled_date: origDate, scheduled_time: origTime })
          if (!reverted.find(r => r.matchId === m.id)) {
            reverted.push({ matchId: m.id, matchNumber: m.match_number, reason: 'R3', phase: m.phase })
          }
        }

        violations.push({
          rule: 'R3',
          matchNumber: m.match_number,
          matchId: m.id,
          description: `Eliminatoria #${m.match_number} (${m.phase}) empieza antes del ultimo grupo de su categoria`,
        })
      }
    }
  }

  const valid = violations.length === 0

  if (violations.length > 0) {
    console.log('FINAL VALIDATION RESULT:', {
      valid,
      totalViolations: violations.length,
      reverted: reverted.length,
      violations: violations.map(v => `${v.rule}: ${v.description}`),
    })
  }

  return { valid, violations, reverted, revertUpdates }
}
