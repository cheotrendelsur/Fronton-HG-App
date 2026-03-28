# CLAUDE.md — RacketTourneys

## Descripción del proyecto

**RacketTourneys** es una Progressive Web App (PWA) para la gestión de torneos de deportes de raqueta (pádel, tenis). Permite a jugadores consultar torneos, partidos y clasificaciones, y a organizadores crear y gestionar torneos. Cuenta con un panel de administración para aprobar o rechazar solicitudes de organizador.

La UI está en **español**. El dashboard actual usa datos mock; la integración real con Supabase está planificada para Fase 2.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 (`react`, `react-dom`) |
| Build tool | Vite 8 (`@vitejs/plugin-react`) |
| Routing | React Router DOM 7 |
| Estilos | Tailwind CSS 4 (`@tailwindcss/postcss`) |
| Backend / Auth / DB | Supabase (`@supabase/supabase-js` ^2.99) |
| Persistencia de sesión | IndexedDB via `idb-keyval` |
| PWA | `vite-plugin-pwa` + Workbox |
| Lint | ESLint 9 + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` |
| Deploy | Vercel (`vercel.json`) |

### Fuentes
- `DM Sans` (sans-serif principal) — Google Fonts
- `DM Mono` (monospace) — Google Fonts

---

## Estructura de carpetas

```
racket-tourneys/
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── icon-512x512.png
│   └── icons/           # íconos PWA (72–512 px)
├── src/
│   ├── assets/          # imágenes estáticas (hero.png, etc.)
│   ├── components/
│   │   ├── Layout.jsx       # Shell con nav inferior por rol
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx  # Estado global de auth + perfil
│   ├── hooks/
│   │   └── useVisibilityRefresh.js  # Re-sync de sesión al volver al tab
│   ├── lib/
│   │   └── supabaseClient.js  # Singleton Supabase + refreshSessionSafely()
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── DashboardPage.jsx        # Mock data — Fase 1
│   │   ├── CreateTournamentPage.jsx # Solo organizadores
│   │   ├── OrganizerHubPage.jsx     # Solo organizadores
│   │   ├── ResultsInputPage.jsx     # Solo organizadores
│   │   └── AdminPanelPage.jsx       # Solo admin
│   ├── App.jsx          # Rutas + guards de rol
│   ├── index.css        # Imports de fuentes + Tailwind + utilidades
│   └── main.jsx
├── supabase/            # Config local de Supabase CLI
├── .env                 # Variables de entorno (no commitear)
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── vercel.json
```

---

## Sistema de roles y rutas

| Rol | Acceso |
|-----|--------|
| `player` | `/dashboard`, `/tournaments`, `/standings`, `/profile` |
| `organizer` | Todo lo anterior + `/organizer/hub`, `/tournaments/create`, `/results/input` |
| `admin` | `/dashboard`, `/admin`, `/profile` |

### Flujo de auth
1. Usuario se registra/inicia sesión en `/auth`
2. Si no tiene `username` + `role` en `profiles` → redirige a `/onboarding`
3. En onboarding elige rol (player o organizer) y username
4. Si elige `organizer` → `status: 'pending'`; necesita aprobación del admin
5. Admin aprueba → `status: 'active'` | Admin rechaza → se invoca Edge Function `delete-user` y se registra en `organizer_requests_history`

---

## Tablas de Supabase relevantes

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Datos del usuario (`id`, `username`, `role`, `status`, `email`) |
| `organizer_requests_history` | Historial de solicitudes de organizador (`action`: `accepted` / `rejected`) |

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

### Paleta de colores (tailwind.config.js)
| Token | Hex | Uso |
|-------|-----|-----|
| `base-950` | `#080909` | Fondo de pantalla |
| `base-900` | `#0f1010` | Variante de fondo |
| `surface-900` | `#1a1c1c` | Cards / inputs |
| `surface-800` | `#212424` | Superficie elevada |
| `neon-300` | `#b8f533` | Acento principal (CTA, activo, progreso) |
| `ink-primary` | `#f0f2f0` | Texto principal |
| `ink-muted` | `#5c665c` | Texto apagado |
| `border-default` | `#2a2e2e` | Bordes de cards |

### Sombras personalizadas
- `shadow-neon-sm` — `0 0 12px rgba(184,245,51,0.15)`
- `shadow-neon-md` — `0 0 24px rgba(184,245,51,0.20)`
- `shadow-card` — `0 1px 3px rgba(0,0,0,0.4)`

### Animaciones custom
- `animate-fade-up` — entrada suave (0.3s ease-out)
- `animate-pulse-neon` — pulso verde neón (2s)

### Utilidades CSS propias
- `.glass` — glassmorphism con `backdrop-filter: blur(16px)`

---

## Convenciones de código

- Archivos de componentes: **PascalCase** (`.jsx`)
- Hooks: **camelCase** prefijado con `use` (`.js`)
- Contextos: patrón Context + Provider + hook (`useAuth`)
- Supabase client: singleton exportado desde `src/lib/supabaseClient.js`
- Sesión almacenada en **IndexedDB** (no localStorage), clave `rackettourneys-auth-v2`
- Refresh de sesión al volver al tab via `visibilitychange` (manejado en `AuthContext` y `useVisibilityRefresh`)
- Guardia de rutas inline en `App.jsx` (`OrganizerRoute`, `AdminRoute`, `ProtectedRoute`)
- SVG de íconos inline en los componentes (sin librería externa)
- Datos mock marcados con comentario `// Datos mock (se reemplazarán en Fase 2)`

---

## Estado del proyecto

- **Fase 1 (actual)**: Auth, onboarding, roles, admin panel funcional con Supabase. Dashboard con datos mock.
- **Fase 2 (pendiente)**: Integración real de torneos, partidos y clasificación con Supabase. Las páginas `/tournaments`, `/standings`, `/profile` muestran placeholder.
