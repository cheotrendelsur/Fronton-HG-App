# CLAUDE.md — RacketTourneys

## Descripción del proyecto

**RacketTourneys** es una Progressive Web App (PWA) para la gestión de torneos de deportes de raqueta (pádel, tenis). Permite a jugadores consultar torneos, partidos y clasificaciones, y a organizadores crear y gestionar torneos. Cuenta con un panel de administración para aprobar o rechazar solicitudes de organizador.

La UI está en **español**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 (`react ^19.2.4`, `react-dom ^19.2.4`) |
| Build tool | Vite 8 (`vite ^8.0.0`, `@vitejs/plugin-react ^6.0.0`) |
| Routing | React Router DOM 7 (`react-router-dom ^7.13.1`) |
| Estilos | Tailwind CSS 4 (`tailwindcss ^4.2.1`, `@tailwindcss/postcss ^4.2.1`) |
| Backend / Auth / DB | Supabase (`@supabase/supabase-js ^2.99.1`) |
| Persistencia de sesión | IndexedDB via `idb-keyval ^6.2.2` |
| PWA | `vite-plugin-pwa ^1.2.0` + Workbox |
| Lint | ESLint 9 + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` |
| Deploy | Vercel (`vercel.json`) |

### Fuentes
- `DM Sans` (sans-serif principal) — Google Fonts
- `DM Mono` (monospace) — Google Fonts

### Nota de instalación
El archivo `.npmrc` en la raíz contiene `legacy-peer-deps=true` para resolver el conflicto de peer dependencies entre `vite@8` y `vite-plugin-pwa@1.2.0`. Esto es necesario para que `npm install` funcione correctamente en Vercel y localmente.

---

## Estructura de carpetas

```
racket-tourneys/
├── public/
│   ├── favicon.svg
│   ├── favicon.ico.png
│   ├── apple-touch-icon.png
│   ├── icon-512x512.png
│   ├── icons.svg
│   └── icons/                    # íconos PWA (72–512 px)
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
├── src/
│   ├── assets/                   # imágenes estáticas (hero.png, etc.)
│   ├── components/
│   │   ├── Layout.jsx            # Shell con nav inferior por rol
│   │   ├── ProtectedRoute.jsx
│   │   ├── ScoringSystem/        # Componentes de configuración de sistema de puntuación
│   │   │   ├── ClosingRuleSwitch.jsx
│   │   │   ├── NormalSetsForm.jsx
│   │   │   ├── PointsScoringForm.jsx
│   │   │   ├── ScoringPreview.jsx
│   │   │   ├── ScoringSystemSelector.jsx
│   │   │   ├── SetsScoringForm.jsx
│   │   │   └── SumaSetsForm.jsx
│   │   └── TournamentsDashboard/ # Dashboard de torneos del organizador
│   │       ├── ActiveTournaments.jsx
│   │       ├── EditTournamentForm.jsx    # Formulario editable con CRUD de categorías/pistas
│   │       ├── HistoryTournaments.jsx    # Torneos finalizados (solo lectura)
│   │       ├── TournamentDetailModal.jsx # Modal con tabs Info/Solicitudes/Progreso
│   │       ├── TournamentsPageLayout.jsx
│   │       ├── TournamentWidget.jsx      # Widget de torneo activo con botón de inicio
│   │       └── Tabs/
│   │           ├── ApprovedSection.jsx
│   │           ├── CategoryProgressCard.jsx  # Tarjeta de progreso por categoría
│   │           ├── InfoTab.jsx               # Tab editable de info del torneo
│   │           ├── ProgresoTab.jsx           # Tab de progreso de inscripciones
│   │           ├── RegistrationRequestCard.jsx
│   │           ├── RequestsSection.jsx
│   │           └── SolicitudesTab.jsx        # Tab de solicitudes de inscripción
│   ├── context/
│   │   └── AuthContext.jsx       # Estado global de auth + perfil
│   ├── lib/
│   │   └── supabaseClient.js     # Singleton Supabase + refreshSessionSafely()
│   ├── pages/
│   │   ├── AdminPanelPage.jsx    # Solo admin
│   │   ├── AuthPage.jsx
│   │   ├── CreateTournamentPage.jsx  # Solo organizadores
│   │   ├── DashboardPage.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── OrganizerHubPage.jsx      # Solo organizadores
│   │   ├── ResultsInputPage.jsx      # Solo organizadores
│   │   └── TournamentsPage.jsx       # Vista de torneos (jugadores y organizadores)
│   ├── App.jsx                   # Rutas + guards de rol
│   ├── App.css
│   ├── index.css                 # Imports de fuentes + Tailwind + utilidades
│   └── main.jsx
├── supabase/                     # Config local de Supabase CLI (.temp/)
├── .env                          # Variables de entorno (no commitear)
├── .npmrc                        # legacy-peer-deps=true
├── .gitignore
├── .claudeignore
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── package.json
└── vercel.json
```

---

## Sistema de roles y rutas

| Rol | Acceso |
|-----|--------|
| `player` | `/dashboard`, `/tournaments`, `/standings`, `/profile` |
| `organizer` | Todo lo anterior + `/organizer/hub`, `/tournaments/create`, `/results/input` |
| `admin` | `/dashboard`, `/admin`, `/profile` |

### Rutas completas (App.jsx)

| Path | Componente | Protección |
|------|-----------|-----------|
| `/auth` | `AuthPage` | Pública |
| `/onboarding` | `OnboardingPage` | Autenticado |
| `/dashboard` | `DashboardPage` | `ProtectedRoute` |
| `/tournaments` | `TournamentsPage` | `ProtectedRoute` |
| `/standings` | Placeholder | `ProtectedRoute` |
| `/profile` | Placeholder | `ProtectedRoute` |
| `/tournaments/create` | `CreateTournamentPage` | `OrganizerRoute` |
| `/organizer/hub` | `OrganizerHubPage` | `OrganizerRoute` |
| `/results/input` | `ResultsInputPage` | `OrganizerRoute` |
| `/admin` | `AdminPanelPage` | `AdminRoute` |
| `/` | Redirect inteligente | — |
| `*` | Redirect a `/` | — |

### Flujo de auth
1. Usuario se registra/inicia sesión en `/auth`
2. Si no tiene `username` + `role` en `profiles` → redirige a `/onboarding`
3. En onboarding elige rol (player o organizer) y username
4. Si elige `organizer` → `status: 'pending'`; necesita aprobación del admin
5. Admin aprueba → `status: 'active'` | Admin rechaza → se invoca Edge Function `delete-user` y se registra en `organizer_requests_history`

---

## Base de datos (Supabase - PostgreSQL)

### Tabla: `profiles`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, FK → auth.users, NOT NULL |
| `email` | text | NOT NULL |
| `username` | text | UNIQUE, nullable |
| `role` | text | nullable |
| `created_at` | timestamptz | NOT NULL, default: `now()` |
| `updated_at` | timestamptz | NOT NULL, default: `now()` |
| `status` | text | NOT NULL, default: `'active'` |

### Tabla: `sports`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `name` | text | UNIQUE, NOT NULL |
| `created_at` | timestamptz | NOT NULL, default: `now()` |

### Tabla: `tournaments`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `organizer_id` | uuid | FK → auth.users, NOT NULL |
| `name` | text | NOT NULL |
| `sport_id` | uuid | FK → sports.id, NOT NULL |
| `start_date` | date | nullable |
| `end_date` | date | nullable |
| `status` | text | NOT NULL, default: `'draft'` |
| `created_at` | timestamptz | NOT NULL, default: `now()` |
| `description` | text | nullable |
| `scoring_config` | jsonb | nullable |
| `location` | varchar | nullable |
| `inscription_fee` | double precision | nullable, default: `0` |

### Tabla: `categories`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id, NOT NULL |
| `name` | text | NOT NULL |
| `max_couples` | integer | NOT NULL |
| `created_at` | timestamptz | NOT NULL, default: `now()` |

### Tabla: `courts`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id, NOT NULL |
| `name` | text | NOT NULL |
| `available_from` | time | nullable |
| `available_to` | time | nullable |
| `break_start` | time | nullable |
| `break_end` | time | nullable |
| `created_at` | timestamptz | NOT NULL, default: `now()` |

### Tabla: `tournament_registrations`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id, NOT NULL |
| `team_name` | varchar | NOT NULL |
| `player1_id` | uuid | FK → profiles.id, NOT NULL |
| `player2_id` | uuid | FK → profiles.id, NOT NULL |
| `category_id` | uuid | FK → categories.id, NOT NULL |
| `status` | varchar | NOT NULL, default: `'pending'` |
| `inscription_fee` | double precision | nullable |
| `requested_at` | timestamp | NOT NULL, default: `now()` |
| `decided_at` | timestamp | nullable |
| `decided_by` | uuid | FK → profiles.id, nullable |
| `created_at` | timestamp | NOT NULL, default: `now()` |
| `updated_at` | timestamp | NOT NULL, default: `now()` |

### Tabla: `tournament_progress`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id, NOT NULL |
| `category_id` | uuid | FK → categories.id, NOT NULL |
| `max_teams_allowed` | integer | NOT NULL |
| `teams_registered` | integer | NOT NULL, default: `0` |
| `teams_approved` | integer | NOT NULL, default: `0` |
| `status` | varchar | NOT NULL, default: `'open'` |
| `created_at` | timestamp | NOT NULL, default: `now()` |
| `updated_at` | timestamp | NOT NULL, default: `now()` |

### Tabla: `tournament_edits_history`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id, NOT NULL |
| `edited_by` | uuid | FK → profiles.id, NOT NULL |
| `field_name` | varchar | NOT NULL |
| `old_value` | text | nullable |
| `new_value` | text | nullable |
| `edited_at` | timestamp | NOT NULL, default: `now()` |

### Tabla: `organizer_requests_history`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, NOT NULL, default: `gen_random_uuid()` |
| `user_id` | uuid | nullable |
| `username` | text | NOT NULL |
| `email` | text | NOT NULL |
| `action` | text | NOT NULL (`'accepted'` / `'rejected'`) |
| `acted_at` | timestamptz | NOT NULL, default: `now()` |
| `acted_by` | uuid | nullable |

### Relaciones principales
- `profiles.id` → `auth.users.id`
- `tournaments.organizer_id` → `auth.users`
- `tournaments.sport_id` → `sports.id`
- `categories.tournament_id` → `tournaments.id`
- `courts.tournament_id` → `tournaments.id`
- `tournament_registrations.tournament_id` → `tournaments.id`
- `tournament_registrations.player1_id` → `profiles.id`
- `tournament_registrations.player2_id` → `profiles.id`
- `tournament_registrations.category_id` → `categories.id`
- `tournament_registrations.decided_by` → `profiles.id`
- `tournament_progress.tournament_id` → `tournaments.id`
- `tournament_progress.category_id` → `categories.id`
- `tournament_edits_history.tournament_id` → `tournaments.id`
- `tournament_edits_history.edited_by` → `profiles.id`

### Edge Functions
- `delete-user` — elimina un usuario de `auth.users` al rechazarlo. Llamada desde `AdminPanelPage`.

---

## Variables de entorno

Crear `.env` en la raíz (no commitear):

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

---

## Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (HMR)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Lint
npm run lint
```

---

## Design system / Convenciones visuales

### Paleta de colores completa (tailwind.config.js)

| Token | Hex | Uso |
|-------|-----|-----|
| `base-950` | `#080909` | Fondo de pantalla |
| `base-900` | `#0f1010` | Variante de fondo |
| `base-800` | `#161818` | Fondo alternativo |
| `surface-900` | `#1a1c1c` | Cards / inputs |
| `surface-800` | `#212424` | Superficie elevada |
| `surface-700` | `#282b2b` | Superficie media |
| `surface-600` | `#303434` | Superficie clara |
| `surface-500` | `#3a3e3e` | Superficie más clara |
| `border-strong` | `#3a3e3e` | Bordes fuertes |
| `border-default` | `#2a2e2e` | Bordes de cards |
| `border-subtle` | `#1e2222` | Bordes sutiles |
| `neon-300` | `#b8f533` | Acento principal (CTA, activo, progreso) |
| `neon-200` | `#ccff61` | Acento claro |
| `neon-400` | `#a2e020` | Acento oscuro |
| `ink-primary` | `#f0f2f0` | Texto principal |
| `ink-secondary` | `#9aa29a` | Texto secundario |
| `ink-muted` | `#5c665c` | Texto apagado |
| `ink-inverse` | `#0f1010` | Texto sobre fondos claros |

### Sombras personalizadas
- `shadow-neon-sm` — `0 0 12px rgba(184,245,51,0.15)`
- `shadow-neon-md` — `0 0 24px rgba(184,245,51,0.20)`
- `shadow-card` — `0 1px 3px rgba(0,0,0,0.4)`

### Animaciones custom
- `animate-fade-up` — entrada suave (0.3s ease-out)
- `animate-pulse-neon` — pulso verde neón (2s)

### Utilidades CSS propias
- `.glass` — glassmorphism con `backdrop-filter: blur(16px)`

### Spacing especial
- `safe-bottom` — `env(safe-area-inset-bottom, 16px)` para notch móvil

---

## Convenciones de código

- Archivos de componentes: **PascalCase** (`.jsx`)
- Hooks: **camelCase** prefijado con `use` (`.js`)
- Contextos: patrón Context + Provider + hook (`useAuth`)
- Supabase client: singleton exportado desde `src/lib/supabaseClient.js`
- Sesión almacenada en **IndexedDB** (no localStorage), clave `rackettourneys-auth-v2`
- Refresh de sesión al volver al tab via `visibilitychange` (manejado en `AuthContext`)
- Guardia de rutas inline en `App.jsx` (`OrganizerRoute`, `AdminRoute`, `ProtectedRoute`)
- SVG de íconos inline en los componentes (sin librería externa)

---

## Estado del proyecto

- **Fase 1 (completada)**: Auth, onboarding, roles, admin panel funcional con Supabase.
- **Fase 2 (completada)**: Dashboard de torneos del organizador — creación de torneos con sistema de puntuación configurable (`CreateTournamentPage`, `ScoringSystem/`).
- **Fase 3 (completada)**: Modal de detalle de torneo con tab Info editable (`TournamentDetailModal`, `EditTournamentForm`, `InfoTab`). CRUD completo de categorías y pistas. Historial de ediciones en `tournament_edits_history`.
- **Fase 4 (completada)**: Gestión de solicitudes de inscripción (`SolicitudesTab`, `RegistrationRequestCard`, `RequestsSection`, `ApprovedSection`). Aprobación/rechazo de parejas.
- **Fase 5 (completada)**: Visualización de progreso por categoría (`ProgresoTab`, `CategoryProgressCard`). Validación de capacidad máxima de categorías. Widgets de torneos históricos en modo solo lectura. Botón de inicio de torneo con modal de confirmación.
- **Pendiente**: Integración real de partidos y clasificaciones. Las páginas `/standings` y `/profile` muestran placeholder.
