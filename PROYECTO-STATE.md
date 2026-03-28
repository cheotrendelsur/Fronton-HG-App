# PROYECTO-STATE.md — RacketTourneys

> Documento de estado del proyecto. Generado el 2026-03-27.
> **Fuente de verdad** para planificar las siguientes fases de desarrollo.

---

## 1. Estado actual — Qué ya está hecho

### ✅ Autenticación completa (Supabase Auth)
- Registro e inicio de sesión por email/contraseña (`AuthPage.jsx`)
- Sesión almacenada en IndexedDB (clave `rackettourneys-auth-v2`) vía `idb-keyval`
- Refresh automático de token cuando quedan < 5 min de expiración (`refreshSessionSafely`)
- Re-sync de sesión al volver al tab (`visibilitychange` listener en `AuthContext`)
- Manejo de "ghost session": si el usuario fue eliminado pero tiene JWT residual, el sistema detecta su estado en `organizer_requests_history` y muestra pantalla de rechazo (`wasRejected`)

### ✅ Onboarding (2 pasos)
- Paso 1: selección de rol (Jugador / Organizador)
- Paso 2: elección de username (solo letras, números, guiones bajos; mín. 3 chars)
- Organizador queda en `status: 'pending'` hasta aprobación del admin
- Aviso visible de que la cuenta de organizador requiere aprobación
- Al completar, actualiza la tabla `profiles` en Supabase

### ✅ Sistema de roles y guards
- 3 roles: `player`, `organizer`, `admin`
- Guards inline en `App.jsx`: `ProtectedRoute`, `OrganizerRoute`, `AdminRoute`
- `isOnboardingComplete` derivado de `Boolean(profile?.username && profile?.role)`
- Redirección automática según estado de sesión y onboarding

### ✅ Layout con navegación inferior por rol
- `Layout.jsx`: bottom nav fija con glassmorphism (`backdrop-filter: blur(16px)`)
- Nav diferente por rol: player (4 items), organizer (5 items), admin (3 items)
- Iconos SVG inline, indicador de tab activo con punto neón
- CTA "Crear" con fondo neón destacado; "Admin" con fondo ámbar
- `SyncOverlay` al refrescar sesión (isSyncing)
- Safe area para iOS (`env(safe-area-inset-bottom)`)

### ✅ Panel de administración funcional (Supabase real)
- Lista solicitudes pendientes (`profiles` donde `role=organizer` y `status=pending`)
- **Aprobar**: actualiza `profiles.status = 'active'` + registra en `organizer_requests_history`
- **Rechazar**: registra en historial → llama Edge Function `delete-user` → elimina de `auth.users`
- Historial de acciones (últimas 50, con fecha/hora, badge de estado)
- Estados de carga (skeleton), error global con mensaje descriptivo
- Botón de refresh manual
- Operación atómica: historial primero, Edge Function después (si el historial falla, la cuenta no se borra)

### ✅ Crear torneo funcional (Supabase real)
- Guarda en 3 tablas en una sola sesión: `tournaments`, `courts`, `categories`
- Campos: nombre, descripción, deporte (cargado desde tabla `sports`), fechas, formato de puntuación
- Formato "Sets" (sets a jugar + games por set) o "Puntos" (puntos para ganar)
- Múltiples categorías con nombre + cupo máximo de parejas
- Múltiples canchas con horario de apertura/cierre + bloque de descanso configurable
- Retry automático al cargar deportes (hasta 3 intentos, backoff lineal)
- Validación: `sportId` requerido, campos required en formulario HTML5
- El torneo se crea con `status: 'draft'`

### ✅ Dashboard con datos mock (UI completa)
- Saludo contextual (buenos días/tardes/noches)
- Avatar con inicial del username
- Card "Próximo Partido" con equipo A vs B, hora, cancha, categoría
- Lista de "Torneos Activos" con barra de progreso, fase, días restantes, categorías, partidos hoy
- CTA "Crear nuevo torneo" condicional para organizadores
- Vista previa de "Clasificación" con tabla (pos, pareja, V, D, +/-, Pts, trend)
- Componentes locales reutilizables: `Card`, `Badge`, `ProgressBar`, `TrendIcon`

### ✅ PWA configurada
- `vite-plugin-pwa` con `registerType: 'autoUpdate'`
- Manifest completo: nombre, tema, modo standalone, orientación portrait
- Íconos en 8 tamaños (72 → 512 px)
- Workbox: caché de fuentes Google (CacheFirst, 1 año)
- `apple-touch-icon.png` para iOS

### ✅ Infraestructura y deploy
- Vercel (`vercel.json`) configurado
- Supabase CLI (carpeta `supabase/.temp/` con referencia al proyecto)
- Edge Function `delete-user` deployada en Supabase

---

## 2. Stack tecnológico completo

| Capa | Tecnología | Versión exacta |
|------|-----------|----------------|
| Framework UI | React | ^19.2.4 |
| Build tool | Vite | ^8.0.0 |
| Routing | React Router DOM | ^7.13.1 |
| Estilos | Tailwind CSS | ^4.2.1 |
| PostCSS adapter | @tailwindcss/postcss | ^4.2.1 |
| Backend / Auth / DB | Supabase JS | ^2.99.1 |
| Persistencia sesión | idb-keyval (IndexedDB) | ^6.2.2 |
| PWA | vite-plugin-pwa + Workbox | ^1.2.0 |
| Transpiler | @vitejs/plugin-react | ^6.0.0 |
| Lint | ESLint 9 | ^9.39.4 |
| Lint plugins | eslint-plugin-react-hooks + eslint-plugin-react-refresh | ^7.0.1 / ^0.5.2 |
| Deploy | Vercel | — |
| Tipografías | DM Sans + DM Mono | Google Fonts (CacheFirst PWA) |

### Tablas Supabase conocidas

| Tabla | Columnas relevantes |
|-------|---------------------|
| `profiles` | `id`, `username`, `role`, `status`, `email` |
| `organizer_requests_history` | `id`, `user_id`, `username`, `email`, `action`, `acted_at`, `acted_by` |
| `tournaments` | `organizer_id`, `name`, `description`, `sport_id`, `start_date`, `end_date`, `score_format`, `sets_to_play`, `games_per_set`, `points_to_play`, `status` |
| `courts` | `tournament_id`, `name`, `available_from`, `available_to`, `break_start`, `break_end` |
| `categories` | `tournament_id`, `name`, `max_couples` |
| `sports` | `id`, `name` |

### Edge Functions deployadas

| Función | Propósito | Llamada desde |
|---------|-----------|---------------|
| `delete-user` | Elimina usuario de `auth.users` al rechazar organizador | `AdminPanelPage.handleReject` |

---

## 3. Arquitectura establecida — NO CAMBIAR

### Estructura de carpetas (canónica)

```
src/
├── assets/               # Imágenes estáticas
├── components/
│   ├── Layout.jsx         # Shell: nav inferior + safe area + SyncOverlay
│   └── ProtectedRoute.jsx # Guard genérico (sesión + onboarding)
├── context/
│   └── AuthContext.jsx    # Estado global: session, profile, wasRejected, isSyncing
├── hooks/
│   └── useVisibilityRefresh.js  # Hook auxiliar visibilitychange
├── lib/
│   └── supabaseClient.js  # Singleton Supabase + idbStorage + refreshSessionSafely()
├── pages/
│   └── *.jsx              # Una página = un archivo
├── App.jsx                # BrowserRouter + Routes + guards de rol inline
├── index.css              # Fuentes + @tailwind + utilidades (.glass)
└── main.jsx
```

### Flujo de inicialización de sesión (AuthContext)

```
mount → init() → refreshSessionSafely() → getSession() → applySession()
                                                         → fetchProfile()
                                                         → checkRejectionHistory() (si no hay perfil)
```

- `busyRef` previene race conditions entre `init()` y `onAuthStateChange`
- `syncingRef` previene solapamiento con el `visibilitychange`
- `mountedRef` previene setState en componentes desmontados
- El evento `INITIAL_SESSION` de Supabase se ignora deliberadamente (lo maneja `init()`)

### Pattern de guards en App.jsx

```jsx
// Guards inline — NO mover a archivos separados
function OrganizerRoute({ children }) { ... }  // role === 'organizer'
function AdminRoute({ children }) { ... }       // role === 'admin'
// ProtectedRoute importado de components/
```

### Singleton Supabase

```js
// src/lib/supabaseClient.js
let _instance = null
function getClient() { /* lazy singleton */ }
export const supabase = getClient()
```

- Storage personalizado: IndexedDB vía `idb-keyval` (NO localStorage)
- `storageKey: 'rackettourneys-auth-v2'`
- `lock` override: `(_name, _timeout, fn) => fn()` (evita problemas en PWA single-tab)
- Header global `apikey` en todas las peticiones (incluye `functions.invoke`)

### Convención de nav items en Layout

Cada rol tiene su propio array de `navItems` estático. El rol `organizer` tiene 5 items (máximo permitido por diseño). El ítem "Crear" (`/tournaments/create`) tiene tratamiento visual especial (fondo neón). El ítem "Admin" tiene tratamiento ámbar.

---

## 4. Convenciones de código en uso

| Categoría | Regla |
|-----------|-------|
| Componentes | PascalCase `.jsx` |
| Hooks | `camelCase` prefijado con `use`, extensión `.js` |
| Contextos | Patrón `Context + Provider + hook` (ej. `AuthProvider` + `useAuth`) |
| Iconos | SVG inline en los componentes, **sin librería externa** |
| Datos mock | Marcados con `// Datos mock (se reemplazarán en Fase 2)` |
| Sesión | IndexedDB, nunca localStorage |
| Colores | Siempre tokens semánticos de Tailwind (`text-ink-primary`, `bg-surface-900`, etc.), **no hex hardcodeado** (excepción: inline styles en Layout para glassmorphism y bordes rgba) |
| Componentes de formulario | Definidos localmente dentro del archivo de la página (Input, TextArea, Select, SectionCard, Toggle, etc.) |
| Error handling | Siempre `try/catch/finally` con estado `busy` para deshabilitar botón |
| Supabase calls | Siempre desestructurar `{ data, error }`, nunca asumir success |
| Animaciones de entrada | `animate-fade-up` en el wrapper principal de cada página |
| Máximo ancho de contenido | `max-w-lg mx-auto px-4` en todas las páginas |
| Padding inferior | `pb-24` o `pb-8` para no solapar con la nav fija de 64px |

---

## 5. Features que faltan por implementar

### Fase 2 — Integración real con Supabase (prioridad alta)

#### Para jugadores
- **`/tournaments`** — Lista de torneos reales: activos, próximos, pasados. Filtros por deporte, estado. Actualmente placeholder.
- **`/tournaments/:id`** — Detalle de torneo: info, categorías, fase, bracket/grupos, partidos. Ruta inexistente.
- **`/standings`** — Clasificación real por torneo/categoría/grupo. Actualmente placeholder.
- **`/profile`** — Perfil del usuario: datos, historial de torneos, estadísticas, opción de editar username. Actualmente placeholder.
- **Dashboard real** — Reemplazar `MOCK_TOURNAMENTS`, `MOCK_STANDINGS` y `MOCK_NEXT_MATCH` con queries reales a Supabase. El botón "Ver todos" y las cards de torneos no tienen acción actualmente.

#### Para organizadores
- **`/organizer/hub`** — Panel de control con lista de torneos propios, estado de cada uno (draft, activo, finalizado), acciones rápidas. Actualmente placeholder completo.
- **`/results/input`** — Carga de marcadores de partidos. Actualmente placeholder completo.
- **Publicar torneo** — Flujo para cambiar `status: 'draft'` → `status: 'active'`. No existe.
- **Gestionar torneo** — Editar, archivar o eliminar torneos ya creados. No existe.
- **Inscripciones** — Sistema para que los jugadores se inscriban a categorías de un torneo. No existen las tablas ni la UI.
- **Generación de grupos/bracket** — Lógica para generar fase de grupos (round-robin) o eliminatoria a partir de los inscritos. No existe.
- **Programación de partidos** — Asignar partidos a canchas y horarios usando los datos de `courts`. No existe la UI ni la lógica.

### Sin fase asignada aún
- **Recuperar contraseña** — No hay flujo de "olvidé mi contraseña" en `AuthPage`
- **Confirmación de email** — Supabase puede enviar email de confirmación; no está manejado en la UI
- **Notificaciones** — Alertar a jugadores sobre próximos partidos, resultados
- **Modo offline** — El PWA cachea assets pero no datos de Supabase
- **`/tournaments/:id/bracket`** — Vista de bracket/cuadro por categoría

---

## 6. Blockers conocidos y tech debt

### Blockers funcionales

| # | Descripción | Impacto |
|---|-------------|---------|
| B1 | `OrganizerHubPage` y `ResultsInputPage` son placeholders sin lógica. Los organizadores pueden crear torneos pero **no pueden verlos ni gestionarlos**. | Alto — flujo de organizador incompleto |
| B2 | `CreateTournamentPage` redirige a `/dashboard` al crear el torneo exitosamente, sin confirmación ni navegación al nuevo torneo. | Medio — UX confusa |
| B3 | No existe ruta `/tournaments/:id`, por lo que las cards de torneos en el dashboard no son navegables. | Alto — los torneos reales serán inaccesibles |
| B4 | No hay tablas en Supabase para inscripciones, partidos, grupos ni brackets (al menos no confirmadas). Antes de implementar Fase 2 hay que definir y migrar el schema. | Crítico — bloquea toda la Fase 2 |
| B5 | El botón "Ver todos" en `DashboardPage` no tiene `onClick` ni ruta asociada. | Bajo — UI muerta |

### Tech debt

| # | Descripción | Severidad |
|---|-------------|-----------|
| T1 | Los componentes de formulario (`Input`, `TextArea`, `Select`, `SectionCard`, `Toggle`, `CategoryCard`, `CourtCard`) están definidos dentro de `CreateTournamentPage.jsx`. Si se reutilizan en otras páginas habrá duplicación. | Media |
| T2 | No hay `ErrorBoundary` a nivel de app. Un error en render no capturado rompe toda la SPA. | Media |
| T3 | `DashboardPage` usa emojis (🎾) como iconos de deporte en los datos mock (violación de la convención de SVG inline). Cuando se integre Supabase, habrá que decidir cómo representar el ícono de cada deporte. | Baja |
| T4 | La tabla `profiles` carga `select('*')` en `fetchProfile`. A medida que la tabla crezca en columnas, convendrá seleccionar solo las columnas necesarias. | Baja |
| T5 | `AdminPanelPage` tiene doble guard: el `AdminRoute` en `App.jsx` y un `if (profile.role !== 'admin') return null` interno. El segundo es redundante pero inofensivo. | Muy baja |
| T6 | No hay tests (unitarios ni e2e). Toda la validación es manual. | Media — se vuelve crítica cuando crezca la lógica de negocio |
| T7 | El `lock` del cliente Supabase está sobrescrito con `fn => fn()`. En escenarios multi-tab puede haber race conditions de refresh de token. Aceptable para MVP single-tab, pero hay que considerar si se habilita instalación PWA multi-ventana. | Media |
| T8 | `useVisibilityRefresh.js` existe como hook pero `AuthContext` ya implementa el mismo listener `visibilitychange` internamente. Revisar si el hook externo está en uso o es código muerto. | Baja |
