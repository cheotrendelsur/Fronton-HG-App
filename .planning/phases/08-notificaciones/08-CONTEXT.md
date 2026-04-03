# Phase 8: Notificaciones - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

In-app notification UI for players: bell icon with unread count badge in the header navigation, notification panel to view all notifications with read/unread state, and mark-as-read functionality. Backend infrastructure (notifications table, CRUD helpers, bulk creation on setback/resume) is already complete from Phases 5 and 7.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User deferred all decisions to Claude. The following areas are open for best-judgment implementation:

- **D-01:** Bell icon placement — Claude decides where in the header to place it (recommended: left of the "Comision de Fronton" text in the existing header bar)
- **D-02:** Notification panel style — Claude decides between slide-out drawer, modal, or dedicated page (recommended: slide-out drawer from the right, matching mobile-first PWA patterns)
- **D-03:** Real-time updates — Claude decides polling vs Supabase Realtime vs manual refresh (recommended: poll unread count on a reasonable interval + refetch on navigation, no new dependencies)
- **D-04:** Notification display — Claude decides grouping, icons per type, time formatting, density (recommended: chronological list, type-based icon/color, relative timestamps in Spanish)
- **D-05:** Mark as read — Individual tap marks single notification read; "Marcar todo como leido" button at top marks all read
- **D-06:** Both player and organizer roles see the bell icon — notifications are per-user regardless of role
- **D-07:** Empty state when no notifications — simple centered message "No tienes notificaciones"

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Notification Backend (Phase 5)
- `src/lib/notificationPersistence.js` — Full CRUD: createNotification, createBulkNotifications, getUserNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead
- `supabase/migrations/create_court_setbacks_notifications.sql` — notifications table schema (id, tournament_id, user_id, message, type, read, created_at)

### Notification Senders (Phase 7)
- `src/lib/cascadeSchedulePersistence.js` — applyCascadeOnResume sends per-player resume notifications with type 'schedule_change'

### UI Patterns
- `src/components/Layout.jsx` — Header bar (line 132-178) and bottom nav (line 186-298). Bell icon goes in the header.
- `src/components/TournamentActive/SetbackFormModal.jsx` — Portal-based modal/drawer pattern reference
- `src/context/AuthContext.jsx` — Auth context provides user profile (profile.id for querying notifications)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `notificationPersistence.js`: Complete CRUD — no new persistence code needed
- `AuthContext`: Provides `profile.id` for user-scoped notification queries
- `Layout.jsx`: Header has space for bell icon next to existing elements
- Inline SVG icon pattern used throughout the app (no icon library)

### Established Patterns
- Portal-based overlays (createPortal to document.body) for modals/drawers
- Body scroll lock when overlays are open
- Spanish UI language for all labels
- Tailwind utility classes + inline styles for color tokens
- PascalCase component naming

### Integration Points
- `Layout.jsx` header: Add bell icon with unread badge
- `Layout.jsx`: Notification panel (drawer/modal) rendered here or as portal
- Bottom nav: No changes needed (bell is in header, not nav)
- `AuthContext`: User ID for notification queries

</code_context>

<specifics>
## Specific Ideas

No specific requirements — user deferred all decisions to Claude's discretion. Open to standard mobile notification patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-notificaciones*
*Context gathered: 2026-04-03*
