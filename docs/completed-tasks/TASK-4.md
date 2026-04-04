# TASK-4.md — Página de Marcadores: Resultados, Clasificación Automática y Fase Eliminatoria

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

La app ya tiene: generación de grupos y partidos (TASK-2), distribución en cronograma con canchas y horarios (TASK-3). Los partidos están en `tournament_matches` con `scheduled_date`, `scheduled_time`, `court_id` asignados y `status='scheduled'`. Los campos `score_team1`, `score_team2` y `winner_id` están en NULL.

Ya existe un botón "Marcadores" en la nav inferior del organizador que lleva a `ResultsInputPage.jsx` — actualmente placeholder vacío.

### Tablas relevantes

**tournament_matches** — `score_team1` (jsonb), `score_team2` (jsonb), `winner_id` (uuid), `status` (varchar), `scheduled_date`, `scheduled_time`, `court_id`, `group_id`, `category_id`, `phase`

**tournament_group_members** — `matches_played`, `matches_won`, `matches_lost`, `sets_won`, `sets_lost`, `games_won`, `games_lost`, `points_scored`, `points_against`, `final_rank`, `qualified`

**tournament_bracket** — `team1_id`, `team2_id`, `status`

**tournaments.scoring_config** — JSONB con la configuración de puntuación

---

## MODALIDADES DE SCORING Y SUS VALIDACIONES

### Modalidad: sets_normal
```json
{ "type": "sets_normal", "sets_to_win": 2, "games_per_set": 6}
```

**Formulario:** Filas dinámicas de sets. Mínimo `sets_to_win` filas, máximo `sets_to_win × 2 - 1`.
**Cada fila:** 2 inputs (games equipo 1, games equipo 2).

**Validaciones estrictas:**
- Games por set: mínimo 0
- Games máximo por set: `games_per_set + 1` normalmente (ej: 7 si games_per_set=6)
- Un set NO puede terminar en empate 
- Un set es ganado por quien tiene MÁS games.
- No se pueden jugar más sets que los necesarios. Si un equipo ya tiene `sets_to_win` sets ganados, NO agregar más filas.
- Si después de sets_to_win filas nadie ha ganado suficientes sets → agregar 1 fila más (hasta el máximo)
- Ejemplo con sets_to_win=2: si después de 2 sets están 1-1, se agrega el set 3. Si alguien va 2-0 después de 2 sets, NO se agrega set 3.
- El ganador del partido es el primero que llega a `sets_to_win` sets ganados.
- El resultado DEBE tener un ganador conclusivo para poder guardar.

### Modalidad: sets_suma
```json
{ "type": "sets_suma", "total_sets": 3, "games_per_set": 4 }
```

**Formulario:** Exactamente `total_sets` filas de sets (fijo, no dinámico).
**Cada fila:** 2 inputs (games equipo 1, games equipo 2).

**Validaciones estrictas:**
- Games por set: mínimo 0, máximo `games_per_set + 1` 
- Todos los sets se juegan siempre (no importa si alguien ya tiene mayoría)
- Un set NO puede terminar en empate
- Ganador del partido: quien ganó más sets. Si empate en sets → quien tiene más games totales. Si empate total → se debe indicar manualmente o sorteo.
- Los `total_sets` deben estar todos completos para guardar.

### Modalidad: points
```json
{ "type": "points", "points_to_win": 21, "win_by": 2, "max_points": 30 }
```

**Formulario:** 2 inputs grandes (puntos equipo 1, puntos equipo 2).

**Validaciones estrictas — dependen de `win_by`:**

**Si `win_by = 1` (punto de oro / punto directo):**
- El ganador es el primero que llega a `points_to_win`
- El ganador DEBE tener exactamente `points_to_win` puntos
- El perdedor puede tener de 0 a `points_to_win - 1`
- Ejemplo: 21-18 ✓, 21-20 ✓, 22-20 ✗ (nadie puede pasar de 21)
- Máximo posible: `points_to_win` para el ganador

**Si `win_by = 2` (diferencia de 2):**
- Nadie gana hasta tener al menos `points_to_win` Y al menos 2 puntos de ventaja
- Si ambos llegan a `points_to_win - 1` (ej: 20-20), se sigue jugando
- El partido termina cuando alguien tiene 2+ de ventaja
- Si `max_points` está definido: al llegar a `max_points`, gana punto de oro (el que tenga max_points gana sin importar diferencia)
  - Ejemplo con points_to_win=21, win_by=2, max_points=30: 30-29 es válido (punto de oro en max)
  - 25-23 es válido (diferencia de 2, ambos >= 21)
  - 21-20 NO es válido (falta 1 punto de diferencia)
  - 22-20 SÍ es válido (diferencia de 2)
- Si `max_points` NO está definido: puede ir a infinito (ej: 35-33 es válido)
- Mínimo del perdedor cuando gana por diferencia: `ganador_puntos - 2` o menos

**Si `win_by` no está definido:** asumir punto directo (win_by=1).

---

## DESCRIPCIÓN DETALLADA DE LA UI

### Estructura de la página de marcadores

```
┌────────────────────────────────────────┐
│  ← Marcadores                          │
│                                        │
│  ● ○ ○ ○ ○ ○         dots por día     │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │      HOY — Mie 17 Abr           │  │
│  │                                  │  │
│  │  ▶ Primera        2p / 1r       │  │  ← acordeón categoría
│  │                                  │  │
│  │  ▼ Segunda        2p / 1r       │  │  ← abierto
│  │  ┌────────────────────────────┐  │  │
│  │  │ Pendientes (2)             │  │  │
│  │  │                            │  │  │
│  │  │ ┌────────────────────────┐ │  │  │
│  │  │ │ 10:15 · Cancha 2  GrA │ │  │  │
│  │  │ │                        │ │  │  │
│  │  │ │  R. Moreno / I. Garcia │ │  │  │
│  │  │ │         vs             │ │  │  │
│  │  │ │  F. Ramos / P. Silva   │ │  │  │
│  │  │ │                        │ │  │  │
│  │  │ │        Registrar →     │ │  │  │
│  │  │ └────────────────────────┘ │  │  │
│  │  │ ...                        │  │  │
│  │  │                            │  │  │
│  │  │ ── Completados (1) ──     │  │  │
│  │  │                            │  │  │
│  │  │ ┌────────────────────────┐ │  │  │
│  │  │ │ 08:45 · Cancha 2  ✓   │ │  │  │
│  │  │ │  R. Moreno / I. Garcia │ │  │  │
│  │  │ │         vs             │ │  │  │
│  │  │ │  R. Iglesias / C. Nav. │ │  │  │
│  │  │ │  21-18   ★ R. Moreno   │ │  │  │
│  │  │ └────────────────────────┘ │  │  │
│  │  └────────────────────────────┘  │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│         ← swipe →  Jue 18 Abr         │
└────────────────────────────────────────┘
```

### Swipe por días
- Cada "página" es un día del torneo (start_date a end_date)
- Dots arriba: ● celeste activo, ○ gris inactivo
- **Vista predeterminada**: HOY si estamos en rango del torneo. Si no, primer día con partidos pendientes.
- Orden cronológico izquierda a derecha
- CSS scroll-snap

### Acordeones de categoría dentro de cada día
- Cada día muestra un botón/acordeón por cada categoría que tiene partidos ese día
- **Cerrado:** nombre de categoría + badge "Xp / Yr" (X pendientes / Y registrados)
- **Abierto:** despliega pendientes arriba + completados abajo
- Animación suave de apertura/cierre
- Si una categoría no tiene partidos ese día, NO aparece

### Cards de partido — Duplas en formato vertical

**Pendiente (borde izquierdo celeste):**
```
08:00 · Cancha 1                Grupo A
        C. Mendez / M. Gonzalez
                 vs
        P. Alvarez / A. Fernandez
                    Registrar →
```

**Completado (borde izquierdo verde):**
```
09:30 · Cancha 2              Grupo A ✓
        C. Mendez / M. Gonzalez
                 vs
        L. Rodriguez / R. Martinez
6-4 / 6-3       ★ C. Mendez / M. Gonzalez
```

- Dupla 1 arriba, "vs" al centro en gris, Dupla 2 abajo
- Nombres = usernames de jugadores separados por " / "
- Línea superior: hora + cancha a la izquierda, grupo a la derecha
- Línea inferior de completado: resultado + ganador con ★

### Modal de ingreso — Adaptable a scoring_config

**Header del modal:**
- "Registrar resultado" + botón ✕
- Info: "Partido X · HH:MM · Cancha Y · Grupo Z · [Categoría]"
- Equipos en formato vertical: Equipo 1 / vs / Equipo 2

**Banner de referencia:**
- Fondo amarillo suave (#FFF5D6)
- Texto describiendo la config: "Mejor de 3 sets de 6 games."
- O: "Partido a 21 puntos · Diferencia de 2 · Máximo 30"

**Para sets_normal/sets_suma:** filas de sets con inputs
**Para points:** 2 inputs grandes de puntos

**Ganador calculado en tiempo real** abajo en verde cuando el resultado es conclusivo.

**Botón "Guardar resultado"** solo habilitado cuando:
- Todos los sets/puntos necesarios están completos
- El resultado tiene un ganador conclusivo
- Todas las validaciones de scoring pasan

---

## FASES DE EJECUCIÓN

---

### FASE 1 — Lógica de resultados, validaciones y estadísticas (lógica pura)

**status:** `DONE`
**test_notes:** `35/35 tests passed. sets_normal: 2-0 y 2-1 ✓, tiebreak 7-6 ✓, 8-6 invalid ✓, 6-6 empate invalid ✓, matchDecided bloquea sets extra ✓, canAddSet 1-1 ✓. sets_suma: 3/3 complete ✓, 2/3 incomplete ✓. points win_by=1: 21-18 ✓, 22-18 invalid ✓. win_by=2: 21-20 incomplete ✓, 22-20 ✓, 30-29 punto de oro ✓, 31-29 invalid ✓, 35-33 sin max ✓. Negativos → error ✓. calculateUpdatedStats: sets+games+points increments ✓. Build OK.`

**Archivos a crear:**
- `src/lib/scoreManager.js`

**Funciones a implementar:**

**1. `validateScoreInput(scores, scoringConfig)`**

Valida los datos parciales mientras el organizador los ingresa. Retorna errores en tiempo real.

Para sets_normal:
- `scores = { team1_games: [6, 3, ...], team2_games: [4, 6, ...] }`
- Cada game value: >= 0
- Cada game value: <= games_per_set + 1 (margen de tiebreak)
- Un set NO puede terminar en empate (mismo número de games para ambos)
- Quien tiene más games gana el set
- No más de `sets_to_win × 2 - 1` sets en total
- Si un equipo ya tiene `sets_to_win` sets ganados, no se permiten más sets
- complete = true cuando un equipo tiene `sets_to_win` sets ganados

Para sets_suma:
- `scores = { team1_games: [4, 6, 3], team2_games: [6, 4, 6] }`
- Exactamente `total_sets` sets (ni más ni menos)
- Mismas validaciones de games por set que sets_normal
- complete = true cuando todos los `total_sets` sets tienen games ingresados y al menos uno tiene más sets ganados

Para points:
- `scores = { team1_points: 21, team2_points: 18 }`
- Puntos >= 0
- Depende de win_by:
  - win_by=1 (punto de oro): el ganador debe tener exactamente points_to_win. El perdedor < points_to_win. Nadie puede exceder points_to_win.
  - win_by=2 (diferencia de 2):
    - Si ninguno llega a points_to_win: incomplete
    - Si uno tiene >= points_to_win y diferencia >= 2: válido
    - Si ambos tienen >= points_to_win - 1 y diferencia < 2: incomplete (siguen jugando)
    - Si max_points definido: al llegar a max_points, gana con diferencia de 1 (punto de oro al max). Nadie puede exceder max_points.
    - Si max_points NO definido: sin tope
  - win_by no definido: asumir win_by=1

Output: `{ valid: boolean, errors: [string], complete: boolean, warnings: [string] }`

**2. `calculateMatchResult(scores, scoringConfig)`**

Solo llamar cuando validateScoreInput retorna complete=true.

Para sets_normal:
- Contar sets ganados por cada equipo
- Calcular total games ganados y perdidos
- Ganador = quien tiene sets_to_win sets ganados
- Output incluye score_team1, score_team2 en formato BD

Para sets_suma:
- Contar sets ganados
- Si empate en sets: quien tiene más games totales
- Si empate total: marcar como empate (el organizador decide o sorteo)

Para points:
- Ganador = quien tiene más puntos (ya validado)

Output:
```js
{
  valid: true,
  winner: 'team1' | 'team2',
  score_team1: { sets_won, sets_lost, games: [6,3,6], total_games_won: 15, total_games_lost: 12 },
  score_team2: { sets_won, sets_lost, games: [4,6,2], total_games_won: 12, total_games_lost: 15 },
  summary: "2-1"
}
// O para puntos:
{
  valid: true,
  winner: 'team1',
  score_team1: { points: 21 },
  score_team2: { points: 18 },
  summary: "21-18"
}
```

**3. `calculateUpdatedStats(currentStats, matchResult, isWinner, scoringConfig)`**
- Incrementa matches_played, matches_won/lost
- Suma sets_won/lost, games_won/lost (si aplica)
- Suma points_scored/against (si aplica)
- Output: nuevo objeto de estadísticas

**4. `determineRequiredSets(scores, scoringConfig)`**
- Para sets_normal: cuántos sets se necesitan según el estado actual
- Para sets_suma: siempre total_sets
- Output: `{ totalSetsNeeded, currentSetsPlayed, matchDecided, canAddSet }`

**5. `getMaxGamesForSet(scoringConfig, team1Games, team2Games)`**
- Retorna el máximo de games válido para un set dado el estado actual
- Si no: max = games_per_set + 1
- Útil para validar inputs en tiempo real

**Validaciones del tester:**
- [ ] sets_normal: 6-4 / 6-3 → winner team1, summary "2-0", complete=true
- [ ] sets_normal: 6-4 / 3-6 / 6-2 → winner team1, summary "2-1"
- [ ] sets_normal: 7-6 tiebreak es válido, 8-6 NO es válido 
- [ ] sets_normal: 6-6 es INVÁLIDO (empate en set)
- [ ] sets_normal: después de 2-0, no permite agregar set 3 (matchDecided=true)
- [ ] sets_normal: después de 1-1, canAddSet=true, totalSetsNeeded=3
- [ ] sets_suma: 3 sets todos llenos → complete=true
- [ ] sets_suma: 2 de 3 sets llenos → complete=false
- [ ] points win_by=1: 21-18 válido, 22-18 INVÁLIDO (excede points_to_win)
- [ ] points win_by=2: 21-20 INVÁLIDO (diferencia < 2), 22-20 válido
- [ ] points win_by=2 con max_points=30: 30-29 válido (punto de oro al max)
- [ ] points win_by=2 con max_points=30: 31-29 INVÁLIDO (excede max)
- [ ] points win_by=2 sin max_points: 35-33 válido
- [ ] games negativos → error
- [ ] calculateUpdatedStats incrementa correctamente
- [ ] `npm run build` pasa

---

### FASE 2 — Página de marcadores con swipe por días y acordeones de categoría

**status:** `DONE`
**test_notes:** `Todos los checks pasan. 6 archivos nuevos en Scoreboard/ ✓. ResultsInputPage renderiza ScoreboardPage con query a torneo activo ✓. DaySwiper: scroll-snap + dots celeste/gris + auto-scroll a HOY ✓. DayView: acordeones por categoría, "Sin partidos" para días vacíos ✓. CategorySection: "Xp / Yr" cerrado, pendientes arriba + completados abajo, "✓ Todos" cuando all done, max-height transition ✓. PendingMatchCard: borde celeste, duplas vertical con usernames, "Registrar →" ✓. CompletedMatchCard: borde verde, fondo #FAFBFC, score summary, "★ Ganador" ✓. Build OK.`

**Archivos a crear:**
- `src/components/Scoreboard/ScoreboardPage.jsx`
- `src/components/Scoreboard/DaySwiper.jsx`
- `src/components/Scoreboard/DayView.jsx`
- `src/components/Scoreboard/CategorySection.jsx`
- `src/components/Scoreboard/PendingMatchCard.jsx`
- `src/components/Scoreboard/CompletedMatchCard.jsx`

**Archivos a modificar:**
- `src/pages/ResultsInputPage.jsx` — reemplazar placeholder con ScoreboardPage

**Qué hacer:**

**ScoreboardPage.jsx:**
- Carga datos desde Supabase al montar:
  - tournament_matches con joins a courts, tournament_registrations, profiles (player1 y player2 usernames), categories
  - scoring_config del torneo
- Agrupa partidos por scheduled_date → luego por category_id
- Determina día predeterminado: HOY si está en rango, si no primer día con pendientes
- Renderiza DaySwiper

**DaySwiper.jsx:**
- Swipe horizontal con scroll-snap
- Dots de navegación (● celeste activo, ○ gris)
- Scroll automático al día predeterminado al montar

**DayView.jsx:**
- Header: "HOY — Mie 17 Abr" (badge "hoy" si aplica) o "Mar 15 Abr"
- Lista de CategorySection, uno por cada categoría que tiene partidos ese día
- Si no hay partidos ese día: "Sin partidos programados"

**CategorySection.jsx — ACORDEÓN POR CATEGORÍA:**
- Props: categoryName, matches (de esa categoría en ese día), scoringConfig, onRegister
- **Cerrado:** Botón alargado con nombre de categoría + badge "Xp / Yr" (X pendientes / Y registrados)
- **Abierto:** Se despliega con animación suave mostrando:
  - Sección "Pendientes (X)" con lista de PendingMatchCard
  - Separador visual "── Completados (Y) ──"
  - Sección completados con CompletedMatchCard
  - Si todos completados: "✓ Todos los partidos registrados" en verde
- Animación de max-height transition

**PendingMatchCard.jsx:**
- Borde izquierdo 4px celeste (#6BB3D9)
- Línea 1: "HH:MM · Cancha X" izquierda + "Grupo Y" derecha (gris)
- Duplas en formato VERTICAL centrado:
  ```
  Player1 / Player2
        vs
  Player3 / Player4
  ```
  - Nombres de jugadores (usernames de profiles, NO team_name)
  - "vs" en gris claro, tamaño pequeño, centrado
- Botón "Registrar →" alineado a la derecha, texto celeste
- Al tocar → onRegister(match)

**CompletedMatchCard.jsx:**
- Borde izquierdo 4px verde (#22C55E)
- Fondo ligeramente gris (#FAFBFC)
- Misma estructura de duplas verticales
- Línea inferior: resultado (ej: "6-4 / 6-3" o "21-18") + "★ [Ganador]" en verde
- ✓ en la esquina del grupo

**ResultsInputPage.jsx:**
- Eliminar placeholder
- Importar y renderizar ScoreboardPage
- Query del torneo activo del organizador logueado

**Estilo:** UI-UX PRO MAX + DESIGN-ARCHITECTURE.md. Fondo perla, cards blancas, celeste pendientes, verde completados, acordeones con animación, mobile-first.

**Validaciones del tester:**
- [ ] 6 archivos nuevos en src/components/Scoreboard/
- [ ] ResultsInputPage ya no es placeholder
- [ ] DaySwiper con scroll-snap y dots
- [ ] Cada día tiene acordeones de categoría (no partidos sueltos)
- [ ] Acordeón cerrado muestra "Xp / Yr"
- [ ] Acordeón abierto muestra pendientes arriba y completados abajo
- [ ] PendingMatchCard: duplas en formato vertical (nombre arriba, vs, nombre abajo)
- [ ] CompletedMatchCard: resultado + ganador con ★
- [ ] Vista predeterminada es HOY
- [ ] `npm run build` pasa

---

### FASE 3 — Modal de ingreso de resultados (adaptable a scoring_config)

**status:** `DONE`
**test_notes:** `Todos los checks pasan. 3 archivos nuevos ✓. Modal abre vía handleRegister→selectedMatch ✓. Banner scoring: sets_normal/sets_suma/points con win_by y max_points ✓. SetsScoreForm: filas dinámicas con determineRequiredSets, sets_suma fijo ✓. PointsScoreForm: 56px/24px inputs, max dinámico por win_by ✓. Ganador en tiempo real: useMemo + validateScoreInput + calculateMatchResult → card verde ✓. Errores inline per-set en rojo ✓. Botón deshabilitado hasta valid+complete+winner, saving state ✓. Build OK.`

**Archivos a crear:**
- `src/components/Scoreboard/ScoreInputModal.jsx`
- `src/components/Scoreboard/SetsScoreForm.jsx`
- `src/components/Scoreboard/PointsScoreForm.jsx`

**Archivos a modificar:**
- `src/components/Scoreboard/ScoreboardPage.jsx` — estado del modal

**Qué hacer:**

**ScoreInputModal.jsx:**
- Modal bottom-sheet (sube desde abajo en móvil), overlay oscuro
- Header: "Registrar resultado" + ✕
- Info: "Partido X · HH:MM · Cancha Y · Grupo Z · [Nombre Categoría]"
- Equipos en formato vertical: Equipo 1 centrado / "vs" / Equipo 2 centrado

- **Banner de referencia de scoring** (fondo #FFF5D6):
  - sets_normal: "Mejor de [sets_to_win×2-1] sets de [games_per_set] games"
  - sets_suma: "[total_sets] sets de [games_per_set] games (todos se juegan)"
  - points con win_by=1: "Partido a [points_to_win] puntos · Punto directo"
  - points con win_by=2: "Partido a [points_to_win] puntos · Diferencia de 2 · Máximo [max_points]" (si tiene max)
  - points con win_by=2 sin max: "Partido a [points_to_win] puntos · Diferencia de 2 · Sin máximo"

- Renderiza SetsScoreForm o PointsScoreForm según scoringConfig.type
- Ganador calculado en TIEMPO REAL usando calculateMatchResult de scoreManager.js
  - Si hay ganador: mostrar en card verde "✓ Ganador: [nombre] ([summary])"
  - Si incompleto: "Completa el resultado para continuar" en gris
  - Si hay errores de validación: mostrar en rojo debajo del input correspondiente

- Botones: [Cancelar] y [Guardar resultado]
  - Guardar solo habilitado cuando validateScoreInput retorna valid=true Y complete=true
  - Al presionar guardar: deshabilitar botón + mostrar loading
  - Por ahora: llamar onSave(match, result) — persistencia real en Fase 4

**SetsScoreForm.jsx:**
- Props: scoringConfig, scores (estado controlado), onScoresChange, errors
- Filas dinámicas de sets:
  - sets_normal: empieza con sets_to_win filas. Si después de esas nadie ganó, agregar otra fila automáticamente. Usar determineRequiredSets para calcular. Máximo sets_to_win × 2 - 1.
  - sets_suma: exactamente total_sets filas, fijo.
- Cada fila: "Set X:" + 2 inputs numéricos (games equipo 1, games equipo 2)
- Labels de equipo: iniciales o nombres cortos de los jugadores (ej: "CM" para Carlos Méndez)
- Inputs: type="number", min=0, step=1
- Inputs grandes y cómodos: height 44-48px, font-size 18-20px, centrados
- Errores inline en rojo debajo del set que tiene error
- Si un set es válido, mostrar check ✓ sutil al lado

**PointsScoreForm.jsx:**
- Props: scoringConfig, scores, onScoresChange, errors
- 2 inputs numéricos MUY grandes (height 56px, font-size 24px):
  - "[Equipo 1 nombre completo]: [input]"
  - "[Equipo 2 nombre completo]: [input]"
- min=0, step=1
- Max dinámico:
  - win_by=1: max = points_to_win
  - win_by=2 con max_points: max = max_points
  - win_by=2 sin max_points: sin max (dejar libre)
- Referencia debajo: "Primero en llegar a [X] puntos" + info de win_by
- Errores inline en rojo si la validación falla

**Validaciones del tester:**
- [ ] Los 3 archivos existen
- [ ] Modal se abre al presionar "Registrar" en PendingMatchCard
- [ ] Banner muestra la config de scoring correcta para el torneo
- [ ] sets_normal: filas de sets se agregan dinámicamente
- [ ] sets_normal: no permite más sets que los necesarios
- [ ] sets_suma: número fijo de filas
- [ ] points: 2 inputs grandes con max correcto según win_by
- [ ] Ganador se calcula en tiempo real
- [ ] Errores de validación se muestran inline
- [ ] Botón guardar deshabilitado hasta resultado conclusivo
- [ ] `npm run build` pasa

---

### FASE 4 — Persistencia de resultados y actualización de estadísticas

**status:** `DONE`
**test_notes:** `Todos los checks pasan. RPC save_match_result: UPDATE matches SET score+winner+status='completed' ✓, UPDATE group_members con deltas (matches_played+1, sets/games/points) ✓, COALESCE para nulls ✓. scorePersistence.js: computeDeltas para sets y points ✓, saveMatchResult llama RPC ✓, checkGroupPhaseComplete query neq('completed') con count ✓. ScoreboardPage: handleSaveResult usa saveMatchResult real ✓, refetch loadData ✓, banner "¡Fase de grupos completada!" cuando check.complete ✓, fetch groupMembers para mapear registration→member ✓. Build OK. IMPORTANTE: Re-ejecutar create_rpc_save_match_result.sql en Supabase SQL Editor.`

**Archivos a crear:**
- `src/lib/scorePersistence.js`
- `supabase/migrations/create_rpc_save_match_result.sql`

**Archivos a modificar:**
- `src/components/Scoreboard/ScoreboardPage.jsx` — conectar persistencia real

**Qué hacer:**

**Función RPC `save_match_result`:**
```sql
CREATE OR REPLACE FUNCTION save_match_result(
  p_match_id uuid,
  p_winner_id uuid,
  p_score_team1 jsonb,
  p_score_team2 jsonb,
  p_team1_member_id uuid,  -- id del group_member de team1
  p_team2_member_id uuid,
  p_team1_stats jsonb,     -- { matches_won_delta, sets_won_delta, sets_lost_delta, games_won_delta, games_lost_delta, points_scored_delta, points_against_delta }
  p_team2_stats jsonb
) RETURNS jsonb
```

Dentro de la función:
1. UPDATE tournament_matches SET score_team1, score_team2, winner_id, status='completed'
2. UPDATE tournament_group_members para team1: sumar deltas a las estadísticas existentes + matches_played += 1
3. UPDATE tournament_group_members para team2: sumar deltas + matches_played += 1
4. Retornar { success: true }

**scorePersistence.js:**

`saveMatchResult(supabase, matchId, result, team1MemberId, team2MemberId)`:
- Calcula los deltas de estadísticas con calculateUpdatedStats
- Llama supabase.rpc('save_match_result', payload)
- Retorna { success, error }

`checkGroupPhaseComplete(supabase, tournamentId, categoryId)`:
- Query: count de tournament_matches WHERE phase='group_phase' AND category_id AND status != 'completed'
- Retorna { complete: boolean, remaining: number }

**ScoreboardPage.jsx:**
- Conectar onSave del modal a saveMatchResult real
- Después de guardar: refetch de partidos del día
- Si checkGroupPhaseComplete retorna complete=true: mostrar banner "¡Fase de grupos completada!"
- La clasificación automática se dispara en Fase 5

**Validaciones del tester:**
- [ ] Función RPC existe en SQL
- [ ] saveMatchResult actualiza tournament_matches con score y status='completed'
- [ ] saveMatchResult actualiza tournament_group_members con estadísticas incrementadas
- [ ] Partido se mueve de Pendientes a Completados visualmente
- [ ] checkGroupPhaseComplete detecta cuando todos los partidos de grupo terminan
- [ ] `npm run build` pasa

---

### FASE 5 — Clasificación automática + llenado de bracket + programación de eliminatoria

**status:** `DONE`
**test_notes:** `Todos los checks pasan. postGroupPhase.js existe (316 líneas) ✓. Clasificación: rankGroupMembers por grupo + calculateClassification + selectDirectQualifiers + selectBestPositioned + assignToBracket ✓. Persiste final_rank+qualified en group_members ✓. Bracket: primera ronda con team1_id/team2_id/status='scheduled' ✓. Partidos eliminatoria: INSERT con phase=eliminationPhase, status='scheduled', group_id=null ✓. Programación: scheduleEliminationMatches usa generateAllSlots+distributeMatches, UPDATE con court_id/scheduled_date/scheduled_time ✓. ScoreboardPage: importa processGroupPhaseCompletion, dispara tras checkGroupPhaseComplete, banner "Calculando clasificación...", refetch loadData ✓. checkAllCategoriesComplete marca torneo 'finished' ✓. Build OK.`

**Archivos a crear:**
- `src/lib/postGroupPhase.js`

**Archivos a modificar:**
- `src/components/Scoreboard/ScoreboardPage.jsx` — disparar clasificación automática

**Qué hacer:**

**`processGroupPhaseCompletion(supabase, tournamentId, categoryId, scoringConfig)`:**

Se ejecuta cuando checkGroupPhaseComplete retorna complete=true. Hace:

a) Cargar tournament_config → obtener config de la categoría
b) Cargar tournament_groups + tournament_group_members con estadísticas
c) rankGroupMembers (de classificationEngine.js) para cada grupo → asignar final_rank
d) selectDirectQualifiers → clasificados directos
e) Si best_positioned_needed > 0: selectBestPositioned → mejores N-ésimos
f) assignToBracket → asignar equipos al bracket
g) Persistir:
   - UPDATE tournament_group_members SET final_rank, qualified
   - INSERT tournament_best_positioned (si aplica)
   - UPDATE tournament_bracket SET team1_id, team2_id, status='scheduled' (primera ronda)
   - INSERT tournament_matches para partidos de eliminatoria
h) Programar eliminatoria:
   - Obtener canchas y slots disponibles (fechas después del último partido de grupo)
   - distributeMatches (de schedulingEngine.js) para partidos de eliminatoria
   - UPDATE tournament_matches de eliminatoria con court_id, scheduled_date, scheduled_time
i) UPDATE tournament_groups SET phase='completed', status='completed'

**`checkAllCategoriesComplete(supabase, tournamentId)`:**
- Si todas las categorías completaron grupos Y eliminatoria → UPDATE tournaments.status = 'finished'

**ScoreboardPage.jsx:**
- Después de checkGroupPhaseComplete = true:
  1. Banner: "Calculando clasificación de [categoría]..."
  2. processGroupPhaseCompletion
  3. Éxito: "✓ Clasificación completada. Partidos de eliminatoria programados."
  4. Refetch para que los nuevos partidos de eliminatoria aparezcan en el DaySwiper
  5. Los partidos de eliminatoria aparecen como pendientes en sus días correspondientes

**Validaciones del tester:**
- [ ] postGroupPhase.js existe
- [ ] Clasificación rankea grupos correctamente
- [ ] Bracket se llena con clasificados
- [ ] Partidos de eliminatoria se crean con status='scheduled'
- [ ] Partidos de eliminatoria se programan con fecha/hora/cancha
- [ ] Nuevos partidos aparecen en el marcador como pendientes
- [ ] `npm run build` pasa

---

### FASE 6 — Integración end-to-end y validación final

**status:** `DONE`
**test_notes:** `VALIDACIÓN FINAL COMPLETA — 21/21 tests passed. Edge cases: tiebreak 7-6 ✓, 6-6 invalid ✓, 21-21 win_by=1 invalid ✓, 22-20 win_by=2 ✓, 30-29 punto de oro ✓. E2E pipeline: score→stats→rank→classify→schedule all chained correctly ✓. Rankings correct (t1>t2>t3 by wins) ✓. Direct qualifiers selected ✓. Scheduling produces valid distribution ✓. Double-save protection: matchDecided blocks extra sets ✓. 0 console.log/TODO/FIXME in all new files ✓. 14 routes intact ✓. Build OK.`

**Flujo completo:** Organizador abre marcadores → swipe entre días → abre categoría → registra resultado → partido se mueve a completados → cuando termina fase de grupos → clasificación automática → bracket se llena → eliminatoria se programa → registra resultados de eliminatoria → torneo puede terminar.

**Casos edge:**
| Caso | Comportamiento |
|---|---|
| Tiebreak 7-6 en sets_normal | Válido, solo acepta 7-6 o 6-7 cuando ambos llegan a tiebreak |
| 6-6 sin resolver | INVÁLIDO, error inline |
| Punto de oro: 21-21 | INVÁLIDO si win_by=1 |
| Diferencia de 2: 22-20 | Válido |
| Diferencia de 2 con max 30: 30-29 | Válido (punto de oro al max) |
| Día sin partidos | "Sin partidos programados" |
| Todos los partidos del día completados | "✓ Todos registrados" |
| Doble clic en guardar | Botón se deshabilita al primer clic |
| Categoría sin partidos ese día | No aparece acordeón de esa categoría |

**Verificar que NO se rompió:** login, torneos, inscripciones, vista activa, admin.

**Limpieza:** grep console.log/TODO/FIXME en archivos nuevos. npm run build.

**Validaciones del tester:**
- [ ] Flujo completo e2e funciona
- [ ] Validaciones de scoring estrictas funcionan
- [ ] Clasificación automática se dispara al completar grupo
- [ ] Partidos eliminatoria aparecen como pendientes
- [ ] Console sin errores
- [ ] npm run build pasa
- [ ] Funcionalidad existente intacta

---

## ESTADO GLOBAL DE LA TAREA

| Fase | Descripción | Status | Test Notes |
|------|-------------|--------|------------|
| Fase 1 | Lógica resultados + validaciones scoring | `DONE` | 35/35 tests passed |
| Fase 2 | Página marcadores + swipe + acordeones | `DONE` | All checks passed |
| Fase 3 | Modal ingreso resultados | `DONE` | All checks passed |
| Fase 4 | Persistencia resultados + stats | `DONE` | All checks passed — re-run SQL |
| Fase 5 | Clasificación auto + bracket + eliminatoria | `DONE` | All checks passed |
| Fase 6 | Integración e2e | `DONE` | 21/21 — Final validation complete |