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
│   │   ├── BrandLoader.jsx       # Loader animado con escudo HGV + anillo celeste
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
│   │   ├── TournamentActive/     # Página completa de torneo activo (fase de grupos)
│   │   │   ├── CategoryAccordion.jsx     # Acordeón de categoría con toggle y lista de duplas
│   │   │   ├── ClasificacionView.jsx     # Vista de clasificación con tabs de categoría + swiper
│   │   │   ├── GroupCard.jsx             # Card de grupo con acordeones de participantes y partidos
│   │   │   ├── GroupSwiper.jsx           # Swipe horizontal de grupos con scroll-snap + dots
│   │   │   ├── InscritosView.jsx         # Vista de inscritos con acordeones por categoría
│   │   │   ├── MatchCard.jsx             # Card de partido: fecha/hora + cancha + badge status + "Por definir" si sin programar
│   │   │   ├── MatchesAccordion.jsx      # Acordeón de partidos dentro de un grupo
│   │   │   └── ParticipantsAccordion.jsx # Acordeón de participantes dentro de un grupo
│   │   ├── Scoreboard/           # Página de marcadores del organizador
│   │   │   ├── ScoreboardPage.jsx        # Carga datos, agrupa por día/categoría, gestiona modal
│   │   │   ├── DaySwiper.jsx             # Swipe horizontal por días con scroll-snap + dots
│   │   │   ├── DayView.jsx               # Vista de un día: header + acordeones de categoría
│   │   │   ├── CategorySection.jsx       # Acordeón por categoría: pendientes arriba, completados abajo
│   │   │   ├── PendingMatchCard.jsx      # Card de partido pendiente (borde celeste, botón Registrar)
│   │   │   ├── CompletedMatchCard.jsx    # Card de partido completado (borde verde, resultado + ★ ganador)
│   │   │   ├── ScoreInputModal.jsx       # Modal centrado (portal) para ingresar resultado
│   │   │   ├── SetsScoreForm.jsx         # Formulario de sets (dinámico sets_normal / fijo sets_suma)
│   │   │   └── PointsScoreForm.jsx       # Formulario de puntos (inputs grandes, win_by validation)
│   │   ├── TournamentSetup/      # Modal de configuración e inicio de torneo
│   │   │   ├── CategoryConfigForm.jsx    # Formulario por categoría (grupos + fase eliminatoria)
│   │   │   ├── ConfigurationModal.jsx    # Modal 5 pasos: confirmar → configurar → preview → cronograma config → cronograma preview
│   │   │   ├── GenerationPreview.jsx     # Vista previa de sorteo con regenerar + "Siguiente: Cronograma →"
│   │   │   ├── ScheduleConfigStep.jsx    # Config de cronograma: duración inteligente, canchas, validación capacidad
│   │   │   ├── SchedulePreview.jsx       # Preview del cronograma distribuido por día/cancha con regenerar
│   │   │   └── ScheduleDayView.jsx       # Vista de un día del cronograma con cards de partidos
│   │   └── TournamentsDashboard/ # Dashboard de torneos del organizador
│   │       ├── ActiveTournaments.jsx
│   │       ├── EditTournamentForm.jsx    # Formulario editable con CRUD de categorías/pistas
│   │       ├── HistoryTournaments.jsx    # Torneos finalizados (solo lectura)
│   │       ├── TournamentDetailModal.jsx # Modal con tabs Info/Solicitudes/Progreso (torneos NO activos)
│   │       ├── TournamentsPageLayout.jsx
│   │       ├── TournamentWidget.jsx      # Widget de torneo: navega a página si activo, abre modal si no
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
│   │   ├── classificationEngine.js   # Motor de clasificación: ranking, qualifiers, bracket assignment
│   │   ├── matchDurationCalculator.js # Cálculo inteligente de duración según scoring_config
│   │   ├── postGroupPhase.js         # Clasificación automática + llenado bracket + programación eliminatoria
│   │   ├── scoreManager.js           # Validación de resultados, cálculo de ganador, estadísticas
│   │   ├── scorePersistence.js       # Persistencia de resultados vía RPC + check fase completa
│   │   ├── schedulingEngine.js       # Motor de time slots, distribución con restricciones, validación
│   │   ├── supabaseClient.js         # Singleton Supabase + refreshSessionSafely()
│   │   ├── tournamentGenerator.js    # Motor de generación: shuffle, grupos, round-robin, bracket
│   │   └── tournamentPersistence.js  # Persistencia atómica: construye payload y llama RPC (con cronograma)
│   ├── pages/
│   │   ├── ActiveTournamentPage.jsx  # Página completa de torneo activo (Inscritos + Clasificación + fecha/hora/cancha)
│   │   ├── AdminPanelPage.jsx        # Solo admin
│   │   ├── AuthPage.jsx
│   │   ├── CreateTournamentPage.jsx  # Solo organizadores
│   │   ├── DashboardPage.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── OrganizerHubPage.jsx      # Solo organizadores
│   │   ├── ResultsInputPage.jsx      # Página de marcadores: carga torneo activo → ScoreboardPage
│   │   ├── SplashPage.jsx            # Splash de marca con animación zoom-in
│   │   ├── TournamentManagePage.jsx  # Página de gestión de torneo (Info/Solicitudes/Progreso)
│   │   └── TournamentsPage.jsx       # Vista de torneos (jugadores y organizadores)
│   ├── App.jsx                   # Rutas + guards de rol
│   ├── App.css
│   ├── index.css                 # Imports de fuentes + Tailwind + utilidades
│   └── main.jsx
├── supabase/                     # Config local de Supabase CLI
│   └── migrations/
│       ├── create_tournament_structure_tables.sql       # 6 tablas de estructura de torneo + RLS
│       ├── fix_rls_policies_registrations_progress.sql  # RLS para registrations, progress y profiles
│       ├── create_rpc_persist_tournament.sql            # RPC persist_tournament_structure (con cronograma)
│       └── create_rpc_save_match_result.sql             # RPC save_match_result (score + stats atómico)
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
| `organizer` | Todo lo anterior + `/organizer/hub`, `/tournaments/create`, `/results/input`, `/tournament/:id/active` |
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
| `/tournament/:id/active` | `ActiveTournamentPage` | `OrganizerRoute` |
| `/tournament/:id/manage` | `TournamentManagePage` | `OrganizerRoute` |
| `/tournaments/create` | `CreateTournamentPage` | `OrganizerRoute` |
| `/organizer/hub` | `OrganizerHubPage` | `OrganizerRoute` |
| `/results/input` | `ResultsInputPage` → `ScoreboardPage` | `OrganizerRoute` |
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

### Tabla: `tournament_config`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id ON DELETE CASCADE, NOT NULL, UNIQUE |
| `config` | jsonb | NOT NULL |
| `status` | varchar | NOT NULL, default: `'pending'` |
| `created_at` | timestamptz | NOT NULL, default: `now()` |
| `updated_at` | timestamptz | NOT NULL, default: `now()` |

### Tabla: `tournament_groups`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id ON DELETE CASCADE, NOT NULL |
| `category_id` | uuid | FK → categories.id ON DELETE CASCADE, NOT NULL |
| `group_letter` | varchar(2) | NOT NULL |
| `group_number` | integer | NOT NULL |
| `phase` | varchar | NOT NULL, default: `'group_phase'` |
| `status` | varchar | NOT NULL, default: `'active'` |
| `created_at` | timestamptz | NOT NULL, default: `now()` |

### Tabla: `tournament_group_members`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, default: `gen_random_uuid()` |
| `group_id` | uuid | FK → tournament_groups.id ON DELETE CASCADE, NOT NULL |
| `registration_id` | uuid | FK → tournament_registrations.id ON DELETE CASCADE, NOT NULL |
| `draw_position` | integer | NOT NULL |
| `matches_played` | integer | NOT NULL, default: `0` |
| `matches_won` | integer | NOT NULL, default: `0` |
| `matches_lost` | integer | NOT NULL, default: `0` |
| `sets_won` | integer | NOT NULL, default: `0` |
| `sets_lost` | integer | NOT NULL, default: `0` |
| `games_won` | integer | NOT NULL, default: `0` |
| `games_lost` | integer | NOT NULL, default: `0` |
| `points_scored` | integer | NOT NULL, default: `0` |
| `points_against` | integer | NOT NULL, default: `0` |
| `final_rank` | integer | nullable |
| `qualified` | boolean | NOT NULL, default: `false` |
| `created_at` | timestamptz | NOT NULL, default: `now()` |
| `updated_at` | timestamptz | NOT NULL, default: `now()` |
| | | UNIQUE(`group_id`, `registration_id`) |

### Tabla: `tournament_matches`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id ON DELETE CASCADE, NOT NULL |
| `category_id` | uuid | FK → categories.id ON DELETE CASCADE, NOT NULL |
| `group_id` | uuid | FK → tournament_groups.id ON DELETE CASCADE, nullable |
| `phase` | varchar | NOT NULL |
| `match_number` | integer | NOT NULL |
| `team1_id` | uuid | FK → tournament_registrations.id, nullable |
| `team2_id` | uuid | FK → tournament_registrations.id, nullable |
| `court_id` | uuid | FK → courts.id, nullable (NULL para eliminatoria sin programar) |
| `scheduled_date` | date | nullable (NULL para eliminatoria sin programar) |
| `scheduled_time` | time | nullable (NULL para eliminatoria sin programar) |
| `estimated_duration_minutes` | integer | nullable (NULL para eliminatoria sin programar) |
| `status` | varchar | NOT NULL, default: `'scheduled'` |
| `score_team1` | jsonb | nullable |
| `score_team2` | jsonb | nullable |
| `winner_id` | uuid | FK → tournament_registrations.id, nullable |
| `created_at` | timestamptz | NOT NULL, default: `now()` |
| `updated_at` | timestamptz | NOT NULL, default: `now()` |

### Tabla: `tournament_bracket`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id ON DELETE CASCADE, NOT NULL |
| `category_id` | uuid | FK → categories.id ON DELETE CASCADE, NOT NULL |
| `phase` | varchar | NOT NULL |
| `round_number` | integer | NOT NULL |
| `position` | integer | NOT NULL |
| `team1_id` | uuid | FK → tournament_registrations.id, nullable |
| `team2_id` | uuid | FK → tournament_registrations.id, nullable |
| `team1_source_group` | uuid | FK → tournament_groups.id, nullable |
| `team2_source_group` | uuid | FK → tournament_groups.id, nullable |
| `match_id` | uuid | FK → tournament_matches.id, nullable |
| `winner_id` | uuid | FK → tournament_registrations.id, nullable |
| `status` | varchar | NOT NULL, default: `'pending'` |
| `created_at` | timestamptz | NOT NULL, default: `now()` |
| `updated_at` | timestamptz | NOT NULL, default: `now()` |

### Tabla: `tournament_best_positioned`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | uuid | PK, default: `gen_random_uuid()` |
| `tournament_id` | uuid | FK → tournaments.id ON DELETE CASCADE, NOT NULL |
| `category_id` | uuid | FK → categories.id ON DELETE CASCADE, NOT NULL |
| `registration_id` | uuid | FK → tournament_registrations.id ON DELETE CASCADE, NOT NULL |
| `source_group_id` | uuid | FK → tournament_groups.id ON DELETE CASCADE, NOT NULL |
| `original_position` | integer | NOT NULL |
| `matches_won` | integer | NOT NULL, default: `0` |
| `matches_lost` | integer | NOT NULL, default: `0` |
| `sets_won` / `sets_lost` | integer | NOT NULL, default: `0` |
| `games_won` / `games_lost` | integer | NOT NULL, default: `0` |
| `points_scored` / `points_against` | integer | NOT NULL, default: `0` |
| `set_diff` / `game_diff` / `point_diff` | integer | NOT NULL, default: `0` |
| `ranking` | integer | nullable |
| `qualified` | boolean | NOT NULL, default: `false` |
| `created_at` | timestamptz | NOT NULL, default: `now()` |

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
- `tournament_config.tournament_id` → `tournaments.id`
- `tournament_groups.tournament_id` → `tournaments.id`
- `tournament_groups.category_id` → `categories.id`
- `tournament_group_members.group_id` → `tournament_groups.id`
- `tournament_group_members.registration_id` → `tournament_registrations.id`
- `tournament_matches.tournament_id` → `tournaments.id`
- `tournament_matches.category_id` → `categories.id`
- `tournament_matches.group_id` → `tournament_groups.id`
- `tournament_matches.team1_id` / `team2_id` / `winner_id` → `tournament_registrations.id`
- `tournament_matches.court_id` → `courts.id`
- `tournament_bracket.tournament_id` → `tournaments.id`
- `tournament_bracket.category_id` → `categories.id`
- `tournament_bracket.team1_source_group` / `team2_source_group` → `tournament_groups.id`
- `tournament_bracket.match_id` → `tournament_matches.id`
- `tournament_best_positioned.source_group_id` → `tournament_groups.id`
- `tournament_best_positioned.registration_id` → `tournament_registrations.id`

### RLS (Row Level Security)
Las 6 tablas de estructura de torneo tienen RLS habilitado:
- **SELECT**: permitido para todos los usuarios autenticados
- **INSERT/UPDATE/DELETE**: solo si el usuario autenticado es el `organizer_id` del torneo asociado

### Edge Functions
- `delete-user` — elimina un usuario de `auth.users` al rechazarlo. Llamada desde `AdminPanelPage`.

### RPC Functions
- `persist_tournament_structure(p_payload jsonb)` — Inserta atómicamente toda la estructura de un torneo (config, grupos, miembros, partidos con cronograma, bracket) y actualiza `tournaments.status` a `'active'`. Los partidos de fase de grupos incluyen `court_id`, `scheduled_date`, `scheduled_time`, `estimated_duration_minutes` asignados; los de eliminatoria quedan en NULL. Si falla cualquier paso, hace rollback automático. Definida en `supabase/migrations/create_rpc_persist_tournament.sql`.
- `save_match_result(p_match_id, p_winner_id, p_score_team1, p_score_team2, p_team1_member_id, p_team2_member_id, p_team1_stats, p_team2_stats)` — Actualiza atómicamente el resultado de un partido (`tournament_matches.score_team1/score_team2/winner_id/status='completed'`) y suma los deltas de estadísticas a `tournament_group_members` (matches_played, matches_won/lost, sets, games, points). Definida en `supabase/migrations/create_rpc_save_match_result.sql`.

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
- **Fase 6 (completada)**: Motor completo de generación de torneos — grupos aleatorios (Fisher-Yates), partidos round-robin (`n*(n-1)/2`), clasificación con desempate escalonado, mejores N-ésimos genéricos, brackets eliminatorios. Modal de configuración con vista previa y regeneración de sorteo. Persistencia atómica vía RPC PostgreSQL (`persist_tournament_structure`). Página completa de torneo activo (`/tournament/:id/active`) con vista de Inscritos (acordeones por categoría) y Clasificación (swipe horizontal por grupos con scroll-snap, dots de navegación, acordeones de participantes y partidos, MatchCards con badges de status).
- **TASK-3 (completada)**: Distribución de partidos en cronograma por canchas y horarios. Motor de time slots (`schedulingEngine.js`) con generación, distribución con 7 restricciones (R1-R6 + R-A/R-B), y validación. UI de configuración con duración inteligente basada en scoring_config (`matchDurationCalculator.js`), slider con recomendación, selección de canchas, validación de capacidad total (grupos + eliminatoria estimada). Preview del cronograma con regenerar. Persistencia de cronograma integrada en RPC. MatchCards en vista de Clasificación muestran fecha + hora + cancha. Página de gestión de torneo (`TournamentManagePage`).
- **TASK-4 (completada)**: Sistema completo de marcadores y resultados. Página de marcadores con swipe por días del torneo (`DaySwiper` + `DayView`), acordeones por categoría con cards de partidos pendientes/completados. Modal de ingreso de resultados (`ScoreInputModal` como portal centrado) adaptable a 3 modalidades de scoring: sets_normal (filas dinámicas), sets_suma (filas fijas), points (win_by=1/2 con max_points). Validación estricta en tiempo real (games mínimos, empates, tiebreaks). Persistencia atómica vía RPC `save_match_result` (score + estadísticas de grupo). Clasificación automática post fase de grupos (`postGroupPhase.js`): rankea grupos, selecciona clasificados, llena bracket, crea y programa partidos de eliminatoria en slots disponibles. Soporte para registrar resultados de eliminatoria (UPDATE directo sin stats de grupo).

### Módulos de lógica pura (sin React/Supabase)

**`src/lib/tournamentGenerator.js`** — Motor de generación:
- `shuffleArray(array)` — Fisher-Yates shuffle, retorna copia
- `generateGroups(approvedTeams, numGroups)` — Distribución equitativa (13 en 3 → 5,4,4), letras A,B,C
- `generateRoundRobinMatches(groupMembers, startingMatchNumber)` — n*(n-1)/2 partidos sin duplicados
- `calculateClassification(numGroups, eliminationPhase)` — Calcula directos por grupo + mejores N-ésimos automáticos
- `generateBracketStructure(eliminationPhase)` — Estructura vacía del bracket con conexiones entre rondas
- `getEliminationOptions(numApproved)` — Opciones válidas de fase eliminatoria

**`src/lib/classificationEngine.js`** — Motor de clasificación:
- `rankGroupMembers(members, scoringType)` — Ranking por desempate: PG → dif sets/puntos → dif games → bruto → sorteo
- `selectDirectQualifiers(rankedGroups, teamsPerGroupQualify)` — Primeros K de cada grupo
- `selectBestPositioned(rankedGroups, positionToCompare, howManyNeeded, scoringType)` — Genérico para 2dos, 3ros, 4tos...
- `assignToBracket(directQualifiers, bestPositioned, bracketStructure)` — Evita mismo grupo en primera ronda

**`src/lib/tournamentPersistence.js`** — Persistencia atómica:
- `persistTournamentStructure(supabase, tournamentId, generatedData, configs, scheduleAssignments?)` — Construye payload con UUIDs frontend, enriquece partidos de grupo con datos de cronograma (court_id, scheduled_date, scheduled_time, estimated_duration_minutes) y llama RPC. Backward compatible si no se pasan asignaciones.

**`src/lib/schedulingEngine.js`** — Motor de cronograma:
- `generateTimeSlots(court, date, matchDurationMinutes)` — Genera slots para una cancha en un día respetando horarios y breaks. Incluye tight slot antes del break y reset post-break.
- `generateAllSlots(courts, startDate, endDate, matchDurationMinutes)` — Genera todos los slots de todas las canchas en todo el rango de fechas, ordenados por fecha → hora → cancha.
- `validateSlotCapacity(totalSlots, totalMatches)` — Verifica si hay suficientes slots.
- `distributeMatches(matches, slots, options?)` — Distribuye partidos en slots respetando restricciones: R1 cancha libre, R2 sin dupla simultánea, R3 max 2 consecutivos, R-A max 2 partidos/dupla/día, R-B proximidad de 3 slots si 2 en un día. Intercala grupos para distribución equitativa. Options: `{ maxConsecutive: 2, maxPerDay: 2, maxProximitySlots: 3 }`.
- `validateDistribution(assignments, matches)` — Valida R1, R2, R3, R-A, R-B, R6 sobre asignaciones generadas.
- `getScheduleSummary(assignments)` — Resumen agrupado por día → cancha → partidos para la UI.

**`src/lib/matchDurationCalculator.js`** — Cálculo de duración:
- `calculateEstimatedDuration(scoringConfig)` — Calcula duración recomendada/mínima/máxima según tipo de scoring (sets_normal, sets_suma, points). Retorna breakdown con descripción.
- `formatDurationBreakdown(result)` — Formatea resultado en string legible.

**`src/lib/scoreManager.js`** — Lógica de resultados:
- `validateScoreInput(scores, scoringConfig)` — Validación en tiempo real de resultados parciales. Soporta sets_normal (dinámico), sets_suma (fijo), points (win_by=1/2 con max_points). Valida: games negativos, max games, empates en set, games mínimos (al menos una dupla debe alcanzar games_per_set), sets máximos, completitud.
- `calculateMatchResult(scores, scoringConfig)` — Calcula ganador, scores para BD, summary string. Solo cuando validateScoreInput retorna complete=true.
- `calculateUpdatedStats(currentStats, matchResult, isWinner, scoringConfig)` — Incrementa estadísticas de group_member (matches, sets, games, points).
- `determineRequiredSets(scores, scoringConfig)` — Cuántos sets se necesitan según estado actual (sets_normal dinámico vs sets_suma fijo).
- `getMaxGamesForSet(scoringConfig)` — Retorna games_per_set + 1.

**`src/lib/scorePersistence.js`** — Persistencia de resultados:
- `saveMatchResult(supabase, matchId, matchResult, winnerId, team1MemberId, team2MemberId, scoringConfig)` — Calcula deltas de stats y llama RPC `save_match_result`.
- `checkGroupPhaseComplete(supabase, tournamentId, categoryId)` — Verifica si todos los partidos de grupo de una categoría están completados.

**`src/lib/postGroupPhase.js`** — Post fase de grupos:
- `processGroupPhaseCompletion(supabase, tournamentId, categoryId, scoringConfig)` — Se ejecuta cuando checkGroupPhaseComplete=true. Rankea grupos con classificationEngine, selecciona clasificados directos + mejores N-ésimos, llena bracket, crea partidos de eliminatoria, los programa en slots disponibles (respetando ocupados). Marca grupos como completados.
- `checkAllCategoriesComplete(supabase, tournamentId)` — Si todos los partidos del torneo están completados, marca `tournaments.status = 'finished'`.

### Flujo de inicio de torneo
1. Organizador presiona "Iniciar Torneo" en widget → `ConfigurationModal` (confirmación)
2. Configura grupos y fase eliminatoria por categoría → cálculos en tiempo real
3. "Generar Vista Previa" → `GenerationPreview` muestra grupos, parejas, partidos
4. "Regenerar sorteo" produce nueva distribución aleatoria (ilimitado)
5. "Siguiente: Cronograma →" → `ScheduleConfigStep` muestra duración inteligente (slider basado en scoring_config), canchas con checkbox, validación de capacidad (grupos + eliminatoria estimada)
6. "Generar Cronograma →" → `SchedulePreview` muestra distribución por día/cancha, puede regenerar
7. "Confirmar e Iniciar Torneo ✓" → `persistTournamentStructure` con scheduleAssignments → RPC atómica → `tournaments.status = 'active'`
8. Widget muestra "Activo — Fase de Grupos" → clic navega a `/tournament/:id/active`
9. Página con tabs Inscritos (acordeones) y Clasificación (swipe de grupos, MatchCards con fecha + hora + cancha)

### Flujo de marcadores (ingreso de resultados)
1. Organizador abre "Marcadores" en nav inferior → `ResultsInputPage` carga torneo activo
2. `ScoreboardPage` muestra DaySwiper con todos los días del torneo (swipe horizontal + dots)
3. Cada día muestra acordeones por categoría con badge "Xp / Yr" (pendientes / registrados)
4. Al expandir: PendingMatchCards arriba (borde celeste, duplas verticales, botón "Registrar →") + CompletedMatchCards abajo (borde verde, resultado + ★ ganador)
5. "Registrar →" abre `ScoreInputModal` (portal en body, centrado, z-9999, body scroll bloqueado)
6. Modal adapta formulario según scoring_config: SetsScoreForm (filas dinámicas) o PointsScoreForm (inputs grandes)
7. Validación en tiempo real (errores inline rojo), ganador calculado automáticamente (card verde)
8. "Guardar resultado" → fase de grupo: RPC `save_match_result` (match + stats atómico) | eliminatoria: UPDATE directo
9. Después de guardar: refetch, partido se mueve a Completados
10. Si fase de grupos completa para una categoría → automáticamente: `processGroupPhaseCompletion` (rankea, clasifica, llena bracket, crea y programa partidos de eliminatoria)

### Modalidades de scoring soportadas
- **sets_normal**: `{ type: "sets_normal", sets_to_win: 2, games_per_set: 6 }` — Mejor de N sets, filas dinámicas, max games_per_set+1 por set, al menos un equipo debe alcanzar games_per_set.
- **sets_suma**: `{ type: "sets_suma", total_sets: 3, games_per_set: 4 }` — Se juegan todos los sets, filas fijas. Empate en sets → gana por diferencia de games.
- **points**: `{ type: "points", points_to_win: 21, win_by: 1|2, max_points: 30? }` — win_by=1: punto directo (ganador=points_to_win exacto). win_by=2: diferencia de 2 requerida, con punto de oro opcional al max_points.

### Restricciones de distribución de cronograma
- **R1**: Sin conflicto de cancha (un slot = un partido)
- **R2**: Sin dupla simultánea en 2 canchas
- **R3**: Máximo 2 partidos consecutivos por dupla sin descanso
- **R-A**: Máximo 2 partidos por dupla por día
- **R-B**: Si 2 partidos en un día, deben estar dentro de 3 slots de distancia
- **R4**: Respetar horarios y breaks de canchas
- **R5**: Solo dentro del rango start_date—end_date
- **R6**: Fase de grupos primero; eliminatoria se programa post-clasificación

- **Pendiente**: Las páginas `/standings` y `/profile` muestran placeholder.

## Skills
- Antes de hacer cualquier cambio de UI o diseño, lee `.claude/skills/ui-ux-pro-max` y sigue sus instrucciones