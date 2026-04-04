// schedulingEngine.js — Motor de distribución de partidos en cronograma
// Módulo de lógica pura (sin React, sin Supabase)

/**
 * Parsea un string de hora "HH:MM" a minutos desde medianoche.
 */
function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos desde medianoche a string "HH:MM".
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Genera todos los slots de tiempo posibles para una cancha en un día.
 *
 * Un slot es válido si:
 * - El partido empieza y TERMINA dentro del horario (start + duración <= available_to)
 * - El partido NO se solapa con el break:
 *   (start + duración <= break_start) OR (start >= break_end)
 *
 * @param {Object} court - { id, name, available_from, available_to, break_start, break_end }
 * @param {string} date - Fecha en formato "YYYY-MM-DD"
 * @param {number} matchDurationMinutes - Duración del partido en minutos
 * @returns {Array} Slots ordenados cronológicamente
 */
export function generateTimeSlots(court, date, matchDurationMinutes) {
  const slots = [];
  const from = parseTime(court.available_from);
  const to = parseTime(court.available_to);
  const hasBreak = court.break_start != null && court.break_end != null;
  const breakStart = hasBreak ? parseTime(court.break_start) : null;
  const breakEnd = hasBreak ? parseTime(court.break_end) : null;

  let lastPreBreakStart = from; // track start of last slot before break
  let addedTightSlot = false;

  for (let start = from; start + matchDurationMinutes <= to; start += matchDurationMinutes) {
    const end = start + matchDurationMinutes;

    if (hasBreak) {
      const endsBeforeBreak = end <= breakStart;
      const startsAfterBreak = start >= breakEnd;

      if (!endsBeforeBreak && !startsAfterBreak) {
        // FIX 1: Try to fit a tight slot ending exactly at break_start
        if (!addedTightSlot) {
          const tightStart = breakStart - matchDurationMinutes;
          if (tightStart > lastPreBreakStart && tightStart >= from) {
            slots.push({
              court_id: court.id,
              court_name: court.name,
              date,
              start_time: minutesToTime(tightStart),
              end_time: minutesToTime(breakStart),
            });
            addedTightSlot = true;
          }
        }

        // FIX 2: Jump to break_end so the first post-break slot starts there
        if (start < breakEnd) {
          start = breakEnd - matchDurationMinutes; // loop will add matchDurationMinutes
          continue;
        }
        continue;
      }

      if (endsBeforeBreak) {
        lastPreBreakStart = start;
      }
    }

    slots.push({
      court_id: court.id,
      court_name: court.name,
      date,
      start_time: minutesToTime(start),
      end_time: minutesToTime(end),
    });
  }

  return slots;
}

/**
 * Genera todos los slots disponibles para todas las canchas en todo el rango de fechas.
 * Ordenados por fecha → hora → cancha.
 *
 * @param {Array} courts - Array de objetos cancha
 * @param {string} startDate - Fecha inicio "YYYY-MM-DD"
 * @param {string} endDate - Fecha fin "YYYY-MM-DD"
 * @param {number} matchDurationMinutes - Duración del partido en minutos
 * @param {Object} [opts] - Optional overrides
 * @param {string[]} [opts.tournamentDays] - If provided, only generate slots for these dates (sorted YYYY-MM-DD strings).
 *   Overrides startDate/endDate iteration. "Next day" = next entry in this array, NOT next calendar day.
 * @param {Object} [opts.courtSchedules] - Per-court per-weekday schedule overrides.
 *   Shape: { [courtId]: { [dayOfWeek]: { available_from, available_to, break_start, break_end } } }
 *   dayOfWeek uses JS getDay() convention: 0=Sun, 1=Mon, ..., 6=Sat.
 *   If a court+weekday has an entry here, it overrides the court's own fields for that day.
 * @returns {Array} Array plano de todos los slots
 */
export function generateAllSlots(courts, startDate, endDate, matchDurationMinutes, opts = {}) {
  const { tournamentDays, courtSchedules } = opts;
  const allSlots = [];
  let dates;

  if (tournamentDays && tournamentDays.length > 0) {
    // Use explicit tournament days (may be non-consecutive)
    dates = [...tournamentDays].sort();
  } else {
    // Legacy: iterate from startDate to endDate inclusive
    dates = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  for (const date of dates) {
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();

    for (const court of courts) {
      // Determine schedule for this court on this day
      let effectiveCourt = court;
      if (courtSchedules && courtSchedules[court.id] && courtSchedules[court.id][dayOfWeek]) {
        const sched = courtSchedules[court.id][dayOfWeek];
        effectiveCourt = {
          ...court,
          available_from: sched.available_from,
          available_to:   sched.available_to,
          break_start:    sched.break_start,
          break_end:      sched.break_end,
        };
      }

      const slots = generateTimeSlots(effectiveCourt, date, matchDurationMinutes);
      allSlots.push(...slots);
    }
  }

  // Ordenar por fecha → hora → cancha
  allSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.start_time !== b.start_time) return a.start_time < b.start_time ? -1 : 1;
    return a.court_name < b.court_name ? -1 : a.court_name > b.court_name ? 1 : 0;
  });

  return allSlots;
}

/**
 * Valida si hay suficientes slots para cubrir todos los partidos.
 *
 * @param {number} totalSlots - Cantidad de slots disponibles
 * @param {number} totalMatches - Cantidad de partidos a programar
 * @returns {Object} { sufficient, slots, matches, deficit }
 */
export function validateSlotCapacity(totalSlots, totalMatches) {
  const deficit = Math.max(0, totalMatches - totalSlots);
  return {
    sufficient: totalSlots >= totalMatches,
    slots: totalSlots,
    matches: totalMatches,
    deficit,
  };
}

/**
 * Intercala partidos de distintos grupos para distribuir carga.
 * Grupo A p1, Grupo B p1, Grupo C p1, Grupo A p2, Grupo B p2, etc.
 */
function interleaveByGroup(matches) {
  const byGroup = new Map();
  for (const m of matches) {
    if (!byGroup.has(m.group_id)) byGroup.set(m.group_id, []);
    byGroup.get(m.group_id).push(m);
  }
  // Sort each group's matches by match_number
  for (const arr of byGroup.values()) {
    arr.sort((a, b) => a.match_number - b.match_number);
  }
  // Sort groups by size descending (larger groups first for better distribution)
  const groups = [...byGroup.values()].sort((a, b) => b.length - a.length);

  const result = [];
  let round = 0;
  let added = true;
  while (added) {
    added = false;
    for (const groupMatches of groups) {
      if (round < groupMatches.length) {
        result.push(groupMatches[round]);
        added = true;
      }
    }
    round++;
  }
  return result;
}

/**
 * Checks if a team has an overlapping match at a specific date+time range.
 * Two matches overlap if: (startA < endB) AND (startB < endA)
 */
function isTeamBusyAt(teamId, date, startTime, duration, assignments) {
  const newStart = parseTime(startTime);
  const newEnd = newStart + duration;
  return assignments.some(a => {
    if (a.scheduled_date !== date) return false;
    if (a.team1_id !== teamId && a.team2_id !== teamId) return false;
    const existingStart = parseTime(a.scheduled_time);
    const existingEnd = existingStart + (a.estimated_duration_minutes || duration);
    return newStart < existingEnd && existingStart < newEnd;
  });
}

/**
 * Checks if assigning a team to a slot would violate the max consecutive rule.
 * Returns true if the assignment would be a violation.
 */
function wouldViolateConsecutive(teamId, slotDate, slotStartTime, slotEndTime, maxConsecutive, teamHistory) {
  const history = teamHistory.get(teamId);
  if (!history || history.length === 0) return false;

  // Get this team's assignments sorted chronologically
  const sorted = [...history].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 :
    a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0
  );

  // Find where the new slot would be inserted chronologically
  const newSlot = { date: slotDate, start_time: slotStartTime, end_time: slotEndTime };
  const all = [...sorted, newSlot].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 :
    a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0
  );

  const newIdx = all.indexOf(newSlot);

  // Check the window around the new slot for consecutive chain length
  // Two matches are consecutive if there's no gap between them (end_time of one >= start_time of next on same date)
  let consecutiveCount = 1;

  // Count backwards from newIdx
  for (let i = newIdx - 1; i >= 0; i--) {
    if (all[i].date === all[i + 1].date) {
      const prevEnd = parseTime(all[i].end_time);
      const nextStart = parseTime(all[i + 1].start_time);
      if (nextStart <= prevEnd) {
        consecutiveCount++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Count forwards from newIdx
  for (let i = newIdx + 1; i < all.length; i++) {
    if (all[i - 1].date === all[i].date) {
      const prevEnd = parseTime(all[i - 1].end_time);
      const nextStart = parseTime(all[i].start_time);
      if (nextStart <= prevEnd) {
        consecutiveCount++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return consecutiveCount > maxConsecutive;
}

/**
 * Returns how many matches a team has on a given date.
 */
function teamMatchesOnDate(teamId, date, teamHistory) {
  const history = teamHistory.get(teamId)
  if (!history) return 0
  return history.filter(h => h.date === date).length
}

/**
 * Checks if a second match on the same day is within the proximity window.
 * Returns true if the slot is TOO FAR from the first match (violation).
 * maxGapSlots = max number of slot-durations between the two matches.
 */
function wouldViolateProximity(teamId, slotDate, slotStartTime, matchDuration, maxGapSlots, teamHistory) {
  const history = teamHistory.get(teamId)
  if (!history) return false

  const sameDayMatches = history.filter(h => h.date === slotDate)
  if (sameDayMatches.length === 0) return false // first match of the day, no constraint

  // Team already has 1 match this day — check proximity for the 2nd
  const slotStart = parseTime(slotStartTime)
  const maxGapMinutes = maxGapSlots * matchDuration

  for (const existing of sameDayMatches) {
    const existingStart = parseTime(existing.start_time)
    const gap = Math.abs(slotStart - existingStart)
    if (gap > maxGapMinutes) return true // too far
  }

  return false
}

/**
 * Distribuye partidos de fase de grupos en los slots disponibles respetando restricciones.
 *
 * @param {Array} matches - Partidos con { id, match_number, team1_id, team2_id, group_id, phase }
 * @param {Array} slots - Slots de generateAllSlots
 * @param {Object} options - { maxConsecutive: 2, maxPerDay: 2, maxProximitySlots: 3 }
 * @returns {Object} { assignments, unassigned }
 */
export function distributeMatches(matches, slots, options = {}) {
  const { maxConsecutive = 2, maxPerDay = 2, maxProximitySlots = 3 } = options

  // Only group phase matches
  const groupMatches = matches.filter(m => m.phase === 'group_phase');
  const ordered = interleaveByGroup(groupMatches);

  const assignments = [];
  const unassigned = [];
  const slotOccupied = new Set(); // indices of used slots
  // Track each team's assigned slots for consecutive checking
  const teamHistory = new Map(); // team_id → [{ date, start_time, end_time }]

  for (const match of ordered) {
    let assigned = false;
    const hasTeams = match.team1_id != null && match.team2_id != null

    for (let si = 0; si < slots.length; si++) {
      if (slotOccupied.has(si)) continue;

      const slot = slots[si];
      const duration = parseTime(slot.end_time) - parseTime(slot.start_time)
      const slotStart = parseTime(slot.start_time)
      const slotEnd = slotStart + duration

      // R1: verify no assigned match on this court overlaps this time range
      let courtBusy = false
      for (const a of assignments) {
        if (a.court_id !== slot.court_id || a.scheduled_date !== slot.date) continue
        const aStart = parseTime(a.scheduled_time)
        const aEnd = aStart + (a.estimated_duration_minutes || duration)
        if (slotStart < aEnd && aStart < slotEnd) { courtBusy = true; break }
      }
      if (courtBusy) continue

      // Team-based constraints only apply when both teams are known
      if (hasTeams) {
        // R2: neither team has an overlapping match (time range check)
        if (isTeamBusyAt(match.team1_id, slot.date, slot.start_time, duration, assignments)) continue;
        if (isTeamBusyAt(match.team2_id, slot.date, slot.start_time, duration, assignments)) continue;

        // R3: neither team would exceed max consecutive
        if (wouldViolateConsecutive(match.team1_id, slot.date, slot.start_time, slot.end_time, maxConsecutive, teamHistory)) continue;
        if (wouldViolateConsecutive(match.team2_id, slot.date, slot.start_time, slot.end_time, maxConsecutive, teamHistory)) continue;

        // R-A: max matches per day per team
        if (teamMatchesOnDate(match.team1_id, slot.date, teamHistory) >= maxPerDay) continue;
        if (teamMatchesOnDate(match.team2_id, slot.date, teamHistory) >= maxPerDay) continue;

        // R-B: if 2nd match of the day, must be within proximity window
        if (wouldViolateProximity(match.team1_id, slot.date, slot.start_time, duration, maxProximitySlots, teamHistory)) continue;
        if (wouldViolateProximity(match.team2_id, slot.date, slot.start_time, duration, maxProximitySlots, teamHistory)) continue;
      }

      // All checks passed — assign
      assignments.push({
        match_id: match.id || null,
        match_number: match.match_number,
        court_id: slot.court_id,
        court_name: slot.court_name,
        scheduled_date: slot.date,
        scheduled_time: slot.start_time,
        estimated_duration_minutes: duration,
        team1_id: match.team1_id,
        team2_id: match.team2_id,
      });

      slotOccupied.add(si);

      // Update team history — only for real teams (skip null)
      if (hasTeams) {
        const slotInfo = { date: slot.date, start_time: slot.start_time, end_time: slot.end_time };
        for (const tid of [match.team1_id, match.team2_id]) {
          if (!teamHistory.has(tid)) teamHistory.set(tid, []);
          teamHistory.get(tid).push(slotInfo);
        }
      }

      assigned = true;
      break;
    }

    if (!assigned) {
      unassigned.push(match.id || match.match_number);
    }
  }

  return { assignments, unassigned };
}

/**
 * Distributes group phase matches first, then elimination placeholder matches.
 * Elimination matches (no team_id) only need court-free constraint.
 * Elimination rounds are ordered: first round before semis before final,
 * with at least 1 slot gap between rounds.
 *
 * @param {Array} groupMatches - Group phase matches with team_ids
 * @param {Array} elimMatches - Elimination matches (team_ids may be null), must have { match_number, phase, round_number, category_id }
 * @param {Array} slots - All available slots
 * @param {Object} options
 * @returns {Object} { assignments, unassigned }
 */
export function distributeFullTournament(groupMatches, elimMatches, slots, options = {}) {
  // Step 1: distribute group matches with full constraints
  const groupResult = distributeMatches(
    groupMatches.map(m => ({ ...m, phase: 'group_phase' })),
    slots,
    options,
  )

  // Step 2: mark occupied slots + find last group match date (for R_ORDER)
  const occupied = new Set()
  let lastGroupDate = ''
  for (const a of groupResult.assignments) {
    const key = `${a.court_id}|${a.scheduled_date}|${a.scheduled_time}`
    occupied.add(key)
    if (a.scheduled_date > lastGroupDate) lastGroupDate = a.scheduled_date
  }

  // Step 3: sort elimination matches by round_number then position/match_number
  const sortedElim = [...elimMatches].sort((a, b) => {
    if ((a.round_number ?? 0) !== (b.round_number ?? 0)) return (a.round_number ?? 0) - (b.round_number ?? 0)
    return (a.match_number ?? 0) - (b.match_number ?? 0)
  })

  // Step 4: assign elimination matches to remaining slots
  // Only constraint: slot not occupied. Also ensure later rounds go after earlier rounds.
  const elimAssignments = []
  const elimUnassigned = []
  // Track last assigned time per round per category for inter-round gap
  const roundLastTime = new Map() // "catId|round" → { date, end_time }

  // All assignments so far (group + elim) for R1 range overlap checking
  const allAssignmentsSoFar = [...groupResult.assignments]

  for (const match of sortedElim) {
    let assigned = false
    const roundKey = `${match.category_id}|${match.round_number ?? 0}`
    const prevRoundKey = `${match.category_id}|${(match.round_number ?? 1) - 1}`
    const prevRoundLast = roundLastTime.get(prevRoundKey)

    for (let si = 0; si < slots.length; si++) {
      const slot = slots[si]
      const slotKey = `${slot.court_id}|${slot.date}|${slot.start_time}`

      if (occupied.has(slotKey)) continue

      const duration = parseTime(slot.end_time) - parseTime(slot.start_time)
      const slotStart = parseTime(slot.start_time)
      const slotEnd = slotStart + duration

      // R1: verify no assigned match on this court overlaps this time range
      let courtBusy = false
      for (const a of allAssignmentsSoFar) {
        if (a.court_id !== slot.court_id || a.scheduled_date !== slot.date) continue
        const aStart = parseTime(a.scheduled_time)
        const aEnd = aStart + (a.estimated_duration_minutes || duration)
        if (slotStart < aEnd && aStart < slotEnd) { courtBusy = true; break }
      }
      if (courtBusy) continue

      // R_ORDER: elimination cannot be on a date before the last group match
      if (lastGroupDate && slot.date < lastGroupDate) continue

      // Ensure this round starts after previous round's last match
      if (prevRoundLast) {
        if (slot.date < prevRoundLast.date) continue
        if (slot.date === prevRoundLast.date && slot.start_time < prevRoundLast.end_time) continue
      }

      // Assign
      const assignment = {
        match_id: match.id || null,
        match_number: match.match_number,
        court_id: slot.court_id,
        court_name: slot.court_name,
        scheduled_date: slot.date,
        scheduled_time: slot.start_time,
        estimated_duration_minutes: duration,
        team1_id: match.team1_id ?? null,
        team2_id: match.team2_id ?? null,
        phase: match.phase,
        round_number: match.round_number,
        category_id: match.category_id,
      }

      elimAssignments.push(assignment)
      allAssignmentsSoFar.push(assignment)
      occupied.add(slotKey)

      // Track for round ordering
      const existing = roundLastTime.get(roundKey)
      if (!existing || slot.date > existing.date || (slot.date === existing.date && slot.end_time > existing.end_time)) {
        roundLastTime.set(roundKey, { date: slot.date, end_time: slot.end_time })
      }

      assigned = true
      break
    }

    if (!assigned) {
      elimUnassigned.push(match.match_number)
    }
  }

  return {
    assignments: [...groupResult.assignments, ...elimAssignments],
    unassigned: [...groupResult.unassigned, ...elimUnassigned],
    groupCount: groupResult.assignments.length,
    elimCount: elimAssignments.length,
  }
}

/**
 * Valida que una distribución cumple TODAS las restricciones.
 *
 * @param {Array} assignments - Asignaciones de distributeMatches
 * @param {Array} matches - Partidos originales
 * @returns {Object} { valid, violations }
 */
export function validateDistribution(assignments, matches) {
  const violations = [];

  // R1: No two assignments on same court overlap in time range
  const byCourtDate = new Map();
  for (const a of assignments) {
    const key = `${a.court_id}|${a.scheduled_date}`;
    if (!byCourtDate.has(key)) byCourtDate.set(key, []);
    byCourtDate.get(key).push(a);
  }
  for (const [key, courtMatches] of byCourtDate) {
    courtMatches.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    for (let i = 0; i < courtMatches.length; i++) {
      for (let j = i + 1; j < courtMatches.length; j++) {
        const a = courtMatches[i];
        const b = courtMatches[j];
        const aStart = parseTime(a.scheduled_time);
        const aEnd = aStart + (a.estimated_duration_minutes || 45);
        const bStart = parseTime(b.scheduled_time);
        const bEnd = bStart + (b.estimated_duration_minutes || 45);
        if (aStart < bEnd && bStart < aEnd) {
          violations.push({
            rule: 'R1',
            description: `Court ${a.court_name} overlap: #${a.match_number} (${a.scheduled_time}-${minutesToTime(aEnd)}) vs #${b.match_number} (${b.scheduled_time}-${minutesToTime(bEnd)}) on ${a.scheduled_date}`,
            details: { match1: a.match_number, match2: b.match_number, overlap: Math.min(aEnd, bEnd) - Math.max(aStart, bStart) },
          });
        }
      }
    }
  }

  // R2: No team playing overlapping matches on different courts (skip null team_ids)
  // Two matches overlap if: (startA < endB) AND (startB < endA)
  const teamAssignments = new Map();
  for (const a of assignments) {
    for (const tid of [a.team1_id, a.team2_id]) {
      if (tid == null) continue;
      if (!teamAssignments.has(tid)) teamAssignments.set(tid, []);
      teamAssignments.get(tid).push(a);
    }
  }
  for (const [tid, tAssigns] of teamAssignments) {
    for (let i = 0; i < tAssigns.length; i++) {
      for (let j = i + 1; j < tAssigns.length; j++) {
        const a = tAssigns[i];
        const b = tAssigns[j];
        if (a.scheduled_date !== b.scheduled_date) continue;
        if (a.court_id === b.court_id) continue; // same court conflicts are R1
        const startA = parseTime(a.scheduled_time);
        const endA = startA + (a.estimated_duration_minutes || 45);
        const startB = parseTime(b.scheduled_time);
        const endB = startB + (b.estimated_duration_minutes || 45);
        if (startA < endB && startB < endA) {
          violations.push({
            rule: 'R2',
            description: `Team ${tid} has overlapping matches on ${a.scheduled_date}: ${a.scheduled_time}-${minutesToTime(endA)} (${a.court_name}) vs ${b.scheduled_time}-${minutesToTime(endB)} (${b.court_name})`,
            details: { match1: a.match_number, match2: b.match_number, team: tid },
          });
        }
      }
    }
  }

  // R3: No team plays more than 2 consecutive matches without rest (skip null team_ids)
  const teamMatches = new Map();
  for (const a of assignments) {
    for (const tid of [a.team1_id, a.team2_id]) {
      if (tid == null) continue; // skip null teams
      if (!teamMatches.has(tid)) teamMatches.set(tid, []);
      teamMatches.get(tid).push(a);
    }
  }
  for (const [tid, tAssignments] of teamMatches) {
    const sorted = [...tAssignments].sort((a, b) =>
      a.scheduled_date < b.scheduled_date ? -1 : a.scheduled_date > b.scheduled_date ? 1 :
      a.scheduled_time < b.scheduled_time ? -1 : a.scheduled_time > b.scheduled_time ? 1 : 0
    );

    let consecutive = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevEnd = parseTime(prev.scheduled_time) + prev.estimated_duration_minutes;
      const currStart = parseTime(curr.scheduled_time);

      if (prev.scheduled_date === curr.scheduled_date && currStart <= prevEnd) {
        consecutive++;
        if (consecutive > 2) {
          violations.push({
            rule: 'R3',
            description: `Team ${tid} has ${consecutive} consecutive matches at ${curr.scheduled_date} ${curr.scheduled_time}`,
            details: { team: tid, consecutiveCount: consecutive, match_number: curr.match_number },
          });
        }
      } else {
        consecutive = 1;
      }
    }
  }

  // R-A: No team plays more than 2 matches on the same day
  // R-B: If a team has 2 matches on a day, they must be within 3-slot proximity
  for (const [tid, tAssignments] of teamMatches) {
    // Group by date
    const byDate = new Map()
    for (const a of tAssignments) {
      if (!byDate.has(a.scheduled_date)) byDate.set(a.scheduled_date, [])
      byDate.get(a.scheduled_date).push(a)
    }
    for (const [date, dayMatches] of byDate) {
      if (dayMatches.length > 2) {
        violations.push({
          rule: 'R-A',
          description: `Team ${tid} has ${dayMatches.length} matches on ${date} (max 2)`,
          details: { team: tid, date, count: dayMatches.length },
        })
      }
      if (dayMatches.length === 2) {
        const t0 = parseTime(dayMatches[0].scheduled_time)
        const t1 = parseTime(dayMatches[1].scheduled_time)
        const gap = Math.abs(t1 - t0)
        const duration = dayMatches[0].estimated_duration_minutes || 45
        const maxGap = 3 * duration
        if (gap > maxGap) {
          violations.push({
            rule: 'R-B',
            description: `Team ${tid} has 2 matches on ${date} separated by ${gap} min (max ${maxGap} min)`,
            details: { team: tid, date, gap, maxGap },
          })
        }
      }
    }
  }

  // R6: Only group_phase matches should be assigned (for group-only validation)
  const matchMap = new Map();
  for (const m of matches) matchMap.set(m.id || m.match_number, m);
  for (const a of assignments) {
    const original = matchMap.get(a.match_id) || matchMap.get(a.match_number);
    if (original && original.phase !== 'group_phase') {
      violations.push({
        rule: 'R6',
        description: `Non-group match ${a.match_number} (phase: ${original.phase}) was assigned a slot`,
        details: { match_number: a.match_number, phase: original.phase },
      });
    }
  }

  // R_ORDER: All group_phase assignments must be on dates <= all elimination assignments
  let lastGroupDate = ''
  for (const a of assignments) {
    const phase = a.phase || matchMap.get(a.match_id)?.phase || matchMap.get(a.match_number)?.phase || 'group_phase'
    if (phase === 'group_phase' && a.scheduled_date > lastGroupDate) {
      lastGroupDate = a.scheduled_date
    }
  }
  if (lastGroupDate) {
    for (const a of assignments) {
      const phase = a.phase || matchMap.get(a.match_id)?.phase || matchMap.get(a.match_number)?.phase || 'group_phase'
      if (phase !== 'group_phase' && a.scheduled_date < lastGroupDate) {
        violations.push({
          rule: 'R_ORDER',
          description: `Elimination match ${a.match_number} on ${a.scheduled_date} is before last group date ${lastGroupDate}`,
          details: { match_number: a.match_number, phase, elimDate: a.scheduled_date, lastGroupDate },
        })
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Genera un resumen agrupado por día → cancha → partidos para la UI.
 *
 * @param {Array} assignments - Asignaciones de distributeMatches
 * @returns {Array} [ { date, dayLabel, courts: [ { court_id, court_name, matches: [...] } ] } ]
 */
export function getScheduleSummary(assignments) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Group by date
  const byDate = new Map();
  for (const a of assignments) {
    if (!byDate.has(a.scheduled_date)) byDate.set(a.scheduled_date, []);
    byDate.get(a.scheduled_date).push(a);
  }

  const sortedDates = [...byDate.keys()].sort();

  return sortedDates.map((date, idx) => {
    const d = new Date(date + 'T00:00:00');
    const dayLabel = `Día ${idx + 1} — ${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;

    // Group by court within this date
    const byCourt = new Map();
    for (const a of byDate.get(date)) {
      if (!byCourt.has(a.court_id)) byCourt.set(a.court_id, { court_id: a.court_id, court_name: a.court_name, matches: [] });
      byCourt.get(a.court_id).matches.push(a);
    }

    // Sort matches within each court by time
    const courts = [...byCourt.values()];
    for (const c of courts) {
      c.matches.sort((a, b) => a.scheduled_time < b.scheduled_time ? -1 : a.scheduled_time > b.scheduled_time ? 1 : 0);
    }
    // Sort courts by name
    courts.sort((a, b) => a.court_name < b.court_name ? -1 : a.court_name > b.court_name ? 1 : 0);

    return { date, dayLabel, courts };
  });
}
