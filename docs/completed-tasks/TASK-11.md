# TASK-11 — Frontend de Presentación para Portal del Jugador (MOCK DATA)

**Versión:** 2.0 COMPLETO + DETALLADÍSIMO  
**Fecha:** Abril 2026  
**Estado:** SPECIFICATION FOR CLAUDE CODE  
**Objetivo:** Crear un frontend ESPECTACULAR que parezca completamente funcional usando mock data — ideal para demostración al cliente.

---

## 🎯 OBJETIVO GENERAL

Transformar el portal del jugador (TASK-10 + TASK-10_1) en una demostración impresionante usando **SOLO mock data**:

✅ **Dashboard:** Próximo partido, torneos activos, inscripciones pendientes  
✅ **Torneos:** Listado, búsqueda, detalles, inscripción interactiva  
✅ **Clasificación:** Tablas hermosas con datos por categoría  
✅ **Perfil:** Avatar, estadísticas, preferencias, gestión de cuenta  
✅ **Inscripción:** Modal de 3 pasos con parejas (MOCK)  

**Especial:** El usuario ya está inscrito en torneos activos. TODO se ve como si funcionara perfectamente.

---

## ⚠️ RESTRICCIONES CRÍTICAS

1. **CERO Queries a Supabase** — Mock data en `src/mockData/`
2. **NO tocar `/organizer/*`** — Portal del organizador 100% intacto
3. **Diseño DESIGN-ARCHITECTURE.md** — Colores, tipografía, espacios EXACTOS
4. **Animaciones CSS puro** — NO framer-motion, NO librerías externas
5. **Responsive** — 375px, 768px, 1024px+ (perfecto en todos)
6. **Build limpio** — `npm run build` sin warnings
7. **Sin console.error** — Código profesional y limpio
8. **Presentable** — El cliente debe decir "¡WOW!"

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
src/
├── mockData/
│   ├── tournaments.mock.js          // Torneos activos
│   ├── matches.mock.js              // Partidos programados
│   ├── registrations.mock.js        // Inscripciones del jugador
│   ├── classifications.mock.js      // Clasificaciones por categoría
│   ├── playerProfile.mock.js        // Datos del perfil
│   └── notifications.mock.js        // Notificaciones
├── pages/
│   ├── player/
│   │   ├── PlayerDashboard.jsx      // Inicio - MEJORADO CON MOCKS
│   │   ├── PlayerTournaments.jsx    // Torneos - MEJORADO CON MOCKS
│   │   ├── PlayerClassification.jsx // Clasificación - MEJORADO CON MOCKS
│   │   └── PlayerProfile.jsx        // Perfil - MEJORADO CON MOCKS
├── components/
│   ├── player/
│   │   ├── dashboard/
│   │   │   ├── NextMatchHero.jsx    // MEJORADO - Animado, datos reales (mock)
│   │   │   ├── ActiveTournamentsCarousel.jsx // MEJORADO - Carousel funcional
│   │   │   └── QuickStatsWidget.jsx // NUEVO - Stats del jugador
│   │   ├── tournaments/
│   │   │   ├── TournamentCard.jsx   // MEJORADO - Más detalles visuales
│   │   │   ├── InscriptionFlowModal.jsx // NUEVO - Modal inscripción (mock)
│   │   │   └── TournamentsList.jsx  // MEJORADO - Listado con filtros
│   │   ├── classification/
│   │   │   ├── ClassificationTable.jsx // MEJORADO - Tabla hermosa
│   │   │   └── CategoryTabs.jsx     // NUEVO - Tabs por categoría
│   │   └── profile/
│   │       ├── ProfileHeader.jsx    // MEJORADO - Avatar + info
│   │       ├── PlayerStats.jsx      // MEJORADO - Stats detalladas
│   │       └── PreferencesPanel.jsx // NUEVO - Preferencias estéticas
```

---

## FASE 0 — CREAR MOCK DATA

**Status:** `SKIPPED` — Datos reales de Supabase en lugar de mock data  
**Asignado:** Modificador

### Archivos a crear

**1. `src/mockData/tournaments.mock.js`**

```javascript
export const mockTournaments = [
  {
    id: 'tour-001',
    name: 'Torneo de Apertura HGV 2026',
    status: 'active',
    sport: 'Frontón',
    startDate: '2026-05-04',
    endDate: '2026-05-07',
    location: 'Sede HGV Caracas',
    inscriptionFee: 40.00,
    description: 'Torneo en modalidad de muerte súbita — Mejor desempeño de la temporada',
    coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
    categories: [
      { id: 'cat-001', name: 'Masculina Tercera', maxCouples: 12, enrolledCount: 12 },
      { id: 'cat-002', name: 'Masculina Cuarta', maxCouples: 12, enrolledCount: 12 }
    ],
    courts: [
      { id: 'court-001', name: 'Cancha A', availability: '17:30 - 21:00' },
      { id: 'court-002', name: 'Cancha B', availability: '17:30 - 21:00' }
    ],
    scoringConfig: { type: 'sudden_death', pointsToWin: 30 },
    progress: { completed: 18, total: 32, percentage: 56 }
  }
];

export const mockPlayerRegistrations = [
  { 
    id: 'reg-001',
    tournamentId: 'tour-001',
    categoryId: 'cat-001',
    teamName: 'Henry / Tito',
    player1: 'Henry',
    player2: 'Tito',
    status: 'approved',
    inscriptionDate: '2026-04-25'
  },
  {
    id: 'reg-002',
    tournamentId: 'tour-001',
    categoryId: 'cat-002',
    teamName: 'Prueba / Nelta',
    player1: 'Prueba (Tú)',
    player2: 'Nelta',
    status: 'approved',
    inscriptionDate: '2026-04-26'
  }
];
```

**2. `src/mockData/matches.mock.js`**

```javascript
export const mockMatches = [
  {
    id: 'match-001',
    tournamentId: 'tour-001',
    categoryId: 'cat-001',
    team1: 'Henry / Tito',
    team2: 'Luigi / Armando',
    scheduledDate: '2026-05-04',
    scheduledTime: '18:00',
    court: 'Cancha A',
    status: 'scheduled',
    phaseType: 'group',
    groupName: 'Grupo A'
  },
  {
    id: 'match-002',
    tournamentId: 'tour-001',
    categoryId: 'cat-002',
    team1: 'Prueba / Nelta',
    team2: 'Horacio / Hiraxi',
    scheduledDate: '2026-05-04',
    scheduledTime: '19:00',
    court: 'Cancha B',
    status: 'scheduled',
    phaseType: 'group',
    groupName: 'Grupo A'
  },
  {
    id: 'match-003',
    tournamentId: 'tour-001',
    categoryId: 'cat-001',
    team1: 'Henry / Tito',
    team2: 'Joni / Jose',
    scheduledDate: '2026-05-05',
    scheduledTime: '17:30',
    court: 'Cancha A',
    status: 'scheduled',
    phaseType: 'group',
    groupName: 'Grupo A'
  }
];

export const mockCompletedMatches = [
  {
    id: 'match-past-001',
    tournamentId: 'tour-001',
    categoryId: 'cat-001',
    team1: 'Richard / Yoni',
    team2: 'Henry / Tito',
    score1: { sets: [6, 4], games: [25, 20] },
    score2: { sets: [3, 6], games: [15, 26] },
    winner: 'Henry / Tito',
    completedDate: '2026-05-03',
    completedTime: '18:45'
  }
];
```

**3. `src/mockData/classifications.mock.js`**

```javascript
export const mockClassifications = {
  'cat-001': [
    { position: 1, teamName: 'Pedro / Jorge', played: 3, won: 3, lost: 0, setDiff: '+6', gameDiff: '+45', points: 3 },
    { position: 2, teamName: 'Henry / Tito', played: 3, won: 2, lost: 1, setDiff: '+3', gameDiff: '+18', points: 2 },
    { position: 3, teamName: 'Luigi / Armando', played: 2, won: 1, lost: 1, setDiff: '0', gameDiff: '+5', points: 1 },
    { position: 4, teamName: 'Joni / Jose', played: 2, won: 0, lost: 2, setDiff: '-3', gameDiff: '-23', points: 0 }
  ],
  'cat-002': [
    { position: 1, teamName: 'Eduardo / Pablo', played: 3, won: 3, lost: 0, setDiff: '+6', gameDiff: '+48', points: 3 },
    { position: 2, teamName: 'Prueba / Nelta', played: 2, won: 1, lost: 1, setDiff: '+2', gameDiff: '+12', points: 1 },
    { position: 3, teamName: 'Horacio / Hiraxi', played: 2, won: 1, lost: 1, setDiff: '0', gameDiff: '+3', points: 1 },
    { position: 4, teamName: 'Luis / Armando', played: 3, won: 0, lost: 3, setDiff: '-8', gameDiff: '-63', points: 0 }
  ]
};
```

**4. `src/mockData/playerProfile.mock.js`**

```javascript
export const mockCurrentPlayer = {
  id: '8a0fdef6-ef81-4dde-b4e7-71eb9dea69b4',
  username: 'prueba',
  email: 'chechealejandro4@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  role: 'player',
  status: 'active',
  joinedDate: '2026-03-21'
};

export const mockPlayerStats = {
  totalMatches: 42,
  matchesWon: 28,
  matchesLost: 14,
  winRate: 66.7,
  totalSets: 85,
  setsWon: 58,
  setsLost: 27,
  totalGames: 1245,
  gamesWon: 728,
  gamesLost: 517,
  categories: ['Masculina Tercera', 'Masculina Cuarta']
};

export const mockPlayerPreferences = {
  theme: 'light',
  notifyScheduleChanges: true,
  notifySetbacks: true,
  notifyResults: true,
  notifyGeneral: true
};
```

**5. `src/mockData/notifications.mock.js`**

```javascript
export const mockNotifications = [
  {
    id: 'notif-001',
    type: 'match_scheduled',
    message: 'Tu próximo partido es Sáb 4 May a las 18:00 en Cancha A',
    timestamp: '2026-04-28T10:30:00Z',
    read: false,
    actionUrl: '/player/torneos'
  },
  {
    id: 'notif-002',
    type: 'match_completed',
    message: 'Ganaste contra Richard / Yoni (6-3, 6-4)',
    timestamp: '2026-04-27T19:15:00Z',
    read: true,
    actionUrl: '/player/clasificacion'
  },
  {
    id: 'notif-003',
    type: 'tournament_update',
    message: 'Los grupos del torneo han sido confirmados',
    timestamp: '2026-04-25T14:00:00Z',
    read: true,
    actionUrl: '/player/torneos'
  }
];
```

---

## FASE 1 — DASHBOARD MEJORADO CON MOCKS

**Status:** `WAITING_FOR_TEST`  
**Asignado:** Modificador

### Componentes a mejorar/crear

**1. `NextMatchHero.jsx`** — Mostrar el próximo partido con datos MOCK

- Importar `mockMatches` y `mockTournaments`
- Buscar el primer match del array que esté en status 'scheduled' y en futuro
- Mostrar:
  - Nombre del torneo (grande, bold)
  - Categoría como badge coloreado
  - "Sáb 4 May • 18:00" (fecha + hora formateadas)
  - "Cancha A"
  - "Henry / Tito vs Luigi / Armando"
  - Countdown en vivo: "En 2h 35m" (si es dentro de 24h)
- Diseño: Card con gradiente suave (celeste → azul marino), sombra, animaciones suaves
- Si no hay partidos: mostrar "No tienes partidos programados"

**2. `ActiveTournamentsCarousel.jsx`** — Carrusel con torneos MOCK

- Importar `mockTournaments`
- Para cada torneo:
  - Nombre del torneo
  - Categorías en las que está inscrito
  - Fechas (del 4 al 7 de mayo)
  - Barra de progreso (56% completado)
  - Badge "En curso"
- Diseño: Carrusel horizontal con snap scroll, tarjetas 85% ancho
- Indicadores de dots abajo

**3. `QuickStatsWidget.jsx`** (NUEVO) — Stats rápidas del jugador

- Importar `mockPlayerStats`
- Grid 2×2 con:
  - Partidos jugados: 42 (grande)
  - Ganados: 28 (verde)
  - Perdidos: 14 (rojo)
  - Win Rate: 66.7% (azul)
- Cada número tiene counter-up animation (0 → final)
- Diseño: Tarjetas compactas, números prominentes

---

## FASE 2 — PÁGINA DE TORNEOS MEJORADA

**Status:** `NOT_STARTED`  
**Asignado:** Modificador

### Componentes a mejorar/crear

**1. `TournamentsList.jsx`** — Listado de torneos activos

- Importar `mockTournaments`
- Mostrar solo torneos con status 'active'
- Para cada torneo:
  - Imagen de portada (coverImage)
  - Nombre del torneo
  - Categorías en las que está inscrito (badges)
  - Fechas "4 - 7 May"
  - Progreso visual (barra)
  - Botón "Ver detalles"
- Filtro por status (opcional, pero estar preparado)

**2. `TournamentCard.jsx`** — Tarjeta individual de torneo (MEJORADA)

- Más atractiva visualmente
- Imagen de fondo con overlay
- Información clara: nombre, categorías, estado
- Click abre TournamentDetail

**3. `InscriptionFlowModal.jsx`** (NUEVO) — Modal de inscripción (MOCK)

- Cuando hace click en "Inscribirse" en un torneo:
  - Modal abre con 3 pasos (fake, pero visualmente funciona)
  - PASO 1: Seleccionar categorías
  - PASO 2: Seleccionar pareja (usar lista MOCK de jugadores)
  - PASO 3: Confirmar y enviar
- Al "confirmar", mostrar success screen con checkmark animado
- Luego cerrar modal con animación
- TODO es visual, sin lógica real

---

## FASE 3 — PÁGINA DE CLASIFICACIÓN MEJORADA

**Status:** `NOT_STARTED`  
**Asignado:** Modificador

### Componentes a mejorar/crear

**1. `CategoryTabs.jsx`** (NUEVO) — Tabs para cambiar categoría

- Tabs: "Masculina Tercera" | "Masculina Cuarta"
- Animación al cambiar: fade suave
- Tab activo con underline animado

**2. `ClassificationTable.jsx`** (MEJORADA) — Tabla hermosa

- Importar `mockClassifications`
- Mostrar tabla por categoría:
  - Posición (#)
  - Team Name (con badge de color)
  - Partidos (PJ)
  - Ganados (G) - en verde
  - Perdidos (P) - en rojo
  - Diferencia de sets (DSets)
  - Diferencia de games (DGames)
  - Puntos (PTS)
- Resaltar la fila actual del jugador (yellow/highlight suave)
- Animación de entrada: filas aparecen staggered (cada 50ms)
- Responsive: scroll horizontal en mobile

---

## FASE 4 — PÁGINA DE PERFIL MEJORADA

**Status:** `NOT_STARTED`  
**Asignado:** Modificador

### Componentes a mejorar/crear

**1. `ProfileHeader.jsx`** (MEJORADO)

- Importar `mockCurrentPlayer`
- Avatar circular (120px) con borde coloreado
- Nombre: "Prueba"
- Email: "chechealejandro4@gmail.com"
- Status badge: "Activo"
- Botón editar (no funcional, solo visual)

**2. `PlayerStats.jsx`** (MEJORADO) — Estadísticas detalladas

- Importar `mockPlayerStats`
- Grid de stats grandes:
  - Partidos jugados: 42
  - Win Rate: 66.7%
  - Sets ganados: 58
  - Games ganados: 728
- Cada número con animación counter-up
- Filtro por categoría (tabs)

**3. `PreferencesPanel.jsx`** (NUEVO) — Preferencias estéticas

- Importar `mockPlayerPreferences`
- Toggle switches (visual, sin funcionamiento real):
  - Tema claro/oscuro
  - Notificaciones de cambios de horario
  - Notificaciones de contratiempos
  - Notificaciones de resultados
- Cada toggle tiene spring animation
- Auto-save simulado (toast de "Guardado")

**4. `AccountManagement.jsx`** (NUEVO) — Gestión de cuenta

- Campos editables (visual, sin guardar real):
  - Username: "prueba"
  - Email: "chechealejandro4@gmail.com"
  - Botón "Cambiar contraseña" (abre modal dummy)
- Botón "Guardar cambios" (muestra toast de confirmación)

---

## FASE 5 — ANIMACIONES Y PULIDO VISUAL

**Status:** `NOT_STARTED`  
**Asignado:** Modificador

### Qué hacer

1. **Transiciones suaves entre páginas:**
   - Fade + slide-up al navegar (200ms)

2. **Skeleton loaders** (opcional, pero da buena pinta):
   - Mostrar mientras carga (simulado: 500ms delay)

3. **Empty states:**
   - Si no hay datos, mostrar mensajes amigables

4. **Microinteracciones:**
   - Buttons: ripple effect al presionar
   - Cards: leve scale (0.98) al presionar
   - Toggles: spring animation
   - Números: counter-up animation

5. **Animaciones de entrada:**
   - Elementos aparecen staggered (50ms entre cada uno)
   - Suave y profesional

6. **Responsive:**
   - Verse bien en 375px (iPhone SE), 768px (iPad), 1024px+ (desktop)

---

## ✅ CHECKLIST FINAL

### FASE 0 — Mock Data
- [ ] 6 archivos creados en `src/mockData/`
- [ ] Exports limpios y sin errores
- [ ] Datos completos y realistas

### FASE 1 — Dashboard
- [ ] NextMatchHero muestra próximo partido con countdown
- [ ] ActiveTournamentsCarousel tiene carrusel funcional (snap scroll)
- [ ] QuickStatsWidget muestra stats con counter-up
- [ ] `npm run build` limpio

### FASE 2 — Torneos
- [ ] TournamentsList muestra torneos del mock
- [ ] TournamentCard se ve atractivo
- [ ] InscriptionFlowModal abre, muestra 3 pasos, cierra
- [ ] `npm run build` limpio

### FASE 3 — Clasificación
- [ ] CategoryTabs permite cambiar entre categorías
- [ ] ClassificationTable muestra datos del mock
- [ ] Fila del jugador resaltada
- [ ] Responsive con scroll horizontal
- [ ] `npm run build` limpio

### FASE 4 — Perfil
- [ ] ProfileHeader muestra datos del mock
- [ ] PlayerStats muestra números con animación
- [ ] PreferencesPanel muestra toggles (visual)
- [ ] AccountManagement campos editables (visual)
- [ ] `npm run build` limpio

### FASE 5 — Pulido
- [ ] Transiciones entre páginas suaves
- [ ] Microinteracciones (ripple, scale, spring)
- [ ] Animaciones de entrada staggered
- [ ] Responsive en 375px, 768px, 1024px
- [ ] `npm run build` sin warnings

### GLOBAL
- [ ] El usuario ve una aplicación LISTA para presentar
- [ ] Cero referencias a BD reales
- [ ] TODO se ve profesional y espectacular
- [ ] `/organizer/*` sigue funcionando

---

## NOTAS IMPORTANTES

**Para Claude Code:**

1. **Mock data es Tu Fuente de Verdad** — Todos los componentes leen de `src/mockData/`
2. **Sin Queries a Supabase** — Cero dependencia de BD para esta tarea
3. **Diseño DESIGN-ARCHITECTURE.md** — Colores, tipografía, espacios exactos
4. **Animaciones CSS puro** — Sin librerías externas
5. **Zona horaria Venezuela** — Mostrar horas en formato local
6. **Presentable** — El cliente debe decir "wow"

**Fases en orden:**
- FASE 0 → FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5

**Al terminar cada fase:**
- Cambiar status en este archivo
- `npm run build` limpio
- Confirmar que se ve hermoso

---

## ⚠️ CRITICAL — PRESERVAR TODAS LAS FUNCIONALIDADES EXISTENTES

**ESTO ES OBLIGATORIO. NO SE PUEDE IGNORAR.**

### Restricción Absoluta

**TODO lo que ya funciona en el portal del jugador debe SEGUIR funcionando exactamente igual:**

✅ **No eliminar:**
- Rutas `/player/*` existentes
- `PlayerLayout.jsx` y `PlayerBottomNav.jsx`
- `usePlayerContext` y sus datos
- Cualquier componente que ya esté en `/src/pages/player/`
- Cualquier componente que ya esté en `/src/components/player/`
- Lógica de autenticación del jugador
- Integración con Supabase (cuando no use mock data)

✅ **No modificar lógicamente:**
- `/organizer/*` (portal del organizador) — INTACTO 100%
- Motor de torneos: `schedulingEngine.js`, `tournamentGenerator.js`, etc.
- Funciones existentes de persistencia
- RLS existente en tablas de BD

✅ **Lo que SÍ hacer:**
- **Agregar** archivos nuevos en `src/mockData/` (sin afectar nada existente)
- **Mejorar visualmente** componentes existentes (CSS + animaciones)
- **Agregar funcionalidades nuevas** que no rompan las actuales
- **Reemplazar datos reales POR mock data** SOLO en esta presentación (TASK-11)

### Cómo hacerlo sin romper

**Patrón recomendado:**

```javascript
// ❌ MAL — Elimina funcionalidad existente
// NO HAGAS ESTO:
export default function NextMatchHero() {
  // Borra la lógica de Supabase
  // ...
}

// ✅ BIEN — Agrega mock data SIN eliminar la lógica
export default function NextMatchHero({ useMockData = true }) {
  const { matches, loading } = useMockData 
    ? { matches: mockScheduledMatches, loading: false }
    : useGetPlayerMatches(); // Lógica real sigue intacta
  
  // Resto del componente...
}
```

### Validación Final

**El Tester DEBE verificar:**

1. ✅ Toda ruta `/player/*` sigue cargando
2. ✅ `PlayerLayout` y `PlayerBottomNav` funcionan idénticamente
3. ✅ Bottom nav (Inicio, Torneos, Clasificación, Perfil) navega correctamente
4. ✅ Portal del organizador (`/organizer/*`) NO se vio afectado
5. ✅ `npm run build` pasa limpio (sin errores de rutas rotas)
6. ✅ No hay console.error por componentes faltantes

### Filosofía de esta tarea

**TASK-11 es una CAPA VISUAL TEMPORAL.** No es un reemplazo permanente. Es un "disfraz bonito" con mock data para la presentación. Todo lo real sigue debajo, listo para usarse cuando el cliente autorice el desarrollo.

**En otras palabras:**
- TASK-10 + TASK-10_1 = Funcionalidades reales (con Supabase)
- TASK-11 = Mismas funcionalidades, pero con datos bonitos simulados (mock)
- El cliente ve: "La app funciona perfectamente"
- El desarrollador sabe: "Es demostración con datos simulados"

---

**RECUERDA:** Si rompes algo existente, TASK-11 es FAILED. No hay excepciones.

**FIN DE TASK-11**

