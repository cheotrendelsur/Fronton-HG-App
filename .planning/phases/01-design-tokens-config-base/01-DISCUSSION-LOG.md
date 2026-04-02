# Phase 1: End-Time Input UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 01-end-time-input-ui
**Areas discussed:** Field placement & label, Input styling, Validation behavior
**Mode:** Auto (all decisions auto-selected as recommended defaults)

---

## Field Placement & Label

| Option | Description | Selected |
|--------|-------------|----------|
| Below match info, above scoring banner | Natural reading order — match context then end-time then score | ✓ |
| Below scoring banner, above score form | Groups all input fields together | |
| At the very top of modal | Most prominent position | |

**User's choice:** [auto] Below match info/teams, above scoring banner (recommended default)
**Notes:** Matches TASK-6 spec: "debajo de la informacion del partido y ANTES de los campos de resultado"

---

| Option | Description | Selected |
|--------|-------------|----------|
| "Cuando termino este partido?" | Matches TASK-6 suggestion, natural Spanish question | ✓ |
| "Hora de finalizacion" | More formal, shorter | |

**User's choice:** [auto] "Cuando termino este partido?" (recommended default)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Side by side (date left, time right) | Saves vertical space, common pattern | ✓ |
| Stacked (date above, time below) | Takes more space but wider inputs | |

**User's choice:** [auto] Side by side (recommended default)

---

## Input Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Match modal style (white bg, light border) | Consistent with existing design | ✓ |
| Distinct style (colored background) | Makes the section stand out | |

**User's choice:** [auto] Match existing modal style (recommended default)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Native date/time inputs | Best mobile compatibility, OS-native pickers | ✓ |
| Custom styled inputs | More control over appearance | |

**User's choice:** [auto] Native date/time inputs (recommended default)

---

## Validation Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Inline red error + disabled button | Matches existing score validation pattern | ✓ |
| Toast notification | Less intrusive but easy to miss | |
| Highlight input borders red | Visual but no text explanation | |

**User's choice:** [auto] Inline red error + disabled button (recommended default)

---

## Claude's Discretion

- Exact pixel spacing between end-time section and surrounding elements
- Whether to add subtle background/border around end-time section
- Exact error message text when fields are empty

## Deferred Ideas

None
