# DESIGN-SYSTEM-CURRENT.md — RacketTourneys

> Extraído del código sin cambios. Fuentes: `tailwind.config.js`, `src/index.css`, todos los `.jsx`.
> Generado el 2026-03-27.

---

## 1. Colores

### 1.1 Paleta completa (tailwind.config.js)

```
GRUPO BASE (fondos de pantalla)
─────────────────────────────────────────────
base-950  #080909   → fondo raíz (html, body, #root)
base-900  #0f1010   → variante de fondo oscura
base-800  #161818   → definida, sin usos directos encontrados

GRUPO SURFACE (cards, inputs, superficies elevadas)
─────────────────────────────────────────────
surface-900  #1a1c1c   → cards principales, paneles, formularios
surface-800  #212424   → inputs, botones secundarios, avatares
surface-700  #282b2b   → sub-cards (categoría/cancha), badges default, íconos nav
surface-600  #303434   → toggle off, skeleton, progress bar track
surface-500  #3a3e3e   → definida, sin usos directos frecuentes

GRUPO BORDER (bordes)
─────────────────────────────────────────────
border-strong    #3a3e3e   → bordes de botones hover, dashed CTA
border-default   #2a2e2e   → borde estándar de cards e inputs
border-subtle    #1e2222   → separadores internos, nav border-top

GRUPO NEON (acento principal — pelota de raqueta)
─────────────────────────────────────────────
neon-50    #f4ffe0
neon-100   #e2ffa8
neon-200   #ccff61
neon-300   #b8f533   ← PRINCIPAL: CTAs, activo, progreso, logo
neon-400   #a2e020   ← links secundarios, "Ver todos", trend up
neon-500   #84be0e
neon-600   #659606   ← focus ring, botón Crear busy state
neon-700   #4a6e04   ← borde neon activo (inputs focus, score toggles)
neon-800   #334d03   ← borde badge neon, hover dashed
neon-900   #1e2e01   ← bg badge neon, hover fondo dashed, bg CTA nav inactive

GRUPO INK (texto)
─────────────────────────────────────────────
ink-primary    #f0f2f0   → texto principal, headings
ink-secondary  #9aa29a   → texto secundario, valores de tabla
ink-muted      #5c665c   → texto apagado, placeholders, labels, nav inactive
ink-inverse    #0f1010   → texto sobre fondos neon (botones CTA)
```

### 1.2 Colores semánticos de estado

```
ERRORES
─────────────────────────────────────────────
bg       red-950/60  rgba(69,10,10,0.6)   → contenedor error
border   red-900/50  rgba(127,29,29,0.5)  → borde contenedor error
text     red-400     #f87171              → texto de error, ícono RejectedScreen

ADVERTENCIAS / PENDIENTE
─────────────────────────────────────────────
bg       amber-950   (Tailwind built-in)  → badge onboarding warning
border   amber-800/50                     → borde aviso onboarding
text     amber-400   #f59e0b              → texto warnings, ícono PendingScreen, nav Admin

ÉXITO / TENDENCIA POSITIVA
─────────────────────────────────────────────
text     neon-400    #a2e020              → trend ▲ en standings

TENDENCIA NEGATIVA
─────────────────────────────────────────────
text     red-400     #f87171              → trend ▼ en standings
```

### 1.3 Colores inline (no-tokens) encontrados en el código

```
Layout nav background   rgba(21, 23, 23, 0.96)   → glassmorphism bottom nav
Layout nav border       #1e2222                   → (= border-subtle, duplicado inline)
glass utility           rgba(26, 28, 28, 0.85)    → (= surface-900 con opacity)

Nav CTA "Crear" - active    bg: #b8f533, text: #0f1010
Nav CTA "Crear" - inactive  bg: rgba(184,245,51,0.12), border: rgba(184,245,51,0.25)
Nav "Admin" - active        bg: rgba(245,158,11,0.20)
Nav "Admin" - inactive      bg: rgba(245,158,11,0.08)
Nav active dot shadow       rgba(184,245,51,0.6)

Admin approve btn active    bg: #b8f533
Admin approve btn busy      bg: #659606  (= neon-600)
Admin pending badge         rgba(245,158,11,0.15) bg / rgba(245,158,11,0.3) border
Admin history accepted      border: rgba(184,245,51,0.15), icon bg: rgba(184,245,51,0.1)
Admin history rejected      border: rgba(248,113,113,0.15), icon bg: rgba(248,113,113,0.1)
Admin history accepted badge rgba(184,245,51,0.12) bg, #b8f533 text
Admin history rejected badge rgba(248,113,113,0.12) bg, #f87171 text

Spinner arc stroke       #b8f533  (= neon-300)
Spinner track stroke     #212424  (= surface-800)
Spinner inner tennis     #b8f533 fill + #2a2e2e border-stroke
```

### 1.4 Resumen de uso por intención

| Intención | Token / Valor |
|-----------|--------------|
| Fondo principal | `base-950` `#080909` |
| Fondo card | `surface-900` `#1a1c1c` |
| Fondo input / botón secondary | `surface-800` `#212424` |
| Borde estándar | `border-default` `#2a2e2e` |
| Acción primaria (CTA) | `neon-300` `#b8f533` |
| Texto sobre CTA | `ink-inverse` `#0f1010` |
| Texto principal | `ink-primary` `#f0f2f0` |
| Texto secundario | `ink-secondary` `#9aa29a` |
| Texto apagado / placeholder | `ink-muted` `#5c665c` |
| Estado activo nav | `neon-300` `#b8f533` |
| Estado error | `red-400` `#f87171` |
| Estado warning / pendiente | `amber-400` `#f59e0b` |
| Focus ring | `neon-600` `#659606` (30% opacity) |

---

## 2. Tipografía

### 2.1 Fuentes cargadas (index.css)

```css
/* Google Fonts — variable axis opsz 9..40 */
DM Sans  → weights: 300, 400, 500, 600  + italic 400
DM Mono  → weights: 400, 500
```

```js
// tailwind.config.js
fontFamily: {
  sans: ["'DM Sans'", "system-ui", "sans-serif"],   // ← default de toda la app
  mono: ["'DM Mono'", "monospace"],                  // ← números en tabla (font-mono)
}
```

### 2.2 Escala de tamaños en uso

| Clase Tailwind | px | Dónde se usa |
|---|---|---|
| `text-[9px]` | 9px | Timestamp en historial admin (micro-label) |
| `text-[10px]` | 10px | Labels de nav, sección labels uppercase, badges historia |
| `text-[11px]` | 11px | Badges generales (`Badge` component en Dashboard) |
| `text-xs` | 12px | Texto helper, subtítulos, body apagado, errores, fechas |
| `text-sm` | 14px | Body principal, inputs, botones, texto de cards |
| `text-base` | 16px | Títulos de sección (`h2` en Dashboard) |
| `text-xl` | 20px | Títulos de páginas interiores (AdminPanel, CreateTournament) |
| `text-2xl` | 24px | Títulos principales (h1 Dashboard, AuthPage, OnboardingPage) |

### 2.3 Pesos usados

| Clase | Peso | Dónde |
|---|---|---|
| `font-bold` (700) | Bold | Puntos en tabla standings, posición #1 |
| `font-semibold` (600) | Semi-bold | H1/H2, textos de botones CTA, nombres en cards |
| `font-medium` (500) | Medium | Labels de formularios, nav labels, "Ver todos" links |
| _(400 / normal implícito)_ | Regular | Párrafos, descripciones, texto muted |

### 2.4 Letter spacing

| Clase | Valor | Dónde |
|---|---|---|
| `tracking-tight` | -0.025em | Todos los headings (`h1`, títulos de página) |
| `tracking-wide` | 0.025em | Nav labels, badge labels |
| `tracking-widest` | 0.1em | Section labels (`uppercase tracking-widest text-[10px]`) |
| `tracking-widest` | 0.1em | Button text "CREAR TORNEO" (en algunas instancias) |

### 2.5 Line height

No hay `leading-*` explícito en la mayoría de componentes → usa el default de Tailwind (`leading-normal` = 1.5). Excepciones:

```
leading-tight   → h1/h2 con tracking-tight (headings compactos)
leading-relaxed → párrafos explicativos (en ProtectedRoute StatusScreen, notices)
```

---

## 3. Componentes existentes

### 3.1 Botones

#### Primary CTA (neon verde)
```
bg-neon-300 hover:bg-neon-200 active:bg-neon-400
disabled:opacity-30 disabled:cursor-not-allowed
text-ink-inverse font-semibold
py-3.5 rounded-xl
text-sm tracking-wide
shadow-neon-sm hover:shadow-neon-md
transition-all duration-200
```
_Usado en: AuthPage submit, OnboardingPage Continuar/Comenzar, CreateTournamentPage submit_

#### Secondary / Ghost
```
bg-surface-800 border border-border-strong
text-ink-secondary hover:text-ink-primary
py-3.5 rounded-xl text-sm font-semibold
disabled:opacity-40 disabled:cursor-not-allowed
transition-all duration-200
```
_Usado en: ProtectedRoute "Aceptar y Salir" (RejectedScreen)_

#### Icon Button (cuadrado pequeño)
```
w-9 h-9 rounded-xl
bg-surface-800 border border-border-default
flex items-center justify-center
text-ink-secondary hover:text-ink-primary hover:border-border-strong
transition-all duration-200
disabled:opacity-40
```
_Usado en: AdminPanel refresh, CreateTournament back arrow_

#### Link / Ghost Text
```
text-neon-400 text-sm font-medium
hover:text-neon-300 transition-colors
```
_Usado en: "Ver todos" en Dashboard_

#### Add / Dashed CTA
```
w-full py-3[.5] rounded-xl
border[-2] border-dashed border-border-strong
text-ink-muted text-sm font-medium
hover:border-neon-800 hover:text-neon-400 hover:bg-neon-900/[10-20]
transition-all duration-200
flex items-center justify-center gap-2
```
_Usado en: Dashboard "Crear nuevo torneo", CreateTournament "Agregar categoría/cancha"_

#### Toggle (score format)
```
Inactive: bg-surface-800 border-border-default text-ink-secondary hover:border-border-strong
Active:   bg-neon-900/40 border-neon-700 text-neon-300 shadow-neon-sm
py-3 rounded-xl text-sm font-medium border transition-all duration-200
```

#### Nav CTA "Crear" (especial)
```
Container: w-10 h-10 rounded-xl flex items-center justify-center
Active:   bg: #b8f533  color: #0f1010  border: rgba(184,245,51,0.25)
Inactive: bg: rgba(184,245,51,0.12)  color: #b8f533  border: rgba(184,245,51,0.25)
Label: text-[10px] font-medium color: #b8f533 (siempre verde)
```

#### Nav "Admin" (especial)
```
Container: w-10 h-10 rounded-xl flex items-center justify-center
Active:   bg: rgba(245,158,11,0.20)  color: #f59e0b
Inactive: bg: rgba(245,158,11,0.08)  color: #f59e0b
Label: text-[10px] font-medium color: #f59e0b (siempre ámbar)
```

#### Admin Aprobar
```
Active: bg: #b8f533 boxShadow: '0 0 12px rgba(184,245,51,0.2)' text-ink-inverse
Busy:   bg: #659606 no shadow
py-2.5 rounded-xl text-xs font-semibold
disabled:opacity-40 disabled:cursor-not-allowed
```

#### Admin Rechazar
```
bg-surface-800 border-border-default text-ink-secondary
hover:border-red-800/70 hover:text-red-400 hover:bg-red-950/30
py-2.5 rounded-xl text-xs font-semibold border
disabled:opacity-40 disabled:cursor-not-allowed
transition-all duration-200
```

---

### 3.2 Cards

#### Card base (Dashboard `Card` component)
```
bg-surface-900
border border-border-default
rounded-2xl
shadow-card          → 0 1px 3px rgba(0,0,0,0.4)
overflow-hidden
```

#### Card interactiva (torneo clickable)
```
[+ Card base]
active:scale-[0.985] transition-transform duration-150 cursor-pointer
```

#### Card con borde izquierdo neon ("Próximo Partido")
```
[+ Card base]
<div absolute left-0 top-0 bottom-0 w-1 bg-neon-300 rounded-l-2xl shadow-neon-sm />
padding: p-4 pl-5
```

#### Card de sección (SectionCard - formulario)
```
bg-surface-900 border border-border-default rounded-2xl overflow-hidden
├── Header: px-4 py-3 border-b border-border-subtle
│   └── text-ink-secondary text-xs font-semibold uppercase tracking-widest
└── Body: p-4 space-y-4
```

#### Sub-card (CategoryCard / CourtCard)
```
bg-surface-800 border border-border-default rounded-xl p-4 space-y-4
```

#### Admin request card
```
bg-surface-900 border border-border-default rounded-2xl p-4 space-y-4
```

#### Admin history item
```
bg-surface-900 border rounded-xl px-4 py-3
hover:bg-surface-800 active:scale-[0.985]
group relative flex items-center gap-3
transition-all duration-200
Border semántico: accepted → rgba(184,245,51,0.15) | rejected → rgba(248,113,113,0.15)
```

#### StatusScreen card (ProtectedRoute)
```
Icono container: w-16 h-16 rounded-2xl mx-auto
background: #1a1c1c, border: 1px solid #2a2e2e
Wrapper: min-h-screen bg-base-950 flex items-center justify-center px-6
Content: w-full max-w-sm text-center space-y-6
```

#### Skeleton / Loading card
```
h-[N] bg-surface-900 border border-border-default rounded-2xl animate-pulse
```

---

### 3.3 Formularios

#### Input
```
w-full
bg-surface-800 border border-border-default rounded-xl
px-4 py-3
text-sm text-ink-primary placeholder-ink-muted
focus:outline-none focus:border-neon-600 focus:ring-1 focus:ring-neon-600/30
transition-all duration-200
```
_Altura resultante: ~44px (py-3 + text-sm line-height)_

#### TextArea
```
[+ Input sin py-3 / con rows=3]
resize-none
```

#### Select
```
[+ Input]
appearance-none
+ chevron SVG absoluto (right-3, pointer-events-none)
```

#### Label de campo
```
text-[10px] font-semibold uppercase tracking-widest text-ink-muted mb-1.5
(implementado como componente <FieldLabel> en CreateTournamentPage)
```

#### Toggle switch
```
Container: w-11 h-6 rounded-full transition-colors duration-200
  checked:   bg-neon-300
  unchecked: bg-surface-600
Thumb: absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
  checked:   translate-x-5
  unchecked: translate-x-0.5
```

#### Contenedor de error de campo
```
bg-red-950/60 border border-red-900/50 rounded-xl px-4 py-3
text-red-400 text-xs [leading-relaxed]
```

#### Input con ícono prefijo (username)
```
Wrapper: relative
Prefix: absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none
Input: pl-8 pr-4 py-3
Suffix checkmark: absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neon-300
```

#### Auth tabs (mode switcher)
```
Container: flex bg-surface-800 rounded-2xl p-1 mb-6 border border-border-subtle
Tab active:   bg-neon-300 text-ink-inverse shadow-neon-sm
Tab inactive: text-ink-muted hover:text-ink-secondary
py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200
```

---

### 3.4 Navegación inferior (Layout)

```
Posición: fixed bottom-0 left-0 w-full z-50
Altura:   h-16 (64px)
Max width: max-w-lg mx-auto px-1
Fondo:    rgba(21, 23, 23, 0.96) + backdrop-filter: blur(16px)
Border:   border-top 1px solid #1e2222
Safe area: paddingBottom: env(safe-area-inset-bottom, 0px)

Ítem estándar:
  flex flex-col items-center justify-center flex-1 h-full gap-0.5
  active:opacity-70 transition-opacity duration-150

  Ícono: w-6 h-6 (24×24px)
  Label: text-[10px] font-medium tracking-wide
  Active color:   #b8f533
  Inactive color: #5c665c

  Indicador activo: absolute top-2, w-1 h-1 rounded-full bg-neon-300
                    boxShadow: 0 0 6px rgba(184,245,51,0.6)
```

Ítems por rol:
- **player** (4): Inicio `/dashboard`, Torneos `/tournaments`, Clasificación `/standings`, Perfil `/profile`
- **organizer** (5): Inicio, Torneos `/organizer/hub`, Crear `/tournaments/create`, Marcadores `/results/input`, Perfil
- **admin** (3): Inicio, Admin `/admin`, Perfil

---

### 3.5 Badges

```
Componente <Badge> en DashboardPage:
  Container: inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium

  default: bg-surface-700 (#282b2b) text-ink-secondary (#9aa29a)
  neon:    bg-neon-900 text-neon-300 border border-neon-800
  warning: bg-amber-950 text-amber-400 border border-amber-900

Admin pending badge (inline):
  px-2.5 py-0.5 rounded-full text-[10px] font-semibold
  bg: rgba(245,158,11,0.12) border: rgba(245,158,11,0.25) color: #f59e0b

Admin history badge (inline):
  px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide
  accepted: bg rgba(184,245,51,0.12) color #b8f533
  rejected: bg rgba(248,113,113,0.12) color #f87171

Onboarding role selection indicator:
  w-5 h-5 rounded-full border; active: bg-neon-300 border-neon-300; inactive: border-border-strong
```

---

### 3.6 Avatar / Iniciales

```
Dashboard header avatar:
  w-11 h-11 rounded-full bg-neon-900 border border-neon-800
  shadow-neon-sm
  text-neon-300 text-lg font-bold uppercase

Admin request avatar (inicial):
  w-11 h-11 rounded-xl flex items-center justify-center
  bg: rgba(184,245,51,0.1), border: rgba(184,245,51,0.2), color: #b8f533
  font-bold text-sm

Admin history action icon:
  w-8 h-8 rounded-lg
  accepted: bg rgba(184,245,51,0.1) border rgba(184,245,51,0.2)
  rejected: bg rgba(248,113,113,0.1) border rgba(248,113,113,0.2)
  group-hover:scale-105 transition-transform duration-200
```

---

### 3.7 Tabla (Standings)

```
Grid: grid-cols-[28px_1fr_36px_36px_36px_40px] gap-2 px-4

Header row: py-2.5 border-b border-border-subtle
  text-ink-muted text-[10px] font-semibold uppercase tracking-wider

Data row: py-3 items-center transition-colors hover:bg-surface-800/50
  [+ border-b border-border-subtle en filas no-últimas]
  [+ bg-neon-900/20 en pos. 1]

Posición badge:
  pos 1: w-6 h-6 rounded-full bg-neon-300 text-ink-inverse text-[11px] font-bold
  pos 2: w-6 h-6 rounded-full bg-surface-600 text-ink-secondary text-[11px] font-bold
  pos 3+: text-ink-muted text-xs

Nombre + TrendIcon: flex items-center gap-1.5 min-w-0
  trend up   → text-neon-400 "▲"
  trend down → text-red-400  "▼"
  trend same → text-ink-muted "—"

Diferencia:
  starts '+' → text-neon-400 font-mono
  starts '-' → text-red-400 font-mono
  else       → text-ink-muted font-mono

Puntos:
  pos 1 → text-neon-300 text-sm font-bold
  otros → text-ink-primary text-sm font-bold
```

---

### 3.8 Spinners / Loading

#### AppLoader (pantalla completa)
```
bg-base-950 flex flex-col items-center justify-center gap-5

Spinner SVG 56×56:
  Track:  circle r=25 stroke #212424 strokeWidth=2.5
  Arc:    path M28 3 A25 25 0 0 1 53 28  stroke #b8f533 strokeWidth=2.5 strokeLinecap=round
  Rotate: animate-spin duration 1.2s

Inner icon (tennis/paddle):
  w-6 h-6, circle stroke #2a2e2e + path fill #b8f533 opacity=0.8

Labels: text-ink-primary text-sm font-medium + text-ink-muted text-xs uppercase animate-pulse
```

#### SyncOverlay (inside Layout, reemplaza children)
```
Idéntico al AppLoader pero 48×48 y centrado en la pantalla de contenido
```

---

### 3.9 Barra de progreso (ProgressBar)

```
Track:  w-full h-1 bg-surface-600 rounded-full overflow-hidden
Fill:   h-full bg-neon-300 rounded-full transition-all duration-500
```

---

### 3.10 Onboarding progress dots

```
Container: flex items-center justify-center gap-2 pt-14 pb-10
Dot: h-1.5 rounded-full transition-all duration-300
  active (step >= N): w-8 bg-neon-300
  inactive:           w-4 bg-surface-600
```

---

## 4. Espaciado

### 4.1 Contenedor y layout

```
Ancho máximo de contenido:  max-w-lg (512px) mx-auto px-4
Padding horizontal páginas: px-4 (16px)
Padding superior páginas:   pt-6 (24px)
Padding inferior páginas:   pb-8 (32px) o pb-24 (96px para nav clearance)

Altura nav inferior:        h-16 (64px)
Clearance mínimo nav:       main className="pb-24"
```

### 4.2 Escala de gaps usada

```
gap-0.5  →  2px   (icono + label en nav)
gap-1    →  4px   (badges en meta-info partido)
gap-1.5  →  6px   (trend + nombre en tabla)
gap-2    →  8px   (gap general entre badges/inputs)
gap-3    →  12px  (entre cards, inputs en grid)
gap-4    →  16px  (padding interno de cards)
gap-5    →  20px  (entre secciones en form)
```

### 4.3 Espaciado vertical (space-y / margin)

```
space-y-1.5  →  6px   label + input
space-y-2    →  8px   historial admin items
space-y-3    →  12px  cards en lista, categorías/canchas
space-y-4    →  16px  fields dentro de SectionCard
space-y-5    →  20px  secciones del formulario
space-y-6    →  24px  secciones de página (Dashboard)
space-y-8    →  32px  secciones Admin Panel

mb-1     → 4px   gap dots → page
mb-1.5   → 6px   label → input
mb-3     → 12px  título sección → contenido
mb-4     → 16px  role selector → button
mb-6     → 24px  grupos en onboarding
mb-8     → 32px  hero de onboarding
```

### 4.4 Padding interno de componentes

```
Card genérica:         p-4 (16px all sides)
Card "Próximo Partido": p-4 pl-5 (izquierda 20px por el borde neon)
SectionCard header:    px-4 py-3
SectionCard body:      p-4
Input/Select/TextArea: px-4 py-3
Button CTA:            py-3.5 (14px vertical)
Button secondary/icon: py-2.5 (10px) o h-9 w-9
Badge:                 px-2 py-0.5
Nav ítem:              h-16 flex-1
```

### 4.5 Breakpoints responsivos

```
No hay breakpoints custom en tailwind.config.js.
Se usan los defaults de Tailwind v4 (sm: 640, md: 768, lg: 1024, xl: 1280).

IMPORTANTE: El proyecto NO usa ninguna clase responsive (sm:, md:, lg:, etc.)
en los componentes actuales. Todo el layout es mobile-first de columna única.
El max-w-lg actúa como único "cap" en pantallas grandes.
```

---

## 5. Efectos

### 5.1 Transiciones

```
transition-all duration-200    → estándar universal (botones, inputs, borders, colores)
transition-colors              → solo color (links "Ver todos", nav colores)
transition-opacity duration-150 → tap en nav items (active:opacity-70)
transition-transform duration-150 → scale en cards clickables
transition-all duration-300    → onboarding dots (width)
transition-all duration-500    → progress bar (width fill)
```

### 5.2 Sombras (boxShadow)

```js
// tailwind.config.js
"neon-sm": "0 0 12px rgba(184, 245, 51, 0.15)"  → CTA primario, avatar neon, borde neon activo
"neon-md": "0 0 24px rgba(184, 245, 51, 0.20)"  → CTA hover
"card":    "0 1px 3px rgba(0,0,0,0.4)"          → cards en general

// Inline
Nav dot activo:       boxShadow: '0 0 6px rgba(184,245,51,0.6)'
Admin approve active: boxShadow: '0 0 12px rgba(184,245,51,0.2)'
```

### 5.3 Animaciones custom

```js
// tailwind.config.js
"fade-up": {
  keyframes: { "0%": opacity 0 + translateY(8px), "100%": opacity 1 + translateY(0) }
  duration: 0.3s
  easing:   ease-out
  fill:     both
  clase:    animate-fade-up
  uso:      wrapper principal de cada página (entrada)
}

"pulse-neon": {
  keyframes: { "0%,100%": boxShadow 0 0 8px rgba(184,245,51,0.15),
               "50%":     boxShadow 0 0 20px rgba(184,245,51,0.35) }
  duration: 2s
  easing:   ease-in-out
  iteración: infinite
  clase:    animate-pulse-neon
  uso:      dot "En vivo" del próximo partido
}

// Tailwind built-in usadas:
animate-spin     → spinners (App loader, SyncOverlay, Admin refresh btn)  duration override: 1.1s–1.2s inline
animate-pulse    → texto "Verificando sesión" + skeletons (duration default 2s)
```

### 5.4 Scale / Transform en interacciones

```
active:scale-[0.985]  → cards de torneos (Dashboard), admin history items
group-hover:scale-105 → action icon en historial admin
hover:scale-[...]     → no se usa actualmente para scale-up en botones
```

### 5.5 Bordes y border-radius

```js
// tailwind.config.js (overrides de Tailwind defaults)
xl:  12px   → inputs, botones, sub-cards, icon buttons, badges grandes
2xl: 16px   → cards principales, containers primarios
3xl: 20px   → definido, no encontrado en uso explícito

// Tailwind built-in también usados:
rounded-full  → avatares, badges, dots de nav, toggle thumb, progress bar
rounded-lg    → action icons en admin (w-8 h-8)

```

### 5.6 Efectos de glassmorphism

```css
/* index.css — utilidad .glass */
.glass {
  background: rgba(26, 28, 28, 0.85);      /* surface-900 con 85% opacity */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Layout nav (inline) */
background: rgba(21, 23, 23, 0.96)         /* más opaco */
backdrop-filter: blur(16px)
-webkit-backdrop-filter: blur(16px)
```

---

## 6. Accessibility

### 6.1 Dark mode

```
El proyecto es EXCLUSIVAMENTE dark mode.
No existe toggle light/dark ni media query prefers-color-scheme.
Todos los tokens están definidos para dark mode únicamente.
```

### 6.2 Focus states (inputs y selects)

```
focus:outline-none                        → elimina el outline nativo del browser
focus:border-neon-600                     → borde toma color neon-600 (#659606)
focus:ring-1 focus:ring-neon-600/30       → ring exterior rgba(101,150,6,0.3)
transition-all duration-200               → animado
```
Botones: **no tienen focus styles definidos** (solo los inputs/selects).

### 6.3 Estados disabled

```
disabled:opacity-30 disabled:cursor-not-allowed   → botones CTA primarios
disabled:opacity-40 disabled:cursor-not-allowed   → botones secundarios, icon buttons
```

### 6.4 Tap highlight

```css
/* index.css */
-webkit-tap-highlight-color: transparent;   → elimina el flash azul en móvil
```

### 6.5 Análisis de contraste (WCAG 2.1)

| Color texto | Fondo | Ratio (aprox.) | AA Normal | AAA Normal |
|---|---|---|---|---|
| `ink-primary` #f0f2f0 | `base-950` #080909 | ~18.2:1 | ✅ PASS | ✅ PASS |
| `ink-secondary` #9aa29a | `base-950` #080909 | ~7.8:1 | ✅ PASS | ✅ PASS |
| `ink-muted` #5c665c | `base-950` #080909 | ~3.6:1 | ❌ FAIL | ❌ FAIL |
| `ink-muted` #5c665c | `surface-900` #1a1c1c | ~3.3:1 | ❌ FAIL | ❌ FAIL |
| `neon-300` #b8f533 | `base-950` #080909 | ~15.8:1 | ✅ PASS | ✅ PASS |
| `neon-400` #a2e020 | `base-950` #080909 | ~12.5:1 | ✅ PASS | ✅ PASS |
| `amber-400` #f59e0b | `base-950` #080909 | ~9.6:1 | ✅ PASS | ✅ PASS |
| `red-400` #f87171 | `base-950` #080909 | ~7.4:1 | ✅ PASS | ✅ PASS |
| `ink-inverse` #0f1010 | `neon-300` #b8f533 | ~15.3:1 | ✅ PASS | ✅ PASS |

> ⚠️ **Problema de contraste identificado**: `ink-muted` (#5c665c) sobre fondos oscuros no alcanza el ratio 4.5:1 requerido por WCAG AA para texto normal. Se usa extensivamente como placeholder, label, texto helper y nav inactive. Este es el principal gap de accesibilidad.

### 6.6 ARIA y semántica

```
No hay atributos aria-* en ningún componente.
No hay role="..." customizados.
No hay aria-live ni aria-alert para errores de formulario.
No hay aria-label en botones de sólo icono (icon buttons).
No hay skip links.

Elementos semánticos HTML usados:
  <header>   → en DashboardPage, AdminPanelPage, CreateTournamentPage
  <nav>      → en Layout (bottom nav)
  <section>  → en DashboardPage (torneos, clasificación)
  <main>     → NO se usa (el wrapper es <div className="pb-24">)
  <form>     → en AuthPage, CreateTournamentPage
  <label>    → en AuthPage (con className, sin for/htmlFor explícito)
  <button>   → mayoritariamente usados correctamente
  <h1><h2><h3> → usados en páginas pero sin jerarquía consistente en toda la app
```

### 6.7 Reducción de movimiento

```
No hay prefers-reduced-motion implementado.
Las animaciones (fade-up, pulse-neon, animate-spin, animate-pulse)
no tienen fallbacks para usuarios con vestibular disorders.
```

### 6.8 Touch targets

```
Botones CTA:     py-3.5 text-sm → altura ~44px ✅
Icon buttons:    w-9 h-9 → 36px ⚠️ (bajo el mínimo 44px recomendado)
Nav items:       h-16 flex-1 → 64px ✅
Toggle switch:   w-11 h-6 → 44×24px ⚠️ (altura 24px)
Remove buttons:  w-7 h-7 → 28px ❌
```

### 6.9 Scroll y viewport

```css
/* index.css */
overscroll-behavior: none;           → previene rubber-band en iOS
::-webkit-scrollbar { width: 0; }    → scrollbar invisible
html, body, #root { height: 100%; }  → evita altura incorrecta en mobile browsers
```

PWA usa `min-h-[100dvh]` en Layout → viewport correcto considerando barras de browser dinámicas.

---

## Resumen rápido

| Propiedad | Valor |
|-----------|-------|
| Modo de color | Dark-only |
| Color primario | `#b8f533` (neon-300) |
| Fondo raíz | `#080909` (base-950) |
| Fondo card | `#1a1c1c` (surface-900) |
| Texto principal | `#f0f2f0` (ink-primary) |
| Fuente principal | DM Sans (300, 400, 500, 600) |
| Fuente mono | DM Mono (400, 500) |
| Radio estándar | 12px (xl) / 16px (2xl) |
| Transición estándar | `transition-all duration-200` |
| Contenedor max | 512px (max-w-lg) |
| Mobile-only layout | Sí (sin breakpoints responsive en uso) |
| Focus indicator | `border-neon-600` + `ring-neon-600/30` (solo inputs) |
| ARIA | No implementado |
| Reduced motion | No implementado |
| Contraste crítico | ⚠️ ink-muted (~3.5:1) — falla WCAG AA |
