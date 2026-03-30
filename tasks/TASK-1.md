# TASK-1.md — Rediseño Visual: Comisión de Frontón HGV

---

## FLUJO DE TRABAJO — DOS AGENTES

### Instrucciones para AGENTE MODIFICADOR (Terminal 1)

1. Lee este archivo completo antes de empezar
2. Usa la habilidad **UI-UX PRO MAX** para todo el trabajo de diseño
3. Busca la primera fase con status `READY`
4. Cambia el status a `IN_PROGRESS`
5. Ejecuta TODO lo que dice esa fase (archivos, cambios, restricciones)
6. Al terminar, ejecuta `npm run build` — si falla, arregla hasta que pase
7. Cambia el status a `WAITING_FOR_TEST`
8. Imprime en terminal un resumen de 3-5 líneas de lo que cambió
9. **PARA.** No sigas a la siguiente fase. Espera a que el tester cambie a `READY`
10. **NO generes reportes ni archivos adicionales**. Solo modifica código y este archivo (el campo status)

### Instrucciones para AGENTE TESTER (Terminal 2)

1. Monitorea este archivo periódicamente buscando fases con status `WAITING_FOR_TEST`
2. Cambia el status a `TESTING`
3. Ejecuta TODAS las validaciones listadas en esa fase
4. Si PASA: cambia el status de esa fase a `DONE` y el de la siguiente fase a `READY`
5. Si FALLA: cambia el status a `FAILED` y escribe 1-2 líneas en el campo `test_notes` explicando qué falló. El modificador leerá esto y corregirá
6. Imprime en terminal un resumen de 3-5 líneas del resultado
7. **NO generes reportes ni archivos adicionales**. Solo valida y modifica este archivo (status y test_notes)

### Flujo de estados

```
READY → IN_PROGRESS → WAITING_FOR_TEST → TESTING → DONE (→ siguiente fase pasa a READY)
                                                   → FAILED (→ modificador corrige → WAITING_FOR_TEST de nuevo)
```

---

## CONTEXTO DEL PROYECTO

**RacketTourneys** es una PWA (React 19 + Vite 8 + Tailwind CSS 4 + Supabase) para la gestión de torneos de frontón de la **Comisión de Frontón de la Hermandad Gallega de Venezuela**. Actualmente tiene un tema oscuro con verde neón. Se requiere un cambio completo de paleta para reflejar la identidad gallega: celeste, dorado y azul marino del escudo institucional.

**Principio fundamental:** NO se cambia la estructura ni el layout. Solo colores, assets de marca y frases identitarias. La estética estructural se mantiene intacta.

---

## PALETA DE COLORES DEFINITIVA

### Zona oscura (Splash + Login + Onboarding)
| Token | Hex | Uso |
|-------|-----|-----|
| dark-bg | `#1E2024` | Fondo splash/login |
| dark-surface | `#2A2D33` | Cards/inputs zona oscura |
| dark-border | `#3A3D44` | Bordes zona oscura |
| dark-text-primary | `#E5E7EB` | Texto principal oscuro |
| dark-text-secondary | `#6B7280` | Texto secundario/placeholder |

### Zona clara (Interior — Dashboard, Torneos, etc.)
| Token | Hex | Uso |
|-------|-----|-----|
| light-bg | `#F2F3F5` | Fondo general (gris perla) |
| light-surface | `#FFFFFF` | Cards, modales, inputs |
| light-border | `#E0E2E6` | Bordes cards |
| light-border-subtle | `#E8EAEE` | Bordes sutiles |
| light-text-primary | `#1F2937` | Texto principal |
| light-text-secondary | `#6B7280` | Texto secundario |
| light-text-muted | `#9CA3AF` | Texto apagado |

### Acentos del escudo
| Token | Hex | Uso |
|-------|-----|-----|
| celeste | `#6BB3D9` | **CTA principal**: botones, links, acento lateral, focus, nav activo, progreso |
| celeste-hover | `#5A9BBF` | Hover botones |
| celeste-light | `#E8F4FA` | Fondo badges activo, fondo nav inferior, seleccionados |
| celeste-text | `#3A8BB5` | Texto sobre celeste-light |
| dorado | `#D4A827` | **SOLO badges**: estrellas, destacado, ganador. NUNCA en botones |
| dorado-light | `#FFF5D6` | Fondo badges dorados |
| dorado-text | `#92750F` | Texto sobre dorado-light |
| azul-marino | `#1B3A5C` | Tinte splash/login, títulos de alto contraste opcional |

### Semánticos
| success | `#22C55E` | success-light | `#F0FDF4` |
| danger | `#EF4444` | danger-light | `#FEF2F2` |
| warning | `#F59E0B` | warning-light | `#FFFBEB` |

---

## RESTRICCIONES GLOBALES (aplican a TODAS las fases)

1. **NO cambiar estructura de componentes** — Solo colores, assets y textos de marca
2. **NO cambiar lógica de negocio** — Ninguna query, validación o flujo se modifica
3. **NO cambiar fuentes** — DM Sans y DM Mono se mantienen
4. **NO cambiar breakpoints ni spacing** — Responsive idéntico
5. **NO crear nuevos componentes** excepto `SplashPage.jsx`
6. **NO usar dorado en botones** — Dorado es EXCLUSIVO para badges/estrellas/logros
7. **Celeste (#6BB3D9) es el ÚNICO color de acción** — Todos los CTAs, links y acciones
8. **Cada fase debe compilar** — `npm run build` sin errores después de cada fase
9. **NO renombrar tokens** — Mantener nombres (`neon-300`, `surface-900`, etc.), cambiar solo valores hex. Los 344 usos de clases en 29 archivos NO se tocan
10. **neon-900/700/800 deben sobrevivir** — Si se eliminan, ScoringSystemSelector y ClosingRuleSwitch se rompen silenciosamente

### Pitfalls críticos a evitar

- **35 hex hardcodeados** sobreviven al cambio de tailwind.config.js. Buscar con `grep -rn "#[0-9A-Fa-f]{3,6}" src/` en cada fase
- **`#b8f533`** (verde neón VIEJO) existe en `App.jsx` en un SVG spinner — eliminar en Fase 2
- **`#F5D547`** (dorado) existe hardcodeado en `Layout.jsx` (7+ inline styles) y `AdminPanelPage.jsx`
- **CSS variables NO se generan desde JS config en Tailwind v4** — Si se necesita `var(--color-X)` en inline styles o SVGs, definir también en `@theme` en `index.css`
- **theme_color está en 3 lugares** que deben sincronizarse: `vite.config.js`, `index.html`, `index.css`
- **HMR no recarga vite.config.js** — Reiniciar `npm run dev` después de tocarlo
- **Manifest icon `"any maskable"` combinado falla Lighthouse** — Usar dos entradas separadas

---

## FASES DE EJECUCIÓN

---

### FASE 1 — Tokens de diseño y configuración base

**status:** `DONE`
**test_notes:** ``

**Archivos a modificar:**
- `tailwind.config.js`
- `src/index.css`
- `index.html`
- `vite.config.js`

**Qué hacer:**

1. En `tailwind.config.js`, cambiar SOLO los valores hex de los tokens existentes:
   - `neon-300` → `#6BB3D9` (era verde/dorado, ahora celeste)
   - `neon-200` → `#A8D8EA` (celeste claro)
   - `neon-400` → `#5A9BBF` (celeste hover)
   - `base-950` → `#1E2024`
   - `base-900` → `#1E2024`
   - `base-800` → `#24282C`
   - `surface-900` → `#2A2D33`
   - `surface-800` → `#32363D`
   - `surface-700` → `#3A3D44`
   - `surface-600` → `#4B5563`
   - `surface-500` → `#6B7280`
   - `border-strong` → `#4B5563`
   - `border-default` → `#3A3D44`
   - `border-subtle` → `#2A2D33`
   - `ink-primary` → `#E5E7EB`
   - `ink-secondary` → `#9CA3AF`
   - `ink-muted` → `#6B7280`
   - `ink-inverse` → `#1F2937`
   - **IMPORTANTE: NO eliminar** `neon-900`, `neon-700`, `neon-800` si existen. Cambiar sus valores a variantes celeste equivalentes

2. Agregar tokens NUEVOS (sin eliminar ninguno existente):
   ```js
   pearl: { 50: '#FFFFFF', 100: '#F2F3F5', 200: '#E8F4FA', 300: '#D0E5F0' },
   celeste: { DEFAULT: '#6BB3D9', hover: '#5A9BBF', light: '#E8F4FA', text: '#3A8BB5' },
   dorado: { DEFAULT: '#D4A827', light: '#FFF5D6', text: '#92750F' },
   ```

3. Actualizar sombras en `tailwind.config.js`:
   - `shadow-neon-sm` → `0 0 12px rgba(107,179,217,0.15)`
   - `shadow-neon-md` → `0 0 24px rgba(107,179,217,0.20)`
   - `shadow-card` → `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`

4. Actualizar keyframe `pulse-neon` — cambiar RGBA de verde/dorado a celeste (`107,179,217`)

5. En `src/index.css`:
   - Cambiar `background-color: #080A0F` (o similar) en `html, body, #root` → `#1E2024`
   - Actualizar `.glass` si tiene RGBA verde → usar `rgba(42,45,51,0.85)` (tinte del dark-surface)
   - NO tocar fuentes ni imports

6. En `index.html`:
   - `<meta name="theme-color" content="#F2F3F5">`

7. En `vite.config.js`:
   - `theme_color: '#F2F3F5'`
   - `background_color: '#1E2024'`
   - `name: 'Frontón HGV'`
   - `short_name: 'Frontón'`
   - `description: 'Gestión de torneos — Comisión de Frontón, Hermandad Gallega de Venezuela'`
   - **Reiniciar `npm run dev` después de este cambio**

**Validaciones del tester:**
- [ ] `npm run build` pasa sin errores
- [ ] `grep -rn "#b8f533\|#080A0F" src/index.css tailwind.config.js` devuelve 0 resultados
- [ ] `neon-900`, `neon-700`, `neon-800` siguen existiendo en `tailwind.config.js`
- [ ] `index.html` tiene theme-color `#F2F3F5`
- [ ] `vite.config.js` tiene name "Frontón HGV", theme_color "#F2F3F5"
- [ ] Los nuevos tokens `pearl`, `celeste`, `dorado` existen en `tailwind.config.js`

---

### FASE 2 — Splash Screen + Assets de marca

**status:** `DONE`
**test_notes:** ``

**Archivos a modificar/crear:**
- Crear `src/pages/SplashPage.jsx`
- Copiar `lobo.png` a `src/assets/lobo.png`
- `src/App.jsx` (agregar splash + eliminar `#b8f533`)

**Qué hacer:**

1. Copiar `lobo.png` a `src/assets/lobo.png` si no existe

2. Crear `src/pages/SplashPage.jsx`:
   - Fondo: `#1E2024` (pantalla completa, fixed, z-50)
   - Centro: `<img>` del escudo `lobo.png` a 150-180px con animación CSS:
     - Zoom-in: scale 0.7→1.0 + opacity 0→1, duración 1.2s, ease-out
   - Texto "FRONTÓN HGV": `#E5E7EB`, 20px, font-weight 600, aparece con delay 0.3s
   - Frase "Por nuestro frontón y raíces": `#6B7280`, 13px, italic, aparece con delay 0.5s
   - Texto inferior opcional: "Hermandad Gallega de Venezuela" en `#4B5563`, 10px
   - Salida: zoom-out (scale 1.0→1.1) + fade-out, duración 0.5s
   - Duración total: ~2.5-3s, luego desaparece
   - Lógica: usar `sessionStorage.getItem('hgv-splash-shown')` — si existe, no mostrar. Al terminar la animación, setear `sessionStorage.setItem('hgv-splash-shown', '1')`
   - Usar solo CSS keyframes (NO Framer Motion ni librerías)
   - Solo animar `transform` y `opacity` (performance)

3. En `src/App.jsx`:
   - Montar el splash como overlay condicional (NO como ruta de React Router)
   - El splash se muestra antes de que las rutas se rendericen, luego desaparece
   - **Buscar y reemplazar `#b8f533`** (verde neón viejo en SVG spinner) por `#6BB3D9`
   - Buscar cualquier otro hex verde hardcodeado y reemplazar

**Validaciones del tester:**
- [ ] Abrir app en pestaña nueva (incognito): splash aparece con escudo animándose
- [ ] Texto "FRONTÓN HGV" y frase aparecen con delay
- [ ] Splash desaparece después de ~3s y se ve la pantalla de login
- [ ] Refrescar en la misma pestaña: splash NO reaparece
- [ ] Cerrar pestaña, abrir nueva: splash aparece de nuevo
- [ ] `grep -n "#b8f533" src/App.jsx` devuelve 0 resultados
- [ ] `npm run build` pasa sin errores

---

### FASE 3 — Login y Onboarding (Zona oscura)

**status:** `DONE`
**test_notes:** ``

**Archivos a modificar:**
- `src/pages/AuthPage.jsx`
- `src/pages/OnboardingPage.jsx`

**Qué hacer:**

1. `AuthPage.jsx`:
   - Fondo raíz: `#1E2024`
   - Agregar escudo `lobo.png` centrado arriba del formulario, ~80px de ancho
   - Debajo del escudo: texto "Comisión de Frontón" en `#E5E7EB`, 16px, font-weight 500
   - Inputs: fondo `#2A2D33`, borde `#3A3D44`, texto `#E5E7EB`, placeholder `#6B7280`, focus border `#6BB3D9`
   - Botón principal: fondo `#6BB3D9`, texto `#FFFFFF`, hover `#5A9BBF`
   - Links: color `#6BB3D9`
   - Reemplazar CUALQUIER hex verde neón o dorado hardcodeado por celeste
   - **Ejecutar primero:** `grep -n "style=\|#[0-9A-Fa-f]" src/pages/AuthPage.jsx` para encontrar inline styles

2. `OnboardingPage.jsx`:
   - Fondo: `#1E2024`
   - Botones de selección de rol:
     - Inactivo: fondo `#2A2D33`, borde `#3A3D44`
     - Activo: borde `#6BB3D9`, sombra `0 0 12px rgba(107,179,217,0.15)`
   - Botón confirmar: fondo `#6BB3D9`, texto blanco
   - Reemplazar cualquier hex verde/dorado hardcodeado
   - **Ejecutar primero:** `grep -n "style=\|#[0-9A-Fa-f]" src/pages/OnboardingPage.jsx`

**Validaciones del tester:**
- [ ] Login muestra fondo oscuro con escudo centrado y texto "Comisión de Frontón"
- [ ] Input focus: borde celeste visible
- [ ] Botón "Iniciar sesión": fondo celeste, texto blanco
- [ ] Cero elementos verdes visibles en AuthPage y OnboardingPage
- [ ] OnboardingPage: opción de rol activa tiene borde celeste
- [ ] Flujo completo funciona: login → onboarding → dashboard (sin regresiones)
- [ ] `npm run build` pasa sin errores

---

### FASE 4 — Layout Shell (Header + Nav)

**status:** `DONE`
**test_notes:** ``

**Archivos a modificar:**
- `src/components/Layout.jsx`

**ATENCIÓN:** Este archivo tiene 7+ inline styles con `#F5D547` hardcodeado. Es la fase de mayor riesgo. Ejecutar `grep -n "style=\|#F5D547\|#505878\|rgba" src/components/Layout.jsx` ANTES de empezar.

**Qué hacer:**

1. **Header superior:**
   - Fondo: `#F2F3F5` (se funde con el fondo del interior)
   - Borde inferior: `1px solid #E0E2E6`
   - Título de página (izquierda): `#1F2937`
   - Derecha (AGREGAR): texto "Comisión de Frontón" en `#6B7280`, 11-12px → escudo `lobo.png` a 28px con border-radius 6px → avatar usuario (mantener como está)
   - Orden: texto → escudo → avatar

2. **Barra de navegación inferior:**
   - Fondo: `#E8F4FA` (celeste suave)
   - Borde superior: `1px solid #D0E5F0`
   - Íconos inactivos: `#9CA3AF`
   - Ícono activo + label: `#1F2937`, font-weight 500 (oscuro sobre fondo celeste, NO celeste sobre celeste)
   - Labels inactivos: `#9CA3AF`

3. **Fondo del área de contenido:** `#F2F3F5`

4. Reemplazar TODOS los `#F5D547` hardcodeados en inline styles por `#1F2937` (para nav activo) o `#6BB3D9` (para acentos)
5. Reemplazar TODOS los fondos oscuros hardcodeados (`#080909`, `#0f1010`, etc.) por `#F2F3F5` para la zona interior

**Validaciones del tester:**
- [ ] Header: fondo claro, escudo 28px visible a la derecha, texto "Comisión de Frontón" visible
- [ ] Nav inferior: fondo celeste suave (#E8F4FA)
- [ ] Ícono activo en nav: color oscuro (#1F2937), NO dorado
- [ ] Login como player: 4 tabs visibles
- [ ] Login como organizer: tabs adicionales visibles
- [ ] Login como admin: tabs de admin visibles
- [ ] `grep -n "#F5D547" src/components/Layout.jsx` devuelve 0 resultados
- [ ] `npm run build` pasa sin errores

---

### FASE 5 — Dashboard y Torneos

**status:** `DONE`
**test_notes:** ``

**Archivos a modificar:**
- `src/pages/DashboardPage.jsx`
- `src/pages/TournamentsPage.jsx`

**Qué hacer:**

1. `DashboardPage.jsx`:
   - Fondo: `#F2F3F5`
   - Cards: fondo `#FFFFFF`, borde `#E8EAEE`, sombra `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`, border-radius mantener actual
   - Números/valores destacados: `#6BB3D9`
   - Agregar saludo "Bienvenido a Frontón HGV" como título de bienvenida en `#1F2937`
   - Badges verde neón → celeste

2. `TournamentsPage.jsx`:
   - Cards de torneo: fondo `#FFFFFF`, borde `#E8EAEE`, sombra suave
   - **Acento lateral izquierdo** (agregar `border-left: 4px solid`):
     - Torneo activo: `#6BB3D9` (celeste)
     - Borrador: `#D1D5DB` (gris)
     - Finalizado: `#22C55E` (verde semántico)
   - Badge "Activo": fondo `#E8F4FA`, texto `#3A8BB5`
   - Badge "Borrador": fondo `#F3F4F6`, texto `#6B7280`
   - Badge "Finalizado": fondo `#F0FDF4`, texto `#16A34A`
   - Badge "★ Destacado": fondo `#FFF5D6`, texto `#92750F` (DORADO — solo aquí)
   - Tags de deporte: fondo `#F3F4F6`, texto `#4B5563`
   - Botón "Inscribirse": fondo `#6BB3D9`, texto blanco
   - Filtros/tabs activos: texto `#6BB3D9` con underline celeste

**Validaciones del tester:**
- [ ] Dashboard: fondo perla, cards blancas con sombra, valores en celeste
- [ ] Saludo "Bienvenido a Frontón HGV" visible
- [ ] Cards de torneo tienen acento lateral celeste (activo), gris (borrador) o verde (finalizado)
- [ ] Badge "★ Destacado" es dorado (fondo #FFF5D6), NO celeste
- [ ] Botón Inscribirse es celeste
- [ ] Cero verde neón visible
- [ ] `npm run build` pasa sin errores

---

### FASE 6 — Componentes TournamentsDashboard

**status:** `DONE`
**test_notes:** ``

**Archivos a modificar (TODOS en `src/components/TournamentsDashboard/`):**
- `TournamentDetailModal.jsx`
- `EditTournamentForm.jsx`
- `TournamentsPageLayout.jsx`
- `TournamentWidget.jsx`
- `ActiveTournaments.jsx`
- `HistoryTournaments.jsx`
- `Tabs/InfoTab.jsx`
- `Tabs/SolicitudesTab.jsx`
- `Tabs/ProgresoTab.jsx`
- `Tabs/ApprovedSection.jsx`
- `Tabs/CategoryProgressCard.jsx`
- `Tabs/RegistrationRequestCard.jsx`
- `Tabs/RequestsSection.jsx`

**Qué hacer (aplicar consistentemente a todos):**

1. **Modales:** overlay `rgba(0,0,0,0.5)`, panel `#FFFFFF`, borde `#E0E2E6`
2. **Tabs en modales:** inactivo `#6B7280`, activo `#6BB3D9` con borde inferior celeste
3. **Formularios:** inputs fondo `#FFFFFF`, borde `#E0E2E6`, focus `#6BB3D9`, labels `#1F2937`
4. **Botones:**
   - Primario (guardar/aprobar): fondo `#6BB3D9`, texto blanco, hover `#5A9BBF`
   - Secundario (cancelar): fondo `#F3F4F6`, texto `#4B5563`
   - Peligroso (rechazar/eliminar): fondo `#EF4444`, texto blanco
   - Iniciar torneo: fondo `#6BB3D9`, sombra `0 0 12px rgba(107,179,217,0.15)`
5. **TournamentWidget:** card `#FFFFFF`/`#E8EAEE`, acento lateral `#6BB3D9` (activo) / `#D1D5DB` (borrador)
6. **CategoryProgressCard:** barra fondo `#E5E7EB`, relleno `#6BB3D9`, texto % `#6BB3D9`
7. **RegistrationRequestCard:** badge pendiente dorado (`#FFF5D6`/`#92750F`), aprobado verde, rechazado rojo
8. **HistoryTournaments:** cards con opacidad reducida, acento lateral gris `#D1D5DB` (NO celeste)

**Validaciones del tester:**
- [ ] Abrir modal de torneo: fondo blanco, tabs con celeste activo
- [ ] Formulario de edición: focus celeste en inputs
- [ ] Botón aprobar: celeste. Botón rechazar: rojo
- [ ] Barra de progreso: relleno celeste
- [ ] Badge pendiente: fondo dorado
- [ ] Cards historial: sin acento celeste, opacidad reducida
- [ ] `npm run build` pasa sin errores

---

### FASE 7 — ScoringSystem + Admin + Páginas restantes + PWA

**status:** `DONE`
**test_notes:** ``

**Archivos a modificar:**
- `src/components/ScoringSystem/ClosingRuleSwitch.jsx`
- `src/components/ScoringSystem/NormalSetsForm.jsx`
- `src/components/ScoringSystem/PointsScoringForm.jsx`
- `src/components/ScoringSystem/SetsScoringForm.jsx`
- `src/components/ScoringSystem/SumaSetsForm.jsx`
- `src/components/ScoringSystem/ScoringPreview.jsx`
- `src/components/ScoringSystem/ScoringSystemSelector.jsx`
- `src/pages/AdminPanelPage.jsx`
- `src/pages/CreateTournamentPage.jsx`
- `src/pages/OrganizerHubPage.jsx`
- `src/pages/ResultsInputPage.jsx`
- `src/components/ProtectedRoute.jsx`
- `src/App.css`
- `public/icons/*` (8 archivos PNG)
- `public/favicon.svg`, `public/favicon.ico.png`, `public/apple-touch-icon.png`

**Qué hacer:**

1. **ScoringSystem:**
   - `ClosingRuleSwitch`: track inactivo `#E5E7EB`, activo `#6BB3D9`, thumb blanco
   - Formularios: inputs fondo `#FFFFFF`, borde `#E0E2E6`, focus `#6BB3D9`
   - `ScoringPreview`: card `#FFFFFF`, valores destacados en `#6BB3D9`
   - `ScoringSystemSelector`: inactiva borde `#E0E2E6`, activa borde `#6BB3D9` + fondo `#E8F4FA`

2. **AdminPanelPage:** fondo `#F2F3F5`, tabla `#FFFFFF`/`#E0E2E6`, botón aprobar `#6BB3D9`, rechazar `#EF4444`
   - **BUSCAR `#F5D547` hardcodeado** — reemplazar por `#6BB3D9`

3. **CreateTournamentPage:** fondo `#F2F3F5`, formulario `#FFFFFF`, stepper completado `#6BB3D9`, pendiente `#E5E7EB`

4. **OrganizerHubPage + ResultsInputPage:** fondo claro, cards blancas, botones celeste

5. **ProtectedRoute.jsx:** buscar `#1a1c1c`, `#2a2e2e` hardcodeados → reemplazar por tokens o `#F2F3F5`

6. **App.css:** revisar y actualizar cualquier color verde hardcodeado

7. **PWA Icons:**
   - Generar versiones de `lobo.png` en tamaños 72, 96, 128, 144, 152, 192, 384, 512px
   - Reemplazar TODOS los archivos en `public/icons/`
   - Reemplazar `public/apple-touch-icon.png` (180px)
   - Reemplazar `public/favicon.ico.png`
   - En `vite.config.js`: separar `purpose: 'any maskable'` en dos entradas: `purpose: 'any'` y `purpose: 'maskable'`

8. **Verificación final global:**
   - `grep -rn "#b8f533\|#F5D547\|#080A0F\|#0f1010\|#080909" src/` → 0 resultados
   - `theme_color` sincronizado en `vite.config.js`, `index.html` e `index.css`

**Validaciones del tester:**
- [ ] ScoringSystemSelector: opción activa con borde celeste y fondo celeste suave
- [ ] ClosingRuleSwitch: track activo celeste
- [ ] AdminPanelPage: botón aprobar celeste (NO dorado)
- [ ] CreateTournamentPage: stepper con pasos celeste
- [ ] `grep -rn "#b8f533\|#F5D547\|#080A0F\|#0f1010" src/` devuelve 0 resultados
- [ ] PWA: iconos son el escudo en `public/icons/`
- [ ] `vite.config.js` tiene dos entradas de ícono (purpose 'any' y 'maskable' SEPARADAS)
- [ ] `theme_color` = `#F2F3F5` en los 3 archivos
- [ ] `npm run build` pasa sin errores
- [ ] **VERIFICACIÓN GLOBAL**: ningún rastro de verde neón en toda la app

---

## ASSET: Escudo de la comisión (`lobo.png`)

| Ubicación | Tamaño | Notas |
|-----------|--------|-------|
| Splash (centro) | 150-180px | Animación zoom-in |
| Login (arriba del form) | 80px | Estático |
| Header (derecha, junto al avatar) | 28px, border-radius 6px | Pequeño |
| PWA icons (public/icons/) | 72-512px | Reemplazar todos |
| favicon | 32px | Reemplazar |
| apple-touch-icon | 180px | Reemplazar |

## FRASES IDENTITARIAS

| Ubicación | Frase | Estilo |
|-----------|-------|--------|
| Splash | "FRONTÓN HGV" | #E5E7EB, 20px, font-weight 600 |
| Splash | "Por nuestro frontón y raíces" | #6B7280, 13px, italic |
| Splash | "Hermandad Gallega de Venezuela" | #4B5563, 10px (opcional) |
| Login | "Comisión de Frontón" | #E5E7EB, 16px, font-weight 500 |
| Header | "Comisión de Frontón" | #6B7280, 11-12px |
| Dashboard | "Bienvenido a Frontón HGV" | #1F2937, título |

---

## ESTADO GLOBAL DE LA TAREA

| Fase | Status | Test Notes |
|------|--------|------------|
| Fase 1 — Tokens | `DONE` | |
| Fase 2 — Splash | `DONE` | |
| Fase 3 — Auth/Onboarding | `DONE` | |
| Fase 4 — Layout | `DONE` | |
| Fase 5 — Dashboard/Torneos | `DONE` | |
| Fase 6 — TournamentsDashboard | `DONE` | |
| Fase 7 — Scoring/Admin/PWA | `DONE` | |