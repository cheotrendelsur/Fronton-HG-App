# Requirements: FRONTÓN HGV — Rediseño Visual

**Defined:** 2026-03-29
**Core Value:** La app debe sentirse identitaria y gallega desde el primer segundo: el escudo, los colores y las frases de la comisión deben evocar orgullo y pertenencia.

## v1 Requirements

### Design Tokens

- [ ] **TOKEN-01**: `tailwind.config.js` actualizado con toda la paleta nueva (celeste, dorado, azul-marino, dark-*, light-*, semánticos)
- [ ] **TOKEN-02**: Sombras personalizadas actualizadas de verde-neón a celeste (`rgba(107,179,217,...)`)
- [ ] **TOKEN-03**: Animación `pulse-neon` cambiada a color celeste
- [ ] **TOKEN-04**: `index.css` sin colores hardcodeados verde neón; utilidad `.glass` con tinte celeste
- [ ] **TOKEN-05**: `index.html` con `meta theme-color` = `#F2F3F5`
- [ ] **TOKEN-06**: `vite.config.js` PWA manifest con `theme_color: #F2F3F5`, `name: "Frontón HGV"`, `short_name: "Frontón"`

### Splash Screen

- [ ] **SPLASH-01**: Componente `SplashPage.jsx` creado con fondo `#1E2024`
- [ ] **SPLASH-02**: Escudo `lobo.png` centrado en 150-180px con animación zoom-in (scale 0.7→1.0) + fade-in
- [ ] **SPLASH-03**: Texto "FRONTÓN HGV" aparece con delay 0.3s tras el escudo
- [ ] **SPLASH-04**: Frase "Por nuestro frontón y raíces" aparece con delay 0.5s, 13px italic
- [ ] **SPLASH-05**: Salida con zoom-out + fade-out (~0.5s); redirige a `/auth` tras 2.5-3s totales
- [ ] **SPLASH-06**: Splash se ejecuta SOLO en primera carga (sessionStorage o estado de app)
- [ ] **SPLASH-07**: `App.jsx` tiene ruta para SplashPage como pantalla inicial

### Auth & Onboarding

- [ ] **AUTH-01**: `AuthPage.jsx` con fondo `#1E2024`, sin rastro de verde neón
- [ ] **AUTH-02**: Escudo `lobo.png` (~80px) centrado arriba del formulario de login
- [ ] **AUTH-03**: Texto "Comisión de Frontón" (`#E5E7EB`, 16px, font-weight 500) debajo del escudo
- [ ] **AUTH-04**: Inputs con fondo `#2A2D33`, borde `#3A3D44`, focus `#6BB3D9`, placeholder `#6B7280`
- [ ] **AUTH-05**: Botón principal fondo `#6BB3D9`, texto blanco, hover `#5A9BBF`
- [ ] **AUTH-06**: Links en `#6BB3D9`
- [ ] **ONBRD-01**: `OnboardingPage.jsx` con fondo `#1E2024`, acentos celeste
- [ ] **ONBRD-02**: Botones de rol inactivo con fondo `#2A2D33`, borde `#3A3D44`; activo con borde `#6BB3D9` y sombra celeste
- [ ] **ONBRD-03**: Botón confirmar fondo `#6BB3D9`, texto blanco

### Layout Shell

- [ ] **LAYOUT-01**: `Layout.jsx` header con fondo `#F2F3F5` y borde inferior `#E0E2E6`
- [ ] **LAYOUT-02**: Header derecha muestra "Comisión de Frontón" (`#6B7280`, 11-12px) + escudo 28px + avatar
- [ ] **LAYOUT-03**: Nav inferior fondo `#E8F4FA`, borde superior `#D0E5F0`
- [ ] **LAYOUT-04**: Íconos nav inactivos `#9CA3AF`; activo `#1F2937` con label `#1F2937` font-weight 500

### Dashboard & Torneos

- [ ] **DASH-01**: `DashboardPage.jsx` fondo `#F2F3F5`, cards `#FFFFFF` con borde `#E8EAEE` y sombra suave
- [ ] **DASH-02**: Valores/números destacados en `#6BB3D9`; ningún badge verde neón
- [ ] **TOUR-01**: `TournamentsPage.jsx` cards con fondo `#FFFFFF`, borde `#E8EAEE`, sombra
- [ ] **TOUR-02**: Acento lateral izquierdo: `#6BB3D9` activo, `#D1D5DB` borrador, `#22C55E` finalizado
- [ ] **TOUR-03**: Badge "Activo" fondo `#E8F4FA` texto `#3A8BB5`; "Borrador" `#F3F4F6`/`#6B7280`; "Finalizado" `#F0FDF4`/`#16A34A`
- [ ] **TOUR-04**: Badge "★ Destacado" fondo `#FFF5D6`, texto `#92750F` (dorado)
- [ ] **TOUR-05**: Botón "Inscribirse" fondo `#6BB3D9`; filtros/tabs activos con underline celeste

### TournamentsDashboard Components

- [ ] **TDASH-01**: `TournamentDetailModal.jsx` overlay `rgba(0,0,0,0.5)`, panel `#FFFFFF`, tabs celeste activo
- [ ] **TDASH-02**: `EditTournamentForm.jsx` y `InfoTab.jsx` inputs fondo `#FFFFFF`, borde `#E0E2E6`, focus `#6BB3D9`
- [ ] **TDASH-03**: `TournamentWidget.jsx` card `#FFFFFF`/`#E8EAEE`, acento lateral `#6BB3D9` (activo) / `#D1D5DB` (borrador)
- [ ] **TDASH-04**: `CategoryProgressCard.jsx` barra fondo `#E5E7EB`, relleno `#6BB3D9`, texto % `#6BB3D9`
- [ ] **TDASH-05**: `RegistrationRequestCard.jsx` badge pendiente dorado, aprobado verde, rechazado rojo
- [ ] **TDASH-06**: `HistoryTournaments.jsx` cards con opacidad 0.7, sin acento lateral celeste (usar `#D1D5DB`)
- [ ] **TDASH-07**: Botones: primario `#6BB3D9`, secundario `#F3F4F6`/`#4B5563`, peligroso `#EF4444`
- [ ] **TDASH-08**: Botón "Iniciar torneo" fondo `#6BB3D9` con sombra celeste

### ScoringSystem & Admin & Create

- [ ] **SCORE-01**: `ClosingRuleSwitch.jsx` track inactivo `#E5E7EB`, activo `#6BB3D9`, thumb blanco
- [ ] **SCORE-02**: Formularios ScoringSystem inputs fondo `#FFFFFF`, borde `#E0E2E6`, focus `#6BB3D9`
- [ ] **SCORE-03**: `ScoringPreview.jsx` card `#FFFFFF`, valores en `#6BB3D9`
- [ ] **SCORE-04**: `ScoringSystemSelector.jsx` opción inactiva borde `#E0E2E6`; activa borde `#6BB3D9` fondo `#E8F4FA`
- [ ] **ADMIN-01**: `AdminPanelPage.jsx` fondo `#F2F3F5`, tabla `#FFFFFF`/`#E0E2E6`, badges semánticos
- [ ] **CREATE-01**: `CreateTournamentPage.jsx` fondo `#F2F3F5`, formulario `#FFFFFF`, stepper celeste
- [ ] **CREATE-02**: Inputs y botones de CreateTournamentPage con paleta nueva

### PWA & Assets

- [ ] **PWA-01**: `lobo.png` copiado a `src/assets/`
- [ ] **PWA-02**: Íconos en `public/icons/` reemplazados con versiones del escudo (72px–512px)
- [ ] **PWA-03**: `favicon.svg`, `favicon.ico.png`, `apple-touch-icon.png` reemplazados con el escudo
- [ ] **PWA-04**: Manifest PWA con `name: "Frontón HGV"`, `short_name: "Frontón"`, `theme_color: "#F2F3F5"`

## v2 Requirements

### Páginas Placeholder

- **PAGES-01**: `OrganizerHubPage.jsx` y `ResultsInputPage.jsx` actualizados con paleta nueva (actualmente placeholders, bajo riesgo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cambios estructurales en componentes | Solo colores — preservar layout, spacing y lógica |
| Cambios en queries/lógica de negocio | No tocar Supabase ni flujos de datos |
| Cambio de fuentes (DM Sans / DM Mono) | Identidad tipográfica mantenida |
| Cambio de breakpoints responsive | Layout idéntico en todos los tamaños |
| Nuevos componentes (excepto SplashPage) | Reutilizar componentes existentes |
| Dorado en botones o CTAs | Dorado es EXCLUSIVO para badges y logros |
| Integración de partidos/clasificaciones | Pendiente para milestone posterior |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKEN-01 — TOKEN-06 | Phase 1 | Pending |
| SPLASH-01 — SPLASH-07 | Phase 2 | Pending |
| AUTH-01 — AUTH-06, ONBRD-01 — ONBRD-03 | Phase 3 | Pending |
| LAYOUT-01 — LAYOUT-04 | Phase 4 | Pending |
| DASH-01 — DASH-02, TOUR-01 — TOUR-05 | Phase 5 | Pending |
| TDASH-01 — TDASH-08 | Phase 6 | Pending |
| SCORE-01 — SCORE-04, ADMIN-01, CREATE-01 — CREATE-02, PWA-01 — PWA-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
