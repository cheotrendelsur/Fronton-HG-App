# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Reajuste Dinamico del Cronograma

**Shipped:** 2026-04-02
**Phases:** 4 | **Plans:** 4 | **Tasks:** 7

### What Was Built
- Date+time end-time inputs in ScoreInputModal, pre-filled with current date/time
- `actual_end_time` column persisted through both group RPC and elimination UPDATE paths
- Pure cascade recalculation engine with 12 unit tests — handles breaks, day overflow, multi-day cascading
- Integration into ScoreboardPage save flows with non-critical error handling

### What Worked
- 4-phase decomposition was clean: UI → Persistence → Engine → Integration. Each phase had a single clear deliverable
- Pure JS engine approach (no server RPC) made testing trivial — 12 tests in 17ms
- discuss-phase context documents prevented planning drift — every decision was locked before planning started
- Single-plan phases kept execution fast with minimal agent overhead

### What Was Inefficient
- Phase 2 and 3 roadmap checkboxes weren't marked complete by executors (minor tracking gap)
- The entire milestone was completed in a single day, suggesting it could have been a single larger phase for experienced developers

### Patterns Established
- Non-critical operations (actual_end_time post-RPC, cascade recalculation) use try/catch with console.error — never block the critical save flow
- Pure engine modules (cascadeRecalculator.js) are fully testable with no Supabase dependency
- Persistence layers (cascadeSchedulePersistence.js) handle DB queries and batch updates as a separate concern

### Key Lessons
1. When adding post-save operations, always place them BEFORE loadData() so the refetch picks up persisted changes
2. VIS-02 (player view refresh) was already satisfied by existing code — sometimes the best implementation is no implementation
3. Court-scoped recalculation (not full tournament) keeps performance bounded and reduces blast radius

### Cost Observations
- Model mix: ~30% opus (planning), ~70% sonnet (research, execution, verification)
- Sessions: ~6 sessions across planning + execution
- Notable: Phase 4 integration was minimal (1 import + 2 function calls) thanks to clean Phase 3 API design

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~6 | 4 | Initial milestone — established discuss→plan→execute→verify flow |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 12 | cascade engine | 2 (cascadeRecalculator.js, cascadeSchedulePersistence.js) |

### Top Lessons (Verified Across Milestones)

1. Pure engines with thin persistence wrappers produce testable, maintainable code
2. Non-critical post-save operations should never block the user-facing flow
