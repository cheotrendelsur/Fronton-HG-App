# Phase 1: End-Time Input UI - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Add editable date and time input fields to ScoreInputModal that capture when a match actually ended. Fields pre-fill with current date/time, are labeled in Spanish, appear above score inputs, and are required to save a result.

</domain>

<decisions>
## Implementation Decisions

### Field Placement & Label
- **D-01:** End-time inputs appear below match info/teams section and above the scoring banner (the yellow `#FFF5D6` box)
- **D-02:** Section is labeled with a heading: "Cuando termino este partido?" in Spanish
- **D-03:** Date input on the left, time input on the right — side by side in a flex row to save vertical space

### Input Styling
- **D-04:** Inputs use the existing modal style — white background, light gray border (`#E0E2E6`), rounded-lg, text-sm, consistent with the modal's clean design language
- **D-05:** Date input uses `type="date"`, time input uses `type="time"` — native browser inputs for mobile compatibility
- **D-06:** Each input has a small label above it (e.g., "Fecha" and "Hora") in `text-[11px]` muted gray (`#6B7280`)

### Validation Behavior
- **D-07:** Both fields are required — saving without either field filled is blocked
- **D-08:** When fields are empty/missing, inline red error text appears below the inputs, matching existing validation error style (`color: #EF4444, text-[10px]`)
- **D-09:** The "Guardar resultado" button remains disabled (same as when score is incomplete) until both end-time fields have values
- **D-10:** The `canSave` condition in ScoreInputModal is extended to include both end-time fields being filled

### Auto-fill Behavior
- **D-11:** Date field auto-fills with today's date (ISO format YYYY-MM-DD) when the modal opens
- **D-12:** Time field auto-fills with the current time (HH:MM format) when the modal opens
- **D-13:** Both fields are editable — organizer can change them if not recording at the exact moment

### Claude's Discretion
- Exact pixel spacing between the end-time section and surrounding elements
- Whether to add a subtle background/border around the end-time section to visually group it
- Exact error message text when fields are empty

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Score Input Modal (primary modification target)
- `src/components/Scoreboard/ScoreInputModal.jsx` — Current modal implementation, insertion point for new fields
- `src/components/Scoreboard/SetsScoreForm.jsx` — Score form for reference on validation patterns
- `src/components/Scoreboard/PointsScoreForm.jsx` — Score form for reference on validation patterns

### Score Management
- `src/lib/scoreManager.js` — `validateScoreInput` pattern for validation approach reference

### Task Specification
- `tasks/TASK-6.md` — Full feature spec, sections 1-2 define the UI requirements for end-time inputs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ScoreInputModal.jsx` (line 38-289): Full modal component — new fields insert into the scrollable content area between teams display and scoring banner
- Existing validation pattern: `useMemo` with `validateScoreInput` → `canSave` boolean controls button state
- Portal-based modal with body scroll lock and entrance animations

### Established Patterns
- Styling: Inline styles with hex colors, Tailwind utility classes for spacing/layout
- Text sizes: `text-[11px]` for labels, `text-xs` for content, `text-[10px]` for meta
- Colors: `#1F2937` primary text, `#6B7280` secondary, `#9CA3AF` muted, `#EF4444` errors
- Layout: `space-y-4` between sections, `px-5` horizontal padding
- Form state: `useState` for form values, `useMemo` for derived validation

### Integration Points
- `onSave(match, result)` callback — the end-time values need to be passed through this callback
- The `result` object from `calculateMatchResult` doesn't include end-time — need to extend the save flow
- ScoreboardPage.jsx calls ScoreInputModal and handles the `onSave` — will need to receive end-time data

</code_context>

<specifics>
## Specific Ideas

- TASK-6 spec says inputs should be clearly identified with a label like "Cuando termino este partido?" or similar
- Pre-fill with current date/time for convenience — the common case is recording results in real time
- Native date/time inputs are preferred for mobile PWA usability

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-end-time-input-ui*
*Context gathered: 2026-04-02*
