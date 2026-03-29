# FRONTÓN HGV — Rediseño Visual

## What This Is

RacketTourneys es una PWA de gestión de torneos de deportes de raqueta para la Comisión de Frontón de la Hermandad Gallega de Venezuela (HGV). Este milestone consiste en una transformación visual completa: migrar de un tema oscuro con verde neón a una identidad visual mixta (login oscuro / interior claro) basada en los colores de la comisión — celeste gallego (#6BB3D9), dorado (#D4A827) y azul marino (#1B3A5C) — junto con el escudo institucional (`lobo.png`) en pantalla de splash, login y header.

## Core Value

La app debe sentirse identitaria y gallega desde el primer segundo: el escudo, los colores y las frases de la comisión deben evocar orgullo y pertenencia en cada miembro que la use.

## Requirements

### Validated

- ✓ Auth, onboarding, roles y admin panel funcional con Supabase — existing
- ✓ Dashboard de torneos con creación y sistema de puntuación configurable — existing
- ✓ Modal de detalle con CRUD de categorías/pistas e historial de ediciones — existing
- ✓ Gestión de solicitudes de inscripción (aprobación/rechazo) — existing
- ✓ Visualización de progreso por categoría y botón de inicio de torneo — existing

### Active

- [ ] Pantalla Splash con animación del escudo y frases identitarias, ejecutada solo en primera carga
- [ ] Login y Onboarding con tema oscuro (#1E2024) y acentos celeste (#6BB3D9)
- [ ] Escudo `lobo.png` visible en Splash (180px), Login (80px) y Header interior (28px)
- [ ] Layout interior (header + nav) con fondo claro (#F2F3F5) y nav celeste suave (#E8F4FA)
- [ ] Todas las páginas interiores con fondo gris perla y cards blancas con sombra suave
- [ ] Cards de torneo con acento lateral izquierdo celeste (activo), gris (borrador), verde (finalizado)
- [ ] Badges semánticos: activo=celeste, borrador=gris, finalizado=verde, destacado=dorado
- [ ] Botones CTA celeste (#6BB3D9) en toda la app; dorado SOLO para badges/logros
- [ ] ScoringSystem, AdminPanel y CreateTournamentPage con paleta nueva
- [ ] Íconos PWA reemplazados con el escudo de la comisión
- [ ] `tailwind.config.js` con paleta completa de tokens de diseño
- [ ] `vite.config.js` y `index.html` actualizados con theme_color y manifest PWA

### Out of Scope

- Cambios en estructura/layout de componentes — solo colores, assets y textos de marca
- Cambios en lógica de negocio — ninguna query, validación o flujo debe modificarse
- Cambios de fuentes — DM Sans y DM Mono se mantienen
- Cambios de breakpoints — responsive idéntico
- Creación de nuevos componentes excepto `SplashPage.jsx`
- Dorado (#D4A827) en botones o CTAs — exclusivo para badges y logros
- Integración real de partidos y clasificaciones — pendiente para otro milestone

## Context

- Proyecto brownfield con 5 fases completadas de funcionalidad core
- Stack: React 19 + Vite 8 + Tailwind CSS 4 + Supabase + React Router 7
- Design system actual: oscuro con verde neón (neon-300: #b8f533)
- El cliente es la Comisión de Frontón HGV — users son miembros de la hermandad
- El asset `lobo.png` debe copiarse a `src/assets/` si no existe
- Tailwind CSS 4 usa configuración distinta a v3 — revisar sintaxis al editar tailwind.config.js
- `.npmrc` contiene `legacy-peer-deps=true` requerido para npm install en Vercel

## Constraints

- **Stack**: React 19 + Tailwind CSS 4 + Vite 8 — no cambiar dependencias
- **Visual**: Solo cambios de color/assets — NO tocar estructura HTML ni lógica JS
- **Build**: Cada fase debe pasar `npm run build` sin errores
- **Assets**: `lobo.png` es el único asset nuevo; íconos PWA se reemplazan con él
- **Color**: #6BB3D9 (celeste) es el único color de acción; #D4A827 (dorado) solo en badges

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tema mixto (oscuro login / claro interior) | Login oscuro es dramático e identitario; interior claro es profesional y legible | — Pending |
| Celeste #6BB3D9 como único CTA | Extraído del escudo de la comisión; coherencia visual con identidad gallega | — Pending |
| Dorado exclusivo para badges/logros | Reservar dorado para reconocimientos mantiene jerarquía visual y peso semántico | — Pending |
| SplashPage.jsx como único componente nuevo | Solo se necesita splash; resto son cambios de color en componentes existentes | — Pending |
| Fondo interior #F2F3F5 (gris perla) | Suave, profesional, no cansa la vista; diferencia clara de la zona oscura | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after initialization*
