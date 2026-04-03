---
phase: 08-notificaciones
plan: 01
subsystem: notification-ui
tags: [notifications, bell, panel, layout]
dependency_graph:
  requires: [notificationPersistence.js, AuthContext.jsx]
  provides: [NotificationBell.jsx, NotificationPanel.jsx]
  affects: [Layout.jsx]
tech_stack:
  added: []
  patterns: [portal-based-drawer, polling, scroll-lock]
key_files:
  created:
    - src/components/NotificationBell.jsx
    - src/components/NotificationPanel.jsx
  modified:
    - src/components/Layout.jsx
decisions:
  - "30s polling interval for unread count refresh"
  - "Portal-based drawer (createPortal to body) consistent with ScoreInputModal pattern"
  - "Bell placed left of 'Comision de Fronton' in header per D-01"
metrics:
  duration_minutes: 3
  completed: "2026-04-03T03:47:00Z"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 08 Plan 01: Notification Bell and Panel Summary

In-app notification bell with unread badge and slide-out panel using portal-based drawer, 30s polling, and Spanish-localized relative timestamps.

## What Was Built

### NotificationBell (src/components/NotificationBell.jsx)
- Bell icon button with inline SVG (24x24, stroke-based, matching Layout icon style)
- Red unread count badge (absolute positioned, "99+" cap for large counts)
- Polls `getUnreadCount` every 30 seconds via setInterval
- Refreshes count when panel closes
- Toggles NotificationPanel on click

### NotificationPanel (src/components/NotificationPanel.jsx)
- Portal-based slide-out drawer from right (createPortal to document.body)
- Backdrop with semi-transparent overlay (z-9998), drawer at z-9999
- Header with "Notificaciones" title and close button
- "Marcar todo como leido" button when unread notifications exist
- Notification list with:
  - Unread dot indicator (blue, 8px circle)
  - Type labels: "Contratiempo" (orange), "Cambio de horario" (green), "General" (blue)
  - Message text and relative timestamps in Spanish (Hace X min/h/d or DD/MM/YYYY)
  - Unread items have light blue background (#F0F7FF)
  - Tap to mark individual notification as read
- Empty state: "No tienes notificaciones" centered message
- Loading state: BrandLoader spinner
- Body scroll lock on mount/unmount

### Layout Integration (src/components/Layout.jsx)
- NotificationBell rendered in header bar, left of "Comision de Fronton" text
- Visible for all authenticated roles (player, organizer, admin)
- gap-3 spacing between bell, text, and logo

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 0ea8c81 | feat(08-01): create NotificationBell and NotificationPanel components |
| 2 | d5887b4 | feat(08-01): integrate NotificationBell into Layout.jsx header |

## Verification Results

- ESLint: all 3 files pass with no errors
- Production build: succeeds (663.65 kB JS, 34.74 kB CSS)
- No regressions in existing header layout or bottom navigation

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all components are fully wired to the notificationPersistence API.
