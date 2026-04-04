# TASK-5.md — Dashboard del Organizador: Resumen del Torneo Activo

---

## FLUJO DE TRABAJO — DOS AGENTES

### Instrucciones para AGENTE MODIFICADOR (Terminal 1)

1. Lee este archivo completo antes de empezar
2. Lee también `DESIGN-ARCHITECTURE.md` y `CLAUDE.md`
3. Usa la habilidad **UI-UX PRO MAX** para todo componente visual
4. Busca la primera fase con status `READY`
5. Cambia el status a `IN_PROGRESS`
6. Ejecuta TODO lo que dice esa fase
7. Al terminar, ejecuta `npm run build` — si falla, arregla hasta que pase
8. Cambia el status a `WAITING_FOR_TEST`
9. Imprime en terminal un resumen de 3-5 líneas
10. **PARA.** No sigas a la siguiente fase
11. **NO generes reportes ni archivos adicionales**

### Instrucciones para AGENTE TESTER (Terminal 2)

1. Monitorea este archivo buscando fases con status `WAITING_FOR_TEST`
2. Cambia el status a `TESTING`
3. Ejecuta TODAS las validaciones listadas
4. Si PASA: cambia esa fase a `DONE` y la siguiente a `READY`
5. Si FALLA: cambia a `FAILED` y escribe qué falló en `test_notes`
6. Imprime en terminal un resumen de 3-5 líneas
7. **NO generes reportes ni archivos adicionales**

---

## CONTEXTO

La app tiene torneos activos con partidos programados en canchas con horarios, resultados que se van registrando, clasificaciones por grupo y brackets eliminatorios. Actualmente la página de inicio del organizador (`DashboardPage.jsx`) es básica. Esta tarea la transforma en un dashboard completo que muestra el estado en tiempo real del torneo activo.

### Datos disponibles en BD

- `tournament_matches` — partidos con scheduled_date, scheduled_time, court_id, status, score, winner_id
- `tournament_groups` + `tournament_group_members` — grupos con estadísticas acumuladas, final_rank
- `tournament_bracket` — estructura eliminatoria con team1_id, team2_id, winner_id, round_number, position
- `categories` — categorías del torneo
- `courts` — canchas con nombres
- `tournament_registrations` + `profiles` — nombres de jugadores

---

## OBJETIVO GENERAL

Transformar la página de inicio del organizador en un dashboard con 3 secciones principales:

1. **Próximos partidos** — Muestra por cada cancha el próximo partido a disputarse
2. **Progreso del torneo** — Barra de progreso con porcentaje de avance
3. **Clasificación** — Tablas de posiciones por grupo (fase de grupos) o bracket visual (fase eliminatoria)

---

## DESCRIPCIÓN DETALLADA DE LA UI

### Sección 1: Próximos partidos

```
┌─────────────────────────────────────────┐
│  Próximos partidos                      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Cancha Principal                │    │
│  │ 10:15 · Primera · Grupo A      │    │
│  │                                 │    │
│  │ Carlos Méndez                   │    │
│  │ María González                  │    │
│  │         vs                      │    │
│  │ Pedro Álvarez                   │    │
│  │ Ana Fernández                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Cancha Norte                    │    │
│  │ 10:15 · Segunda · Grupo B      │    │
│  │                                 │    │
│  │ Raúl Moreno                     │    │
│  │ Isabel García                   │    │
│  │         vs                      │    │
│  │ Fernando Ramos                  │    │
│  │ Patricia Silva                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Cancha Sur                      │    │
│  │ Sin partidos próximos           │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- Una card por cada cancha del torneo
- Muestra el PRÓXIMO partido de esa cancha (el primer partido con status='scheduled' ordenado por fecha y hora)
- Si la cancha no tiene partidos pendientes: "Sin partidos próximos" en gris
- Nombres de jugadores en formato vertical (Player1 arriba, Player2 abajo, vs al centro)
- Si el partido es de eliminatoria sin equipos: "Por definir vs Por definir"
- Header de la card: nombre de la cancha en bold
- Sub-header: hora · categoría · grupo/fase
- Borde izquierdo celeste (#6BB3D9)
- Card blanca con sombra suave

### Sección 2: Progreso del torneo

```
┌─────────────────────────────────────────┐
│  Progreso del torneo                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ████████████░░░░░░░░░  58%     │    │
│  │                                 │    │
│  │ 45 de 77 partidos completados   │    │
│  │ 32 partidos restantes           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Primera      ████████░░  80%   │    │
│  │ Segunda      █████░░░░░  50%   │    │
│  │ Tercera      ███░░░░░░░  33%   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- Barra de progreso GENERAL del torneo arriba:
  - Porcentaje = (partidos completados / partidos totales) × 100
  - Partidos totales = fase de grupos + eliminatoria de TODAS las categorías
  - Color de la barra: rojo (0-33%), amarillo (34-66%), verde (67-100%)
  - Texto debajo: "X de Y partidos completados" + "Z partidos restantes"
- Barras de progreso por CATEGORÍA debajo:
  - Una barra más pequeña por cada categoría
  - Nombre de categoría a la izquierda, porcentaje a la derecha
  - Misma lógica de colores (rojo/amarillo/verde)
  - Solo cuenta partidos de ESA categoría

### Sección 3: Clasificación (DINÁMICA según fase)

Esta sección cambia su contenido según el estado del torneo:

**SI hay categorías en fase de grupos → Mostrar tablas de posiciones**

```
┌─────────────────────────────────────────┐
│  Clasificación                          │
│                                         │
│  [Primera ▼]   ← selector de categoría │
│                                         │
│  [Grupo A] [Grupo B] [Grupo C]  ← tabs │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ #  Dupla          PJ PG PP DG  │    │
│  │ 1  C.Méndez/      3  3  0 +12 │    │
│  │    M.González                   │    │
│  │ 2  P.Álvarez/     3  2  1  +5 │    │
│  │    A.Fernández                  │    │
│  │ 3  L.Rodríguez/   3  1  2  -3 │    │
│  │    R.Martínez                   │    │
│  │ 4  J.Pérez/       3  0  3 -14 │    │
│  │    L.Torres                     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Partidos del grupo:                    │
│  ┌─────────────────────────────────┐    │
│  │ C.Méndez vs P.Álvarez  6-4 6-3│    │
│  │ C.Méndez vs L.Rodríg.  6-2 6-1│    │
│  │ P.Álvarez vs L.Rodríg. 4-6 6-3│    │
│  │            6-4                  │    │
│  │ ...                             │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

Tabla de posiciones por grupo:
- Columnas: # (posición), Dupla (nombres), PJ (partidos jugados), PG (partidos ganados), PP (partidos perdidos), DG (diferencia de games o sets según scoring)
- Ordenada por final_rank si existe, o por matches_won descendente
- Los primeros clasificados (según teams_per_group_qualify) resaltados con fondo celeste suave (#E8F4FA)
- Si hay mejores N-ésimos clasificados, resaltados con fondo dorado suave (#FFF5D6)
- Los no clasificados sin resaltar
- Debajo de la tabla: lista de partidos del grupo con resultados (si completados) o "Pendiente"

Controles:
- Dropdown de categoría arriba (si hay más de una categoría)
- Tabs/botones de grupo debajo del dropdown: [Grupo A] [Grupo B] [Grupo C]
- Tab activo con fondo celeste, inactivos gris claro
- Al cambiar grupo se actualiza la tabla y la lista de partidos

**SI una categoría terminó fase de grupos → Mostrar bracket eliminatorio**

```
┌─────────────────────────────────────────┐
│  Clasificación                          │
│                                         │
│  [Segunda ▼]   ← selector de categoría │
│                                         │
│  Fase eliminatoria                      │
│                                         │
│  CUARTOS          SEMIS         FINAL   │
│  ┌────────┐                             │
│  │ Equipo1│──┐                          │
│  └────────┘  │  ┌────────┐              │
│              ├──│ Equipo1│──┐           │
│  ┌────────┐  │  └────────┘  │           │
│  │ Equipo2│──┘              │ ┌────────┐│
│  └────────┘                 ├─│  ???   ││
│                             │ └────────┘│
│  ┌────────┐                 │           │
│  │ Equipo3│──┐              │           │
│  └────────┘  │  ┌────────┐  │           │
│              ├──│  ???   │──┘           │
│  ┌────────┐  │  └────────┘              │
│  │ Equipo4│──┘                          │
│  └────────┘                             │
└─────────────────────────────────────────┘
```

Bracket visual:
- Muestra TODAS las rondas de eliminatoria de izquierda a derecha
- Headers: "Cuartos", "Semis", "Final" (o "Octavos", "Cuartos", "Semis", "Final")
- Cada slot muestra el nombre de la dupla o "Por definir" si team_id es NULL
- Si el partido se jugó: resaltar el ganador con fondo verde suave y ★
- Líneas conectoras entre rondas mostrando quién avanza
- Scroll horizontal si el bracket es ancho (octavos + cuartos + semis + final)
- Responsive: en móvil, el bracket se puede scrollear horizontalmente

Cuándo mostrar qué:
- Si TODAS las categorías están en fase de grupos → solo tablas de posiciones
- Si ALGUNA categoría terminó grupos → mostrar tabla para las que están en grupos, bracket para las que están en eliminatoria
- El dropdown de categoría permite alternar entre categorías
- El sistema detecta automáticamente si la categoría está en fase de grupos o eliminatoria basándose en:
  - Si tournament_groups de esa categoría tienen status='completed' → está en eliminatoria
  - Si no → está en fase de grupos

---

## FASES DE EJECUCIÓN

---

### FASE 1 — Componente de próximos partidos por cancha

**status:** `READY`
**test_notes:** ``

**Archivos a crear:**
- `src/components/Dashboard/UpcomingMatches.jsx`
- `src/components/Dashboard/CourtNextMatch.jsx`

**Qué hacer:**

**UpcomingMatches.jsx:**
- Props: tournamentId
- Al montar, query a Supabase:
  - Obtener todas las canchas del torneo (courts WHERE tournament_id)
  - Para cada cancha, obtener el PRIMER partido con status='scheduled' ordenado por scheduled_date, scheduled_time (el más próximo)
  - Join con tournament_registrations + profiles para nombres de jugadores
  - Join con categories para nombre de categoría
  - Join con tournament_groups para nombre del grupo (si es fase de grupos)
- Renderiza una lista de CourtNextMatch, una por cancha
- Título de sección: "Próximos partidos" con ícono sutil

**CourtNextMatch.jsx:**
- Props: court (nombre), match (datos del próximo partido o null)
- Card blanca, borde izquierdo 4px celeste, border-radius 12px, sombra suave
- Header: nombre de la cancha en bold, 15px
- Si hay partido:
  - Sub-header: "HH:MM · [Categoría] · [Grupo X / Cuartos / Semis / Final]" en gris 12px
  - Equipos en formato vertical:
    - Jugador 1 de dupla 1
    - Jugador 2 de dupla 1
    - "vs" centrado en gris
    - Jugador 1 de dupla 2
    - Jugador 2 de dupla 2
  - Si team_id es NULL: "Por definir" en gris italic
- Si no hay partido: "Sin partidos próximos" centrado en gris
- Si todos los partidos de esa cancha están completados: "✓ Cancha libre" en verde

**Validaciones del tester:**
- [ ] Los 2 archivos existen
- [ ] UpcomingMatches hace query a courts + tournament_matches con joins
- [ ] Muestra una card por cada cancha del torneo
- [ ] Cada card muestra el próximo partido de esa cancha (el scheduled más cercano)
- [ ] Si no hay partidos pendientes en una cancha, muestra "Sin partidos próximos"
- [ ] Nombres de jugadores en formato vertical (no "Player1 / Player2" en una línea)
- [ ] Maneja partidos con team_id=NULL sin crashear
- [ ] `npm run build` pasa

---

### FASE 2 — Barra de progreso del torneo

**status:** `NOT_STARTED`
**test_notes:** ``

**Archivos a crear:**
- `src/components/Dashboard/TournamentProgress.jsx`
- `src/components/Dashboard/CategoryProgressBar.jsx`

**Qué hacer:**

**TournamentProgress.jsx:**
- Props: tournamentId
- Query a Supabase: count de tournament_matches agrupados por status y category_id
  ```
  SELECT category_id, status, count(*) 
  FROM tournament_matches 
  WHERE tournament_id = X 
  GROUP BY category_id, status
  ```
- Calcular totales:
  - totalMatches = todos los partidos
  - completedMatches = partidos con status='completed'
  - percentage = (completedMatches / totalMatches) × 100
  - remaining = totalMatches - completedMatches
- Calcular lo mismo por categoría

- Renderiza:
  - Título: "Progreso del torneo"
  - Card con barra de progreso general grande:
    - Ancho del relleno = percentage%
    - Color: rojo (#EF4444) 0-33%, amarillo (#F59E0B) 34-66%, verde (#22C55E) 67-100%
    - Porcentaje grande a la derecha: "58%"
    - Texto debajo: "X de Y partidos completados"
    - Texto secundario: "Z partidos restantes" en gris
    - Barra con height 12px, border-radius 6px, fondo gris (#E5E7EB)
    - Animación suave del ancho (transition: width 0.5s ease)
  - Debajo: lista de CategoryProgressBar

**CategoryProgressBar.jsx:**
- Props: categoryName, completed, total
- Una línea con:
  - Nombre de categoría a la izquierda (14px)
  - Barra de progreso pequeña al centro (height 8px, flex: 1)
  - Porcentaje a la derecha (13px, bold)
- Color de barra según porcentaje (rojo/amarillo/verde)
- Compacto: height total ~36px por categoría

**Validaciones del tester:**
- [ ] Los 2 archivos existen
- [ ] TournamentProgress calcula porcentaje correctamente (completados/total)
- [ ] La barra cambia de color según rango: rojo ≤33%, amarillo 34-66%, verde ≥67%
- [ ] Muestra "X de Y partidos completados" con números correctos
- [ ] Hay una barra por cada categoría
- [ ] Si todos están completados: barra verde al 100%
- [ ] Si ninguno completado: barra roja al 0%
- [ ] `npm run build` pasa

---

### FASE 3 — Tabla de posiciones por grupo (fase de grupos)

**status:** `NOT_STARTED`
**test_notes:** ``

**Archivos a crear:**
- `src/components/Dashboard/GroupStandings.jsx`
- `src/components/Dashboard/StandingsTable.jsx`
- `src/components/Dashboard/GroupMatchResults.jsx`

**Qué hacer:**

**GroupStandings.jsx:**
- Props: tournamentId, categories, scoringConfig
- Controles arriba:
  - Dropdown para seleccionar categoría (si hay más de 1)
  - Tabs/botones de grupo debajo: [Grupo A] [Grupo B] [Grupo C]
  - Tab activo: fondo celeste (#E8F4FA), texto (#3A8BB5), border-radius 8px
  - Tab inactivo: fondo gris (#F3F4F6), texto (#6B7280)
- Query a Supabase: tournament_groups + tournament_group_members de la categoría seleccionada
  - Join con tournament_registrations + profiles para nombres
- Al cambiar categoría: actualizar tabs de grupo
- Al cambiar grupo: actualizar tabla

**StandingsTable.jsx:**
- Props: members (del grupo seleccionado), scoringConfig, teamsPerGroupQualify
- Tabla con columnas:
  - # (posición — usar final_rank si existe, o calcular por matches_won)
  - Dupla (nombres verticales: Player1 arriba, Player2 abajo, font-size 13px)
  - PJ (partidos jugados)
  - PG (partidos ganados)
  - PP (partidos perdidos)
  - Si scoring tipo sets: DS (diferencia de sets = sets_won - sets_lost)
  - Si scoring tipo sets: DG (diferencia de games = games_won - games_lost)
  - Si scoring tipo puntos: DP (diferencia de puntos = points_scored - points_against)
- Ordenar por: final_rank si existe, sino por matches_won DESC, luego por diferencial
- Resaltado visual:
  - Posiciones 1 a teamsPerGroupQualify: fondo celeste suave (#E8F4FA) — clasificados directos
  - Posición teamsPerGroupQualify+1 si esa dupla tiene qualified=true: fondo dorado suave (#FFF5D6) — mejor N-ésimo clasificado
  - Resto: sin fondo especial
- Header de tabla: fondo gris (#F3F4F6), texto gris oscuro, font-weight 500, font-size 12px
- Filas: altura 52px para acomodar 2 líneas de nombres, separadas por borde sutil
- Responsive: si la tabla es ancha, scroll horizontal

**GroupMatchResults.jsx:**
- Props: matches (del grupo seleccionado)
- Lista de partidos del grupo con resultados
- Cada partido muestra:
  - Nombres cortos de las duplas (primer nombre de cada jugador)
  - Si completado: resultado "6-4 / 6-3" y ★ junto al ganador
  - Si pendiente: "Pendiente" en gris
- Card compacta, sin borde lateral, font-size 13px
- Separador sutil entre partidos

**Validaciones del tester:**
- [ ] Los 3 archivos existen
- [ ] Dropdown de categoría funciona y cambia los tabs de grupo
- [ ] Tabs de grupo funcionan y actualizan la tabla
- [ ] Tabla muestra columnas correctas: #, Dupla, PJ, PG, PP, DS/DG o DP
- [ ] Clasificados directos resaltados con fondo celeste
- [ ] Mejores N-ésimos resaltados con fondo dorado
- [ ] Partidos del grupo se listan debajo de la tabla
- [ ] Partidos completados muestran resultado, pendientes muestran "Pendiente"
- [ ] `npm run build` pasa

---

### FASE 4 — Bracket visual de fase eliminatoria

**status:** `NOT_STARTED`
**test_notes:** ``

**Archivos a crear:**
- `src/components/Dashboard/BracketView.jsx`
- `src/components/Dashboard/BracketRound.jsx`
- `src/components/Dashboard/BracketMatchSlot.jsx`

**Qué hacer:**

**BracketView.jsx:**
- Props: tournamentId, categoryId
- Query a Supabase: tournament_bracket de esa categoría con join a tournament_registrations + profiles para nombres
- Organiza los datos por round_number
- Renderiza un contenedor horizontal scrolleable con un BracketRound por cada ronda
- Headers de ronda arriba: "Cuartos", "Semis", "Final" (o "Octavos", "Cuartos", "Semis", "Final")
  - Detectar nombres según phase: 'round_of_16'→"Octavos", 'quarterfinals'→"Cuartos", 'semifinals'→"Semis", 'final'→"Final"
- Layout:
  ```css
  .bracket-container {
    display: flex;
    overflow-x: auto;
    gap: 24px;
    padding: 16px;
    align-items: center;
  }
  ```
- Cada ronda es una columna vertical de slots
- Líneas conectoras entre rondas (SVG o CSS borders):
  - Del ganador de cada par de slots → al slot correspondiente de la siguiente ronda
  - Color: gris claro (#D1D5DB) si pendiente, verde (#22C55E) si el ganador ya avanzó

**BracketRound.jsx:**
- Props: roundName, slots (array de slots de esta ronda)
- Header: nombre de la ronda (font-size 13px, color gris, text-align center, uppercase)
- Lista vertical de BracketMatchSlot
- Spacing entre slots: depende de la ronda
  - Primera ronda: slots juntos en pares (8px entre los 2 de un par, 24px entre pares)
  - Siguientes rondas: slots más espaciados para alinearse con los pares de la ronda anterior

**BracketMatchSlot.jsx:**
- Props: slot (team1, team2, winner, status)
- Mini-card con 2 equipos:
  ```
  ┌──────────────────┐
  │ C.Méndez / M.Gon │ ← fondo verde si ganó
  │──────────────────│
  │ P.Álvarez / A.Fe │ ← fondo blanco si perdió
  └──────────────────┘
  ```
- Ancho fijo: 160px (para que quepan los nombres abreviados)
- Cada equipo ocupa media card (height ~32px)
- Si team_id existe: mostrar primer nombre de cada jugador abreviado "C.Méndez / M.Gon"
- Si team_id es NULL: "Por definir" en gris italic
- Si hay winner_id:
  - El ganador tiene fondo verde suave (#F0FDF4), borde izquierdo verde 3px, texto bold
  - El perdedor tiene fondo gris muy claro (#F9FAFB), texto gris
- Si no hay winner (partido pendiente): ambos con fondo blanco
- Si status='scheduled' (tiene equipos pero no se jugó): borde celeste sutil
- Border-radius 8px, borde gris (#E8EAEE)

**Manejo de diferentes fases:**
- Octavos: 8 slots → 4 slots → 2 slots → 1 slot (4 columnas)
- Cuartos: 4 slots → 2 slots → 1 slot (3 columnas)
- Semis: 2 slots → 1 slot (2 columnas)
- Final: 1 slot (1 columna — solo muestra el partido final)

**Líneas conectoras (simplificado):**
- Usar CSS borders en vez de SVG para simplicidad:
  - Cada par de slots tiene un conector al slot de la siguiente ronda
  - Border-right de 2px desde el primer slot del par + border-bottom
  - Border-right de 2px desde el segundo slot del par + border-top
  - Estos se unen y conectan al slot de la siguiente ronda
- Color: #D1D5DB por defecto, #22C55E si el ganador ya se determinó
- Si las líneas CSS son muy complejas, usar una solución más simple:
  - Flechas "→" entre rondas
  - O simplemente separación visual sin líneas (los headers de ronda son suficientes)

**Validaciones del tester:**
- [ ] Los 3 archivos existen
- [ ] BracketView muestra columnas por ronda (cuartos, semis, final o lo que corresponda)
- [ ] Cada slot muestra nombres de equipos o "Por definir"
- [ ] El ganador está resaltado con fondo verde
- [ ] El perdedor tiene fondo gris
- [ ] Scroll horizontal funciona si el bracket es ancho
- [ ] Maneja octavos (4 columnas), cuartos (3), semis (2), final (1)
- [ ] Partidos con team_id=NULL muestran "Por definir" sin crashear
- [ ] `npm run build` pasa

---

### FASE 5 — Sección de clasificación dinámica (tablas + bracket)

**status:** `NOT_STARTED`
**test_notes:** ``

**Archivos a crear:**
- `src/components/Dashboard/ClassificationSection.jsx`

**Archivos a modificar:**
- Ninguno todavía — esta fase solo crea el componente orquestador

**Qué hacer:**

**ClassificationSection.jsx:**
- Props: tournamentId, categories, scoringConfig
- Este componente es el ORQUESTADOR que decide qué mostrar para cada categoría
- Título: "Clasificación"
- Dropdown de categoría arriba (si hay más de 1)
- Al seleccionar una categoría, determinar su estado:
  - Query tournament_groups WHERE category_id AND status: si todos los grupos tienen status='completed' → está en eliminatoria
  - Si algún grupo tiene status='active' → está en fase de grupos

- Si la categoría está en FASE DE GRUPOS:
  - Renderizar GroupStandings (creado en Fase 3) con tabs de grupo + tabla + partidos
  - No mostrar bracket

- Si la categoría está en FASE ELIMINATORIA:
  - Renderizar BracketView (creado en Fase 4)
  - No mostrar tablas de grupo (ya no son relevantes, los grupos terminaron)
  - Opcionalmente: debajo del bracket, un acordeón "Ver resultados de fase de grupos" que al abrirlo muestra las tablas de grupo finales (solo lectura, para referencia)

- Si TODAS las categorías terminaron todo (torneo finished):
  - Mostrar los brackets de todas las categorías con los campeones resaltados
  - Mensaje: "🏆 Torneo finalizado"

**Validaciones del tester:**
- [ ] ClassificationSection.jsx existe
- [ ] Dropdown de categoría funciona
- [ ] Categoría en fase de grupos → muestra GroupStandings (tablas con tabs de grupo)
- [ ] Categoría en eliminatoria → muestra BracketView (bracket visual)
- [ ] Detección automática del estado funciona (buscar query a tournament_groups.status)
- [ ] No crashea si una categoría está en grupos y otra en eliminatoria simultáneamente
- [ ] `npm run build` pasa

---

### FASE 6 — Integración en DashboardPage + verificación final

**status:** `NOT_STARTED`
**test_notes:** ``

**Archivos a modificar:**
- `src/pages/DashboardPage.jsx` — integrar los 3 componentes del dashboard

**Qué hacer:**

**DashboardPage.jsx:**
- Detectar si el organizador tiene un torneo activo:
  - Query: tournaments WHERE organizer_id = usuario actual AND status = 'active'
  - Si hay torneo activo → mostrar el dashboard completo
  - Si no hay torneo activo → mostrar mensaje "No tienes torneos activos" con botón para crear uno

- Layout del dashboard cuando hay torneo activo:
  - Header: nombre del torneo + badge "Activo" en celeste
  - Sección 1: UpcomingMatches
  - Separador visual sutil
  - Sección 2: TournamentProgress
  - Separador visual sutil
  - Sección 3: ClassificationSection
  - Fondo: gris perla (#F2F3F5)
  - Spacing entre secciones: 24px
  - Cada sección tiene su propio título (ya incluido en cada componente)

- Pasar props correctos a cada componente:
  - tournamentId del torneo activo
  - categories del torneo
  - scoringConfig del torneo
  - courts del torneo (para UpcomingMatches)

- Auto-refresh: las secciones deben actualizarse cuando el organizador vuelve al dashboard (ej: después de registrar un resultado en marcadores). Implementar refetch al montar o usar un useEffect con dependencia en una flag.

**Verificación end-to-end:**

1. Si hay torneo activo con partidos programados:
   - Próximos partidos muestra el siguiente de cada cancha
   - Progreso muestra porcentaje correcto
   - Clasificación muestra tablas de posiciones con datos reales

2. Si hay categorías en diferentes estados (una en grupos, otra en eliminatoria):
   - Al seleccionar la de grupos → tabla de posiciones
   - Al seleccionar la de eliminatoria → bracket
   - No crashea al cambiar entre ellas

3. Si el torneo está finalizado:
   - Progreso al 100% en verde
   - Todas las canchas "Sin partidos próximos"
   - Brackets con campeones resaltados

4. Verificar que NO se rompió nada:
   - Página de marcadores sigue funcionando
   - Vista de torneo activo (Inscritos/Clasificación) sigue funcionando
   - Vista de torneo en inscripción sigue funcionando
   - Login, auth, admin

**Limpieza:**
- grep console.log/TODO/FIXME en los archivos nuevos
- npm run build sin errores

**Validaciones del tester:**
- [ ] DashboardPage muestra las 3 secciones cuando hay torneo activo
- [ ] Sin torneo activo: muestra mensaje "No tienes torneos activos"
- [ ] UpcomingMatches: una card por cancha con próximo partido
- [ ] TournamentProgress: barra general + barras por categoría con colores correctos
- [ ] ClassificationSection: tablas en fase de grupos, bracket en eliminatoria
- [ ] Dropdown de categoría funciona en toda la sección de clasificación
- [ ] Bracket muestra ganadores con fondo verde y perdedores con fondo gris
- [ ] Tabla de posiciones resalta clasificados (celeste) y mejores N-ésimos (dorado)
- [ ] Funcionalidad existente no rota
- [ ] Console sin errores
- [ ] `npm run build` pasa

---

## ESTADO GLOBAL DE LA TAREA

| Fase | Descripción | Status | Test Notes |
|------|-------------|--------|------------|
| Fase 1 | Próximos partidos por cancha | `READY` | |
| Fase 2 | Barra de progreso del torneo | `NOT_STARTED` | |
| Fase 3 | Tabla de posiciones por grupo | `NOT_STARTED` | |
| Fase 4 | Bracket visual eliminatoria | `NOT_STARTED` | |
| Fase 5 | Clasificación dinámica (orquestador) | `NOT_STARTED` | |
| Fase 6 | Integración en DashboardPage | `NOT_STARTED` | |