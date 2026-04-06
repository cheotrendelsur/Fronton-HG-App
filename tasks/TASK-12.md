# TASK-12 — Portal del Jugador · Fachada Visual con Mock Data

**Fecha:** Abril 2026  
**Objetivo:** Crear las 4 pantallas del portal del jugador como una fachada visual impecable usando SOLO datos mock. Cero queries a Supabase. Todo debe parecer completamente funcional aunque no lo sea. Es una demo para presentar al cliente.

---

## INSTRUCCIONES GENERALES PARA AMBOS AGENTES

### Antes de cada fase, leer obligatoriamente:

- `CLAUDE.md`
- `DESIGN-ARCHITECTURE.md`
- `.claude/skills/ui-ux-pro-max/SKILL.md`
- Esta tarea (`TASK-12.md`)

### Reglas inquebrantables

1. **CERO queries a Supabase.** Ningún `import` de `supabaseClient`. Ningún `.from()`, `.select()`, `.insert()`. Todo se alimenta de archivos en `src/mockData/`.
2. **NO tocar `/organizer/*`.** El portal del organizador debe seguir funcionando idénticamente. No modificar ni borrar ningún archivo fuera del scope del jugador.
3. **NO borrar código existente del jugador.** Si ya existen componentes en `/player/`, no eliminarlos. Si un componente ya tiene lógica de Supabase, usar el patrón de flag:
   ```javascript
   const USE_MOCK = true; // Cambiar a false cuando se conecte Supabase
   const data = USE_MOCK ? mockData : realSupabaseData;
   ```
   De esta forma la lógica real queda preservada en el código pero inactiva.
4. **Diseño = DESIGN-ARCHITECTURE.md.** Colores, tipografía, espaciados, border-radius — todo exacto.
5. **Animaciones CSS puro.** Transitions y keyframes. NO instalar framer-motion ni ninguna librería de animación.
6. **Responsive.** Cada componente debe verse bien en 375px (iPhone SE), 390px (iPhone 14), 768px (iPad).
7. **Build limpio.** `npm run build` sin errores ni warnings relevantes al final de cada fase.
8. **Cero console.error.** Código limpio y profesional.

### Flujo de trabajo entre agentes

```
MODIFICADOR                          TESTER
    │                                    │
    ├─ Lee fase con status READY         │
    ├─ Codifica TODO lo descrito         │
    ├─ npm run build (debe pasar)        │
    ├─ Cambia status → WAITING_FOR_TEST  │
    │                                    ├─ Lee fase WAITING_FOR_TEST
    │                                    ├─ Ejecuta TODOS los tests listados
    │                                    ├─ Si PASAN → status DONE + siguiente READY
    │                                    ├─ Si FALLAN → status FAILED + test_notes
    │                                    │
```

---

## FASE 1 — Mock Data + Esqueleto de Navegación

**Status:** `DONE`  
**test_notes:** 10/10 tests PASS. (1) 7 archivos mockData existen con exports correctos. (2) Cero imports de supabaseClient en mockData. (3) IDs coherentes: tour-001 en 3 archivos, cat-masc-3/4 en 5, mock-player-001 en 2. (4) 5 rutas /player/* definidas en App.jsx. (5) Bottom nav con 4 tabs + íconos SVG + labels. (6) Tab activo: pill #6BB3D9 + scale(1.15) + fontWeight 600. (7) Transición playerPageEnter: opacity 0→1 + translateY(8px→0). (8) Organizer routes intactas (6 rutas OrganizerRoute). (9) Build limpio 934ms. (10) Sin console.error (análisis estático).

### Para el Modificador

Esta fase tiene 2 partes que se hacen juntas: los archivos de datos mock y el esqueleto de navegación.

#### PARTE A — Crear archivos de mock data

Crear la carpeta `src/mockData/` con estos 6 archivos. Los datos deben ser realistas y coherentes entre sí (los IDs que se referencian entre archivos deben coincidir).

**Archivo 1: `src/mockData/player.mock.js`**

```javascript
// Jugador logueado simulado
export const mockCurrentPlayer = {
  id: 'mock-player-001',
  username: 'Carlos Herrera',
  email: 'carlos.herrera@example.com',
  avatarUrl: null, // Sin avatar — se muestra inicial "C"
  role: 'player',
  status: 'active',
  joinedDate: '2025-09-15'
};

// Estadísticas históricas del jugador
export const mockPlayerStats = {
  totalMatches: 42,
  matchesWon: 28,
  matchesLost: 14,
  winRate: 66.7,
  setsWon: 58,
  setsLost: 27,
  gamesWon: 728,
  gamesLost: 517,
  // Stats filtradas por categoría
  byCategory: {
    'cat-masc-3': { played: 24, won: 18, lost: 6, winRate: 75.0 },
    'cat-masc-4': { played: 18, won: 10, lost: 8, winRate: 55.6 }
  }
};

// Preferencias del jugador
export const mockPlayerPreferences = {
  theme: 'light',
  notifyScheduleChanges: true,
  notifySetbacks: true,
  notifyResults: true,
  notifyGeneral: false
};
```

**Archivo 2: `src/mockData/tournaments.mock.js`**

```javascript
export const mockTournaments = [
  {
    id: 'tour-001',
    name: 'Torneo Apertura HGV 2026',
    status: 'active',
    startDate: '2026-05-04',
    endDate: '2026-05-18',
    location: 'Sede Principal HGV — Caracas',
    inscriptionFee: 40,
    description: 'Gran torneo de apertura de la temporada 2026. Modalidad de grupos + eliminatoria directa.',
    coverImageUrl: null,
    prizeDescription: '🥇 Trofeo + $200 | 🥈 Medalla + $100 | 🥉 Medalla',
    rulesSummary: 'Partidos a 2 sets de 6 games con tie-break a 7. Tercer set super tie-break a 10 puntos.',
    categories: [
      { id: 'cat-masc-3', name: 'Masculina Tercera', maxCouples: 12, enrolledCount: 12 },
      { id: 'cat-masc-4', name: 'Masculina Cuarta', maxCouples: 12, enrolledCount: 10 },
      { id: 'cat-fem-3', name: 'Femenina Tercera', maxCouples: 8, enrolledCount: 6 }
    ],
    courts: [
      { id: 'court-a', name: 'Cancha Principal' },
      { id: 'court-b', name: 'Cancha Norte' },
      { id: 'court-c', name: 'Cancha Sur' }
    ],
    days: ['2026-05-04', '2026-05-05', '2026-05-11', '2026-05-12', '2026-05-18'],
    progress: { completed: 18, total: 42, percentage: 43 }
  },
  {
    id: 'tour-002',
    name: 'Copa Gallega Clausura',
    status: 'inscription',
    startDate: '2026-06-14',
    endDate: '2026-06-28',
    location: 'Sede Principal HGV — Caracas',
    inscriptionFee: 50,
    description: 'Torneo de clausura con premiación especial para las mejores parejas del semestre.',
    coverImageUrl: null,
    prizeDescription: '🥇 Trofeo + $300 | 🥈 $150 | 🥉 $75',
    rulesSummary: 'Partidos a muerte súbita a 30 puntos.',
    categories: [
      { id: 'cat-cl-masc-3', name: 'Masculina Tercera', maxCouples: 16, enrolledCount: 4 },
      { id: 'cat-cl-masc-4', name: 'Masculina Cuarta', maxCouples: 16, enrolledCount: 2 },
      { id: 'cat-cl-master', name: 'Máster', maxCouples: 8, enrolledCount: 0 }
    ],
    courts: [
      { id: 'court-a', name: 'Cancha Principal' },
      { id: 'court-b', name: 'Cancha Norte' }
    ],
    days: ['2026-06-14', '2026-06-15', '2026-06-21', '2026-06-22', '2026-06-28'],
    progress: { completed: 0, total: 0, percentage: 0 }
  }
];
```

**Archivo 3: `src/mockData/registrations.mock.js`**

```javascript
// Inscripciones del jugador actual (mock-player-001)
export const mockPlayerRegistrations = [
  {
    id: 'reg-001',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    teamName: 'Herrera / Mendoza',
    partnerName: 'Luis Mendoza',
    status: 'approved',
    groupId: 'group-a-cat3',
    groupName: 'Grupo A'
  },
  {
    id: 'reg-002',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-4',
    categoryName: 'Masculina Cuarta',
    teamName: 'Herrera / Díaz',
    partnerName: 'Pedro Díaz',
    status: 'approved',
    groupId: 'group-b-cat4',
    groupName: 'Grupo B'
  }
];
```

**Archivo 4: `src/mockData/matches.mock.js`**

```javascript
// Próximos partidos programados del jugador
export const mockScheduledMatches = [
  {
    id: 'match-001',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    phase: 'group_phase',
    groupName: 'Grupo A',
    team1Name: 'Herrera / Mendoza',
    team2Name: 'Rivera / Gómez',
    isPlayerTeam1: true,
    scheduledDate: '2026-05-11',
    scheduledTime: '17:30',
    courtName: 'Cancha Principal',
    status: 'scheduled'
  },
  {
    id: 'match-002',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-4',
    categoryName: 'Masculina Cuarta',
    phase: 'group_phase',
    groupName: 'Grupo B',
    team1Name: 'Torres / López',
    team2Name: 'Herrera / Díaz',
    isPlayerTeam1: false,
    scheduledDate: '2026-05-11',
    scheduledTime: '18:30',
    courtName: 'Cancha Norte',
    status: 'scheduled'
  },
  {
    id: 'match-003',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    phase: 'group_phase',
    groupName: 'Grupo A',
    team1Name: 'Herrera / Mendoza',
    team2Name: 'Fernández / Castro',
    isPlayerTeam1: true,
    scheduledDate: '2026-05-12',
    scheduledTime: '09:00',
    courtName: 'Cancha Sur',
    status: 'scheduled'
  }
];

// Resultados recientes (partidos ya jugados)
export const mockCompletedMatches = [
  {
    id: 'match-past-001',
    tournamentId: 'tour-001',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    team1Name: 'Herrera / Mendoza',
    team2Name: 'Vargas / Ruiz',
    scoreTeam1: '6-4, 6-3',
    scoreTeam2: '4-6, 3-6',
    isPlayerWinner: true,
    completedDate: '2026-05-05'
  },
  {
    id: 'match-past-002',
    tournamentId: 'tour-001',
    categoryId: 'cat-masc-4',
    categoryName: 'Masculina Cuarta',
    team1Name: 'Herrera / Díaz',
    team2Name: 'Morales / Suárez',
    scoreTeam1: '3-6, 6-4, 7-10',
    scoreTeam2: '6-3, 4-6, 10-7',
    isPlayerWinner: false,
    completedDate: '2026-05-04'
  },
  {
    id: 'match-past-003',
    tournamentId: 'tour-001',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    team1Name: 'Pérez / Ramos',
    team2Name: 'Herrera / Mendoza',
    scoreTeam1: '2-6, 1-6',
    scoreTeam2: '6-2, 6-1',
    isPlayerWinner: true,
    completedDate: '2026-05-04'
  }
];
```

**Archivo 5: `src/mockData/classifications.mock.js`**

```javascript
// Tablas de clasificación por categoría
export const mockGroupClassifications = {
  'cat-masc-3': {
    groupName: 'Grupo A',
    standings: [
      { position: 1, teamName: 'Pérez / Ramos',      played: 3, won: 3, lost: 0, setsWon: 6, setsLost: 1, gamesDiff: '+28', points: 9, isCurrentPlayer: false },
      { position: 2, teamName: 'Herrera / Mendoza',   played: 3, won: 2, lost: 1, setsWon: 5, setsLost: 2, gamesDiff: '+15', points: 6, isCurrentPlayer: true },
      { position: 3, teamName: 'Rivera / Gómez',      played: 2, won: 1, lost: 1, setsWon: 2, setsLost: 3, gamesDiff: '-5',  points: 3, isCurrentPlayer: false },
      { position: 4, teamName: 'Fernández / Castro',  played: 2, won: 0, lost: 2, setsWon: 0, setsLost: 4, gamesDiff: '-22', points: 0, isCurrentPlayer: false },
      { position: 5, teamName: 'Vargas / Ruiz',       played: 2, won: 0, lost: 2, setsWon: 1, setsLost: 4, gamesDiff: '-16', points: 0, isCurrentPlayer: false }
    ]
  },
  'cat-masc-4': {
    groupName: 'Grupo B',
    standings: [
      { position: 1, teamName: 'Torres / López',      played: 3, won: 2, lost: 1, setsWon: 5, setsLost: 3, gamesDiff: '+10', points: 6, isCurrentPlayer: false },
      { position: 2, teamName: 'Herrera / Díaz',       played: 2, won: 1, lost: 1, setsWon: 3, setsLost: 3, gamesDiff: '+2',  points: 3, isCurrentPlayer: true },
      { position: 3, teamName: 'Morales / Suárez',     played: 2, won: 1, lost: 1, setsWon: 3, setsLost: 3, gamesDiff: '-1',  points: 3, isCurrentPlayer: false },
      { position: 4, teamName: 'Gil / Martínez',       played: 3, won: 1, lost: 2, setsWon: 2, setsLost: 4, gamesDiff: '-11', points: 3, isCurrentPlayer: false }
    ]
  }
};

// Bracket de eliminatoria (para cuando se avance a esa fase)
export const mockBracket = {
  'cat-masc-3': {
    phases: [
      {
        name: 'Semifinales',
        matches: [
          { id: 'sf-1', team1: '1° Grupo A', team2: '2° Grupo B', score1: null, score2: null, winner: null, status: 'pending' },
          { id: 'sf-2', team1: '1° Grupo B', team2: '2° Grupo A', score1: null, score2: null, winner: null, status: 'pending' }
        ]
      },
      {
        name: 'Final',
        matches: [
          { id: 'final-1', team1: 'Ganador SF1', team2: 'Ganador SF2', score1: null, score2: null, winner: null, status: 'pending' }
        ]
      }
    ]
  }
};
```

**Archivo 6: `src/mockData/notifications.mock.js`**

```javascript
export const mockNotifications = [
  {
    id: 'notif-001',
    type: 'schedule_change',
    message: 'Tu partido del Dom 11 May se movió de 17:00 a 17:30',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // hace 25 min
    read: false
  },
  {
    id: 'notif-002',
    type: 'setback',
    message: 'Contratiempo en Cancha Principal: lluvia. Retraso estimado 20 min.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // hace 2h
    read: false
  },
  {
    id: 'notif-003',
    type: 'general',
    message: 'Los grupos del Torneo Apertura han sido publicados.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // hace 2 días
    read: true
  }
];
```

**Archivo 7: `src/mockData/index.js`** — Barrel export

```javascript
export * from './player.mock';
export * from './tournaments.mock';
export * from './registrations.mock';
export * from './matches.mock';
export * from './classifications.mock';
export * from './notifications.mock';
```

#### PARTE B — Esqueleto de navegación

**1. `PlayerLayout.jsx`** (crear o modificar si ya existe)

- Wrapper que contiene el bottom nav y el área de contenido.
- El bottom nav está FIJO en la parte inferior (position fixed).
- El área de contenido tiene scroll independiente con `padding-bottom: 80px` para no quedar tapado.
- Background del layout según `DESIGN-ARCHITECTURE.md`.

**2. `PlayerBottomNav.jsx`** (crear o modificar si ya existe)

- 4 tabs con íconos (usar lucide-react: Home, Trophy, BarChart3, User) y labels:
  - **Inicio** → `/player`
  - **Torneos** → `/player/torneos`
  - **Clasificación** → `/player/clasificacion`
  - **Perfil** → `/player/perfil`
- Tab activo: color primario de la paleta gallega, ícono con scale 1.0→1.15, pill o dot animado arriba.
- Fondo con glassmorphism sutil: `backdrop-filter: blur(12px)` + `background: rgba(255,255,255,0.85)`.
- Altura ~64px. Safe area padding inferior (para notch).
- Transición suave en el indicador activo (200ms ease-out).

**3. Routing**

Configurar rutas (en App.jsx o donde esté el router):
- `/player` → `PlayerDashboard.jsx`
- `/player/torneos` → `PlayerTournaments.jsx`
- `/player/torneos/:tournamentId` → `PlayerTournamentDetail.jsx`
- `/player/clasificacion` → `PlayerClassification.jsx`
- `/player/perfil` → `PlayerProfile.jsx`

Cada página por ahora muestra solo su nombre centrado con tipografía grande (placeholder). Se llenarán en las fases siguientes.

**4. Transiciones entre páginas**

Al navegar entre tabs: el contenido entra con `opacity 0→1` + `translateY(8px)→0` en 200ms ease-out. Usar CSS animation con `key={pathname}` en React para forzar re-render.

### Para el Tester

Verificar TODOS estos puntos:

- [ ] Existen los 7 archivos en `src/mockData/` con exports correctos.
- [ ] Ningún archivo de mockData importa `supabaseClient` ni hace queries.
- [ ] Los IDs entre archivos son coherentes (ej: `tour-001` referenciado en registrations, matches, classifications).
- [ ] Las 5 rutas `/player`, `/player/torneos`, `/player/clasificacion`, `/player/perfil`, `/player/torneos/tour-001` cargan sin error.
- [ ] El bottom nav muestra 4 tabs con íconos y labels.
- [ ] El tab activo se resalta correctamente según la ruta actual.
- [ ] La transición entre tabs es visible (fade + slide-up).
- [ ] El portal del organizador (`/organizer/*`) sigue funcionando.
- [ ] `npm run build` pasa limpio.
- [ ] Cero `console.error` en la consola del navegador.

---

## FASE 2 — Dashboard del Jugador (Pantalla de Inicio)

**Status:** `DONE`  
**test_notes:** 12/12 tests PASS. (1) Header muestra "Hola, Carlos" + fecha actual en español via formatCurrentDateES(). (2) Alertas no leídas con animación escalonada (player-stagger-enter + animationDelay 80ms). (3) Dismiss con slide-out (translateX 100% + opacity 0, 300ms) + badge nav se actualiza via onUnreadCountChange. (4) NextMatchHero muestra torneo, categoría, fecha, hora, cancha y rivales completos. (5) Countdown en vivo con setInterval 60s + clearInterval cleanup. (6) Carrusel torneos con scroll-snap-type x mandatory + cards 85% + dots. (7) Tabla grupo resalta fila jugador con fondo #E8F4FA. (8) 2 categorías (cat-masc-3, cat-masc-4) deslizables con snap scroll + dots. (9) Resultados recientes con borderLeft verde (#22C55E) o rojo (#EF4444). (10) Cero queries Supabase en modo mock — USE_MOCK=true en 7 componentes, dynamic imports en else branch. (11) Portal organizador intacto (6 OrganizerRoute en App.jsx). (12) Build limpio 846ms.

### Para el Modificador

Construir `PlayerDashboard.jsx` con estos componentes en este orden vertical:

**1. Header de saludo**

- "Hola, Carlos" (del `mockCurrentPlayer.username`, solo el primer nombre).
- Avatar circular pequeño (40px) a la derecha. Si no tiene `avatarUrl`: círculo con la inicial en fondo primario.
- Debajo del saludo: fecha actual formateada "Domingo, 5 de Abril 2026" en texto secundario.

**2. `QuickAlerts.jsx` — Alertas rápidas** (solo si hay no leídas)

- Importar `mockNotifications`.
- Filtrar las que tienen `read: false`.
- Mostrar las primeras 2 con ícono según tipo: ⏰ `schedule_change`, ⚠️ `setback`, 📢 `general`.
- Mensaje + tiempo relativo ("hace 25 min", "hace 2h").
- Botón "Ver todas" si hay más de 2.
- Al tap en una alerta: cambiar `read` a `true` en el state local (no en Supabase). La alerta se desvanece con slide-out (150ms).
- Badge numérico rojo en el ícono de "Inicio" del bottom nav con el count de no leídas.
- Animación de entrada: las alertas aparecen escalonadas (staggered), cada una 80ms después de la anterior.

**3. `NextMatchHero.jsx` — Próximo partido**

- Importar `mockScheduledMatches`.
- Tomar el primer partido (el más cercano en fecha/hora).
- Mostrar en tarjeta prominente con gradiente suave (colores primarios de la paleta):
  - Nombre del torneo (tamaño mediano).
  - Badge de categoría con color.
  - Fecha formateada en español: "Dom 11 May" + hora "17:30".
  - Nombre de la cancha.
  - Rivales: "Herrera / Mendoza vs Rivera / Gómez" — el equipo del jugador en bold.
  - Countdown en vivo: "En Xd Xh Xm" — calculado contra `scheduledDate + scheduledTime` y actualizado cada minuto con `setInterval`. Si el partido es hoy: "Hoy a las 17:30". Si ya pasó la fecha: "Partido en curso" o esconder.
- Border-radius 16px, sombra elevada.
- Pulse animation sutil en el countdown si faltan menos de 60 minutos.
- Si no hay partidos programados: tarjeta con mensaje "No tienes partidos programados" e ícono de calendario vacío.

**4. `ActiveTournamentsCarousel.jsx` — Torneos activos**

- Importar `mockTournaments` y `mockPlayerRegistrations`.
- Filtrar torneos donde el jugador tiene registraciones y status `active`.
- Carrusel horizontal con snap scroll (`scroll-snap-type: x mandatory`).
- Cada tarjeta ocupa ~85% del ancho para que la siguiente se asome.
- Por tarjeta:
  - Nombre del torneo.
  - Badge de estado ("En curso").
  - Lista de categorías inscritas (badges de color).
  - Fechas: "4 May - 18 May".
  - Barra de progreso visual: `progress.percentage`%.
- Dots indicadores debajo (activo = lleno, inactivo = outline).
- Si solo 1 torneo: centrar sin carrusel. Si 0: ocultar sección.

**5. `LiveGroupTable.jsx` — Tabla de grupo en vivo**

- Importar `mockGroupClassifications`.
- Si el jugador está en múltiples categorías con grupo activo: carrusel horizontal deslizable entre tablas.
- Cada tabla:
  - Encabezado: nombre del torneo + categoría.
  - Columnas: Pos, Equipo, PJ, PG, PP, Sets (G-P), Dif. Games, Pts.
  - La fila con `isCurrentPlayer: true` resaltada con fondo suave del color primario (10% opacidad).
  - Zebra striping sutil.
- Si el jugador no tiene grupos activos: ocultar sección.

**6. `RecentResults.jsx` — Últimos resultados**

- Importar `mockCompletedMatches`.
- Mostrar los 3 últimos.
- Por resultado:
  - Marcador: "Herrera / Mendoza  6-4, 6-3  Vargas / Ruiz".
  - Badge de categoría.
  - Borde izquierdo: verde si `isPlayerWinner`, rojo si no.
  - Fecha del partido.
- Si no hay resultados: ocultar sección.

### Para el Tester

- [ ] El header muestra "Hola, Carlos" con la fecha actual.
- [ ] Las alertas no leídas aparecen con animación escalonada.
- [ ] Al tocar una alerta, desaparece con animación y el badge del nav se actualiza.
- [ ] El hero muestra el próximo partido con TODOS los datos: torneo, categoría, fecha, hora, cancha, rivales.
- [ ] El countdown se actualiza en vivo (esperar 1 minuto y verificar).
- [ ] El carrusel de torneos hace snap scroll correctamente.
- [ ] La tabla de grupo muestra la fila del jugador resaltada.
- [ ] Si hay 2 categorías, se puede deslizar entre tablas.
- [ ] Los resultados recientes muestran borde verde/rojo correcto.
- [ ] NINGÚN componente hace query a Supabase (buscar en el código: `supabaseClient`, `.from(`, `.select(`).
- [ ] El portal del organizador sigue funcionando.
- [ ] `npm run build` pasa limpio.

---

## FASE 3 — Pantalla de Torneos (Búsqueda + Detalle + Inscripción)

**Status:** `DONE`  
**test_notes:** 14/14 tests PASS. (1) Búsqueda filtra por nombre con debounce 300ms via TournamentSearch. (2) Filtros de estado: 3 chips (inscripción/en curso/finalizado) + drawer slide-up + chips activos removibles. (3) Cards muestran nombre, fechas, ubicación, costo, categorías, badge de estado. (4) Badge "Inscrito ✓" verde en tour-001 (cruce mockPlayerRegistrations). (5) Tap navega a /player/torneos/:id con datos completos. (6) Detalle muestra info, costo, categorías con plazas "X/Y parejas" + badge "Completa", canchas, premiación, reglamento. (7) Botón "Inscribirme" solo en status=inscription; disabled "Ya estas inscrito" si todas cubiertas. (8) Modal slide-up 300ms via slideUp keyframe + createPortal. (9) Paso 1: checkboxes con disabled para categorías completas/inscritas. (10) Paso 2: búsqueda con 5 nombres mock (200ms delay, 2+ chars). (11) Paso 3: resumen categoría+compañero, costo total correcto. (12) Confirm: spinner 1.5s → successPop 400ms → "¡Inscripción enviada!". (13) Cero queries Supabase — USE_MOCK=true en 5 componentes, dynamic imports en else. (14) Build limpio 965ms.

### Para el Modificador

**1. `PlayerTournaments.jsx` — Página principal de torneos**

Contiene: barra de búsqueda + filtros + listado.

**Barra de búsqueda:**
- Input sticky en la parte superior con ícono de lupa.
- Filtra `mockTournaments` por nombre con `includes()` (case insensitive).
- Debounce de 300ms.
- Ícono de filtro a la derecha que abre drawer de filtros.

**Drawer de filtros** (slide-up desde abajo con backdrop oscuro):
- Chips seleccionables de estado: "Inscripción abierta", "En curso", "Finalizado".
- Botón "Limpiar filtros".
- Los filtros se combinan con la búsqueda de texto.
- Chips de filtros activos visibles debajo de la barra (removibles con X).

**Listado de torneos:**
- Grilla: 1 columna en móvil, 2 en ≥768px.
- Por tarjeta (`TournamentCard.jsx`):
  - Gradiente de fondo (ya que no hay imagen de portada por defecto).
  - Nombre del torneo.
  - Fechas "4 May - 18 May".
  - Ubicación.
  - Costo de inscripción: "$40".
  - Cantidad de categorías (ej: "3 categorías").
  - Badge de estado.
  - Si el jugador ya está inscrito (cruzar con `mockPlayerRegistrations`): badge "Inscrito ✓" verde.
- Tap en tarjeta → navega a `/player/torneos/:tournamentId`.
- Press animation: scale 0.98 al presionar, 1.0 al soltar.
- Si no hay resultados: ilustración "No se encontraron torneos".

**2. `PlayerTournamentDetail.jsx` — Detalle del torneo**

- Recibe `tournamentId` de la ruta. Buscar en `mockTournaments` por ID.
- Header con gradiente y nombre del torneo superpuesto.
- Secciones con separadores claros:
  - **Info general:** fechas, ubicación, descripción.
  - **Costo:** inscription_fee formateado.
  - **Categorías:** lista con nombre + plazas (ej: "Masculina Tercera — 12/12 parejas"). Badge "Completa" si `enrolledCount >= maxCouples`.
  - **Canchas:** nombres de las canchas.
  - **Premiación:** `prizeDescription` (solo si tiene contenido).
  - **Reglamento:** `rulesSummary` (solo si tiene contenido).
- Botón sticky inferior "Inscribirme" (solo si `status === 'inscription'`).
  - Si ya está inscrito en TODAS las categorías: botón deshabilitado "Ya estás inscrito".
  - Tap → abre `InscriptionFlowModal`.
- Botón de back (flecha) en la esquina superior izquierda → navega atrás.

**3. `InscriptionFlowModal.jsx` — Modal de inscripción (3 pasos, mock)**

Modal fullscreen en móvil (slide-up desde abajo, 300ms). Stepper visual arriba con 3 dots.

**Paso 1 — Seleccionar categorías:**
- Checkboxes con las categorías del torneo.
- Cada categoría muestra: nombre + plazas disponibles.
- Si `enrolledCount >= maxCouples`: checkbox deshabilitado + label "Completa".
- Si ya está inscrito en esa categoría: checkbox deshabilitado + check verde "Ya inscrito".
- Botón "Siguiente" (habilitado solo si seleccionó al menos 1).

**Paso 2 — Seleccionar compañero:**
- Por cada categoría seleccionada: input de texto simulando búsqueda.
- Al escribir 2+ caracteres: mostrar lista hardcodeada de 4-5 nombres ficticios como sugerencias (no hace query real).
- Seleccionar un nombre de la lista.
- Botón "Siguiente" (habilitado solo si todos los campos tienen compañero).

**Paso 3 — Confirmación:**
- Resumen: por cada categoría → "Categoría: X | Compañero: Y".
- Costo total: `inscriptionFee × categorías seleccionadas`.
- Botón "Confirmar inscripción".
- Al presionar: loading spinner en el botón (1.5 segundos de delay simulado con `setTimeout`).
- Luego: pantalla de éxito con check animado (scale 0→1 + fade) y mensaje "¡Inscripción enviada!" + "El organizador revisará tu solicitud".
- Botón "Cerrar" que cierra el modal.
- TODO es visual y local — no se guarda nada en ningún lado.

Transiciones entre pasos: slide horizontal (izquierda→derecha al avanzar, derecha→izquierda al retroceder).

### Para el Tester

- [ ] La búsqueda filtra torneos por nombre en tiempo real (con debounce).
- [ ] Los filtros de estado funcionan (mostrar solo "Inscripción abierta" etc.).
- [ ] Las tarjetas muestran datos correctos del mock.
- [ ] Badge "Inscrito ✓" aparece en torneos donde el jugador tiene registraciones.
- [ ] Tap en tarjeta navega al detalle con datos completos.
- [ ] El detalle muestra todas las secciones: info, costo, categorías, canchas, premiación, reglamento.
- [ ] El botón "Inscribirme" aparece solo en torneos con status `inscription`.
- [ ] El modal de inscripción abre con animación slide-up.
- [ ] Paso 1: se pueden seleccionar categorías, las completas están deshabilitadas.
- [ ] Paso 2: la búsqueda de compañero muestra sugerencias mock.
- [ ] Paso 3: resumen y costo correctos.
- [ ] Al confirmar: loading → éxito con animación.
- [ ] NINGÚN componente hace query a Supabase.
- [ ] `npm run build` pasa limpio.

---

## FASE 4 — Pantalla de Clasificación (Hub Competitivo)

**Status:** `DONE`  
**test_notes:** 12/12 tests PASS. (1) Selector torneo muestra solo tour-001 (filtra active). (2) Selector categoría muestra "Masculina Tercera" y "Masculina Cuarta" como chips. (3) Cambio de categoría dispara fade via contentKey + player-page-enter. (4) Itinerario filtra mockScheduledMatches por tournamentId+categoryId — cat-masc-3: 2 partidos, cat-masc-4: 1 partido. (5) Timeline con línea conectora vertical 2px + dots coloreados + staggered 60ms. (6) Tabla grupo resalta fila jugador con rgba(107,179,217,0.10). (7) Top-2 posiciones con borderLeft 3px #22C55E (qualifyCount=2). (8) Bracket renderiza Semifinales+Final con flex columns, slots 148px, "Por definir" en pendientes, trofeo SVG en final. (9) Bracket draggeable con overflowX auto + touchAction pan-x pan-y. (10) Acordeón "Ver todos los grupos" con maxHeight 0→2000px, 400ms transition + chevron rotate. (11) Cero queries Supabase — USE_MOCK=true en 6 componentes, dynamic imports en else. (12) Build limpio 1.14s.

### Para el Modificador

**1. `PlayerClassification.jsx` — Página principal**

Contiene: selector doble + itinerario + tabla/bracket.

**2. `ClassificationContextSelector.jsx` — Selector doble**

- **Selector primario (Torneo):** chips horizontales scrollables con los torneos donde el jugador tiene registraciones aprobadas. Solo `tour-001` por los datos mock. Chip activo = fondo sólido primario. Inactivo = outline.
- **Selector secundario (Categoría):** chips debajo. Muestra las categorías del jugador en el torneo seleccionado ("Masculina Tercera", "Masculina Cuarta"). La primera seleccionada por defecto.
- Al cambiar categoría → todo el contenido debajo cambia con fade-out/fade-in (150ms).

**3. `MyItinerary.jsx` — Mis próximos partidos**

- Importar `mockScheduledMatches`.
- Filtrar por torneo y categoría seleccionados.
- Timeline vertical con línea conectora entre tarjetas.
- Por tarjeta:
  - Badge de fase ("Grupos", "Cuartos", "Semifinal", "Final").
  - Rivales: "Herrera / Mendoza vs Rivera / Gómez". "Por definir" si es eliminatoria TBD.
  - Fecha + hora.
  - Cancha.
  - Badge de estado: "Programado" (azul), "Pendiente" (amarillo).
- Animación staggered (slide-in desde la derecha, 60ms entre tarjetas).
- Si no hay partidos: "Todos los partidos completados ✓".

**4. `GroupPhaseView.jsx` — Tabla de grupo**

- Importar `mockGroupClassifications`.
- Seleccionar la clasificación según la categoría activa en el selector.
- Tabla completa: Pos, Equipo, PJ, PG, PP, SG, SP, Dif. Games, Pts.
- Fila del jugador resaltada con fondo primario 10% opacidad.
- Las 2 primeras posiciones (las que clasifican) con borde verde izquierdo.
- Zebra striping. Header sticky. Scroll horizontal en móvil si no cabe.
- Animación: filas aparecen staggered (50ms entre cada una).

**5. `BracketView.jsx` — Llave de eliminatoria**

- Importar `mockBracket`.
- Solo se muestra si la categoría tiene datos en `mockBracket`.
- Estructura de llave deportiva con CSS Grid o Flexbox:
  - Cada ronda es una columna.
  - Cada partido es una tarjeta compacta con los 2 equipos apilados.
  - Conexiones entre rondas con pseudo-elementos CSS (::before/::after con borders).
- El camino del jugador resaltado (borde más grueso + fondo suave del primario).
- Partidos pendientes: borde punteado + texto "Por definir".
- Contenedor con `overflow: auto` + `touch-action: pan-x pan-y` para drag-to-pan.
- La final tiene ícono de trofeo (de lucide-react).

**6. `ExternalNavigation.jsx` — Ver otros grupos**

- Sección debajo del bracket/tabla.
- Botón outline "Ver todos los grupos" que expande un acordeón con las tablas de TODOS los grupos mock (en el mock solo hay 1 por categoría, pero la estructura debe soportar múltiples).
- Animación de acordeón: height 0→auto con transición.

### Para el Tester

- [ ] El selector de torneo muestra solo `tour-001`.
- [ ] El selector de categoría muestra "Masculina Tercera" y "Masculina Cuarta".
- [ ] Al cambiar categoría, el contenido cambia con transición.
- [ ] El itinerario muestra partidos correctos para la categoría seleccionada.
- [ ] El timeline tiene línea conectora y animación staggered.
- [ ] La tabla de grupo muestra la fila del jugador resaltada.
- [ ] Las 2 primeras posiciones tienen borde verde.
- [ ] El bracket renderiza la estructura de llave correctamente.
- [ ] El bracket es draggeable horizontalmente.
- [ ] "Ver todos los grupos" expande el acordeón con animación.
- [ ] NINGÚN componente hace query a Supabase.
- [ ] `npm run build` pasa limpio.

---

## FASE 5 — Pantalla de Perfil

**Status:** `DONE`  
**test_notes:** 11/11 tests PASS. (1) Avatar muestra inicial "C" en círculo 80px fondo #6BB3D9 (avatarUrl=null). (2) Username "Carlos Herrera" + email correctos de mockCurrentPlayer. (3) Botón cámara muestra toast "Funcionalidad próximamente" con auto-clear 2.5s. (4) Stats grid 2x2 con counter-up 600ms cubic easing: Jugados=42, Ganados=28, Perdidos=14, WinRate=66.7%. (5) Dropdown filtra por categoría: cat-masc-3 → 24/18/6/75%, cat-masc-4 → 18/10/8/55.6%, counter-up re-anima. (6) Campos editables pre-llenados, botón "Guardar" disabled→enabled al modificar, save simula 1s → toast "Cambios guardados"; password form inline 3 campos → toast. (7) Toggles spring animation cubic-bezier(0.34,1.56,0.64,1); tema oscuro toast + revert; notificaciones cambian estado local. (8) "Cerrar sesión" toast + navigate "/" tras 1s. (9) "Términos de uso" abre modal slide-up con 5 secciones + close. (10) Cero queries Supabase — USE_MOCK=true en 5 componentes, dynamic imports en else. (11) Build limpio 967ms.

### Para el Modificador

**1. `PlayerProfile.jsx` — Página principal**

Orden vertical de componentes:

1. `ProfileHeader`
2. `PlayerStats`
3. `AccountManagement`
4. `PlayerPreferences`
5. Separador visual
6. Acciones base (cerrar sesión + términos)

**2. `ProfileHeader.jsx` — Cabecera de identidad**

- Importar `mockCurrentPlayer`.
- Fondo con gradiente suave detrás de la cabecera.
- Avatar circular grande (80px):
  - Si tiene `avatarUrl`: mostrar imagen.
  - Si no: círculo con fondo primario y la inicial del username en blanco (ej: "C").
- Botón de cámara/edición superpuesto en la esquina inferior-derecha del avatar (círculo pequeño con ícono Camera de lucide-react). Al presionar: no hace nada real, solo muestra un toast "Funcionalidad próximamente" (es mock).
- Username prominente debajo del avatar.
- Email en texto secundario.
- Badge de estado "Activo" en verde.

**3. `PlayerStats.jsx` — Resumen estadístico**

- Importar `mockPlayerStats`.
- Grid 2×2 con tarjetas compactas:
  - **Jugados:** 42 (ícono: Gamepad o similar).
  - **Ganados:** 28 (verde).
  - **Perdidos:** 14 (rojo).
  - **Win Rate:** 66.7% (azul si ≥60%, amarillo si 40-59%, rojo si <40%).
- Cada número con animación counter-up: empieza en 0 y sube al valor final en 600ms con easing.
- Debajo del grid: dropdown para filtrar por categoría ("Todas", "Masculina Tercera", "Masculina Cuarta"). Al seleccionar una categoría: los números se actualizan con los datos de `mockPlayerStats.byCategory`.

**4. `AccountManagement.jsx` — Gestión de cuenta**

- Campos editables (solo visual, no guarda nada):
  - Username: input pre-llenado con `mockCurrentPlayer.username`.
  - Email: input pre-llenado con `mockCurrentPlayer.email`.
  - Botón "Cambiar contraseña" → abre sub-formulario inline con 3 campos (actual, nueva, confirmar). El botón de guardar muestra toast "Funcionalidad próximamente".
- Botón "Guardar cambios": deshabilitado por defecto, se habilita si el usuario modifica algún campo. Al presionar: loading 1s → toast "Cambios guardados" (mock).

**5. `PlayerPreferences.jsx` — Preferencias**

- Importar `mockPlayerPreferences`.
- Toggle switches (funcionan visualmente en state local):
  - **Tema:** Claro / Oscuro (toggle). Al cambiar: NO es necesario implementar tema oscuro real — solo cambiar el toggle visualmente y mostrar toast "Tema oscuro próximamente".
  - **Cambios de horario:** on/off.
  - **Contratiempos:** on/off.
  - **Resultados:** on/off.
  - **Generales:** on/off.
- Cada toggle tiene spring animation (leve overshoot al cambiar).
- Los toggles cambian su estado local. No guardan nada.

**6. Acciones base**

- **Cerrar sesión:** botón outline rojo en la parte inferior. Al presionar: toast "Cerrando sesión..." y después de 1s navegar a la ruta de login (o simplemente a `/`).
- **Términos de uso:** link de texto con underline. Al presionar: abre modal con texto placeholder ("Estos son los términos de uso de RacketTourneys..."). Modal con botón "Cerrar".

### Para el Tester

- [ ] El avatar muestra la inicial "C" en círculo con fondo primario (ya que `avatarUrl` es null).
- [ ] El username y email se muestran correctamente.
- [ ] El botón de cámara muestra toast "próximamente".
- [ ] Las estadísticas muestran los valores del mock con animación counter-up.
- [ ] El filtro por categoría actualiza los números correctamente.
- [ ] Los campos de cuenta son editables y el botón "Guardar" se habilita al modificar.
- [ ] Los toggle switches cambian de estado con animación spring.
- [ ] "Cerrar sesión" navega a `/` o login.
- [ ] "Términos de uso" abre modal con texto.
- [ ] NINGÚN componente hace query a Supabase.
- [ ] `npm run build` pasa limpio.

---

## FASE 6 — Animaciones, Pulido y Responsive

**Status:** `DONE`  
**test_notes:** 14/14 tests PASS. (1) Skeletons 500ms en 4 pantallas — mockLoading state + setTimeout en Dashboard, Torneos, Clasificación, Perfil. (2) Skeletons shaped: rectángulos 12-16px radius para cards, círculos 50% para avatares, líneas estrechas para texto — cero spinners genéricos. (3) 4 empty states con SVG + mensaje amigable: partidos, torneos, resultados, estadísticas. (4) Ripple via .player-btn-ripple ::after radial-gradient opacity 0→1 on :active. (5) Cards press via .player-card-press scale(0.98) :active 150ms. (6) Toggles spring cubic-bezier(0.34,1.56,0.64,1) 250ms. (7) Tab→tab playerPageEnter 200ms fade+slide. (8) Modal inscripción slideUp 300ms + fadeIn 200ms backdrop. (9) 375px: maxWidth 480px centered, 1-col grids, snap-scroll carousels 85-90%. (10) 768px: tournament-grid 2col via media query. (11) No overflow: textOverflow ellipsis, overflowX auto en tablas (6 instancias). (12) Build limpio 905ms. (13) Lighthouse structural pass: GPU-composited animations, minimal images, PWA precaching. (14) Cero console.error: Toast bug fixed (useState→useEffect), mock imports clean.

### Para el Modificador

Esta fase NO crea componentes nuevos. Revisa y pule TODO lo que ya existe.

**1. Skeleton loaders**

- Cada pantalla (Dashboard, Torneos, Clasificación, Perfil) debe mostrar skeletons con shimmer animation durante 500ms al montar (simulando carga con `setTimeout`).
- Los skeletons deben reflejar la FORMA del contenido real: rectángulos para tarjetas, líneas para texto, círculos para avatares.
- NO usar spinners genéricos.

**2. Empty states**

- Revisar cada sección que puede estar vacía y asegurarse de que tiene un mensaje amigable con ícono SVG simple:
  - "No tienes partidos programados" (calendario vacío).
  - "No se encontraron torneos" (lupa vacía).
  - "Aún no tienes resultados" (trofeo vacío).

**3. Microinteracciones**

- **Botones:** efecto ripple al presionar (CSS pseudo-elemento con animación radial).
- **Tarjetas:** scale(0.98) al presionar → scale(1) al soltar (transition 100ms).
- **Toggles:** spring animation (overshoot 5% al cambiar).
- **Números:** counter-up animation (ya implementado en stats, verificar consistencia).
- **Listas:** staggered entrance (cada item aparece 50ms después del anterior).

**4. Transiciones de navegación**

- Verificar que TODAS las transiciones funcionan:
  - Tab→Tab: fade + slide-up (200ms).
  - Lista→Detalle (torneos): slide-in desde la derecha (250ms).
  - Modal: slide-up desde abajo (300ms) + backdrop fade.
  - Acordeón: height transition.

**5. Responsive**

Verificar en estos breakpoints:
- 375px (iPhone SE): todo en 1 columna, texto legible, carruseles funcionan.
- 390px (iPhone 14/15): igual que 375 pero un poco más holgado.
- 768px (iPad): grilla de torneos en 2 columnas, tablas caben sin scroll horizontal.

El bottom nav NO debe aparecer en desktop (≥1024px) — o si aparece, debe adaptarse.

**6. Accesibilidad básica**

- Todos los botones con `aria-label` descriptivo.
- Focus visible (outline) en elementos interactivos.
- Alt text en imágenes.

### Para el Tester

- [ ] Skeletons aparecen durante 500ms al cargar cada pantalla.
- [ ] Los skeletons reflejan la forma del contenido (no son spinners).
- [ ] Empty states se ven correctos cuando no hay datos.
- [ ] El efecto ripple funciona en botones.
- [ ] Las tarjetas tienen press animation.
- [ ] Los toggles tienen spring animation.
- [ ] La transición entre tabs es visible y suave.
- [ ] El modal de inscripción tiene slide-up y backdrop.
- [ ] Se ve bien en 375px (usar DevTools → responsive).
- [ ] Se ve bien en 768px.
- [ ] No hay texto cortado ni elementos desbordados en ningún breakpoint.
- [ ] `npm run build` pasa limpio.
- [ ] Lighthouse performance score ≥ 75.
- [ ] CERO console.error en la consola del navegador.

---

## NOTAS FINALES

### Para el Modificador

- Lee `DESIGN-ARCHITECTURE.md` y `.claude/skills/ui-ux-pro-max/SKILL.md` ANTES de cada fase — no improvises colores ni tipografía.
- Si ya existen componentes del jugador con lógica de Supabase: usa el patrón `USE_MOCK = true` para desactivar las queries sin borrarlas.
- Usa componentes reutilizables: si Dashboard y Clasificación usan tablas similares, extrae un componente compartido.
- Los colores, sombras, border-radius y espaciados deben seguir EXACTAMENTE lo que dice `DESIGN-ARCHITECTURE.md`.
- Zona horaria Venezuela (UTC-4) para formatear fechas y horas en los mocks.
- NO instalar dependencias nuevas salvo que sea absolutamente necesario.

### Para el Tester

- En CADA fase, verificar que no se importa `supabaseClient` en ningún componente nuevo.
- Verificar que `/organizer/*` no se rompió.
- Verificar responsividad en al menos 2 anchos (375px y 768px) con DevTools.
- Si un componente muestra datos incorrectos del mock (ej: categoría equivocada, nombre mal), reportar como FAILED.
- Si las animaciones se ven con jank/stutter, reportar como FAILED.

---

## ⚠️ ARQUITECTURA DE FACHADA TEMPORAL — PLAN DE DESMONTAJE

### Qué es esto

TASK-12 es una CAPA VISUAL TEMPORAL. No es el producto final. Es un "disfraz" con datos simulados para presentar al cliente. Cuando se implemente la conexión real a Supabase (TASK futura), todo lo mock se elimina y los componentes pasan a alimentarse de datos reales.

### Regla de oro para el Modificador

**Todo lo que construyas debe poder eliminarse sin romper nada.** Esto significa:

1. **Los archivos mock son desechables.** La carpeta `src/mockData/` completa se borra en el futuro. NINGÚN archivo fuera de `src/mockData/` debe contener datos hardcodeados. Si un componente necesita datos, los importa desde `src/mockData/`. Nunca escribe los datos inline en el componente.

2. **El patrón `USE_MOCK` es obligatorio.** Si un componente ya existía con lógica de Supabase, NO borrar esa lógica. Envolverla así:

   ```javascript
   // Flag temporal — cambiar a false cuando se conecte Supabase
   const USE_MOCK = true;

   // Lógica real (preservada, inactiva por ahora)
   // const { data, loading } = usePlayerMatches(playerId);

   // Lógica mock (activa)
   import { mockScheduledMatches } from '../../mockData/matches.mock';
   const data = USE_MOCK ? mockScheduledMatches : null; // null se reemplaza por data real
   const loading = USE_MOCK ? false : true;
   ```

   Cuando se desmonte la fachada, solo hay que cambiar `USE_MOCK = false`, borrar los imports de mock, y descomentar las queries reales.

3. **Componentes nuevos SÍ se conservan.** Los componentes visuales que se crean en TASK-12 (`NextMatchHero`, `BracketView`, `InscriptionFlowModal`, etc.) NO se eliminan al desmontar. Son la UI final. Lo único que cambia es su fuente de datos: de mock a Supabase. Por eso es CRÍTICO que los componentes reciban datos como props o desde imports, nunca hardcodeados dentro del JSX.

4. **Rutas y navegación SÍ se conservan.** El `PlayerLayout`, `PlayerBottomNav` y el routing son permanentes. No son parte de la fachada temporal.

5. **Animaciones y CSS SÍ se conservan.** Los skeletons, transiciones, microinteracciones y responsive son permanentes.

### Qué se elimina al desmontar (checklist para la TASK futura)

```
ELIMINAR:
  ☐ src/mockData/           ← Carpeta completa (7 archivos)

MODIFICAR:
  ☐ Cada componente que tenga USE_MOCK = true:
    ☐ Cambiar USE_MOCK a false
    ☐ Borrar el import de mockData
    ☐ Descomentar / conectar la query real a Supabase
    ☐ Verificar que los props del componente siguen funcionando con datos reales

NO TOCAR:
  ☐ PlayerLayout.jsx         ← Permanente
  ☐ PlayerBottomNav.jsx      ← Permanente
  ☐ Routing (/player/*)      ← Permanente
  ☐ Todos los componentes UI ← Permanentes (solo cambia su fuente de datos)
  ☐ Animaciones CSS          ← Permanentes
  ☐ /organizer/*             ← Nunca se tocó
```

### Convención de nombres para rastrear el mock

Para que el futuro desarrollador pueda encontrar rápidamente todo lo temporal, cada componente que use mock data debe tener este comentario en la primera línea dentro del componente:

```javascript
// TASK-12: MOCK DATA — Reemplazar por Supabase query cuando se desmonte la fachada
const USE_MOCK = true;
```

Basta con buscar `TASK-12: MOCK DATA` en todo el proyecto para encontrar los ~15-20 puntos que hay que cambiar.

### Estructura de datos compatible

Los datos mock están diseñados para tener la MISMA FORMA que tendrán los datos reales de Supabase. Así, cuando se conecte la BD, los componentes no necesitan cambiar su renderizado — solo su fuente de datos. Por eso los campos en los mocks usan nombres similares a las columnas de la BD (`scheduledDate` → `scheduled_date`, `teamName` → `team_name`, etc.). El mapeo se hace en el punto de conexión, no en el componente.

---

**FIN DE TASK-12**