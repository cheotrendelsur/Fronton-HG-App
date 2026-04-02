# Milestones

## v1.0 Reajuste Dinamico del Cronograma (Shipped: 2026-04-02)

**Phases completed:** 4 phases, 4 plans, 7 tasks

**Key accomplishments:**

- Date+time inputs pre-filled with today/now added to ScoreInputModal above scoring banner, blocking save when empty and passing { date, time } as third arg to onSave
- actual_end_time timestamptz column added to tournament_matches, wired through both group RPC and elimination direct UPDATE save paths
- Pure cascade recalculation engine (cascadeRecalculator.js) + DB persistence layer (cascadeSchedulePersistence.js) that shifts pending match times forward/backward from a completed match's actual end time, respecting court breaks and day overflow
- `src/components/Scoreboard/ScoreboardPage.jsx`:

---
