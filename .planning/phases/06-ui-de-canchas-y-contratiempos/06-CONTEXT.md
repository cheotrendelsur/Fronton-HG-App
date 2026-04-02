# Phase 6: UI de Canchas y Contratiempos - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a "Canchas" tab to ActiveTournamentPage with court status cards (swipe per court), setback declaration form modal, paused state display with live timer, setback history accordion, and paused-court confirmation warning when recording results on a paused court.

</domain>

<decisions>
## Implementation Decisions

### Tab Integration
- **D-01:** Add "Canchas" as 3rd tab in ActiveTournamentPage alongside "Inscritos" and "Clasificación", using the same tab toggle pattern (rounded-xl, p-1, E8EAEE background)
- **D-02:** New `CanchasView` component in `src/components/TournamentActive/` following existing view pattern (InscritosView, ClasificacionView)

### Court Swiper
- **D-03:** Reuse the scroll-snap + dots swipe pattern from GroupSwiper/DaySwiper. One "page" per court. Dots on top.
- **D-04:** Each court card is a `CourtCard` component showing court name, status badge, action button, upcoming matches list, and collapsible setback history

### Court Card States
- **D-05:** Normal state: green badge "Operativa", orange/amber "Declarar contratiempo" button, list of next 3 pending matches, collapsible setback history at bottom
- **D-06:** Paused state: red badge "Pausada — [tipo]", "Pausada desde: HH:MM" + live timer (mm:ss updated every second via setInterval), green "Reanudar cancha" button, matches show "Retrasado" badge with original time in grey text, "Jugadores notificados: N" count
- **D-07:** Declare button disabled when court already paused (text: "Cancha ya pausada") or no pending matches (text: "Sin partidos pendientes")

### Setback Form Modal
- **D-08:** Reuse createPortal pattern from ScoreInputModal (portal on body, centered, z-9999, body scroll blocked)
- **D-09:** Setback type: native `<select>` dropdown with options: Lluvia, Mantenimiento, Lesión de jugador, Falla eléctrica, Problema de equipamiento, Otro. If "Otro" selected, show text input for custom type.
- **D-10:** Description: textarea, required, min 10 characters
- **D-11:** Warning text below form: "Al activar, el cronograma de esta cancha se pausará y los jugadores afectados serán notificados."
- **D-12:** "Activar contratiempo" button disabled until type selected AND description >= 10 chars
- **D-13:** On submit: call `createSetback()` from setbackPersistence.js, then refetch court data

### Match List in Court View
- **D-14:** Show up to 3 next pending matches per court (status='scheduled' or 'pending'), ordered by scheduled_date + scheduled_time
- **D-15:** Each match mini-card shows: time, category name, phase (Grupo X / elimination round), team names
- **D-16:** When paused: matches show "Retrasado" badge (amber/orange), original time in grey/muted text
- **D-17:** Matches without team_ids show "Por definir vs Por definir"

### Setback History
- **D-18:** Collapsible accordion at bottom of each court card, collapsed by default
- **D-19:** Header shows count: "Historial de contratiempos: (N)"
- **D-20:** Each history entry shows: type, description, started_at formatted, ended_at formatted (or "En curso"), duration calculated

### Paused-Court Warning (SEGR-01)
- **D-21:** When organizer taps "Registrar" on a match from a paused court in ScoreboardPage, show a confirm dialog before opening ScoreInputModal
- **D-22:** Warning text: "Esta cancha está pausada por [tipo]. ¿Deseas registrar el resultado de todos modos?"
- **D-23:** Two buttons: "Cancelar" (close) and "Registrar de todos modos" (proceed to ScoreInputModal)

### Data Fetching
- **D-24:** Fetch courts with active setbacks in ActiveTournamentPage loadData(). Query `courts` table + join/separate query to `court_setbacks` for active setbacks
- **D-25:** Pass courts and setbacks data to CanchasView as props

### Claude's Discretion
- Exact Tailwind color values for badges, buttons, and states (follow existing design system tokens: neon-300 for active, ink-secondary for muted, etc.)
- Animation/transition details for tab switching and accordion expand/collapse
- Exact spacing and typography sizes (follow existing component patterns)
- Timer implementation details (setInterval cleanup, format function)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI Wireframes & Spec
- `tasks/TASK-7.md` — Full wireframes for court normal state, paused state, and setback declaration form. Business logic for pause/resume flow.

### Existing Swipe Pattern
- `src/components/TournamentActive/GroupSwiper.jsx` — Scroll-snap + dots swipe pattern to replicate for court swiper
- `src/components/Scoreboard/DaySwiper.jsx` — Alternative swipe pattern (same concept, different context)

### Tab Integration Point
- `src/pages/ActiveTournamentPage.jsx` — Page where "Canchas" tab must be added (currently has Inscritos + Clasificación)

### Modal Pattern
- `src/components/Scoreboard/ScoreInputModal.jsx` — createPortal modal pattern to replicate for setback form

### Data Layer (Phase 5)
- `src/lib/setbackPersistence.js` — CRUD helpers: createSetback, resolveSetback, getActiveSetback, getSetbackHistory
- `src/lib/notificationPersistence.js` — createNotification, createBulkNotifications (for notifying affected players on setback)

### Existing Components
- `src/components/TournamentActive/MatchCard.jsx` — Match card pattern for reference (may simplify for court view)
- `src/components/Scoreboard/PendingMatchCard.jsx` — Pending match card in scoreboard (paused-court warning triggers here)

### Design System
- `DESIGN-ARCHITECTURE.md` — Color tokens, spacing, typography conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GroupSwiper.jsx`: scroll-snap horizontal swipe with dots — direct pattern for CourtSwiper
- `ScoreInputModal.jsx`: createPortal modal with body scroll lock — pattern for SetbackFormModal
- `MatchCard.jsx`: match display with time/court/status — reference for court match list
- `setbackPersistence.js`: createSetback, resolveSetback, getActiveSetback, getSetbackHistory
- `notificationPersistence.js`: createBulkNotifications for notifying players

### Established Patterns
- Tab toggle in ActiveTournamentPage: rounded-xl pills with E8EAEE background, white active state
- Data loading: useCallback + useEffect pattern with loadData() function
- State management: useState hooks, data passed as props to child views
- Accordion pattern: used in CategoryAccordion, MatchesAccordion, ParticipantsAccordion

### Integration Points
- `ActiveTournamentPage.jsx` line ~160: tab toggle array — add 'canchas' entry
- `ActiveTournamentPage.jsx` loadData(): add courts + setbacks fetch queries
- `ScoreboardPage.jsx` or `PendingMatchCard.jsx`: add paused-court check before opening ScoreInputModal

</code_context>

<specifics>
## Specific Ideas

- TASK-7 wireframes are the primary visual reference — follow them closely
- Live timer on paused court uses setInterval with cleanup on unmount
- "Reanudar cancha" button is in Phase 6 UI only — the actual resume logic (cascade recalculation) is Phase 7. Phase 6 button calls resolveSetback() and refetches data.
- Notification sending on setback declaration is Phase 6 scope (calls createBulkNotifications for affected players)

</specifics>

<deferred>
## Deferred Ideas

- Resume cascade recalculation logic → Phase 7
- Cross-court conflict detection → Phase 7
- Spill-over date extension prompt → Phase 7
- Bell icon and notification panel → Phase 8

</deferred>

---

*Phase: 06-ui-de-canchas-y-contratiempos*
*Context gathered: 2026-04-02*
