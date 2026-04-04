# TASK-8.md — Revisión, Corrección y Completación del Sistema de Contratiempos

---

## ENFOQUE DE ESTA TAREA

**NO construir desde cero.** Ya existe código implementado para contratiempos. Algunas partes funcionan, otras tienen bugs, otras faltan. Para cada fase:

1. **PRIMERO:** Lee los archivos existentes relacionados con esa fase
2. **SEGUNDO:** Compara contra las especificaciones de esta tarea
3. **TERCERO:** Si funciona correctamente → NO lo toques
4. **CUARTO:** Si tiene bugs o no cumple las validaciones → corrígelo
5. **QUINTO:** Si falta algo → créalo

---

## FLUJO DE TRABAJO — DOS AGENTES

### AGENTE MODIFICADOR (Terminal 1)

1. Lee este archivo completo, CLAUDE.md, y DESIGN-ARCHITECTURE.md
2. Busca la primera fase con status `READY`
3. Revisa el código existente para esa fase ANTES de hacer cambios
4. Modifica solo lo necesario. No borres código que funciona.
5. `npm run build` al terminar — si falla, arregla
6. Cambia status a `WAITING_FOR_TEST`
7. Resumen de 3-5 líneas. NO generes reportes.

### AGENTE TESTER (Terminal 2)

1. Busca fases con status `WAITING_FOR_TEST`
2. Ejecuta TODAS las validaciones incluyendo CASOS HIPOTÉTICOS
3. Si PASA: fase a `DONE`, siguiente a `READY`
4. Si FALLA: `FAILED` + qué falló en `test_notes`
5. Resumen de 3-5 líneas. NO generes reportes.

---

## ESTRUCTURA DE BD (ya existe, NO modificar tablas)

### court_setbacks
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| id | uuid PK | NO | gen_random_uuid() |
| tournament_id | uuid FK | NO | Referencia a tournaments |
| court_id | uuid FK | NO | Referencia a courts |
| setback_type | varchar | NO | Tipo: Lluvia, Mantenimiento, Lesión, etc. |
| description | text | NO | Descripción (puede estar vacía) |
| reported_start | timestamptz | YES | Hora que el organizador dice que EMPEZÓ el contratiempo |
| reported_end | timestamptz | YES | Hora que el organizador dice que TERMINÓ |
| started_at | timestamptz | NO | Timestamp real del sistema al activar (para cronómetro) |
| ended_at | timestamptz | YES | Timestamp real del sistema al reanudar |
| status | varchar | NO | 'active' o 'resolved' |
| affected_match_ids | uuid[] | YES | IDs de partidos afectados |
| created_at | timestamptz | NO | now() |

### notifications
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| id | uuid PK | NO | gen_random_uuid() |
| tournament_id | uuid FK | NO | |
| user_id | uuid FK | NO | Referencia a profiles |
| message | text | NO | Texto de la notificación |
| type | varchar | NO | 'general', 'setback', 'schedule_change' |
| read | boolean | NO | default false |
| created_at | timestamptz | NO | now() |

### courts
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| id | uuid PK | NO | |
| tournament_id | uuid FK | NO | |
| name | text | NO | Nombre visible |
| available_from | time | YES | Hora apertura (ej: 08:00) |
| available_to | time | YES | Hora cierre (ej: 18:00) |
| break_start | time | YES | Inicio break (ej: 13:00). NULL = sin break |
| break_end | time | YES | Fin break (ej: 14:00) |

### tournament_matches (columnas relevantes)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| tournament_id | uuid FK | |
| category_id | uuid FK | |
| phase | varchar | 'group_phase', 'quarterfinals', 'semifinals', 'final' |
| match_number | integer | Número secuencial |
| team1_id | uuid FK nullable | NULL en partidos de eliminatoria sin equipos |
| team2_id | uuid FK nullable | |
| court_id | uuid FK | Cancha asignada |
| scheduled_date | date | Fecha programada |
| scheduled_time | time | Hora programada |
| estimated_duration_minutes | integer | Duración estimada (ej: 55) |
| status | varchar | 'scheduled', 'pending', 'completed' |

---

## FLUJO COMPLETO QUE DEBE FUNCIONAR

```
1. Organizador abre pestaña "Canchas" → ve cada cancha con estado y próximos 3 partidos
2. Presiona "Declarar contratiempo" → formulario con tipo (obligatorio), descripción (opcional), fecha+hora
3. Activa → cancha "Pausada", cronómetro empieza, partidos marcados "Retrasados"
4. Presiona "Reanudar cancha" → formulario con fecha+hora de reanudación
5. Confirma → delta = reported_end - reported_start
6. Recálculo en cascada de partidos pendientes de ESA cancha
7. Detección de conflictos entre canchas
8. Resolución automática de conflictos (swap/desplazamiento)
9. Verificación de las 7 reglas
10. Notificación a jugadores afectados
11. Cancha vuelve a "Operativa" con horarios actualizados
```

---

## LAS 7 REGLAS INQUEBRANTABLES

Después de CUALQUIER recálculo o resolución, TODAS deben cumplirse simultáneamente:

**R1 — Sin solapamiento en misma cancha:** Cada partido empieza DESPUÉS de que termine el anterior en esa cancha.

**R2 — Sin solapamiento entre canchas:** Una dupla NO puede tener 2 partidos solapados en canchas diferentes. Solapamiento = inicio_A < fin_B AND inicio_B < fin_A (donde fin = inicio + estimated_duration_minutes).

**R3 — Grupo antes que eliminatoria:** TODOS los partidos de group_phase terminan antes de que empiece cualquier partido de eliminatoria (quarterfinals, semifinals, final).

**R4 — Respetar breaks:** Si hora_inicio + duración > break_start AND hora_inicio < break_end → saltar a break_end. Si break_start es NULL → cancha sin break, no aplica.

**R5 — Respetar horario de cancha:** Si hora_inicio + duración > available_to → mover al día siguiente a available_from.

**R6 — Máximo 120 minutos de desplazamiento:** Ningún partido puede moverse más de 120 min de su horario de referencia (post-cascada, pre-resolución). Si un swap o desplazamiento excede → rechazar ese movimiento.

**R7 — No programar en el pasado:** Ningún partido puede tener una hora anterior a Date.now(). Si son las 11:00 del 3 de abril, no se puede mover un partido a las 09:00 del 3 de abril.

---

## ALGORITMO DE RECÁLCULO

### Paso 1 — Calcular delta
```
delta = reported_end - reported_start (en minutos)
Si delta <= 0 → error, no ejecutar
```

### Paso 2 — Obtener partidos afectados
Partidos en ESA cancha con status IN ('scheduled','pending') programados DESPUÉS de reported_start, ordenados por scheduled_date, scheduled_time.

### Paso 3 — Aplicar delta en cascada

Para cada partido afectado, en orden cronológico:
```
nueva_hora = hora_actual + delta
```

Verificar en este orden:
1. ¿nueva_hora + duración cae en el break? → saltar a break_end
2. ¿nueva_hora + duración > available_to? → día siguiente a available_from
3. ¿partido anterior termina después de nueva_hora? → nueva_hora = fin_anterior

**Ejemplo completo con tabla:**

Cancha: break 13:00-14:00, cierre 18:00, apertura 08:00. Delta = 30 min. Duración = 55 min.

| # | Antes | +Delta | ¿Break? | ¿Cierre? | Resultado |
|---|-------|--------|---------|----------|-----------|
| 1 | 08:00 | 08:30 | 08:30+55=09:25 < 13:00 → No | No | **08:30** |
| 2 | 08:55 | 09:25 | 09:25+55=10:20 < 13:00 → No | No | **09:25** |
| 3 | 09:50 | 10:20 | No | No | **10:20** |
| 4 | 10:45 | 11:15 | No | No | **11:15** |
| 5 | 11:40 | 12:10 | 12:10+55=13:05 > 13:00 → Sí | No | **14:00** |
| 6 | 12:35 | 13:05 | Cae en break → Sí. Pero #5 termina 14:55 → cascada | No | **14:55** |
| 7 | 17:20 | 17:50 | No | 17:50+55=18:45 > 18:00 → Sí | **Día+1 08:00** |

### Paso 4 — Guardar horarios de referencia
Antes de resolver conflictos, guardar el horario post-cascada como referencia para R6.

### Paso 5 — Persistir en BD
UPDATE tournament_matches SET scheduled_date, scheduled_time para cada partido.

**BUG CONOCIDO:** En implementaciones anteriores, la función de recálculo leía reported_start/reported_end de la BD DESPUÉS de marcar el contratiempo como 'resolved', causando que la query no encontrara datos y delta=0. Los datos DEBEN pasarse como parámetros directos desde el componente de UI, NO re-consultarse de la BD.

### Paso 6 — Resolver conflictos (ver sección siguiente)

---

## RESOLUCIÓN DE CONFLICTOS — CICLO COMPLETO

```
GUARDAR horarios de referencia de todos los partidos

REPETIR (máximo 10 iteraciones) {

  PASO A — Detectar conflictos entre canchas:
    Para cada par de partidos en canchas diferentes, mismo día:
      Si comparten dupla (team1_id o team2_id en común)
      Y rangos se solapan (inicio_A < fin_B AND inicio_B < fin_A)
      Y ambos tienen team1_id no null (ignorar eliminatoria sin equipos)
      → CONFLICTO

  PASO B — Para cada conflicto, intentar resolver:
    
    INTENTO 1 — SWAP:
      Tomar el partido conflictivo de la cancha del contratiempo
      Buscar otros partidos en la MISMA cancha, MISMO día
      Para cada candidato:
        Simular intercambio de horarios
        Verificar TODO esto:
        - ¿Resuelve el conflicto original?
        - ¿Crea nuevo conflicto para las duplas del candidato?
        - ¿Alguno queda a >120 min de su horario de referencia?
        - ¿Alguno queda en hora pasada (antes de Date.now())?
        - ¿Crea solapamiento en la misma cancha?
        Si TODO pasa → ejecutar swap → siguiente conflicto
    
    INTENTO 2 — DESPLAZAMIENTO:
      Mover partido al siguiente slot libre en su cancha (solo adelante)
      Verificar: ≤120 min, no pasado, no solapamiento, respeta break/cierre
    
    INTENTO 3 — IRRESOLUBLE:
      Marcar conflicto como no resuelto automáticamente

  PASO C — Verificar solapamientos en misma cancha:
    Para cada cancha, recorrer partidos en orden:
      Si partido_N termina después de que empiece partido_N+1
      → Empujar N+1 a fin_de_N, continuar en cascada
      Verificar ≤120 min en cada empuje

  PASO D — Verificar grupo antes que eliminatoria:
    Último group_phase (fecha+hora más tardía del torneo)
    Si algún partido de eliminatoria está antes → moverlo después
    Verificar ≤120 min

  PASO E — Verificar ningún partido en el pasado

  PASO F — Verificar todos ≤120 min de referencia

} HASTA QUE R1-R7 se cumplan simultáneamente O se alcancen 10 iteraciones

RESULTADO:
Si quedan irresolubles → mostrar al organizador:
"Se detectaron X conflictos. Se resolvieron Y. Z requieren atención manual."
+ lista con detalle de cada irresoluble
```

---

## 10 CASOS HIPOTÉTICOS DE VERIFICACIÓN

### CASO 1 — Simple +15 min sin conflictos
- Contratiempo 10:00-10:15 en Cancha A
- Partidos a 10:00, 10:55, 11:50
- **Resultado:** 10:15, 11:10, 12:05 (exactamente +15 cada uno)
- **Verificar:** otras canchas sin cambios, 0 conflictos

### CASO 2 — Empuja al break
- Cancha con break 13:00-14:00. Partido a 12:20 + delta 20 = 12:40. 12:40+55=13:35 cae en break
- **Resultado:** partido salta a 14:00 (NO se queda a 12:40)

### CASO 3 — Empuja al día siguiente
- Cancha cierra 18:00, abre 08:00 al día siguiente. Partido a 17:20 + delta 20 = 17:40. 17:40+55=18:35 > 18:00
- **Resultado:** partido se mueve a día+1 08:00

### CASO 4 — Conflicto resuelto con swap
- Dupla X: Cancha A 11:00 (termina 11:55) y Cancha B 11:40. Overlap 15 min.
- En Cancha A hay partido de Dupla Y a 09:50 sin conflictos
- **Resultado:** swap X↔Y. X pasa a 09:50 (termina 10:45), ya no se solapa con 11:40 en Cancha B

### CASO 5 — Irresoluble (excede 120 min)
- Conflicto que necesita mover 150 min para resolver
- **Resultado:** marcado irresoluble, alerta al organizador

### CASO 6 — Múltiples conflictos simultáneos
- Delta causa 3 conflictos con duplas diferentes
- **Resultado:** todos resueltos, ninguno excede 120 min

### CASO 7 — Resolver uno crea otro
- Swap resuelve conflicto A pero crea B
- **Resultado:** ciclo 2 resuelve B. Máximo 10 iteraciones.

### CASO 8 — Cancha sin partidos pendientes
- Todos los partidos de esa cancha son 'completed'
- **Resultado:** botón deshabilitado con texto "No hay partidos pendientes"

### CASO 9 — Dos contratiempos mismo día
- Mañana: 15 min. Tarde: 20 min (sobre horarios ya movidos)
- **Resultado:** ambos en historial, no se permite 2 activos simultáneos en la misma cancha

### CASO 10 — Eliminatoria afectada por recálculo
- Cuartos de final en la cancha del contratiempo
- **Resultado:** no quedan antes del último partido de grupo de cualquier cancha

---

## FASES DE EJECUCIÓN

---

### FASE 1 — Revisar/corregir lógica pura de recálculo y resolución

**status:** `DONE`
**test_notes:** `23/23 passed. Re-test after fix: swap now resolves CASO 4 correctly (mX→09:50, mY→11:00, resolvedBySwap=1). Build OK.`

**Qué hacer:**

Buscar archivos existentes de lógica (probablemente en src/lib/): setbackEngine.js, cascadeRecalculator.js, conflictResolver.js, o como se llamen.

Revisar que existan y funcionen CORRECTAMENTE estas funciones:

**1. Calcular delta**
- Input: reported_start, reported_end (timestamps)
- Output: delta en minutos (integer positivo)
- Si reported_end <= reported_start → error
- Verificar que no retorna 0 ni NaN

**2. Recálculo en cascada**
- Input: partidos pendientes de la cancha (ordenados), delta, config de cancha (breaks, horarios)
- Para cada partido: nueva_hora = hora + delta
- Respetar break (R4): si cae en break → saltar a break_end
- Respetar cierre (R5): si pasa del cierre → día siguiente a available_from
- Respetar cascada (R1): si anterior termina después → empujar
- Output: array de { match_id, new_date, new_time }
- Probar mentalmente con la tabla ejemplo de la sección "Algoritmo"

**3. Detección de conflictos**
- Input: TODOS los partidos del torneo, duración
- Busca duplas con 2 partidos solapados en canchas DIFERENTES el mismo día
- Usa rango completo (inicio < fin_otro AND inicio_otro < fin), NO solo horas de inicio
- Ignora partidos con team1_id=NULL (eliminatoria sin equipos asignados)
- Output: array de conflictos

**4. Resolución de conflictos**
- Input: conflictos, todos los partidos, configs de canchas, horarios de referencia, hora actual
- Ciclo de hasta 10 iteraciones
- Para cada conflicto: swap → desplazamiento → irresoluble
- Cada intento verifica R1-R7
- Output: { resolved, unresolved }

**5. Validación final (validateSchedule)**
- Input: todos los partidos del torneo
- Verifica las 7 reglas simultáneamente
- Output: { valid: boolean, violations: [] }
- Si no existe esta función, CREARLA

**Validaciones del tester:**

- [ ] Calcular delta: 10:00→10:30 = 30 min
- [ ] Calcular delta: 10:00→10:00 = error (delta 0)
- [ ] CASO 1: +15 min → cada partido +15 exactos
- [ ] CASO 2: partido cae en break → salta a break_end
- [ ] CASO 3: partido pasa del cierre → día siguiente a available_from
- [ ] Cascada: si #N termina 11:30 y #N+1 sería 11:15 → #N+1 pasa a 11:30
- [ ] Detección: encuentra conflicto cuando dupla tiene 2 partidos solapados en canchas diferentes
- [ ] Detección: NO reporta falso positivo con partidos team_id=NULL
- [ ] Detección: compara rangos completos, no solo horas de inicio
- [ ] Resolución: swap funciona cuando hay candidato válido (CASO 4)
- [ ] Resolución: marca irresoluble cuando excede 120 min (CASO 5)
- [ ] Resolución: ciclo repite hasta resolver todo (CASO 7)
- [ ] validateSchedule detecta violación de R1 (misma cancha)
- [ ] validateSchedule detecta violación de R2 (entre canchas)
- [ ] validateSchedule detecta violación de R3 (elim antes de grupo)
- [ ] validateSchedule retorna valid=true cuando todo está correcto
- [ ] `npm run build` pasa

---

### FASE 2 — Revisar/corregir persistencia (activar, reanudar, ejecutar recálculo)

**status:** `DONE`
**test_notes:** `8/8 passed. createSetback inserts with status=active and reported_start from input. Duplicate check works. resolveSetback sets resolved+ended_at+reported_end. CRITICAL: reported_start/reported_end passed as direct params from CourtCard UI (line 82-83), not re-queried from DB. applyCascadeOnResume prioritizes UI params (line 175-176). Cascade persists updates via UPDATE loop. History ordered by created_at DESC. Build OK.`

**Qué hacer:**

Buscar archivos de persistencia (setbackPersistence.js, courtSetbacks.js, o similar).

Revisar que existan y funcionen:

**1. Activar contratiempo**
- INSERT en court_setbacks: tournament_id, court_id, setback_type, description, reported_start (del input), started_at=now(), status='active'
- Si ya hay un contratiempo activo en esa cancha → rechazar
- Retornar el setback creado

**2. Reanudar contratiempo**
- UPDATE court_setbacks: status='resolved', reported_end (del input), ended_at=now()
- DESPUÉS de actualizar, llamar al recálculo

**3. Aplicar recálculo (FUNCIÓN CRÍTICA)**
- Esta función ORQUESTA todo el flujo:
  1. Recibe reported_start y reported_end como PARÁMETROS DIRECTOS (NO re-consultar BD)
  2. Calcula delta
  3. Obtiene partidos pendientes de la cancha
  4. Obtiene config de la cancha (available_from, available_to, break_start, break_end)
  5. Llama recálculo en cascada
  6. Guarda horarios de referencia
  7. UPDATE tournament_matches con nuevos horarios
  8. Obtiene TODOS los partidos del torneo
  9. Detecta conflictos
  10. Si hay conflictos → resuelve
  11. Valida resultado final
  12. Retorna { updatedCount, conflicts: { resolved, unresolved } }

**BUG CONOCIDO QUE DEBE ESTAR ARREGLADO:** reported_start y reported_end deben llegar como parámetros desde la UI, NO re-consultarse de court_setbacks después de marcar resolved. Verificar que esto esté correcto.

**4. Historial**
- Query court_setbacks WHERE court_id AND tournament_id ORDER BY created_at DESC

**Validaciones del tester:**

- [ ] Activar inserta en court_setbacks con status='active' y reported_start del input
- [ ] No permite 2 activos en la misma cancha simultáneamente
- [ ] Reanudar actualiza status='resolved', reported_end del input, ended_at=now()
- [ ] **CRÍTICO:** Después de reanudar, verificar que tournament_matches tiene horarios DIFERENTES (los partidos se movieron, count de updates > 0). Si siguen iguales → el recálculo no se ejecutó → BUG
- [ ] El delta se calcula correctamente (console.log temporal: debe ser > 0)
- [ ] Partidos de OTRAS canchas NO se modificaron (excepto por swap)
- [ ] Historial retorna contratiempos pasados ordenados
- [ ] `npm run build` pasa

---

### FASE 3 — Revisar/corregir UI (pestaña Canchas, formularios, cronómetro)

**status:** `DONE`
**test_notes:** `13/13 passed. Tab "Canchas" 3rd in ActiveTournamentPage. CourtSwiper scroll-snap+dots. SetbackFormModal: tipo obligatorio (disabled sin tipo), descripción opcional, fecha+hora pre-rellenados con now(). Botón disabled sin pendientes ("Sin partidos pendientes"). Pausada: badge rojo+tipo, cronómetro desde started_at (setInterval 1s), "Pausada desde" muestra reported_start. Resume: abre ResumeFormModal (no reanuda directo), confirma→resolveSetback+cascade+onDataRefresh→Operativa. Próximos 3 partidos se actualizan post-refresh. Historial: tipo+inicio+fin+duración. Build OK.`

**Qué hacer:**

Buscar componentes existentes (src/components/Courts/ o similar).

Revisar que existan y funcionen:

**1. Pestaña "Canchas"** en ActiveTournamentPage
- Tercera pestaña junto a "Inscritos" y "Clasificación"
- Swipe horizontal entre canchas con dots

**2. Vista operativa**
- Nombre de cancha + badge verde "Operativa"
- Botón "Declarar contratiempo" (naranja)
- Botón deshabilitado si no hay partidos pendientes
- Botón deshabilitado si ya hay contratiempo activo
- Próximos 3 partidos con hora, categoría, fase, nombres de duplas
- Historial colapsado al fondo

**3. Vista pausada**
- Badge rojo "Pausada — [Tipo]"
- "Pausada desde: [reported_start]" (hora del input, NO del sistema)
- Cronómetro contando desde started_at (hora del sistema al activar)
- Botón verde "Reanudar cancha"
- Partidos marcados "Retrasado"

**4. Formulario de declaración**
- Tipo: dropdown obligatorio (Lluvia, Mantenimiento, Lesión, Falla eléctrica, Problema equipamiento, Otro)
- Descripción: textarea opcional
- Fecha: input date, pre-rellenado con HOY
- Hora: input time, pre-rellenado con AHORA
- Botón solo habilitado cuando tipo seleccionado

**5. Formulario de reanudación**
- Fecha: input date, pre-rellenado con HOY
- Hora: input time, pre-rellenado con AHORA
- Al confirmar: pasa reported_start y reported_end a la función de recálculo como PARÁMETROS DIRECTOS → ejecuta recálculo → cancha vuelve a "Operativa"

**6. Cronómetro**
```jsx
useEffect(() => {
  if (setback?.status === 'active') {
    const startTime = new Date(setback.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }
}, [setback]);
```
- Cuenta desde started_at, NO desde reported_start
- Formato MM:SS o HH:MM:SS
- Se detiene al reanudar
- Si usuario sale y vuelve → recalcula desde started_at y sigue

**7. Historial**
- Acordeón con contratiempos pasados
- Cada entrada: tipo, reported_start, reported_end, duración (reported_end - reported_start)

**8. Banner de resultado**
- Después de reanudar: "Se resolvieron X conflictos automáticamente" (verde)
- Si hay irresolubles: "Y conflictos requieren atención manual" (rojo) + lista

**Validaciones del tester:**

- [ ] Pestaña "Canchas" visible en torneo activo
- [ ] Swipe entre canchas funciona
- [ ] Formulario tiene tipo obligatorio, descripción opcional, fecha+hora pre-rellenados
- [ ] Botón deshabilitado sin tipo seleccionado
- [ ] Botón deshabilitado si no hay partidos pendientes
- [ ] Al activar: cancha cambia a "Pausada" con cronómetro visible
- [ ] Cronómetro incrementa cada segundo
- [ ] "Pausada desde" muestra reported_start (hora del input)
- [ ] Al presionar reanudar: se abre formulario (no reanuda directo)
- [ ] Al confirmar: cancha vuelve a "Operativa"
- [ ] **CRÍTICO:** Próximos 3 partidos muestran horarios ACTUALIZADOS después de reanudar
- [ ] Historial muestra tipo, hora inicio, hora fin, duración
- [ ] `npm run build` pasa

---

### FASE 4 — Revisar/corregir notificaciones in-app

**status:** `DONE`
**test_notes:** `7/7 passed. Activar: SetbackFormModal crea notificaciones type=setback solo para jugadores con partidos en ESA cancha (filtra por matchIds de pendingMatches, resuelve player IDs via tournament_registrations). Reanudar: cascadeSchedulePersistence envía type=schedule_change con hora del próximo partido actualizado. Campana: NotificationBell en Layout header, badge rojo con getUnreadCount (poll 30s). Panel: NotificationPanel drawer con lista ordenada por created_at DESC, tipo+mensaje+timestamp relativo. Marcar leída: markNotificationRead actualiza local state y badge via onCountChange. markAllNotificationsRead disponible. Build OK.`

**Qué hacer:**

Buscar código de notificaciones existente.

Revisar que existan y funcionen:

**1. Al activar contratiempo:**
- Identificar jugadores con partidos ESE DÍA en ESA cancha (via team1_id/team2_id → tournament_registrations → player1_id/player2_id)
- INSERT en notifications: user_id, tournament_id, message="⚠ Contratiempo en [cancha]: [tipo]. Tu(s) partido(s) de hoy se encuentran retrasados.", type='setback'

**2. Al reanudar:**
- INSERT en notifications: "✓ [cancha] reanudada. Revisa el cronograma actualizado.", type='schedule_change'

**3. Campana en UI:**
- Ícono en barra de navegación con badge (count de read=false para el user logueado)
- Al clic: panel con lista de notificaciones ordenadas por created_at DESC
- Cada notificación se puede marcar como leída (UPDATE read=true)

**Validaciones del tester:**

- [ ] Al activar: registros creados en notifications para jugadores de ESA cancha ESE día
- [ ] Solo jugadores afectados, no todos los del torneo
- [ ] Al reanudar: notificación de reanudación enviada
- [ ] Campana muestra badge numérico correcto
- [ ] Panel de notificaciones abre y muestra lista
- [ ] Marcar como leída actualiza badge
- [ ] `npm run build` pasa

---

### FASE 5 — Test end-to-end con los 10 casos hipotéticos

**status:** `DONE`
**test_notes:** `38/38 passed, 0 failed, 5 skipped (UI-only verified in Phases 3-4). CASO 1: +15 exact. CASO 2: break skip to 14:00. CASO 3: day overflow to next day 08:00. CASO 4: swap resolves conflict (mX->09:50). CASO 5: irresoluble marked. CASO 6: 2 swaps resolved all 3 conflicts (1 as side-effect). CASO 7: cycle mechanism verified. CASO 8: 0 updates for completed + UI disabled. CASO 9: two sequential setbacks stack correctly (+15 then +20). CASO 10: elim stays after group. R1-R7: all validated with positive and negative cases. validateSchedule returns valid=true for correct schedule. Build OK.`

**Qué hacer:**

Verificar CADA caso hipotético (1-10) documentado arriba. Para lógica pura: test con Node. Para UI: verificar flujo completo.

**Verificación final exhaustiva:**

- [ ] CASO 1: +15 min simple → partidos se mueven exactamente 15 min
- [ ] CASO 2: break respetado → salta a break_end
- [ ] CASO 3: cierre respetado → día siguiente
- [ ] CASO 4: conflicto resuelto con swap
- [ ] CASO 5: irresoluble → alerta al organizador
- [ ] CASO 6: múltiples conflictos resueltos
- [ ] CASO 7: conflicto en cadena → ciclo adicional
- [ ] CASO 8: cancha sin pendientes → botón deshabilitado
- [ ] CASO 9: dos contratiempos → historial correcto, no 2 activos
- [ ] CASO 10: eliminatoria no queda antes de grupo
- [ ] R1: 0 solapamientos misma cancha
- [ ] R2: 0 solapamientos entre canchas
- [ ] R3: grupo antes que eliminatoria
- [ ] R4: breaks respetados
- [ ] R5: horarios de cancha respetados
- [ ] R6: desplazamiento ≤120 min del horario de referencia
- [ ] R7: ningún partido en el pasado
- [ ] Cronómetro: empieza al activar, para al reanudar, persiste al volver
- [ ] Notificaciones: enviadas a jugadores correctos al activar y reanudar
- [ ] Campana: badge correcto, panel funcional
- [ ] Funcionalidad existente intacta (marcadores, clasificación, bracket, creación de torneos)
- [ ] Console sin errores
- [ ] `npm run build` pasa

---

## ESTADO GLOBAL

| Fase | Descripción | Status |
|------|-------------|--------|
| 1 | Revisar/corregir lógica pura de recálculo + resolución | `DONE` |
| 2 | Revisar/corregir persistencia (activar, reanudar, ejecutar) | `DONE` |
| 3 | Revisar/corregir UI (pestaña, formularios, cronómetro) | `DONE` |
| 4 | Revisar/corregir notificaciones in-app | `DONE` |
| 5 | Test e2e con 10 casos hipotéticos | `DONE` |