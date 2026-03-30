# Roadmap: FRONTÓN HGV — Rediseño Visual

## Overview

Transformación visual completa de la PWA RacketTourneys: migrar de un tema oscuro con verde neón a una identidad mixta gallega — login oscuro con acentos celeste (#6BB3D9) y zona interior clara con fondo gris perla (#F2F3F5). La estrategia es token-first: Phase 1 actualiza tailwind.config.js y propaga automáticamente 344 usos de clase, después cada fase elimina los valores hex hardcodeados que sobreviven a ese cambio. El único componente nuevo es SplashPage.jsx; todo lo demás son reemplazos de color y assets.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Design Tokens & Config Base** - Establecer la paleta completa de tokens en tailwind.config.js e index.css; propaga a 344 usos automáticamente
- [ ] **Phase 2: Splash Screen + Brand Assets** - Crear SplashPage.jsx animada con lobo.png, lógica first-load-only y fix del #b8f533 en App.jsx
- [ ] **Phase 3: Auth & Onboarding (Dark Zone)** - Tema oscuro con acentos celeste en AuthPage y OnboardingPage; escudo a 80px sobre el formulario
- [ ] **Phase 4: Layout Shell (Header + Nav)** - Header claro con logo 28px, nav celeste suave; mayor riesgo del proyecto (7+ inline styles)
- [ ] **Phase 5: Dashboard & Tournaments Pages** - Fondo perla, cards blancas, acentos laterales por estado, badges semánticos
- [ ] **Phase 6: TournamentsDashboard Components** - Modal, tabs, formularios, barras de progreso y tarjetas de solicitud con paleta nueva
- [ ] **Phase 7: ScoringSystem + Admin + PWA Assets** - Componentes finales, íconos PWA reemplazados con lobo.png, sincronización de theme_color

## Phase Details

### Phase 1: Design Tokens & Config Base
**Goal**: La paleta completa de diseño existe como tokens de Tailwind; todos los componentes que usan clases de utilidad reflejan la identidad celeste/perla automáticamente al compilar
**Depends on**: Nothing (first phase)
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06
**Success Criteria** (what must be TRUE):
  1. `npm run build` completa sin errores y el CSS generado contiene clases `galician-*`, `pearl-*` y los nuevos valores de `neon-300`
  2. Los tokens `neon-900`, `neon-700`, `neon-800` siguen existiendo en el config como alias a valores celeste (no eliminados)
  3. `tailwind.config.js` contiene los nuevos valores hex para toda la paleta celeste, azul marino, dorado y los tokens pearl-* para la zona interior
  4. `index.css` no contiene hex hardcodeados de verde neón (#b8f533, #080A0F); `.glass` usa tinte celeste
  5. `index.html` tiene `<meta name="theme-color" content="#F2F3F5">` y `vite.config.js` tiene `theme_color: "#F2F3F5"` con `name: "Frontón HGV"`
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core token migration (tailwind.config.js + index.css)
- [ ] 01-02-PLAN.md — PWA metadata update (index.html + vite.config.js)
**UAT Pre-Phase Checklist**:
  - [ ] Ejecutar `grep -rn "#b8f533\|#080A0F\|neon-green" src/` para inventariar hardcoded antes de empezar
  - [ ] Confirmar que neon-900/700/800 están presentes en tailwind.config.js actual
**UAT Post-Phase Checklist**:
  - [ ] `npm run build` pasa sin errores
  - [ ] CSS generado en `dist/` incluye reglas con los nuevos hex celeste
  - [ ] `neon-900`, `neon-700`, `neon-800` siguen en el config (verificar no eliminados)
  - [ ] `index.html`: meta theme-color = `#F2F3F5`
  - [ ] `vite.config.js`: `theme_color: "#F2F3F5"`, `name: "Frontón HGV"`, `short_name: "Frontón"`

### Phase 2: Splash Screen + Brand Assets
**Goal**: La primera pantalla que ve un usuario es el escudo institucional animado con el nombre y la frase de la comisión; solo aparece una vez por sesión y entrega el control a `/auth`
**Depends on**: Phase 1
**Requirements**: SPLASH-01, SPLASH-02, SPLASH-03, SPLASH-04, SPLASH-05, SPLASH-06, SPLASH-07
**Success Criteria** (what must be TRUE):
  1. Al abrir la app en una pestaña nueva, aparece la pantalla splash con fondo #1E2024 y el escudo centrado con animación de zoom-in + fade-in
  2. El texto "FRONTÓN HGV" y "Por nuestro frontón y raíces" aparecen después del escudo con sus delays correspondientes
  3. Tras ~3 segundos, la splash ejecuta zoom-out + fade-out y redirige automáticamente a `/auth`
  4. Si el usuario refresca la página dentro de la misma sesión del navegador, la splash NO vuelve a aparecer (sessionStorage flag)
  5. `App.jsx` no contiene el color hex #b8f533 (verde neón residual eliminado del AppLoader SVG)
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core token migration (tailwind.config.js + index.css)
- [ ] 01-02-PLAN.md — PWA metadata update (index.html + vite.config.js)
**UI hint**: yes
**UAT Pre-Phase Checklist**:
  - [ ] `lobo.png` disponible para copiar a `src/assets/`
  - [ ] Confirmar que Phase 1 pasó build gate antes de iniciar
**UAT Post-Phase Checklist**:
  - [ ] Abrir app en pestaña nueva (incognito): splash aparece con animación
  - [ ] Refrescar dentro de la misma pestaña: splash NO aparece
  - [ ] Abrir nueva pestaña incognito de nuevo: splash aparece de nuevo
  - [ ] Splash redirige a `/auth` automáticamente (no requiere acción del usuario)
  - [ ] `grep -n "#b8f533" src/App.jsx` devuelve 0 resultados

### Phase 3: Auth & Onboarding (Dark Zone)
**Goal**: Las pantallas de login, registro y onboarding tienen tema completamente oscuro con acentos celeste; el escudo de la comisión aparece centrado sobre el formulario
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, ONBRD-01, ONBRD-02, ONBRD-03
**Success Criteria** (what must be TRUE):
  1. AuthPage muestra fondo #1E2024, el escudo `lobo.png` a ~80px centrado arriba del formulario, y el texto "Comisión de Frontón" en #E5E7EB debajo del escudo
  2. Los inputs tienen fondo #2A2D33, borde #3A3D44 y focus ring celeste (#6BB3D9); los placeholders son #6B7280
  3. El botón principal tiene fondo #6BB3D9 con texto blanco; los links son celeste; no hay nada de color verde neón visible
  4. OnboardingPage tiene el mismo fondo oscuro; las opciones de rol inactivas usan #2A2D33/#3A3D44 y la activa usa borde #6BB3D9 con sombra celeste
  5. El flujo completo funciona: login, registro, selección de rol, envío, estado pendiente — sin regresiones funcionales
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core token migration (tailwind.config.js + index.css)
- [ ] 01-02-PLAN.md — PWA metadata update (index.html + vite.config.js)
**UI hint**: yes
**UAT Pre-Phase Checklist**:
  - [ ] Ejecutar `grep -n "style=" src/pages/AuthPage.jsx src/pages/OnboardingPage.jsx` para inventariar inline styles
  - [ ] Ejecutar `grep -rn "#[0-9A-Fa-f]\{3,6\}" src/pages/AuthPage.jsx src/pages/OnboardingPage.jsx`
**UAT Post-Phase Checklist**:
  - [ ] Login visual: fondo oscuro, escudo visible, texto "Comisión de Frontón" presente
  - [ ] Input focus: borde celeste visible al hacer clic en campo de email
  - [ ] Botón "Iniciar sesión": fondo #6BB3D9, texto blanco
  - [ ] Ningún elemento verde (#b8f533) visible en AuthPage ni OnboardingPage
  - [ ] Flujo de onboarding completo funciona (rol player y organizador)
  - [ ] `npm run build` pasa sin errores

### Phase 4: Layout Shell (Header + Nav)
**Goal**: El shell de la aplicación autenticada tiene header claro con el escudo institucional y nav celeste suave; todos los roles ven su variante correcta del nav
**Depends on**: Phase 3
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04
**Success Criteria** (what must be TRUE):
  1. El header muestra fondo #F2F3F5 con borde inferior #E0E2E6, el texto "Comisión de Frontón" en gris, y el escudo a 28px junto al avatar
  2. La barra de navegación inferior tiene fondo #E8F4FA con borde superior #D0E5F0; íconos inactivos grises (#9CA3AF)
  3. El ícono activo en el nav es #1F2937 con label en #1F2937 font-weight 500 (sin rastro de dorado #F5D547)
  4. Los tres roles (player, organizer, admin) renderizan su conjunto de tabs correctamente en el nav
  5. El wrapper de página interior usa fondo claro (pearl/light-zone), no el fondo oscuro #080909 anterior
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core token migration (tailwind.config.js + index.css)
- [ ] 01-02-PLAN.md — PWA metadata update (index.html + vite.config.js)
**UI hint**: yes
**UAT Pre-Phase Checklist**:
  - [ ] Ejecutar `grep -n "style=" src/components/Layout.jsx` y listar todos los props inline (mínimo 7 esperados)
  - [ ] Ejecutar `grep -n "#F5D547\|#505878\|rgba" src/components/Layout.jsx`
**UAT Post-Phase Checklist**:
  - [ ] Iniciar sesión como player: header claro, escudo 28px visible, nav #E8F4FA con 4 tabs
  - [ ] Iniciar sesión como organizer: nav muestra tabs adicionales de organizador
  - [ ] Iniciar sesión como admin: nav muestra solo tabs de admin
  - [ ] Clic en cada tab del nav: ícono activo es #1F2937, no dorado
  - [ ] Cero refs a `#F5D547` en Layout.jsx (`grep -n "#F5D547" src/components/Layout.jsx`)
  - [ ] `npm run build` pasa sin errores

### Phase 5: Dashboard & Tournaments Pages
**Goal**: Las páginas principales de contenido muestran el tema claro interior — fondo perla, cards blancas con sombra, acentos celeste por estado y badges semánticos sin verde neón
**Depends on**: Phase 4
**Requirements**: DASH-01, DASH-02, TOUR-01, TOUR-02, TOUR-03, TOUR-04, TOUR-05
**Success Criteria** (what must be TRUE):
  1. DashboardPage tiene fondo #F2F3F5 con cards blancas (#FFFFFF) con borde #E8EAEE y sombra suave; valores/números destacados en celeste #6BB3D9
  2. TournamentsPage muestra cards de torneos con fondo blanco y acento lateral izquierdo: celeste (activo), gris #D1D5DB (borrador), verde #22C55E (finalizado)
  3. Los badges de estado son semánticos: "Activo" #E8F4FA/#3A8BB5, "Borrador" #F3F4F6/#6B7280, "Finalizado" #F0FDF4/#16A34A, "Destacado" #FFF5D6/#92750F (dorado)
  4. El botón "Inscribirse" y los filtros/tabs activos usan #6BB3D9; ningún badge usa verde neón
  5. Las páginas placeholder OrganizerHubPage y ResultsInputPage tienen fondo claro #F2F3F5 (coherencia visual con el shell)
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core token migration (tailwind.config.js + index.css)
- [ ] 01-02-PLAN.md — PWA metadata update (index.html + vite.config.js)
**UI hint**: yes
**UAT Pre-Phase Checklist**:
  - [ ] Verificar que `.glass` utility no se usa en cards de estas páginas (riesgo: glass oscuro sobre fondo claro)
  - [ ] Ejecutar `grep -rn "#[0-9A-Fa-f]\{3,6\}" src/pages/DashboardPage.jsx src/pages/TournamentsPage.jsx`
**UAT Post-Phase Checklist**:
  - [ ] DashboardPage: fondo perla visible, cards blancas con sombra, números en celeste
  - [ ] TournamentsPage: torneo activo tiene borde izquierdo celeste, borrador gris, finalizado verde
  - [ ] Badge "Activo": fondo azul suave, texto celeste oscuro
  - [ ] Badge "Destacado": fondo amarillo suave, texto dorado (no verde)
  - [ ] Botón "Inscribirse": fondo #6BB3D9
  - [ ] OrganizerHubPage y ResultsInputPage: fondo claro, sin fondo oscuro residual
  - [ ] `npm run build` pasa sin errores

### Phase 6: TournamentsDashboard Components
**Goal**: Todos los componentes de gestión de torneos — modal, tabs, formularios, barras de progreso y tarjetas de solicitud — usan la paleta clara interior con acentos celeste
**Depends on**: Phase 5
**Requirements**: TDASH-01, TDASH-02, TDASH-03, TDASH-04, TDASH-05, TDASH-06, TDASH-07, TDASH-08
**Success Criteria** (what must be TRUE):
  1. El modal TournamentDetailModal tiene overlay semitransparente, panel blanco, y el tab activo usa underline o fondo celeste (#6BB3D9)
  2. Los formularios de edición (EditTournamentForm, InfoTab) tienen inputs con fondo #FFFFFF, borde #E0E2E6 y focus ring celeste; ningún input tiene fondo oscuro
  3. Las barras de progreso de CategoryProgressCard tienen relleno celeste (#6BB3D9) sobre fondo gris #E5E7EB, con el porcentaje en texto celeste
  4. Las tarjetas de solicitud (RegistrationRequestCard) muestran badges: pendiente=dorado, aprobado=verde, rechazado=rojo
  5. Los widgets de torneos históricos (HistoryTournaments) tienen opacidad reducida y acento lateral gris #D1D5DB (no celeste)
  6. Los botones siguen jerarquía: primario celeste, secundario #F3F4F6/#4B5563, peligroso #EF4444; "Iniciar torneo" tiene sombra celeste
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core token migration (tailwind.config.js + index.css)
- [ ] 01-02-PLAN.md — PWA metadata update (index.html + vite.config.js)
**UI hint**: yes
**UAT Pre-Phase Checklist**:
  - [ ] Ejecutar grep de hex en todos los 12 archivos del directorio TournamentsDashboard (incluyendo Tabs/)
  - [ ] Verificar orden de migración: tab content primero → TournamentDetailModal → TournamentWidget → ActiveTournaments/HistoryTournaments
**UAT Post-Phase Checklist**:
  - [ ] Abrir modal de un torneo activo: tabs celeste activo, panel blanco
  - [ ] Editar campo en InfoTab: input focus ring celeste visible
  - [ ] Ver tab Progreso: barra de progreso con relleno celeste, porcentaje en celeste
  - [ ] Ver tab Solicitudes: cards con badge dorado (pendiente), verde (aprobado), rojo (rechazado)
  - [ ] Ver widget de torneo histórico: opacidad reducida, borde lateral gris (no celeste)
  - [ ] Botón "Iniciar torneo": fondo celeste con sombra celeste visible
  - [ ] Aprobar/rechazar solicitud: funciona correctamente (sin regresión funcional)
  - [ ] `npm run build` pasa sin errores

### Phase 7: ScoringSystem + Admin + PWA Assets
**Goal**: Los componentes finales de configuración de torneos y administración adoptan la paleta nueva; todos los íconos PWA son reemplazados con el escudo institucional y theme_color está sincronizado en los tres archivos que lo definen
**Depends on**: Phase 6
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04, ADMIN-01, CREATE-01, CREATE-02, PWA-01, PWA-02, PWA-03, PWA-04
**Success Criteria** (what must be TRUE):
  1. El flujo completo de creación de torneo con configuración de scoring funciona visualmente: selector de sistema activo con borde celeste y fondo #E8F4FA; inactivo con borde #E0E2E6; switch activo con track celeste y thumb blanco
  2. Los formularios de scoring (NormalSetsForm, PointsScoringForm, SetsScoringForm, SumaSetsForm) tienen inputs blancos con focus celeste; ScoringPreview muestra valores en celeste
  3. AdminPanelPage tiene fondo #F2F3F5, tabla blanca con borde #E0E2E6, badges semánticos de estado; el ícono de aprobar es celeste (no dorado #F5D547)
  4. Al instalar la PWA en Android/Chrome, el ícono que aparece es el escudo lobo.png (no el ícono verde anterior)
  5. Un audit de Lighthouse PWA pasa el check de maskable icon (dos entradas separadas: `purpose: 'any'` y `purpose: 'maskable'`)
  6. `theme_color` tiene el valor #F2F3F5 en `vite.config.js`, `index.html` y `index.css` — los tres en el mismo commit; ningún valor verde neón (#b8f533 o variantes) aparece en toda la app
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core token migration (tailwind.config.js + index.css)
- [ ] 01-02-PLAN.md — PWA metadata update (index.html + vite.config.js)
**UI hint**: yes
**UAT Pre-Phase Checklist**:
  - [ ] Verificar visualmente que el estado ACTIVE de ScoringSystemSelector funciona (fondo neon-900/40 visible) — si está roto, arreglar alias en Phase 1 antes de continuar
  - [ ] Verificar que `neon-900`, `neon-700`, `neon-800` están en tailwind.config.js como alias a valores celeste
  - [ ] Ejecutar `grep -rn "#F5D547\|#b8f533\|neon-green" src/pages/AdminPanelPage.jsx src/pages/CreateTournamentPage.jsx`
**UAT Post-Phase Checklist**:
  - [ ] CreateTournamentPage: seleccionar sistema "Sets Normal" — opción activa tiene borde celeste y fondo celeste suave
  - [ ] CreateTournamentPage: toggle ClosingRule — track inactivo gris, activo celeste, thumb blanco
  - [ ] ScoringPreview: números/valores en celeste (no verde neón)
  - [ ] AdminPanelPage: botón/ícono de aprobar organizador es celeste (no dorado)
  - [ ] `grep -rn "#b8f533\|#F5D547\|#080A0F" src/` devuelve 0 resultados
  - [ ] PWA: `vite.config.js` tiene dos entradas de ícono (`purpose: 'any'` y `purpose: 'maskable'` separadas)
  - [ ] PWA: `theme_color: "#F2F3F5"` en vite.config.js, index.html y index.css
  - [ ] `npm run build` pasa sin errores
  - [ ] Reiniciar `npm run dev` después de cambios en vite.config.js (HMR no recarga el config)

## Progress

**Execution Order:**
Phases execute in strict dependency order: 1 → 2 → 3 → 4 → 5 → 6 → 7

**Critical path items:** Phase 1 (tokens — bloquea todo lo demás) y Phase 4 (Layout — gateway de la zona interior)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design Tokens & Config Base | 0/? | Not started | - |
| 2. Splash Screen + Brand Assets | 0/? | Not started | - |
| 3. Auth & Onboarding (Dark Zone) | 0/? | Not started | - |
| 4. Layout Shell (Header + Nav) | 0/? | Not started | - |
| 5. Dashboard & Tournaments Pages | 0/? | Not started | - |
| 6. TournamentsDashboard Components | 0/? | Not started | - |
| 7. ScoringSystem + Admin + PWA Assets | 0/? | Not started | - |

---

## Coverage

**v1 Requirements: 48 total — 48 mapped — 0 orphans**

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKEN-01 | Phase 1 | Pending |
| TOKEN-02 | Phase 1 | Pending |
| TOKEN-03 | Phase 1 | Pending |
| TOKEN-04 | Phase 1 | Pending |
| TOKEN-05 | Phase 1 | Pending |
| TOKEN-06 | Phase 1 | Pending |
| SPLASH-01 | Phase 2 | Pending |
| SPLASH-02 | Phase 2 | Pending |
| SPLASH-03 | Phase 2 | Pending |
| SPLASH-04 | Phase 2 | Pending |
| SPLASH-05 | Phase 2 | Pending |
| SPLASH-06 | Phase 2 | Pending |
| SPLASH-07 | Phase 2 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| AUTH-05 | Phase 3 | Pending |
| AUTH-06 | Phase 3 | Pending |
| ONBRD-01 | Phase 3 | Pending |
| ONBRD-02 | Phase 3 | Pending |
| ONBRD-03 | Phase 3 | Pending |
| LAYOUT-01 | Phase 4 | Pending |
| LAYOUT-02 | Phase 4 | Pending |
| LAYOUT-03 | Phase 4 | Pending |
| LAYOUT-04 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| TOUR-01 | Phase 5 | Pending |
| TOUR-02 | Phase 5 | Pending |
| TOUR-03 | Phase 5 | Pending |
| TOUR-04 | Phase 5 | Pending |
| TOUR-05 | Phase 5 | Pending |
| TDASH-01 | Phase 6 | Pending |
| TDASH-02 | Phase 6 | Pending |
| TDASH-03 | Phase 6 | Pending |
| TDASH-04 | Phase 6 | Pending |
| TDASH-05 | Phase 6 | Pending |
| TDASH-06 | Phase 6 | Pending |
| TDASH-07 | Phase 6 | Pending |
| TDASH-08 | Phase 6 | Pending |
| SCORE-01 | Phase 7 | Pending |
| SCORE-02 | Phase 7 | Pending |
| SCORE-03 | Phase 7 | Pending |
| SCORE-04 | Phase 7 | Pending |
| ADMIN-01 | Phase 7 | Pending |
| CREATE-01 | Phase 7 | Pending |
| CREATE-02 | Phase 7 | Pending |
| PWA-01 | Phase 7 | Pending |
| PWA-02 | Phase 7 | Pending |
| PWA-03 | Phase 7 | Pending |
| PWA-04 | Phase 7 | Pending |

---

## Key Constraints & Pitfalls

**Must not forget across all phases:**

1. **neon-900/700/800 alias survival** — Estos tokens deben existir en tailwind.config.js en TODAS las fases como alias a valores celeste. Si se eliminan, el estado ACTIVE de ScoringSystemSelector y ClosingRuleSwitch desaparece silenciosamente sin error de build.

2. **35 hex hardcodeados sobreviven al token swap** — El cambio de tailwind.config.js NO actualiza `style={{}}` props ni hex literales en JSX. Ejecutar `grep -rn "#[0-9A-Fa-f]{3,6}" src/` antes de cada fase. Los más críticos: `#b8f533` en App.jsx, `#F5D547` en Layout.jsx y AdminPanelPage.jsx.

3. **CSS variables no se generan desde JS config en Tailwind v4** — Tokens en tailwind.config.js crean clases de utilidad pero NO variables CSS `--color-*`. Si algún `style={{}}` o SVG necesita referenciar un nuevo token, añadirlo también en un bloque `@theme` en index.css.

4. **theme_color en tres ubicaciones** — vite.config.js, index.html y index.css deben actualizarse en el mismo commit (Phase 7). Inconsistencia actual en codebase original.

5. **Manifest icon purpose separado** — `"any maskable"` combinado falla Lighthouse 10+. Usar dos entradas separadas: `{ purpose: 'any' }` y `{ purpose: 'maskable' }`.

6. **HMR no recarga vite.config.js** — Reiniciar `npm run dev` después de cualquier cambio en ese archivo.

---

*Roadmap created: 2026-03-29*
*Milestone: FRONTÓN HGV — Rediseño Visual*
*Coverage: 48/48 v1 requirements mapped*
