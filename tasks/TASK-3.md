# TASK-3.md — Distribución de Partidos: Cronograma por Canchas y Horarios

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

### Flujo de estados

```
READY → IN_PROGRESS → WAITING_FOR_TEST → TESTING → DONE → (siguiente = READY)
                                                   → FAILED → (modificador corrige → WAITING_FOR_TEST)
```

---

## CONTEXTO

**RacketTourneys / Frontón HGV** — PWA con React 19 + Vite 8 + Tailwind CSS 4 + Supabase. La TASK-2 implementó la generación de grupos, partidos round-robin y brackets. Los partidos existen en `tournament_matches` con `court_id`, `scheduled_date`, `scheduled_time` y `estimated_duration_minutes` en **NULL**. Esta tarea los llena con una distribución inteligente.

### Tablas relevantes ya existentes

**courts** — canchas asignadas al torneo:
- `id`, `tournament_id`, `name`
- `available_from` (time) — hora de apertura (ej: 08:00)
- `available_to` (time) — hora de cierre (ej: 18:00)
- `break_start` (time) — inicio del descanso (ej: 12:00)
- `break_end` (time) — fin del descanso (ej: 13:00)

**tournament_matches** — partidos ya generados:
- `court_id` (uuid, nullable) — cancha asignada → LLENAR
- `scheduled_date` (date, nullable) — fecha → LLENAR
- `scheduled_time` (time, nullable) — hora → LLENAR
- `estimated_duration_minutes` (integer, nullable) — duración → LLENAR
- `phase` — 'group_phase', 'quarterfinals', 'semifinals', 'final'
- `team1_id`, `team2_id` — las duplas que juegan
- `group_id` — grupo al que pertenece el partido (NULL si eliminatoria)

**tournaments** — tiene `start_date` y `end_date` que definen el rango de fechas del torneo.

---

## OBJETIVO GENERAL

Después de que el organizador confirma la generación de grupos y partidos (TASK-2), el sistema debe:

1. Mostrar un paso de configuración de duración de partidos
2. Calcular automáticamente los time slots disponibles por cancha por día
3. Distribuir TODOS los partidos de fase de grupos en esos slots respetando restricciones estrictas
4. Mostrar un cronograma visual para que el organizador lo revise
5. Permitir al organizador ajustar manualmente si lo desea
6. Persistir las asignaciones (court_id, scheduled_date, scheduled_time, estimated_duration_minutes)
7. Mostrar la fecha y hora en la vista de Clasificación existente

---

## RESTRICCIONES DE DISTRIBUCIÓN (CRÍTICAS)

Estas restricciones son **inquebrantables**. El algoritmo DEBE respetarlas todas:

### R1 — Sin conflicto de cancha
Una cancha solo puede tener UN partido a la vez. Si la Cancha 1 tiene un partido a las 10:00 que dura 45 min, el siguiente partido en esa cancha NO puede empezar antes de las 10:45.

### R2 — Sin duplicidad de dupla simultánea
Una dupla NO puede estar jugando en 2 canchas al mismo tiempo. Si "Los Invencibles" juegan a las 10:00 en Cancha 1, no pueden tener otro partido a las 10:00 en Cancha 2.

### R3 — Máximo 2 partidos consecutivos por dupla
Una dupla NO puede jugar más de 2 partidos seguidos (sin al menos 1 slot de descanso entre medio). Esto significa que si una dupla juega a las 10:00 y a las 10:45, su siguiente partido NO puede ser a las 11:30 — debe haber al menos 1 slot libre donde NO jueguen.

### R4 — Respetar horarios de cancha
Los partidos deben caer dentro de `available_from` y `available_to`. Ningún partido puede empezar durante el break (`break_start` a `break_end`). Un partido que empezaría a las 11:45 y dura 45 min terminaría a las 12:30 — si el break empieza a las 12:00, ese partido NO es válido porque se solapa con el break.

### R5 — Respetar fechas del torneo
Los partidos solo se asignan entre `start_date` y `end_date` del torneo (inclusive).

### R6 — Partidos de grupo antes que eliminatoria
Todos los partidos de `phase = 'group_phase'` se programan primero. Los partidos de eliminatoria se dejan SIN programar (se programarán cuando la fase de grupos termine y se conozcan los clasificados).

### R7 — Distribución equitativa de descanso
El algoritmo debe INTENTAR (best effort, no hard constraint) que todas las duplas tengan una distribución similar de partidos — no concentrar todos los partidos de una dupla en un solo día mientras otra dupla juega repartida en todos los días.

---

## ALGORITMO DE DISTRIBUCIÓN

### Paso 1: Generar time slots

Para cada día del torneo (start_date a end_date) y cada cancha:
```
slots = []
hora_actual = available_from
WHILE hora_actual + duración_partido <= available_to:
    IF hora_actual NO cae dentro de [break_start, break_end]:
        IF hora_actual + duración_partido <= break_start OR hora_actual >= break_end:
            slots.push({ court_id, date, time: hora_actual })
    hora_actual += duración_partido
```

Ejemplo: Cancha 1, día 1, horario 08:00-18:00, break 12:00-13:00, partido de 45 min:
```
08:00, 08:45, 09:30, 10:15, 11:00, 11:45 (NO 11:45 si termina a 12:30 y solapa break)
→ 08:00, 08:45, 09:30, 10:15, 11:00
→ 13:00, 13:45, 14:30, 15:15, 16:00, 16:45, 17:15 (último si 17:15+45=18:00 <= available_to)
```

### Paso 2: Ordenar partidos por prioridad

Ordenar los partidos de fase de grupos para asignarlos:
1. Partidos de grupos más grandes primero (más restricciones)
2. Dentro del mismo grupo, orden por match_number
3. Intercalar grupos distintos para evitar que un grupo monopolice un día

### Paso 3: Asignar partidos a slots (greedy con backtracking)

Para cada partido en la cola:
1. Buscar el primer slot disponible donde:
   - La cancha está libre (R1)
   - Ninguna de las 2 duplas está jugando en otra cancha al mismo tiempo (R2)
   - Ninguna de las 2 duplas ha jugado 2 partidos consecutivos previos sin descanso (R3)
   - El slot respeta horarios y breaks (R4)
2. Si se encuentra slot: asignar y marcar el slot como ocupado
3. Si NO se encuentra: avanzar al siguiente slot/día hasta encontrar uno válido
4. Si NO hay slots suficientes en todo el torneo: reportar error con cuántos partidos quedaron sin asignar

### Paso 4: Validación post-asignación

Después de asignar todos los partidos, verificar:
- Cero conflictos de cancha (ningún slot tiene 2 partidos)
- Cero conflictos de dupla simultánea
- Cero cadenas de más de 2 partidos consecutivos por dupla
- Todos los partidos de grupo tienen fecha/hora/cancha asignada
- Los partidos de eliminatoria siguen sin asignar (court_id, date, time = NULL)

---

## DESCRIPCIÓN DE LA UI

### Paso de configuración (después de confirmar grupos en TASK-2)

Después de que el organizador presiona "Confirmar e Iniciar" en el GenerationPreview de TASK-2, ANTES de persistir, aparece un nuevo paso:

```
┌─────────────────────────────────────────┐
│  Configuración de cronograma            │
│                                         │
│  Duración estimada por partido:         │
│  ┌─────────────────────────────┐        │
│  │ 45 minutos              ▼  │        │
│  └─────────────────────────────┘        │
│                                         │
│  Canchas disponibles:                   │
│  ┌─────────────────────────────────┐    │
│  │ ✓ Cancha 1  08:00-18:00        │    │
│  │   Break: 12:00-13:00           │    │
│  │ ✓ Cancha 2  09:00-17:00        │    │
│  │   Break: 12:30-13:30           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Fechas del torneo:                     │
│  15 Abr 2026 → 20 Abr 2026 (6 días)   │
│                                         │
│  Resumen automático:                    │
│  "X slots disponibles en total"         │
│  "X partidos por programar"             │
│  "✓ Hay suficientes slots" (o error)    │
│                                         │
│  [← Volver]  [Generar Cronograma →]    │
└─────────────────────────────────────────┘
```

### Vista de cronograma generado (para revisión)

```
┌─────────────────────────────────────────┐
│  Cronograma generado                    │
│                                         │
│  Día 1 — Mar 15 Abr                    │
│  ┌─────────────────────────────────┐    │
│  │ Cancha 1                        │    │
│  │ 08:00  Invencibles vs Gallega   │    │
│  │ 08:45  Lobos vs Cracks          │    │
│  │ 09:30  Invencibles vs Lobos     │    │
│  │ ...                             │    │
│  ├─────────────────────────────────┤    │
│  │ Cancha 2                        │    │
│  │ 09:00  Team Galicia vs Stars    │    │
│  │ 09:45  Raqueta vs Celta         │    │
│  │ ...                             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Día 2 — Mié 16 Abr                    │
│  ...                                    │
│                                         │
│  [← Volver]  [🔄 Regenerar]            │
│              [Confirmar Cronograma ✓]   │
└─────────────────────────────────────────┘
```

### Integración con vista de Clasificación existente

En la página del torneo activo (ActiveTournamentPage), el tab CLASIFICACIÓN ya muestra los partidos en el acordeón "Partidos" de cada grupo. Actualmente cada MatchCard dice "Programado". Después de esta tarea, debe mostrar:

```
┌─────────────────────────────────────┐
│ Partido 1         Mar 15 · 08:00   │
│ Invencibles vs Fuerza Gallega      │
│ Cancha 1              Programado   │
└─────────────────────────────────────┘
```

Es decir, agregar fecha, hora y cancha al MatchCard existente.

---

## FASES DE EJECUCIÓN

---

### FASE 1 — Motor de generación de time slots (lógica pura)

**status:** `DONE`
**test_notes:** `16/16 tests passed. Exports OK. Slots con break: 11:15 tight slot ✓, no 11:30 ✓, post-break 13:00 ✓, 12 slots total ✓. Sin break: continuo ✓. 60min < 45min ✓. generateAllSlots 2×3=75 ✓, sorted ✓. validateSlotCapacity OK. Build OK.`

**Archivos a crear:**
- `src/lib/schedulingEngine.js`

**Funciones a implementar:**

**1. `generateTimeSlots(court, date, matchDurationMinutes)`**
- Input: objeto cancha (available_from, available_to, break_start, break_end), fecha, duración de partido en minutos
- Genera todos los slots de tiempo posibles para esa cancha en ese día
- Respeta: horario de apertura/cierre, break (ningún partido puede solaparse con el break), duración del partido
- Un slot = `{ court_id, court_name, date, start_time, end_time }`
- Validar que `start_time + duración <= available_to`
- Validar que el partido NO se solapa con el break: `start_time + duración <= break_start` OR `start_time >= break_end`
- Output: array de slots ordenados cronológicamente

**2. `generateAllSlots(courts, startDate, endDate, matchDurationMinutes)`**
- Input: array de canchas, fecha inicio, fecha fin, duración
- Llama `generateTimeSlots` para cada cancha en cada día del rango
- Output: array plano de TODOS los slots disponibles, ordenados por fecha → hora → cancha
- Incluir un count total: "X slots disponibles"

**3. `validateSlotCapacity(totalSlots, totalMatches)`**
- Input: cantidad de slots, cantidad de partidos de fase de grupos
- Output: `{ sufficient: boolean, slots: number, matches: number, deficit: number }`
- Si deficit > 0, hay un problema — no alcanzan los slots

**Validaciones del tester:**
- [ ] `generateTimeSlots` con cancha 08:00-18:00, break 12:00-13:00, partido 45min genera los slots correctos (NO genera slots que se solapan con el break)
- [ ] Un partido que empieza a las 11:30 y dura 45min termina a las 12:15 → se solapa con break 12:00 → NO debe generarse
- [ ] Un partido que empieza a las 11:15 y dura 45min termina a las 12:00 → NO se solapa → SÍ se genera
- [ ] `generateAllSlots` con 2 canchas × 3 días genera slots para los 6 combos
- [ ] `validateSlotCapacity` retorna sufficient=false si hay más partidos que slots
- [ ] `npm run build` pasa

---

### FASE 2 — Algoritmo de distribución con restricciones (lógica pura)

**status:** `DONE`
**test_notes:** `21/21 tests passed. 6 exports OK. R1 no court conflicts ✓, all 15 assigned ✓. R2 no simultaneous team (t1/t5 multi-group verified) ✓. R3 max 2 consecutive ✓. validateDistribution valid=true ✓, detects forced R1 violation ✓. getScheduleSummary grouped by date→court, sorted, dayLabel format ✓. Insufficient slots: 5 assigned, 10 unassigned, no crash ✓. Build OK.`

**Archivos a modificar:**
- `src/lib/schedulingEngine.js` (agregar funciones)

**Funciones a implementar:**

**4. `distributeMatches(matches, slots, options)`**
- Input:
  - matches: array de partidos de fase de grupos (con team1_id, team2_id, group_id, match_number)
  - slots: array de slots disponibles (generados en Fase 1)
  - options: `{ maxConsecutive: 2 }` (máximo de partidos seguidos por dupla)
- Output: array de asignaciones `{ match_id, court_id, scheduled_date, scheduled_time, estimated_duration_minutes }`

- **Algoritmo:**
  1. Ordenar partidos: intercalar grupos (no poner todos los del Grupo A seguidos)
  2. Mantener un tracker por dupla: `{ lastPlayedSlotIndex, consecutiveCount }`
  3. Para cada partido, buscar el primer slot donde:
     - a) La cancha está libre (ningún otro partido asignado a ese slot)
     - b) team1 NO está jugando en otra cancha al mismo tiempo
     - c) team2 NO está jugando en otra cancha al mismo tiempo
     - d) team1 NO ha jugado `maxConsecutive` partidos seguidos sin descanso
     - e) team2 NO ha jugado `maxConsecutive` partidos seguidos sin descanso
  4. Si se encuentra: asignar, actualizar trackers
  5. Si no: avanzar al siguiente slot
  6. Si se agotan los slots: marcar partidos sin asignar

- **Definición de "consecutivo":** dos partidos son consecutivos para una dupla si entre ellos no hay al menos 1 slot completo de tiempo libre para esa dupla. Es decir, si una dupla juega en el slot de las 10:00 (termina 10:45) y en el de las 10:45 (termina 11:30), esos son 2 consecutivos. Si además juega a las 11:30, serían 3 consecutivos → VIOLACIÓN si maxConsecutive=2.

**5. `validateDistribution(assignments, matches, slots)`**
- Input: asignaciones generadas, partidos originales, slots
- Verifica TODAS las restricciones:
  - R1: ningún slot tiene 2 partidos
  - R2: ninguna dupla juega en 2 canchas al mismo tiempo
  - R3: ninguna dupla tiene más de 2 partidos consecutivos
  - R4: todos los slots son válidos (dentro de horario, fuera de break)
  - R6: solo partidos de group_phase están asignados
- Output: `{ valid: boolean, violations: [{ rule, description, match_id }] }`

**6. `getScheduleSummary(assignments)`**
- Input: asignaciones
- Output: resumen agrupado por día → cancha → lista de partidos con hora
- Para la UI del cronograma

**Validaciones del tester:**
- [ ] `distributeMatches` con 15 partidos y suficientes slots asigna TODOS los partidos
- [ ] Ningún slot tiene 2 partidos asignados (R1)
- [ ] Ninguna dupla juega en 2 canchas al mismo tiempo (R2)
- [ ] Ninguna dupla tiene más de 2 partidos consecutivos (R3)
- [ ] `validateDistribution` retorna valid=true para una distribución correcta
- [ ] `validateDistribution` detecta violación si se fuerza un conflicto
- [ ] Partidos de eliminatoria (phase !== 'group_phase') NO se asignan
- [ ] Con slots insuficientes, los partidos sin asignar se reportan (no crash)
- [ ] `npm run build` pasa

---

### FASE 3 — UI de configuración de cronograma

**status:** `DONE`
**test_notes:** `Todos los checks pasan. 3 archivos nuevos creados. ScheduleConfigStep: dropdown 30-60min ✓, canchas con checkbox ✓, imports generateAllSlots+validateSlotCapacity ✓, mensaje verde/rojo ✓, botón disabled si insuficiente ✓. SchedulePreview: imports distributeMatches+validateDistribution+getScheduleSummary ✓, regenerar ✓, unassigned+violations handling ✓, 3 botones ✓. ScheduleDayView: dayLabel+court_name+start_time+break dashed ✓. ConfigurationModal: 5 steps (confirm→configure→preview→schedule_config→schedule_preview) ✓. GenerationPreview: botón "Siguiente: Cronograma →" ✓, no llama persistTournamentStructure ✓. Build OK.`

**Archivos a crear:**
- `src/components/TournamentSetup/ScheduleConfigStep.jsx`
- `src/components/TournamentSetup/SchedulePreview.jsx`
- `src/components/TournamentSetup/ScheduleDayView.jsx`

**Archivos a modificar:**
- `src/components/TournamentSetup/ConfigurationModal.jsx` — agregar paso de cronograma DESPUÉS del GenerationPreview y ANTES de la persistencia

**Qué hacer:**

El flujo del modal de configuración ahora tiene 3 pasos:
```
Paso 1: Configuración de grupos (existente)
Paso 2: Vista previa de grupos + regenerar (existente)
Paso 3: Configuración y preview de cronograma (NUEVO)
→ Confirmar e Iniciar (persiste todo)
```

**ScheduleConfigStep.jsx:**
- Dropdown "Duración estimada por partido": opciones 30, 35, 40, 45, 50, 60 minutos (default 45)
- Lista de canchas del torneo (query `courts` WHERE tournament_id):
  - Cada cancha muestra: nombre + horario (available_from - available_to) + break si tiene
  - Checkbox para incluir/excluir cancha (por si alguna no está disponible para este torneo)
- Resumen de fechas: "15 Abr → 20 Abr (6 días)"
- Cálculo automático:
  - "X slots disponibles en total" (llama generateAllSlots)
  - "X partidos de fase de grupos por programar"
  - Si hay suficientes: "✓ Hay suficientes slots" (verde)
  - Si no alcanzan: "✗ Faltan X slots. Agrega más canchas o fechas" (rojo)
- Botones: [← Volver a vista previa] [Generar Cronograma →] (solo habilitado si hay slots suficientes)

**SchedulePreview.jsx:**
- Al montar, llama `distributeMatches` + `validateDistribution`
- Si hay violaciones: mostrar errores
- Si es válido: mostrar cronograma agrupado por día usando ScheduleDayView
- Resumen arriba: "X partidos distribuidos en X días, X canchas"
- **Botón "🔄 Regenerar distribución"** — re-ejecuta el algoritmo (puede dar distribución diferente por el ordering)
- Botones: [← Volver a configuración] [🔄 Regenerar] [Confirmar e Iniciar ✓]

**ScheduleDayView.jsx:**
- Props: dayData (fecha + array de canchas con sus partidos asignados)
- Renderiza:
  - Header: "Día 1 — Mar 15 Abr 2026"
  - Por cada cancha:
    - Nombre de la cancha
    - Lista de partidos en orden cronológico:
      - "08:00  Los Invencibles vs Fuerza Gallega"
      - "08:45  Lobos HGV vs Los Cracks"
    - Slots de break marcados visualmente (ej: franja gris "12:00-13:00 Descanso")
  - Estilo: cards blancas, timeline visual a la izquierda si posible

**Estilo visual:** UI-UX PRO MAX + DESIGN-ARCHITECTURE.md. Cards blancas, fondo perla, celeste CTA, cronograma limpio y legible, responsive mobile-first.

**Validaciones del tester:**
- [ ] ScheduleConfigStep muestra dropdown de duración y lista de canchas
- [ ] Cálculo de slots disponibles se actualiza al cambiar duración
- [ ] Mensaje de error si no hay suficientes slots
- [ ] SchedulePreview muestra cronograma agrupado por día → cancha → partidos
- [ ] Botón "Regenerar distribución" funciona
- [ ] El flujo del modal ahora tiene 3 pasos (config → preview grupos → cronograma)
- [ ] `npm run build` pasa

---

### FASE 4 — Persistencia del cronograma

**status:** `DONE`
**test_notes:** `Todos los checks pasan. RPC SQL: INSERT incluye court_id/scheduled_date/scheduled_time/estimated_duration_minutes con CASE WHEN NULL handling ✓, sin BEGIN/COMMIT explícito ✓, CREATE OR REPLACE ✓. Persistencia JS: 5to param scheduleAssignments ✓, Map lookup por match_number ✓, null fallback para eliminatoria ✓, backward compat con optional chaining ✓. Flujo: ConfigurationModal.handleScheduleConfirm pasa assignments a persistTournamentStructure ✓, saving state + error UI + success callback ✓. Build OK. IMPORTANTE: Re-ejecutar create_rpc_persist_tournament.sql en Supabase SQL Editor.`

**Archivos a modificar:**
- `src/lib/tournamentPersistence.js` — agregar datos de cronograma al payload
- `supabase/migrations/create_rpc_persist_tournament.sql` — actualizar la función RPC para incluir las asignaciones de cancha/horario en los matches

**Qué hacer:**

Cuando el organizador presiona "Confirmar e Iniciar" en el SchedulePreview, el payload de persistencia ahora incluye también las asignaciones de cronograma.

1. **Modificar `persistTournamentStructure`:**
   - El payload ahora incluye un array `schedule_assignments`:
     ```json
     [
       { "match_number": 1, "court_id": "uuid", "scheduled_date": "2026-04-15", "scheduled_time": "08:00", "estimated_duration_minutes": 45 },
       ...
     ]
     ```
   - La función RPC, al insertar en `tournament_matches`, debe usar estos valores para `court_id`, `scheduled_date`, `scheduled_time`, `estimated_duration_minutes` en vez de NULL
   - Solo para partidos de `phase = 'group_phase'`. Los de eliminatoria siguen con NULL.

2. **Alternativa más simple:** Si modificar la RPC es complejo, hacer un UPDATE separado después de la persistencia inicial:
   - Después de que la RPC inserta los matches con NULLs, hacer un batch UPDATE que llene court_id, scheduled_date, scheduled_time, estimated_duration_minutes para cada match usando match_number como correlación.
   - Esto es menos atómico pero más simple de implementar.

3. **Elegir la opción que sea más limpia y confiable.**

**Validaciones del tester:**
- [ ] Después de confirmar, los partidos de grupo en `tournament_matches` tienen `court_id`, `scheduled_date`, `scheduled_time` NO NULL
- [ ] Los partidos de eliminatoria siguen con esos campos en NULL
- [ ] `estimated_duration_minutes` tiene el valor configurado (ej: 45)
- [ ] Los valores coinciden con lo que se mostró en el preview del cronograma
- [ ] `npm run build` pasa

---

### FASE 5 — Integración con vista de Clasificación existente

**status:** `DONE`
**test_notes:** `Todos los checks pasan. Query: court:courts(id, name) + scheduled_date/time/duration en select ✓. Flujo de datos: match object con court+schedule pasa desde ActiveTournamentPage→ClasificacionView→MatchesAccordion→MatchCard ✓. MatchCard: DAY_NAMES español ✓, formato "Mar 15 · 08:00" ✓, "Por definir" cuando null ✓. Court: optional chaining match.court?.name ✓, línea 3 no renderiza si null ✓. Badge status intacto ✓. InscritosView+ClasificacionView+tabs intactos ✓. MatchCard solo usado en MatchesAccordion ✓. Build OK.`

**Archivos a modificar:**
- `src/components/TournamentActive/MatchCard.jsx` — mostrar fecha, hora y cancha
- `src/components/TournamentActive/MatchesAccordion.jsx` — verificar que pasa los datos necesarios al MatchCard
- `src/pages/ActiveTournamentPage.jsx` — verificar que la query trae court_id, scheduled_date, scheduled_time y que hace join con courts para obtener el nombre de la cancha

**Qué hacer:**

1. **MatchCard.jsx — Agregar información de programación:**

   Actualmente muestra:
   ```
   Partido 1              Programado
   Invencibles vs Fuerza Gallega
   ```

   Debe mostrar (cuando tiene fecha/hora asignada):
   ```
   Partido 1         Mar 15 · 08:00
   Invencibles vs Fuerza Gallega
   Cancha 1              Programado
   ```

   - Línea 1: número de partido + fecha corta y hora (si existen)
   - Línea 2: equipos
   - Línea 3: nombre de la cancha + badge de status
   - Si scheduled_date/time son NULL (partidos de eliminatoria): mostrar "Por definir" en vez de fecha/hora
   - Formatear fecha como "Lun 15", "Mar 16", etc. (día de semana abreviado + número)
   - Formatear hora como "08:00", "13:45"

2. **ActiveTournamentPage.jsx — Query actualizada:**
   - La query de tournament_matches debe incluir join a courts para obtener el nombre:
     ```
     supabase.from('tournament_matches')
       .select('*, court:courts(id, name)')
       .eq('tournament_id', id)
     ```
   - Pasar los datos de court al MatchCard

3. **MatchesAccordion.jsx:**
   - Verificar que pasa `match.court`, `match.scheduled_date`, `match.scheduled_time` al MatchCard como props

**Estilo visual:**
- Fecha/hora en texto gris secundario (#6B7280), tamaño pequeño (12px)
- Nombre de cancha en texto gris más claro, debajo de los equipos
- No cambiar la estructura ni el tamaño general del MatchCard — solo agregar las líneas de info

**Validaciones del tester:**
- [ ] MatchCard muestra fecha y hora cuando existen (ej: "Mar 15 · 08:00")
- [ ] MatchCard muestra nombre de cancha (ej: "Cancha 1")
- [ ] Partidos sin fecha/hora asignada muestran "Por definir"
- [ ] La query en ActiveTournamentPage hace join con courts
- [ ] El formato de fecha es legible (día semana + número)
- [ ] No se rompe la vista cuando scheduled_date es NULL
- [ ] `npm run build` pasa

---

### FASE 6 — Integración end-to-end y validación final

**status:** `DONE`
**test_notes:** `VALIDACIÓN FINAL COMPLETA. Flujo de datos 5-step OK ✓. Persistencia con scheduleAssignments OK ✓. MatchCard: fecha español + cancha + "Por definir" + optional chaining ✓. Query court:courts join ✓. Edge cases: sin canchas + slots insuficientes + regenerar ✓. Restricciones: 15/15 asignados, validateDistribution valid=true, R3 manual check 0 violaciones ✓. Rutas intactas (12 rutas) ✓. 4 archivos nuevos + 7 modificados presentes ✓. 0 console.log/TODO/FIXME ✓. Build OK ✓.`

**Qué hacer:**

1. **Flujo completo end-to-end:**
   - Organizador tiene torneo con parejas aprobadas y canchas configuradas
   - Presiona "Iniciar Torneo"
   - Paso 1: configura grupos y fase eliminatoria
   - Paso 2: ve preview de grupos, puede regenerar sorteo
   - Paso 3 (NUEVO): configura duración de partidos, ve cronograma, puede regenerar distribución
   - Confirma → todo se persiste atómicamente
   - Torneo pasa a 'active'
   - En la página activa, tab Clasificación, los partidos muestran fecha, hora y cancha

2. **Casos edge:**

   | Caso | Comportamiento esperado |
   |---|---|
   | Torneo sin canchas configuradas | Paso 3 muestra error "No hay canchas configuradas" |
   | 1 sola cancha, muchos partidos | Se distribuyen en más días |
   | Canchas sin break | Slots continuos sin gap |
   | Duración 60min, pocas horas | Menos slots, posible insuficiencia |
   | Todos los partidos de un grupo small (3 partidos) | Se intercalan con los de otros grupos |
   | Dupla que aparece en muchos partidos | Nunca más de 2 seguidos |

3. **Verificar restricciones en datos reales:**
   - Correr `validateDistribution` sobre los datos persistidos
   - Verificar que R1-R6 se cumplen en la BD real

4. **Verificar que NO se rompió nada:**
   - Login, auth, onboarding
   - Crear torneo, inscripciones, aprobar
   - Vista de torneo en inscripción (TournamentManagePage)
   - Vista de torneo activo (ActiveTournamentPage) — tabs Inscritos y Clasificación
   - Admin panel

**Validaciones del tester:**
- [ ] Flujo completo e2e funciona: config → preview → cronograma → confirmar → torneo activo con fechas
- [ ] Sin canchas: error claro, no crash
- [ ] Restricción R3: ninguna dupla juega 3+ seguidos
- [ ] Restricción R2: ninguna dupla en 2 canchas al mismo tiempo
- [ ] MatchCards en Clasificación muestran fecha + hora + cancha
- [ ] Funcionalidad existente NO rota
- [ ] Console sin errores
- [ ] `npm run build` pasa
- [ ] **VERIFICACIÓN GLOBAL:** `validateDistribution` retorna valid=true sobre datos persistidos

---

## ESTADO GLOBAL DE LA TAREA

| Fase | Descripción | Status | Test Notes |
|------|-------------|--------|------------|
| Fase 1 | Motor de time slots (lógica pura) | `DONE` | 16/16 tests passed |
| Fase 2 | Algoritmo distribución con restricciones | `DONE` | 21/21 tests passed |
| Fase 3 | UI configuración + preview cronograma | `DONE` | All checks passed |
| Fase 4 | Persistencia del cronograma | `DONE` | All checks passed — re-run SQL in Supabase |
| Fase 5 | Integración con vista Clasificación | `DONE` | All checks passed |
| Fase 6 | Integración e2e + validación final | `DONE` | Final validation complete |