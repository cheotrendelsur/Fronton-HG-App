# DESIGN-ARCHITECTURE.md — Frontón HGV

> Documento de referencia definitivo del sistema de diseño. Cualquier modificación futura debe seguir estas especificaciones al pie de la letra.

---

## 1. PALETA DE COLORES

### 1.1 Zona Oscura (Splash + Login + Onboarding)

| Token | Hex | Uso |
|-------|-----|-----|
| `base-950` / `base-900` | `#1E2024` | Fondo principal splash/login/onboarding |
| `base-800` | `#24282C` | Superficie secundaria oscura |
| `surface-900` | `#2A2D33` | Cards/inputs zona oscura, glass overlay |
| `surface-800` | `#32363D` | Superficie elevada oscura |
| `surface-700` | `#3A3D44` | Borde default zona oscura |
| `surface-600` | `#4B5563` | Borde fuerte, hover states |
| `surface-500` | `#6B7280` | Texto muted, bordes medios |

| Token | Hex | Uso |
|-------|-----|-----|
| `ink-primary` | `#E5E7EB` | Texto principal (zona oscura) |
| `ink-secondary` | `#9CA3AF` | Texto secundario |
| `ink-muted` | `#6B7280` | Texto terciario/deshabilitado |
| `ink-inverse` | `#1F2937` | Texto oscuro (zona clara) |

| Token | Hex | Uso |
|-------|-----|-----|
| `border-strong` | `#4B5563` | Divisores prominentes |
| `border-default` | `#3A3D44` | Divisores estándar |
| `border-subtle` | `#2A2D33` | Separadores mínimos |

### 1.2 Zona Clara (Dashboard, Torneos, Admin, Formularios)

| Token | Hex | Uso |
|-------|-----|-----|
| `pearl-50` | `#FFFFFF` | Cards, modales, inputs |
| `pearl-100` | `#F2F3F5` | Fondo principal de página |
| `pearl-200` | `#E8F4FA` | Tinte celeste suave (nav, badges activos) |
| `pearl-300` | `#D0E5F0` | Bordes celeste sutiles |

Colores inline usados en zona clara:

| Hex | Uso |
|-----|-----|
| `#FFFFFF` | Fondo de cards, modales, inputs |
| `#F2F3F5` | Fondo de página, header |
| `#F9FAFB` | Fondo de sub-cards (categoría, cancha) |
| `#F3F4F6` | Fondo de botones secundarios, skeletons, badges neutros |
| `#E8EAEE` | Borde de cards en dashboard/torneos |
| `#E8F4FA` | Fondo badges celeste, nav inferior, pill activo |
| `#E5E7EB` | Fondo barra progreso, toggle inactivo |
| `#E0E2E6` | Borde estándar de cards, inputs, modales |
| `#D1D5DB` | Drag handle modal, acento lateral borrador/historial |
| `#D0E5F0` | Borde nav inferior, borde badge celeste |
| `#1F2937` | Texto principal zona clara (títulos, nombres) |
| `#4B5563` | Texto botón secundario |
| `#6B7280` | Texto secundario, labels, subtítulos |
| `#9CA3AF` | Texto muted, hints, placeholders |

### 1.3 Acento Primario — Celeste

| Token | Hex | Uso |
|-------|-----|-----|
| `neon-300` / `celeste` | `#6BB3D9` | **ACENTO PRINCIPAL**: CTAs, botones, focus, progreso, tabs activos, nav activo |
| `neon-400` / `celeste-hover` | `#5A9BBF` | Hover de botones primarios |
| `neon-200` | `#A8D8EA` | Celeste claro |
| `celeste-light` | `#E8F4FA` | Fondo de badges activos, fondo nav, seleccionados |
| `celeste-text` | `#3A8BB5` | Texto sobre fondo celeste-light |

> **REGLA**: Celeste `#6BB3D9` es el UNICO color de acción en toda la app. Todos los CTAs, links, focus states y elementos interactivos usan celeste.

### 1.4 Acento Secundario — Dorado (SOLO badges)

| Token | Hex | Uso |
|-------|-----|-----|
| `dorado` | `#D4A827` | Estrellas, destacados, ganadores |
| `dorado-light` | `#FFF5D6` | Fondo de badges dorados |
| `dorado-text` | `#92750F` | Texto sobre fondo dorado |
| Borde dorado | `#F5E6A3` | Borde sutil de badges dorados |

> **REGLA**: Dorado NUNCA se usa en botones. Es EXCLUSIVO para badges de estado pendiente, estrellas y logros.

### 1.5 Colores Semánticos

| Contexto | Color | Light BG | Texto | Uso |
|----------|-------|----------|-------|-----|
| Success | `#22C55E` / `#16A34A` | `#F0FDF4` | `#16A34A` | Aprobado, finalizado, check |
| Danger | `#EF4444` | `#FEF2F2` | `#EF4444` | Rechazar, eliminar, errores |
| Warning | `#F59E0B` | `#FFFBEB` | `#F59E0B` | Categoría llena, precauciones |
| Info | `#3B82F6` | `#EFF6FF` | `#3B82F6` | Torneo en curso |
| Error border | — | — | — | `#FECACA` (borde), `#FEF2F2` (fondo) |
| Success border | — | — | — | `#BBF7D0` (borde), `#F0FDF4` (fondo) |

### 1.6 Identidad Gallega (escudo)

| Token | Hex | Uso |
|-------|-----|-----|
| `azul-marino` | `#1B3A5C` | Tinte splash/login (gradiente radial) |

---

## 2. TIPOGRAFIA

### 2.1 Familias

| Fuente | Tipo | Uso |
|--------|------|-----|
| **DM Sans** | Sans-serif | Todo el texto: títulos, body, labels, botones |
| **DM Mono** | Monospace | Datos numéricos, scores, tabular-nums |

Pesos disponibles DM Sans: 300, 400, 500, 600, 700 + italic 400.
Pesos disponibles DM Mono: 400, 500.

### 2.2 Escala Tipográfica

| Nivel | Tamaño | Peso | Tracking | Ejemplo |
|-------|--------|------|----------|---------|
| H1 (página) | `text-2xl` (22px) | 700 | `-0.02em` | "Bienvenido a Frontón HGV" |
| H2 (sección) | `text-xl` (20px) | 600 | `-0.01em` | "Panel de Administración" |
| Splash título | 20px | 600 | `0.12em` | "FRONTÓN HGV" |
| Card título | `text-base` (16px) | 600 | normal | Nombre de torneo en modal |
| Card subtítulo | `text-sm` (14px) | 600 | normal | Nombre torneo en widget |
| Body | `text-sm` (14px) | 400-500 | normal | Texto general |
| Small | `text-xs` (12px) | 400-500 | normal | Info secundaria, fechas |
| Label | 10px | 600 | `tracking-widest` (0.08em) | `uppercase` — labels de campos |
| Micro | 10px | 400 | normal | Hints, descripciones pequeñas |
| Badge | 10px | 500-600 | normal | Badges de estado |
| Timestamp | 9px | 600 | `tracking-wide` (0.06em) | Fechas en historial |

### 2.3 Estilos especiales

- `tabular-nums` para datos numéricos (progreso, contadores)
- `truncate` para textos que pueden desbordar (nombres de torneo, emails)
- `text-balance` para wrapping equilibrado (CSS utility custom)
- `italic` solo en tagline del splash ("Por nuestro frontón y raíces")

---

## 3. PATRONES DE COMPONENTES

### 3.1 Cards

**Card estándar (zona clara):**
```
background: #FFFFFF
border: 1px solid #E8EAEE
border-radius: 16px (rounded-2xl)
padding: 16px (p-4)
shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
```

**Card con acento lateral (torneos):**
```
border-left: 3px solid [color-estado]
  - Activo: #6BB3D9
  - Borrador: #D1D5DB
  - Finalizado: #22C55E
  - Historial (readonly): #D1D5DB + opacity 60%
```

**Sub-card (categoría/cancha dentro de formulario):**
```
background: #F9FAFB
border: 1px solid #E0E2E6
border-radius: 12px (rounded-xl)
padding: 16px (p-4)
```

**Section card (formularios):**
```
background: #FFFFFF
border: 1px solid #E0E2E6
border-radius: 16px (rounded-2xl)
overflow: hidden

Header:
  padding: 16px horizontal, 12px vertical
  border-bottom: 1px solid #E8EAEE
  título: 12px, 600, uppercase, tracking-widest, color #6B7280

Body:
  padding: 16px
  space-y: 16px
```

### 3.2 Botones

**Primario (celeste):**
```
background: #6BB3D9
color: #FFFFFF
border: none
border-radius: 12px (rounded-xl)
padding: 10-14px vertical
font-weight: 600
font-size: 14px
shadow: 0 0 12px rgba(107,179,217,0.15)
hover: background #5A9BBF
active: scale(0.98-0.99)
disabled: opacity 40%, cursor not-allowed
transition: all 200ms
```

**Secundario (cancelar):**
```
background: #F3F4F6
color: #4B5563
border: none (o 1px solid #E0E2E6 en contextos con borde)
border-radius: 12px
padding: 12px
font-weight: 500
```

**Peligroso (rechazar/eliminar):**
```
background: #EF4444
color: #FFFFFF
border-radius: 12px
font-weight: 600
```

**Toggle selector (sets/puntos, normal/suma, cierre):**
```
Activo:
  background: #E8F4FA
  border: 1px solid #6BB3D9
  color: #3A8BB5

Inactivo:
  background: #FFFFFF
  border: 1px solid #E0E2E6
  color: #6B7280

border-radius: 12px
font-weight: 500-600
transition: all 200ms
```

**Añadir (dashed border):**
```
background: transparent
border: 1px dashed #E0E2E6
color: #6B7280
border-radius: 12px
padding: 12px
con icono SVG circular "+"
```

**Botón de icono (back, refresh, close):**
```
background: #FFFFFF (o #F3F4F6 para close en modal)
border: 1px solid #E0E2E6
color: #6B7280
border-radius: 12px
width/height: 36px (w-9 h-9)
display: flex items-center justify-center
```

### 3.3 Inputs de Formulario

**Input de texto/número/fecha/hora:**
```
background: #FFFFFF
border: 1px solid #E0E2E6
border-radius: 12px (rounded-xl)
padding: 12px 16px (px-4 py-3)
font-size: 14px
color: #1F2937
placeholder: #9CA3AF
focus: border #6BB3D9, ring 1px rgba(107,179,217,0.30)
disabled: opacity 50%
transition: all 200ms
```

**TextArea:** Igual que input + `resize: none`, `rows: 3`.

**Select:** Igual que input + `appearance: none` con chevron SVG absoluto a la derecha en `#9CA3AF`.

**Label de campo:**
```
font-size: 10px
font-weight: 600
text-transform: uppercase
letter-spacing: tracking-widest (0.08em)
color: #6B7280
margin-bottom: 6px (mb-1.5)
```

**Error de validación:**
```
border input: 1px solid #EF4444
texto error: #EF4444 o #DC2626, 11px, mt-1

Bloque error general:
  background: #FEF2F2
  border: 1px solid #FECACA
  border-radius: 12px
  padding: 12px 16px
  texto: #EF4444, 12px
```

### 3.4 Toggle Switch

```
Track:
  width: 44px, height: 24px
  border-radius: full
  background: #6BB3D9 (on) / #E5E7EB (off)
  transition: background 200ms

Thumb:
  width: 20px, height: 20px
  background: #FFFFFF
  border-radius: full
  shadow: 0 1px 3px rgba(0,0,0,0.08)
  transform: translateX(20px) (on) / translateX(2px) (off)
  transition: transform 200ms
```

### 3.5 Modales

**Overlay:**
```
background: rgba(0,0,0,0.5)
backdrop-filter: blur(4px)
position: fixed inset-0 z-50
```

**Panel:**
```
background: #FFFFFF
border: 1px solid #E0E2E6
border-radius: 20px (rounded-3xl) — en mobile solo top
max-height: 90vh (mobile) / 85vh (desktop)
display: flex flex-col
shadow: shadow-card
```

**Drag handle (mobile only):**
```
background: #D1D5DB
width: 40px, height: 4px
border-radius: full
margin: 12px auto 4px
```

**Botón cerrar:**
```
background: #F3F4F6
border: 1px solid #E0E2E6
color: #6B7280
width/height: 32px (w-8 h-8)
border-radius: 12px
```

### 3.6 Tabs en Modal

```
Container: border-bottom 1px solid #E0E2E6

Tab activo:
  color: #6BB3D9
  underline: span absolute bottom-0, height 2px, background #6BB3D9

Tab inactivo:
  color: #6B7280

font-size: 12px
font-weight: 500
padding: 10px vertical
transition: all 200ms
```

### 3.7 Badges

**Badge neutro:**
```
background: #F3F4F6
color: #6B7280
border: 1px solid #E0E2E6
border-radius: full
padding: 2px 8px
font-size: 10px, font-weight: 500
```

**Badge celeste (inscripciones, activo):**
```
background: #E8F4FA
color: #3A8BB5
border: 1px solid #D0E5F0
```

**Badge dorado (pendiente):**
```
background: #FFF5D6
color: #92750F
border: 1px solid #F5E6A3
```

**Badge verde (aprobado, finalizado):**
```
background: #F0FDF4
color: #16A34A
border: 1px solid #BBF7D0
```

**Badge rojo (rechazado):**
```
background: #FEF2F2
color: #EF4444
border: 1px solid #FECACA (opcional)
```

**Badge borrador:**
```
background: #F3F4F6
color: #6B7280
border: 1px solid #E0E2E6
```

**Contador (pill numérico):**
```
background: #F3F4F6
color: #6B7280
border: 1px solid #E0E2E6
border-radius: full
min-width: 20px, height: 20px
font-size: 10px, font-weight: 500
tabular-nums
```

### 3.8 Barras de Progreso

```
Container:
  background: #E5E7EB
  height: 12px (h-3)
  border-radius: full
  overflow: hidden

Fill:
  background: #6BB3D9
  height: 100%
  border-radius: full
  transition: width 500ms ease-out

Texto porcentaje:
  color: #6BB3D9
  font-size: 11px
  font-weight: 600
  tabular-nums

Dot indicador:
  background: #6BB3D9
  width/height: 6px
  border-radius: full

Status text:
  color: #6BB3D9
  font-size: 12px
  font-weight: 500
  uppercase, tracking-wider
```

### 3.9 Filter Pills (ApprovedSection)

```
Activo:
  background: #E8F4FA
  color: #3A8BB5
  border: 1px solid #D0E5F0

Inactivo:
  background: transparent
  color: #6B7280
  border: 1px solid #E0E2E6

border-radius: full
padding: 6px 12px
font-size: 11px
font-weight: 500
transition: all 150ms
```

### 3.10 Skeletons de Carga

```
Container:
  background: #FFFFFF
  border: 1px solid #E0E2E6
  border-radius: 16px
  animate-pulse

Bloques internos:
  background: #E5E7EB
  border-radius: full (para líneas)
  height: variable (3-4px para líneas)
```

### 3.11 Estados Vacíos

```
Container centrado verticalmente
Icono SVG: color #9CA3AF, opacity 25%, 40px
Texto principal: #9CA3AF, 12px
Texto acento (link): #6BB3D9
padding: 40px vertical
```

---

## 4. SISTEMA DE ANIMACIONES

### 4.1 Keyframes (tailwind.config.js)

**fade-up** — entrada suave de componentes:
```css
@keyframes fade-up {
  0% { opacity: 0; transform: translateY(8px) }
  100% { opacity: 1; transform: translateY(0) }
}
duration: 300ms
timing: ease-out
```

**pulse-neon** — pulso celeste para botones destacados:
```css
@keyframes pulse-neon {
  0%, 100% { box-shadow: 0 0 8px rgba(107,179,217,0.15) }
  50% { box-shadow: 0 0 20px rgba(107,179,217,0.35) }
}
duration: 2s
timing: ease-in-out
iteration: infinite
```

### 4.2 Animaciones del Splash (SplashPage.jsx)

| Animación | Duración | Delay | Efecto |
|-----------|----------|-------|--------|
| `hgv-shield-enter` | 1.2s ease-out | 0s | scale(0.7→1) + opacity(0→1) |
| `hgv-title-enter` | 0.5s ease-out | 0.3s | translateY(6px→0) + opacity(0→1) |
| `hgv-sub-enter` | 0.5s ease-out | 0.5s | translateY(4px→0) + opacity(0→1) |
| `hgv-sub-enter` (footer) | 0.5s ease-out | 0.7s | translateY(4px→0) + opacity(0→1) |
| `hgv-exit` | 0.5s ease-in | 2.2s | scale(1→1.1) + opacity(1→0) |

Timeline total: ~2.7s. Usa `sessionStorage('hgv-splash-shown')` para no repetir.

Solo anima `transform` y `opacity` (performance GPU).

### 4.3 Transiciones Generales

| Contexto | Duración | Easing |
|----------|----------|--------|
| Botones, inputs, cards | 200ms | ease-out |
| Botones de acción rápida | 150ms | ease-out |
| Progreso de barra | 500ms | ease-out |
| Hover scale cards | active: scale(0.99) | — |
| Hover scale botones | active: scale(0.95-0.98) | — |

### 4.4 Spinner SVG (App.jsx)

```
Círculo base: stroke #E0E2E6, stroke-width 4
Arco animado: stroke #6BB3D9, stroke-dasharray 80 200, stroke-dashoffset 0
Rotación: 1.1s linear infinite
Tamaño: 40px
```

---

## 5. SOMBRAS

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | Cards en zona clara |
| `shadow-neon-sm` | `0 0 12px rgba(107,179,217,0.15)` | Botones primarios, glow sutil |
| `shadow-neon-md` | `0 0 24px rgba(107,179,217,0.20)` | Glow intenso en hover |

---

## 6. ESPACIADO Y LAYOUT

### 6.1 Spacing

| Valor | Tailwind | Uso principal |
|-------|----------|---------------|
| 4px | `p-1` | Gaps mínimos |
| 6px | `p-1.5` | Gap entre badge items |
| 8px | `p-2` / `gap-2` | Gap entre elementos inline |
| 10px | `p-2.5` / `gap-2.5` | Gap en grid |
| 12px | `p-3` / `gap-3` | Gap en formularios, padding botones |
| 16px | `p-4` / `gap-4` | **Padding estándar de cards** |
| 20px | `p-5` | Padding vertical de secciones |
| 24px | `p-6` / `gap-6` | Separación entre secciones |
| 32px | `p-8` | Padding inferior página |

### 6.2 Border Radius

| Valor | Tailwind | Uso |
|-------|----------|-----|
| 6px | `rounded-md` | Escudo en header |
| 8px | `rounded-lg` | Botón eliminar, indicadores |
| 12px | `rounded-xl` | **Inputs, botones, sub-cards** |
| 16px | `rounded-2xl` | **Cards principales** |
| 20px | `rounded-3xl` | **Modales** |
| 999px | `rounded-full` | Badges, pills, toggles, progress bars |

### 6.3 Layout Principal

```
Header: height 56px, fixed top, background #F2F3F5, border-bottom #E0E2E6
Content: padding-top 56px, padding-bottom 96px, background #F2F3F5
Nav: height 64px, fixed bottom, background #E8F4FA, border-top #D0E5F0
Safe area: padding-bottom env(safe-area-inset-bottom, 16px)
Max width contenido: 512px (max-w-lg) centrado
Padding horizontal: 16px (px-4)
```

### 6.4 Alturas de Componentes

| Componente | Altura |
|-----------|--------|
| Header | 56px |
| Nav inferior | 64px |
| Input | ~48px (py-3 + padding) |
| Botón primario | ~48-56px (py-3 a py-4) |
| Botón pequeño | ~40px (py-2.5) |
| Avatar inicial | 44px (w-11 h-11) |
| Botón icono | 36px (w-9 h-9) |
| Toggle | 24px alto |

---

## 7. MAPEO POR PÁGINA

### 7.1 SplashPage
- Fondo: `#1E2024`, fixed, z-50, pantalla completa
- Escudo: 160px, animación zoom-in
- "FRONTÓN HGV": `#E5E7EB`, 20px, 600, tracking 0.12em
- "Por nuestro frontón y raíces": `#6B7280`, 13px, italic
- "Hermandad Gallega de Venezuela": `#4B5563`, 10px
- Duración: ~2.7s, sessionStorage para no repetir

### 7.2 AuthPage
- Fondo: gradiente radial `rgba(27,58,92,0.18)` sobre `#1E2024`
- Escudo: 80px centrado
- "Comisión de Frontón": `#E5E7EB`, 16px, 500
- Tabs login/registro: `#E8F4FA` activo, `#E5E7EB` inactivo
- Inputs: `#F3F4F6` fondo, `#1F2937` texto, focus `#6BB3D9`
- Botón submit: `#6BB3D9`, hover `#5A9BBF`, shadow celeste
- Links: `#6BB3D9`

### 7.3 OnboardingPage
- Fondo: `#1E2024`
- Barra progreso: height 1.5px, `#6BB3D9` activo, `#4B5563` inactivo
- Role cards: `#F3F4F6` fondo, borde `#6BB3D9` activo con `#E8F4FA`
- Checkmark: `#6BB3D9` fondo, check blanco
- Input username: fondo oscuro, prefix email en `#6B7280`
- Botón confirmar: `#6BB3D9`, shadow, disabled opacity 30%

### 7.4 Layout (Header + Nav)
- **Header**: fondo `#F2F3F5`, borde inferior `#E0E2E6`, título `#1F2937`, "Comisión de Frontón" `#6B7280` 11px, escudo 28px con radius 6px
- **Nav inferior**: fondo `#E8F4FA`, borde superior `#D0E5F0`
  - Icono activo: `#1F2937`, dot celeste con 6px blur
  - Icono inactivo: `#9CA3AF`
  - Label activo: `#1F2937`, 500
  - Label inactivo: `#9CA3AF`
  - Botón crear: `#6BB3D9` fondo (activo), `rgba(107,179,217,0.12)` (inactivo)

### 7.5 DashboardPage
- Fondo: `#F2F3F5`
- Saludo: "Bienvenido a Frontón HGV" en `#1F2937`
- Avatar: `#E8F4FA` fondo, `#6BB3D9` borde, `#3A8BB5` texto inicial
- Cards: blancas, borde `#E8EAEE`, shadow-card, borde-left 4px por estado
- Valores destacados: `#6BB3D9`
- Progress: `#E5E7EB` fondo, `#6BB3D9` fill
- Ranking #1: `#6BB3D9` fondo circular, texto blanco

### 7.6 TournamentsPage
- Widgets: card blanca, borde `#E8EAEE`, borde-left estado
- Status badges con colores semánticos (ver sección 3.7)
- Tabs filtro: `#6BB3D9` activo con underline, `#6B7280` inactivo
- Botón "Inscribirse": `#6BB3D9`

### 7.7 TournamentDetailModal
- Overlay: `rgba(0,0,0,0.5)` blur
- Panel: `#FFFFFF`, `#E0E2E6` borde
- Tabs: celeste activo, `#6B7280` inactivo, underline `#6BB3D9`
- Close: `#F3F4F6`, `#6B7280`

### 7.8 EditTournamentForm
- Labels: `#6B7280` uppercase tracking
- Inputs: `#FFFFFF`, `#E0E2E6` borde, focus `#6BB3D9`
- Section cards: `#FFFFFF`, `#E0E2E6`
- Sub-cards (categoría/cancha): `#F9FAFB`, `#E0E2E6`
- Toggle: `#6BB3D9` on, `#E5E7EB` off
- Save: `#6BB3D9`, shadow celeste
- Remove: `#F3F4F6` fondo, `#6B7280`, hover rojo
- Add: dashed `#E0E2E6`, `#6B7280`

### 7.9 CategoryProgressCard
- Card: `#FFFFFF`, `#E0E2E6`
- Barra: `#E5E7EB` fondo, `#6BB3D9` fill
- Porcentaje y status: `#6BB3D9`

### 7.10 RegistrationRequestCard
- Card: `#FFFFFF`, `#E0E2E6`
- Badge "Pendiente": `#FFF5D6`, `#92750F`, borde `#F5E6A3`
- Admitir: `#6BB3D9`
- Rechazar: `#EF4444`
- Warning categoría llena: `#F59E0B`

### 7.11 ApprovedSection
- Filter pills: celeste activo, gris inactivo (ver 3.9)
- Aprobado: icono `#F0FDF4`/`#16A34A`, texto "Admitida" `#16A34A`
- Rechazado: icono `#FEF2F2`/`#EF4444`, texto "Rechazada" `#EF4444`

### 7.12 AdminPanelPage
- Fondo: `#F2F3F5`
- Cards: `#FFFFFF`, `#E0E2E6`
- Avatar iniciales: `#E8F4FA` fondo, `#3A8BB5` texto
- Badge pendiente: dorado (`#FFF5D6`/`#92750F`)
- Aprobar: `#6BB3D9`, Rechazar: `#EF4444`
- Historial aceptado: borde `#D0E5F0`, check `#6BB3D9`, badge `#E8F4FA`/`#3A8BB5`
- Historial rechazado: borde `#FECACA`, X `#EF4444`, badge `#FEF2F2`/`#EF4444`

### 7.13 CreateTournamentPage
- Mismos patrones que EditTournamentForm
- Back button: `#FFFFFF`/`#6B7280`
- Reset button: `#FFFFFF`, icono `#6BB3D9`
- Submit: `#6BB3D9`, shadow, texto blanco

### 7.14 ScoringSystem
- **ScoringSystemSelector/SetsScoringForm**: toggle `#E8F4FA`/`#6BB3D9` activo, `#FFFFFF`/`#E0E2E6` inactivo
- **ClosingRuleSwitch**: mismos toggles
- **ScoringPreview**: card `#FFFFFF`/`#E0E2E6`, badge dot+texto `#6BB3D9`, valores `#6BB3D9`, labels `#6B7280`, separadores `#E8EAEE`
- **NumField**: input `#FFFFFF`/`#E0E2E6`, label `#6B7280`, hint `#9CA3AF`, error `#EF4444`

### 7.15 ProtectedRoute (Status Screens)
- Fondo: `#F2F3F5`
- Icon container: `#FFFFFF`, `#E0E2E6`
- Título: `#1F2937`
- Mensaje: `#6B7280`
- Botón salir: `#FFFFFF`, `#E0E2E6`, `#4B5563`

### 7.16 OrganizerHubPage / ResultsInputPage (placeholders)
- Texto principal: `#1F2937`
- Texto secundario: `#6B7280`, opacity 50%

---

## 8. ICONOS

- Todos los iconos son **SVG inline** — sin librería externa
- `stroke="currentColor"` para heredar color del padre
- `strokeWidth`: 1.2-2.2 (1.8 estándar, 2.2 para activo en nav)
- `strokeLinecap="round"`, `strokeLinejoin="round"`
- Tamaños: 12px (`w-3 h-3`), 14px (`w-3.5 h-3.5`), 16px (`w-4 h-4`), 20px (`w-5 h-5`), 24px (`w-6 h-6`)
- Gap con texto: 8px (`gap-2`)
- `flex-shrink-0` siempre en iconos

---

## 9. UTILIDADES CSS CUSTOM (index.css)

**Glass morphism:**
```css
.glass {
  background: rgba(42, 45, 51, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

**Text balance:**
```css
.text-balance { text-wrap: balance; }
```

**Safe bottom:**
```css
safe-bottom: env(safe-area-inset-bottom, 16px)
```

---

## 10. PWA

**Manifest (vite.config.js):**
```
name: "Frontón HGV"
short_name: "Frontón"
description: "Gestión de torneos — Comisión de Frontón, Hermandad Gallega de Venezuela"
theme_color: "#F2F3F5"
background_color: "#1E2024"
display: standalone
orientation: portrait
```

**Icons:** lobo.png redimensionado a 72, 96, 128, 144, 152, 192, 384, 512px.
- 192px y 512px tienen entradas separadas: `purpose: 'any'` y `purpose: 'maskable'`.

**theme_color sincronizado en:**
1. `vite.config.js` → manifest.theme_color
2. `index.html` → `<meta name="theme-color">`

Valor: `#F2F3F5`

---

## 11. ASSET: Escudo (lobo.png)

| Ubicación | Tamaño | Notas |
|-----------|--------|-------|
| Splash (centro) | 160px | Animación zoom-in |
| Login (arriba del form) | 80px | Estático |
| Header (derecha) | 28px | border-radius 6px |
| PWA icons | 72-512px | `public/icons/` |
| favicon | 32px | `public/favicon.ico.png` |
| apple-touch-icon | 180px | `public/apple-touch-icon.png` |

---

## 12. REGLAS FUNDAMENTALES

1. **NO cambiar estructura de componentes** sin actualizar este documento
2. **Celeste `#6BB3D9` es el UNICO color de acción** — todos los CTAs, links, focus, activos
3. **Dorado es EXCLUSIVO para badges** — NUNCA en botones
4. **Zona oscura** (splash/auth/onboarding) usa tokens `base-*`, `surface-*`, `ink-*`
5. **Zona clara** (dashboard, torneos, admin, formularios) usa inline styles con hex explícitos
6. **Fuentes fijas**: DM Sans + DM Mono — no cambiar
7. **Breakpoints y spacing** se mantienen intactos
8. **Cada cambio debe compilar**: `npm run build` sin errores
9. **Colores semánticos**: rojo=peligro, verde=éxito, ámbar=pendiente, celeste=acción — nunca invertir
10. **Animaciones**: solo `transform` y `opacity` para performance GPU

---

## 13. ANIMACIONES DE MARCA

### Splash screen
- Aparece en primera carga de la app (sessionStorage) Y al iniciar sesión exitosamente
- Escudo lobo.png con zoom-in, texto "FRONTÓN HGV", frase "Por nuestro frontón y raíces" (entre comillas)
- Duración ~2-3 segundos
- NO aparece al recargar página logueado, ni al navegar entre páginas, ni en registro nuevo → onboarding

### Loader de marca (BrandLoader)
- Componente: `src/components/BrandLoader.jsx`
- Escudo lobo.png (40-48px) rotando suavemente (2s/vuelta) + anillo celeste (#6BB3D9) giratorio (1.2s/vuelta, ~270°)
- Reemplaza TODOS los spinners de la app (AppLoader, SyncOverlay)
- Props: `size` (default 48), `className`
