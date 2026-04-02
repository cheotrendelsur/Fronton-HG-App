# Phase 2: Persist Actual End Time - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 02-persist-actual-end-time
**Areas discussed:** DB column type, RPC modification strategy, Timestamp construction
**Mode:** Auto (all decisions auto-selected as recommended defaults)

---

## DB Column Type

| Option | Description | Selected |
|--------|-------------|----------|
| Single timestamptz column | Standard PostgreSQL timestamp, stores full date+time | ✓ |
| Separate date + time columns | Mirrors UI fields but adds complexity | |

**User's choice:** [auto] Single timestamptz column (recommended default)
**Notes:** PROJECT.md already references `actual_end_time` as a timestamp field

---

## RPC Modification Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Separate UPDATE after RPC | Safe, doesn't modify existing RPC, score always saved first | ✓ |
| Modify RPC to accept new param | Atomic but risky — other flows depend on current signature | |
| New dedicated RPC | Over-engineered for a single column update | |

**User's choice:** [auto] Separate UPDATE after RPC (recommended default)
**Notes:** Avoids touching stable save_match_result RPC

---

## Timestamp Construction

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side combination | Combine date+time in handleSaveResult, pass to persistence | ✓ |
| Server-side (in RPC) | Would require RPC modification | |
| Database trigger | Overly complex for this use case | |

**User's choice:** [auto] Client-side combination (recommended default)

---

## Claude's Discretion

- Helper function vs inline for timestamp combination
- Error handling for post-RPC UPDATE failure
- Migration approach (MCP tool vs documented SQL)

## Deferred Ideas

None
