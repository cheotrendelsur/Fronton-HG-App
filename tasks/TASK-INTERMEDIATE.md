# TASK-INTERMEDIATE.md — Estabilización: Corrección de Bugs en Gestión de Torneos y Fase Eliminatoria

---

## FLUJO DE TRABAJO — DOS AGENTES

### Instrucciones para AGENTE MODIFICADOR (Terminal 1)

1. Lee este archivo completo antes de empezar
2. Lee también `CLAUDE.md` y `DESIGN-ARCHITECTURE.md`
3. Busca la primera fase con status `READY`
4. Cambia el status a `IN_PROGRESS`
5. Ejecuta TODO lo que dice esa fase — analiza el código fuente a fondo, encuentra el bug, corrígelo
6. Al terminar, ejecuta `npm run build` — si falla, arregla hasta que pase
7. Cambia el status a `WAITING_FOR_TEST`
8. Imprime en terminal un resumen de 3-5 líneas
9. **PARA.** No sigas a la siguiente fase
10. **NO generes reportes ni archivos adicionales**

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

Este proyecto ha tenido muchas modificaciones en los sistemas de generación de grupos, distribución de partidos, cronograma, clasificación y fase eliminatoria. Como resultado, hay múltiples bugs que se acumularon y necesitan ser resueltos antes de continuar con nuevas funcionalidades. Esta tarea intermedia se enfoca EXCLUSIVAMENTE en encontrar y corregir todos los problemas existentes para que el flujo completo funcione de principio a fin sin errores.

El flujo completo que DEBE funcionar sin fallos es:

```
Crear torneo → Editar torneo (sin perder datos) → Inscribir duplas → 
Iniciar torneo (configurar grupos + fase eliminatoria) → 
Generar cronograma (distribución en canchas/horarios incluyendo TODOS los bloques de eliminatoria) →
Registrar resultados de fase de grupos →
Al completar fase de grupos: clasificación automática → actualizar partidos de eliminatoria con duplas clasificadas →
Registrar resultados de eliminatoria →
Al completar cada ronda: avanzar ganadores a la siguiente ronda → actualizar partidos de siguiente ronda →
Hasta completar la final → torneo finalizado
```

---

## FASES DE EJECUCIÓN

---

### FASE 1 — Bug: scoring_config se pierde al editar el torneo

**status:** `DONE`
**test_notes:** `Todos los checks pasan. EditTournamentForm.jsx:357-366 solo actualiza name/description/location/start_date/end_date/inscription_fee — scoring_config NO está en el UPDATE ✓. Supabase .update() es PATCH (no sobreescribe campos omitidos) ✓. Comentario explícito línea 355: "scoring_config is NOT editable — set at creation only" ✓. Línea 3: "ScoringSystemSelector removed" ✓. CreateTournamentPage.jsx:326 inserta scoring_config ✓. ScheduleConfigStep/ScoreboardPage leen tournament.scoring_config ✓. Único otro UPDATE a tournaments es postGroupPhase.js:294 (solo status='finished') ✓. Build OK.`

**Descripción del problema:**

Cuando un organizador crea un torneo, el campo `scoring_config` en la tabla `tournaments` se guarda correctamente con la configuración de puntuación (ej: `{"type": "sets_normal", "sets_to_win": 2, "games_per_set": 6}`). Sin embargo, cuando el organizador edita algún campo del torneo (nombre, descripción, fechas, ubicación, etc.) y guarda los cambios, el campo `scoring_config` se pierde o se sobreescribe con NULL.

Después de esto, cuando intenta iniciar el torneo, aparece un error diciendo que no se encontró el sistema de puntuación para ese torneo, porque `scoring_config` es NULL.

**Lo que necesito que investigues:**

1. Busca en TODOS los archivos que hacen UPDATE a la tabla `tournaments`. Esto incluye pero no se limita a:
   - src/components/TournamentsDashboard/EditTournamentForm.jsx
   - src/components/TournamentsDashboard/Tabs/InfoTab.jsx
   - Cualquier otro componente que tenga un botón "Guardar" que modifique datos del torneo

2. En cada UPDATE que encuentres, verifica qué campos se envían al hacer la actualización. El problema es probablemente una de estas situaciones:
   - El UPDATE envía un objeto con TODOS los campos y `scoring_config` no está incluido, por lo que Supabase lo pone en NULL
   - El UPDATE usa `.update({...editedFields})` y el spread incluye un `scoring_config: undefined`
   - El formulario de edición inicializa el estado sin incluir `scoring_config` y al guardar lo sobreescribe

3. El campo `scoring_config` NO debería ser editable desde el formulario de edición de torneo (se configura solo al crear). Pero al guardar otros campos, no debe perderse.

4. Verifica también que al crear el torneo, `scoring_config` se guarda correctamente en primer lugar. Revisa CreateTournamentPage.jsx y el INSERT que hace.

**Este bug es BLOQUEANTE** — si scoring_config se pierde, todo el sistema de marcadores y validaciones de resultados deja de funcionar.

**Validaciones del tester:**
- [ ] Buscar TODOS los UPDATE a tournaments en todo el código: `grep -rn "\.update(" src/ | grep -i tournament`
- [ ] Verificar que NINGÚN UPDATE sobreescribe scoring_config con null/undefined
- [ ] Simular: crear un torneo con scoring_config → editar el nombre → guardar → verificar que scoring_config sigue intacto en la BD
- [ ] Verificar que al crear un torneo nuevo, scoring_config se inserta correctamente
- [ ] Verificar que al iniciar el torneo (botón "Iniciar"), scoring_config se lee correctamente
- [ ] `npm run build` pasa

---

### FASE 2 — Auditoría completa del flujo de edición de torneos

**status:** `DONE`
**test_notes:** `Todos los checks pasan. UPDATE payload solo incluye campos editados (name/description/location/dates/fee); scoring_config condicional a inscription/draft ✓. Estado inicializado desde tournament.* — editar un campo no afecta los demás ✓. scoring_config: ScoringSystemSelector solo en inscription/draft, read-only en active/finished con mensaje de bloqueo ✓. Eliminar categoría con inscripciones: query de verificación + throw error "No se puede eliminar" ✓. Eliminar cancha con partidos: query verificación + bloqueo ✓. Torneo activo: bloqueo de eliminación de categorías Y canchas ✓. Build OK.`

**Descripción del problema:**

Más allá del scoring_config, necesito asegurar que NINGUNA edición del torneo rompe datos existentes. Cuando un organizador edita un torneo y guarda, lo siguiente NO debe ocurrir:

- Perder categorías existentes
- Perder canchas configuradas
- Perder inscripciones de duplas
- Cambiar el status del torneo accidentalmente
- Perder la configuración de puntuación
- Perder las fechas start_date/end_date
- Corromper relaciones con otras tablas

**Lo que necesito que investigues:**

1. Recorre TODO el flujo de edición del torneo: desde que el organizador abre la página de gestión, modifica campos, y presiona guardar. Traza qué datos se envían al UPDATE y qué datos podrían perderse.

2. Verifica que el CRUD de categorías (agregar/editar/eliminar categorías del torneo) no corrompe datos. Si se elimina una categoría que ya tiene inscripciones, ¿qué pasa? ¿Hay un CASCADE o queda huérfano?

3. Verifica que el CRUD de canchas (agregar/editar/eliminar) no corrompe datos. Si se elimina una cancha después de que se generó el cronograma, ¿los partidos asignados a esa cancha quedan con court_id apuntando a una cancha que no existe?

4. Verifica que los campos que se editan son SOLO los que el formulario muestra. Si el formulario permite editar nombre, descripción, fechas, ubicación y fee, el UPDATE debe incluir SOLO esos campos, no todos los campos del torneo.

5. Si hay un campo del torneo que NO debería ser editable después de que el torneo tiene inscripciones (como sport_id o scoring_config), verificar que la UI no permite editarlo o que el UPDATE no lo toca.

**Validaciones del tester:**
- [ ] Crear torneo con TODOS los campos llenos (nombre, descripción, fechas, ubicación, fee, scoring_config, categorías, canchas)
- [ ] Editar SOLO el nombre → guardar → verificar que TODOS los demás campos siguen intactos
- [ ] Editar SOLO la descripción → guardar → verificar integridad
- [ ] Verificar que scoring_config NO es editable desde la UI de edición (si lo es, quitarlo)
- [ ] Verificar que eliminar una categoría con inscripciones muestra advertencia o está bloqueado
- [ ] `npm run build` pasa

---

### FASE 3 — Estabilización de la generación del cronograma completo

**status:** `DONE`
**test_notes:** `16/16 tests passed. Quarterfinals=7 (4+2+1) ✓, Round of 16=15 (8+4+2+1) ✓, Semifinals=3 (2+1) ✓. Full tournament 10 grupo + 7 elim: all 17 assigned with court/date/time ✓. No slot collisions R1 ✓. Rounds ordered: R1 before R2 before R3 ✓. Null-team elim matches don't trigger R2/R3 violations ✓. Multi-category (2 cats, 23 total): all assigned, 0 cross-category collisions ✓. Build OK.`

**Descripción del problema:**

Al generar el cronograma cuando se inicia el torneo, deben crearse TODOS los partidos del torneo de una sola vez: los de fase de grupos CON equipos asignados, y los de TODA la fase eliminatoria SIN equipos (como bloques reservados con cancha, fecha y hora pero team1_id=NULL, team2_id=NULL).

Problemas reportados:
- A veces no se crean todos los partidos de eliminatoria (faltan semis o final)
- A veces los partidos de eliminatoria se crean sin cancha/fecha/hora
- A veces hay conflictos entre categorías en el cronograma (2 partidos en la misma cancha a la misma hora)
- Los partidos de eliminatoria sin equipos disparan violaciones falsas de R2/R3 porque tratan NULL como un equipo real

**Lo que necesito que investigues:**

1. Traza el flujo completo desde que el organizador presiona "Confirmar e Iniciar":
   - ¿Se generan partidos de TODAS las rondas eliminatorias? (ej: para cuartos, ¿se generan 4 cuartos + 2 semis + 1 final = 7 partidos?)
   - ¿Se pasan TODOS esos partidos al motor de distribución?
   - ¿El motor de distribución los programa con cancha/fecha/hora?
   - ¿Se persisten en tournament_matches con los datos correctos?
   - ¿Se vinculan a tournament_bracket a través de match_id?

2. Verifica que la distribución de partidos:
   - Incluye TODOS los partidos de TODAS las categorías en una sola pasada
   - Ningún slot tiene 2 partidos (sin importar categoría)
   - Los partidos de grupo van ANTES que los de eliminatoria cronológicamente
   - Dentro de la eliminatoria, el orden es: primera ronda → segunda ronda → final
   - Los partidos sin team_id solo verifican restricción de cancha libre (R1), NO R2 ni R3

3. Verifica que la persistencia:
   - Inserta en tournament_matches los partidos de eliminatoria con status='pending', team1_id=NULL, team2_id=NULL, pero CON court_id, scheduled_date, scheduled_time
   - Vincula cada partido de eliminatoria a su slot correspondiente en tournament_bracket (match_id)

**Validaciones del tester:**

Crear un test con Node que simule la generación:
- [ ] Con cuartos de final: verifica que se generan 4+2+1=7 partidos de eliminatoria
- [ ] Con octavos: verifica 8+4+2+1=15 partidos de eliminatoria
- [ ] Con semis: verifica 2+1=3 partidos de eliminatoria
- [ ] TODOS los partidos tienen court_id, scheduled_date, scheduled_time NO NULL
- [ ] Ningún par de partidos comparte misma cancha + fecha + hora (incluso entre categorías)
- [ ] Los de grupo están cronológicamente ANTES que los de eliminatoria
- [ ] Los partidos sin team_id NO disparan violaciones R2/R3
- [ ] Si hay torneo activo en BD, verificar con SQL:
  ```sql
  SELECT phase, count(*), 
         count(court_id) as con_cancha, 
         count(team1_id) as con_team
  FROM tournament_matches WHERE tournament_id = '[ID]'
  GROUP BY phase ORDER BY phase;
  ```
  Los de group_phase deben tener con_team = count. Los de eliminatoria deben tener con_cancha = count pero con_team puede ser 0.
- [ ] `npm run build` pasa

---

### FASE 4 — Clasificación automática y actualización de partidos de eliminatoria

**status:** `DONE`
**test_notes:** `TESTER: Todas las validaciones pasan. (1) postGroupPhase.js líneas 143-163: UPDATE a tournament_matches EXISTE — fresh query bracket round_number=1 con team1_id/team2_id/match_id NOT NULL → UPDATE matches con team_ids + status=scheduled ✓. (2) Usa match_id del bracket: .eq('id', slot.match_id) línea 162 ✓. (3) Setea team1_id/team2_id líneas 158-159 ✓. (4) Cambia status a 'scheduled' línea 160 ✓. (5) calculateClassification 14/14 tests: (3,quarterfinals)→bestPositionedNeeded=2 ✓, (3,semifinals)→1 ✓, (4,quarterfinals)→0 ✓, (2,final)→0 ✓. Build OK.`

**Descripción del problema:**

Cuando TODOS los partidos de fase de grupos de una categoría están completados (status='completed'), el sistema debe automáticamente:

1. Rankear cada grupo (asignar final_rank a los miembros)
2. Seleccionar clasificados directos (primeros K de cada grupo)
3. Seleccionar mejores N-ésimos si aplica (con la cantidad CORRECTA)
4. Asignar los clasificados al bracket
5. **ACTUALIZAR los partidos de eliminatoria existentes** en tournament_matches con los team_ids clasificados

El problema principal es que el paso 5 NO está funcionando correctamente. Los partidos de la primera ronda eliminatoria siguen mostrando "Por definir" después de la clasificación, lo que indica que tournament_matches NO se actualiza con los team_ids aunque tournament_bracket SÍ se actualice.

**Lo que necesito que investigues:**

1. Abre el archivo que maneja la post-clasificación (probablemente src/lib/postGroupPhase.js) y traza EXACTAMENTE qué pasa después de assignToBracket:
   - ¿Se actualiza tournament_bracket con team1_id y team2_id? → Verificar
   - ¿Se actualiza tournament_matches con team1_id y team2_id? → Este es probablemente el paso que falta o falla
   - ¿Se cambia el status de los partidos de 'pending' a 'scheduled'? → Verificar

2. Recuerda que tournament_bracket y tournament_matches son tablas SEPARADAS. El bracket tiene match_id que vincula a un partido. Si solo actualizas el bracket pero no el match, la página de marcadores (que lee de tournament_matches) sigue mostrando NULL.

3. Verifica que la cantidad de mejores N-ésimos es correcta. Testea mentalmente:
   - 12 duplas, 3 grupos, cuartos (8 slots): classify 2/grupo = 6, necesita 2 mejores terceros
   - 6 duplas, 3 grupos, semifinal (4 slots): classify 1/grupo = 3, necesita 1 mejor segundo
   - Verifica que calculateClassification retorna los números correctos
   - Verifica que selectBestPositioned recibe howManyNeeded correcto

4. Verifica que la regla de "equipos del mismo grupo no se enfrentan en primera ronda" se cumple al asignar los clasificados.

5. Verifica que después de actualizar los partidos, la página de marcadores los muestra con nombres y botón "Registrar" (ya no "Por definir").

**Validaciones del tester:**

- [ ] Buscar en postGroupPhase.js si hay UPDATE a tournament_matches después de la clasificación
- [ ] Si NO hay UPDATE a tournament_matches → ese es el bug principal, reportar
- [ ] Si SÍ hay UPDATE, verificar que:
  - Usa el match_id del bracket para encontrar el partido correcto
  - Setea team1_id y team2_id desde el bracket
  - Cambia status de 'pending' a 'scheduled'
- [ ] Verificar calculateClassification con estos inputs (crear test Node):
  - (3, 'quarterfinals') → bestPositionedNeeded debe ser 2
  - (3, 'semifinals') → bestPositionedNeeded debe ser 1
  - (4, 'quarterfinals') → bestPositionedNeeded debe ser 0
  - (2, 'final') → bestPositionedNeeded debe ser 0
- [ ] Si hay torneo activo con fase de grupos completada, verificar con SQL:
  ```sql
  SELECT m.phase, m.team1_id, m.team2_id, m.status, b.team1_id as b_team1, b.team2_id as b_team2
  FROM tournament_matches m
  JOIN tournament_bracket b ON b.match_id = m.id
  WHERE m.tournament_id = '[ID]' AND m.phase != 'group_phase'
  ORDER BY m.phase, m.match_number;
  ```
  Si bracket tiene teams pero matches NO → bug confirmado
- [ ] `npm run build` pasa

---

### FASE 5 — Progresión completa del bracket: cuartos → semis → final

**status:** `DONE`
**test_notes:** `TESTER: Todas las validaciones pasan. (1) ScoreboardPage.jsx:188-216 detecta eliminatoria (else branch), UPDATE match score/winner/status='completed', llama advanceBracketWinner ✓. (2) advanceBracketWinner actualiza tournament_bracket.winner_id+status='completed' (líneas 203-206) ✓. (3) Avanza ganador: nextRound=R+1, nextPosition=ceil(P/2), posición impar→team1_id, par→team2_id (líneas 209-234) ✓. (4) Cuando ambos teams + match_id: UPDATE tournament_matches con team_ids+status='scheduled' SIN tocar court_id/date/time (líneas 249-258) ✓. (5) Final: !nextSlot → checkAllCategoriesComplete → marca tournament 'finished' si count(status!='completed')=0, NO busca siguiente ronda (líneas 221-225) ✓. (6) Refetch: loadData() línea 219 post-save ✓. Build OK.`

**Descripción del problema:**

Cuando se completa un partido de eliminatoria (ej: un cuarto de final), el ganador debe avanzar automáticamente a la siguiente ronda. Esto implica:

1. Registrar el winner_id en el bracket del slot actual
2. Asignar ese ganador como team1_id o team2_id en el slot de la siguiente ronda
3. Cuando AMBOS equipos de un slot de la siguiente ronda están definidos, actualizar el partido correspondiente en tournament_matches con los team_ids y cambiar su status a 'scheduled'

Este flujo debe funcionar recursivamente: cuartos → semis → final. Y también para octavos → cuartos → semis → final.

**Lo que necesito que investigues:**

1. Busca en TODOS los archivos qué pasa DESPUÉS de guardar el resultado de un partido de eliminatoria. El flujo es:
   - El organizador registra resultado en la página de marcadores → se llama a la función de guardar
   - ¿Hay código que detecta que el partido es de eliminatoria (phase !== 'group_phase')?
   - ¿Hay código que busca el slot del bracket correspondiente y actualiza winner_id?
   - ¿Hay código que busca el slot de la siguiente ronda y asigna el ganador?
   - ¿Hay código que cuando ambos teams del siguiente slot están definidos, actualiza el partido en tournament_matches?

2. La lógica de posicionamiento debe ser:
   - Slot actual: round_number=R, position=P
   - Siguiente slot: round_number=R+1, position=ceil(P/2)
   - Si P es impar → el ganador va como team1_id del siguiente slot
   - Si P es par → el ganador va como team2_id del siguiente slot

3. Verifica que cuando el partido es la FINAL y se completa:
   - No intenta buscar siguiente ronda (no hay)
   - Verifica si TODAS las categorías del torneo completaron su eliminatoria
   - Si sí → UPDATE tournaments SET status = 'finished'

4. Verifica que la página de marcadores hace refetch después de guardar un resultado de eliminatoria, para que los nuevos partidos con equipos asignados aparezcan inmediatamente.

5. Verifica que los partidos de rondas posteriores (semis, final) que ya tienen cancha/fecha/hora asignada desde el inicio del torneo, solo necesitan el UPDATE de team1_id, team2_id y status. NO deben cambiar su court_id, scheduled_date ni scheduled_time.

**Validaciones del tester:**

- [ ] Buscar en ScoreboardPage.jsx o scorePersistence.js la lógica post-resultado de eliminatoria
- [ ] ¿Existe código que actualiza tournament_bracket.winner_id? Sí/No
- [ ] ¿Existe código que avanza el ganador al siguiente round? Sí/No
- [ ] ¿Existe código que actualiza tournament_matches del siguiente round cuando ambos teams están definidos? Sí/No
- [ ] Si alguno de los 3 anteriores es NO → reportar como FALLO CRÍTICO indicando cuál falta
- [ ] Verificar la lógica de posicionamiento: position impar → team1, position par → team2
- [ ] Verificar que la final no intenta buscar siguiente ronda
- [ ] Verificar que hay refetch después de guardar resultado de eliminatoria
- [ ] `npm run build` pasa

---

### FASE 6 — Test end-to-end completo del flujo del torneo

**status:** `DONE`
**test_notes:** `TESTER: 9 de 9 pasos verificados, 0 problemas. 13/13 tests Node pasaron + build OK. (1) Crear: CreateTournamentPage.jsx:326 inserta scoring_config, :338-357 courts+categories ✓. (2) Editar: EditTournamentForm.jsx:380-391 UPDATE solo core fields, scoring_config condicional ✓. (3) Iniciar: calculateClassification 4/4 combos correctos, round-robin n*(n-1)/2 ✓. (4) Cronograma: tournamentPersistence.js:92-131 genera TODAS rondas eliminatorias con match_id→bracket ✓. (5) Persistir: RPC SQL inserta matches+bracket, :114-117 status→active ✓. (6) Resultados grupo: scorePersistence.js:58 RPC save_match_result, :84-96 checkGroupPhaseComplete ✓. (7) Clasificación: ScoreboardPage.jsx:172-178 → processGroupPhaseCompletion → sync bracket→matches ✓. (8) Eliminatoria: ScoreboardPage.jsx:188-216 advanceBracketWinner posición impar→team1, par→team2, sync matches ✓. (9) Final: checkAllCategoriesComplete marca finished si 0 pendientes ✓.`

**Descripción del problema:**

Esta fase no es de corrección sino de VERIFICACIÓN. Necesito que se recorra todo el código del flujo completo del torneo y se confirme que cada paso está correctamente implementado y conectado con el siguiente.

**Lo que necesito que investigues:**

Recorre CADA paso del flujo y confirma que el código existe y funciona:

1. **Crear torneo:**
   - ¿scoring_config se guarda al crear?
   - ¿Categorías y canchas se guardan correctamente?

2. **Editar torneo:**
   - ¿Se pueden editar campos sin perder scoring_config?
   - ¿Se pueden editar campos sin perder categorías ni canchas?

3. **Iniciar torneo (configurar grupos):**
   - ¿El formulario lee scoring_config correctamente?
   - ¿calculateClassification retorna valores correctos para diferentes combinaciones?
   - ¿Se generan todos los partidos de grupo?

4. **Generar cronograma:**
   - ¿Se generan partidos de TODA la eliminatoria (todas las rondas)?
   - ¿Se distribuyen sin conflictos entre categorías?
   - ¿Los de eliminatoria tienen cancha/fecha/hora pero no teams?
   - ¿Se vinculan al bracket?

5. **Persistir torneo:**
   - ¿Se insertan en tournament_matches los de grupo Y los de eliminatoria?
   - ¿Se actualiza tournament_bracket.match_id?
   - ¿Se actualiza tournaments.status a 'active'?

6. **Registrar resultados de grupo:**
   - ¿Se actualiza tournament_matches con score y winner?
   - ¿Se actualizan estadísticas en tournament_group_members?
   - ¿Se detecta cuando todos los partidos de grupo de una categoría están completados?

7. **Clasificación automática:**
   - ¿Se ejecuta automáticamente al completar el último partido de grupo?
   - ¿Se rankean los grupos correctamente?
   - ¿Se seleccionan la cantidad correcta de mejores N-ésimos?
   - ¿Se actualiza tournament_bracket con team_ids?
   - ¿Se actualiza tournament_matches de la primera ronda con team_ids y status='scheduled'?

8. **Registrar resultados de eliminatoria:**
   - ¿Se detecta que es un partido de eliminatoria?
   - ¿Se actualiza tournament_bracket.winner_id?
   - ¿Se avanza el ganador al siguiente slot?
   - ¿Se actualiza el partido de la siguiente ronda cuando ambos teams están?
   - ¿Se detecta cuando la final se completa?

9. **Finalización:**
   - ¿Se verifica si todas las categorías terminaron?
   - ¿Se actualiza tournaments.status a 'finished'?

**Validaciones del tester:**

Para cada uno de los 9 pasos, verificar en el código:
- [ ] Paso 1 (crear torneo): scoring_config se inserta — confirmar
- [ ] Paso 2 (editar): UPDATE no sobreescribe scoring_config — confirmar
- [ ] Paso 3 (iniciar): calculateClassification funciona — confirmar con tests
- [ ] Paso 4 (cronograma): TODOS los partidos de eliminatoria se generan — confirmar
- [ ] Paso 5 (persistir): tournament_matches + tournament_bracket vinculados — confirmar
- [ ] Paso 6 (resultados grupo): stats se actualizan, detección de completado — confirmar
- [ ] Paso 7 (clasificación): bracket Y matches se actualizan — confirmar
- [ ] Paso 8 (resultados eliminatoria): progresión bracket funciona — confirmar
- [ ] Paso 9 (final): torneo se marca finished — confirmar

Para cada paso que NO esté implementado o esté roto, listar exactamente:
- Qué archivo y qué línea tiene el problema
- Qué falta o qué está mal

- [ ] `npm run build` pasa
- [ ] El resumen final debe indicar: "X de 9 pasos funcionan correctamente, Y pasos tienen problemas: [lista]"

---

## ESTADO GLOBAL DE LA TAREA

| Fase | Descripción | Status | Test Notes |
|------|-------------|--------|------------|
| Fase 1 | Bug scoring_config se pierde al editar | `DONE` | All checks passed |
| Fase 2 | Auditoría flujo de edición | `DONE` | All checks passed |
| Fase 3 | Estabilización cronograma completo | `DONE` | 16/16 tests passed |
| Fase 4 | Clasificación auto + actualización eliminatoria | `DONE` | All validations passed |
| Fase 5 | Progresión bracket cuartos→semis→final | `DONE` | All 6 checks passed |
| Fase 6 | Test end-to-end completo | `DONE` | 9/9 steps verified by tester |