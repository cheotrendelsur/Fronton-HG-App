# TASK-9.md — Fechas Flexibles, Horarios por Día de Semana y Categorías Predeterminadas

---

## FLUJO DE TRABAJO — DOS AGENTES

### AGENTE MODIFICADOR (Terminal 1)

1. Lee este archivo completo, CLAUDE.md, y DESIGN-ARCHITECTURE.md
2. Busca la primera fase con status `READY`
3. Revisa el código existente ANTES de hacer cambios
4. Ejecuta `npm run build` al terminar
5. Cambia status a `WAITING_FOR_TEST`
6. Resumen de 3-5 líneas. NO generes reportes.

### AGENTE TESTER (Terminal 2)

1. Busca fases con status `WAITING_FOR_TEST`
2. Ejecuta TODAS las validaciones listadas
3. Si PASA: fase a `DONE`, siguiente a `READY`
4. Si FALLA: `FAILED` + qué falló en `test_notes`
5. Resumen de 3-5 líneas. NO generes reportes.

---

## CONTEXTO ACTUAL

- Torneo se define con `start_date` y `end_date` → días consecutivos obligatorios
- Canchas tienen horario fijo: `available_from`, `available_to`, `break_start`, `break_end` → aplica igual TODOS los días
- Categorías se crean con nombre libre manual

## QUÉ CAMBIA

1. **Fechas del torneo** → calendario interactivo donde se seleccionan días específicos (pueden ser no consecutivos)
2. **Horarios de canchas** → dependen del día de la semana (lunes diferente a sábado, etc.)
3. **Categorías** → opciones predeterminadas del frontón (Masculina 7ª-1ª, Femenina 7ª-1ª, Máster, Junior)

---

## CAMBIOS EN LA BASE DE DATOS

### SQL para ejecutar en Supabase ANTES de empezar

```sql
-- ============================================================
-- TASK-9: Nuevas tablas y modificaciones
-- ============================================================

-- 1. Tabla de días activos del torneo
CREATE TABLE tournament_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  day_date date NOT NULL,
  day_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, day_date)
);

-- 2. Tabla de horarios de cancha por día de la semana
CREATE TABLE court_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado
  available_from time NOT NULL,
  available_to time NOT NULL,
  break_start time,
  break_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(court_id, day_of_week)
);

-- 3. RLS policies
ALTER TABLE tournament_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tournament_days" ON tournament_days FOR SELECT USING (true);
CREATE POLICY "Organizers can manage tournament_days" ON tournament_days FOR ALL USING (true);

ALTER TABLE court_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read court_schedules" ON court_schedules FOR SELECT USING (true);
CREATE POLICY "Organizers can manage court_schedules" ON court_schedules FOR ALL USING (true);
```

### Tablas existentes que NO se modifican estructuralmente

- `tournaments` → se MANTIENEN `start_date` y `end_date`. Se calculan automáticamente como MIN y MAX de tournament_days.
- `courts` → se MANTIENEN `available_from`, `available_to`, `break_start`, `break_end` como valores de fallback. Si no hay entrada en court_schedules para un día, se usan estos.
- `categories` → se MANTIENE igual. El campo `name` guarda el nombre generado ("Masculina Primera", "Junior", etc.)

---

## PARTE 1 — FECHAS FLEXIBLES DEL TORNEO

### UI — Calendario interactivo

En el formulario de crear/editar torneo, REEMPLAZAR los 2 inputs de fecha (inicio y fin) por:

```
┌─────────────────────────────────────────┐
│  Días del torneo *                      │
│                                         │
│       ◄  Abril 2026  ►                  │
│  ┌─────────────────────────────────┐    │
│  │ Lu  Ma  Mi  Ju  Vi  Sá  Do     │    │
│  │           1   2   3   4   5     │    │
│  │  6   7   8   9  10 [11] [12]   │    │
│  │ 13  14  15  16  17 [18] [19]   │    │
│  │ 20  21  22  23  24 [25] [26]   │    │
│  │ 27  28  29  30                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Días seleccionados: 8                  │
│  11, 12, 18, 19, 25, 26 Abril           │
│                                         │
│  Días de semana activos: Sáb, Dom       │
└─────────────────────────────────────────┘
```

**Comportamiento:**

1. Calendario visual navegable entre meses (flechas ◄ ►)
2. Cada día es un botón. Al hacer clic/tap se selecciona (resaltado con color CTA celeste #6BB3D9) o se deselecciona
3. Días pasados (anteriores a hoy) están deshabilitados y en gris
4. Debajo del calendario: lista de días seleccionados ordenados cronológicamente
5. Debajo: resumen automático de días de la semana activos (ej: "Sáb, Dom" si solo seleccionó sábados y domingos)
6. Mínimo 1 día seleccionado para avanzar al siguiente paso
7. Al navegar entre meses, los días ya seleccionados de otros meses se mantienen
8. Soporte multi-mes: el organizador puede seleccionar días de abril Y mayo si quiere

**Al guardar:**

1. INSERT en `tournament_days` un registro por cada día seleccionado, con `day_order` secuencial (1, 2, 3...)
2. UPDATE `tournaments` SET `start_date` = MIN(días seleccionados), `end_date` = MAX(días seleccionados)

**Al editar torneo (status='inscription'):**

1. Cargar días existentes de `tournament_days` y marcarlos en el calendario
2. El organizador puede agregar o quitar días
3. Al guardar: DELETE los días existentes e INSERT los nuevos (más simple que diff)

---

## PARTE 2 — HORARIOS DE CANCHAS POR DÍA DE LA SEMANA

### UI — Circulitos de día + formulario de horarios

En la sección "Canchas y Horarios" del formulario de crear/editar torneo, CADA cancha ahora muestra:

```
┌─────────────────────────────────────────┐
│  Cancha 1                           ✕   │
│  ┌─────────────────────────────────┐    │
│  │ Nombre: [Cancha Principal    ]  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Horarios por día:                      │
│                                         │
│    (Vi)  [Sá]  (Do)                     │
│                                         │
│  ── Sábado ──────────────────────       │
│  Apertura:  [08:00]                     │
│  Cierre:    [18:00]                     │
│  ☑ Tiene break                          │
│  Break de:  [12:00]  a  [13:00]         │
│                                         │
│  ☐ Aplicar a todos los días             │
│                                         │
│  Estado de configuración:               │
│  Vi: ✓  Sá: ✓  Do: ⏳                  │
└─────────────────────────────────────────┘
```

**Comportamiento detallado:**

1. **Circulitos filtrados:** Solo se muestran los días de la semana que aparecen en las fechas seleccionadas del torneo en la Parte 1. Si el organizador seleccionó solo viernes, sábados y domingos → solo aparecen (Vi), (Sá), (Do). Si seleccionó lunes a viernes → aparecen (Lu), (Ma), (Mi), (Ju), (Vi).

2. **Formato de circulitos:**
   - Círculo sin configurar: borde gris, texto gris, fondo transparente
   - Círculo seleccionado (activo para editar): borde celeste, fondo celeste, texto blanco
   - Círculo ya configurado: punto verde pequeño debajo o borde verde

3. **Al hacer clic en un circulito:** se muestran los inputs de horario para ESE día de la semana debajo de los circulitos. Los inputs son:
   - Apertura (input type="time", obligatorio)
   - Cierre (input type="time", obligatorio, debe ser > apertura)
   - Checkbox "Tiene break"
   - Si checked: Break inicio (time) y Break fin (time) — obligatorios, deben estar entre apertura y cierre
   - Los valores se guardan al cambiar de circulito o al guardar el formulario

4. **Checkbox "Aplicar a todos los días":** Al activar, copia los horarios del día actualmente seleccionado a TODOS los demás días de la semana activos. Útil cuando el horario es el mismo todos los días. Si el organizador luego modifica un día específico, el checkbox se desactiva.

5. **Estado de configuración:** Debajo de los circulitos, mostrar qué días ya tienen horarios (✓) y cuáles faltan (⏳). No se puede avanzar al siguiente paso si algún día no tiene horarios.

6. **Interacción con la Parte 1:** Si el organizador vuelve al paso de fechas y cambia los días seleccionados (agrega o quita días), los circulitos se actualizan:
   - Si se agrega un nuevo día de la semana: aparece el circulito sin configurar
   - Si se quita un día de la semana (ya no hay fechas de ese día): el circulito desaparece y se eliminan sus horarios

**Al guardar:**

Para cada cancha, para cada día de la semana configurado:
1. INSERT en `court_schedules` (court_id, day_of_week, available_from, available_to, break_start, break_end)
2. UPDATE `courts` con los valores del primer día configurado como fallback

**Ejemplo concreto:**

El organizador seleccionó fechas: 11 abril (sábado), 12 abril (domingo), 18 abril (sábado), 19 abril (domingo).

Días de la semana activos: Sábado (6) y Domingo (0).

Cancha Principal:
- Sábado: 08:00-18:00, break 12:00-13:00
- Domingo: 09:00-14:00, sin break

court_schedules tendrá:
- court_id=X, day_of_week=6, available_from=08:00, available_to=18:00, break_start=12:00, break_end=13:00
- court_id=X, day_of_week=0, available_from=09:00, available_to=14:00, break_start=NULL, break_end=NULL

---

## PARTE 3 — CATEGORÍAS PREDETERMINADAS

### UI — Selector de categorías

REEMPLAZAR el input de texto libre actual por un sistema de selección:

```
┌─────────────────────────────────────────┐
│  Categorías del torneo                  │
│                                         │
│  Tipo: *                                │
│  ┌─────────────────────────────────┐    │
│  │ Seleccionar tipo...         ▼   │    │
│  └─────────────────────────────────┘    │
│  → Masculina / Femenina / Máster / Junior│
│                                         │
│  [Si Masculina o Femenina:]             │
│  Nivel: *                               │
│  ┌─────────────────────────────────┐    │
│  │ Seleccionar nivel...        ▼   │    │
│  └─────────────────────────────────┘    │
│  → Séptima / Sexta / Quinta / Cuarta /  │
│    Tercera / Segunda / Primera          │
│                                         │
│  [Si Máster o Junior: no hay nivel]     │
│                                         │
│  Máximo de duplas: * [    ]             │
│                                         │
│  [+ Agregar categoría]                  │
│                                         │
│  ── Categorías agregadas ──             │
│  ┌─────────────────────────────────┐    │
│  │ 1. Masculina Primera   max: 16 ✕│    │
│  │ 2. Masculina Tercera   max: 12 ✕│    │
│  │ 3. Junior              max: 8  ✕│    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Comportamiento:**

1. Dropdown tipo: "Masculina", "Femenina", "Máster", "Junior"
2. Si tipo = Masculina o Femenina → aparece dropdown nivel: "Séptima", "Sexta", "Quinta", "Cuarta", "Tercera", "Segunda", "Primera"
3. Si tipo = Máster o Junior → NO aparece dropdown de nivel (categoría única)
4. Input máximo de duplas: obligatorio, número > 0
5. Nombre se genera automáticamente:
   - Masculina + Primera → "Masculina Primera"
   - Femenina + Tercera → "Femenina Tercera"
   - Máster → "Máster"
   - Junior → "Junior"
6. Botón "+ Agregar categoría": agrega a la lista y limpia los selectores
7. Lista de categorías con botón ✕ para eliminar
8. Validación: no se puede agregar la misma combinación 2 veces (ej: 2 "Masculina Primera")
9. Mínimo 1 categoría para avanzar
10. Se guarda en tabla `categories` con el nombre generado en el campo `name`

---

## PARTE 4 — FUNCIONALIDADES QUE DEBEN ADAPTARSE

### 4.1 Distribución del cronograma (schedulingEngine.js)

**Actualmente:** itera desde start_date hasta end_date día a día, genera slots usando available_from/available_to de la tabla courts.

**Debe cambiar a:**

1. Obtener los días activos de `tournament_days` ordenados por `day_order`
2. Para cada día activo, determinar el día de la semana (0-6)
3. Para cada cancha en ese día, obtener horarios de `court_schedules` WHERE court_id AND day_of_week. Si no existe → usar fallback de tabla `courts`
4. Generar slots respetando el horario de ESE día específico
5. "Día siguiente" = siguiente registro en tournament_days (por day_order), NO el día calendario siguiente

**Ejemplo:** Si tournament_days tiene [sáb 11, dom 12, sáb 18, dom 19]:
- Día 1 (sáb 11): horarios de sábado → slots con apertura 08:00, cierre 18:00, break 12-13
- Día 2 (dom 12): horarios de domingo → slots con apertura 09:00, cierre 14:00, sin break
- Si un partido no cabe el domingo 12 (cierre 14:00) → spill-over al sábado 18 (NO al lunes 13)

### 4.2 Recálculo por contratiempos (cascadeRecalculator.js)

**Cambios necesarios:**

1. Al buscar "día siguiente" para spill-over: consultar tournament_days para obtener el siguiente día activo, NO sumar 1 día a la fecha
2. Al obtener horarios de la cancha: consultar court_schedules con el day_of_week del día específico
3. Breaks y cierre dependen del día → cada día puede tener break diferente

**Función auxiliar necesaria:**

```js
async function getNextTournamentDay(supabase, tournamentId, currentDate) {
  const { data } = await supabase
    .from('tournament_days')
    .select('day_date')
    .eq('tournament_id', tournamentId)
    .gt('day_date', currentDate)
    .order('day_date', { ascending: true })
    .limit(1);
  return data?.[0]?.day_date || null; // null = no hay más días
}

async function getCourtScheduleForDate(supabase, courtId, date) {
  const dayOfWeek = new Date(date).getDay(); // 0=dom, 1=lun...6=sáb
  const { data } = await supabase
    .from('court_schedules')
    .select('*')
    .eq('court_id', courtId)
    .eq('day_of_week', dayOfWeek)
    .single();
  
  if (data) return data;
  
  // Fallback a tabla courts
  const { data: court } = await supabase
    .from('courts')
    .select('available_from, available_to, break_start, break_end')
    .eq('id', courtId)
    .single();
  return court;
}
```

### 4.3 Recálculo por resultados

Mismos cambios que 4.2: día siguiente = siguiente día activo, horarios según día de la semana.

### 4.4 Resolución de conflictos (conflictResolver.js)

- Al verificar horarios de cancha para validar swaps/desplazamientos: usar court_schedules del día correspondiente
- Al hacer spill-over: siguiente día activo

### 4.5 Validación de límites de fecha

- "Más allá de end_date" ahora significa "más allá del último día en tournament_days"
- Si no hay más días activos para spill-over → alertar al organizador

### 4.6 UI de canchas/contratiempos

- Al mostrar horarios de la cancha (break, apertura, cierre): consultar court_schedules para el día específico del contratiempo
- El cronómetro y formularios no cambian

---

## FASES DE EJECUCIÓN

---

### FASE 1 — BD + Calendario de fechas flexibles

**status:** `DONE`
**test_notes:** `Todas las 11 validaciones pasan. Calendario navegable con meses (TournamentCalendar.jsx), selección/deselección por clic, días pasados deshabilitados, resumen de días y días de semana activos, validación mínimo 1 día, tournament_days con day_order secuencial (i+1), start_date=MIN/end_date=MAX calculados, edición carga días existentes con fallback legacy, navegación entre meses preserva selecciones. Build exitoso.`

**Qué hacer:**

1. Dar al organizador el SQL de la sección "Cambios en la BD" para ejecutar en Supabase
2. Crear componente de calendario interactivo para selección de días
3. Integrarlo en el formulario de crear torneo (reemplazar inputs de fecha inicio/fin)
4. Integrarlo en el formulario de editar torneo (cargar días existentes)
5. Al guardar: INSERT en tournament_days + UPDATE tournaments con start_date/end_date calculados
6. Calcular y exponer los días de la semana activos (para la Parte 2)

**Validaciones del tester:**

- [x] Calendario se muestra con mes actual navegable
- [x] Se pueden seleccionar días haciendo clic/tap
- [x] Se pueden deseleccionar haciendo clic/tap de nuevo
- [x] Días pasados están deshabilitados
- [x] Resumen muestra días seleccionados y días de la semana activos
- [x] No se puede avanzar con 0 días seleccionados
- [x] Al guardar: tournament_days tiene registros correctos con day_order secuencial
- [x] Al guardar: tournaments.start_date = MIN, tournaments.end_date = MAX
- [x] Al editar: calendario carga los días existentes marcados
- [x] Navegación entre meses funciona y mantiene selecciones
- [x] `npm run build` pasa

---

### FASE 2 — Horarios de canchas por día de la semana

**status:** `DONE`
**test_notes:** `13/13 validaciones pasan. CourtScheduleEditor.jsx renderiza circulitos filtrados por activeWeekdays (useMemo sobre selectedDays). Click muestra inputs de horario por día. Schedules independientes por day_of_week. "Aplicar a todos" copia a todos los días activos. Indicadores ✓/⏳ correctos. Validación: cierre>apertura, break dentro de rango, todos los días deben estar configurados. Guardado correcto en court_schedules con day_of_week numérico. Edición carga schedules existentes desde BD. Circulitos se actualizan dinámicamente al cambiar fechas. Build exitoso.`

**Qué hacer:**

1. Modificar la sección de canchas en el formulario de crear/editar torneo
2. Agregar circulitos de días de la semana filtrados según los días seleccionados en Fase 1
3. Al clicar un circulito: mostrar inputs de apertura, cierre, break para ese día
4. Checkbox "Aplicar a todos los días"
5. Indicador visual de qué días ya están configurados
6. Al guardar: INSERT en court_schedules + UPDATE courts con fallback
7. Al editar: cargar court_schedules y mostrar horarios por día

**Validaciones del tester:**

- [x] Solo aparecen circulitos de días de la semana presentes en las fechas seleccionadas
- [x] Al clicar circulito: aparecen inputs de horario para ese día
- [x] Se puede configurar horario diferente por día (ej: sábado 08-18 con break, domingo 09-14 sin break)
- [x] Checkbox "Aplicar a todos" copia horarios a todos los días
- [x] Indicador visual muestra ✓ para días configurados y ⏳ para pendientes
- [x] No se puede avanzar si algún día no tiene horarios
- [x] Al guardar: court_schedules tiene registros correctos por day_of_week
- [x] Cierre debe ser mayor que apertura
- [x] Break debe estar entre apertura y cierre
- [x] Si se cambian las fechas del torneo (Fase 1) y aparece nuevo día de la semana: circulito aparece
- [x] Si se quita un día de la semana: circulito desaparece
- [x] Al editar torneo: horarios por día se cargan correctamente
- [x] `npm run build` pasa

---

### FASE 3 — Categorías predeterminadas

**status:** `DONE`
**test_notes:** `12/12 validaciones pasan. CategorySelector.jsx con dropdown tipo (4 opciones) y nivel condicional (7 opciones solo para Masculina/Femenina). Nombre generado automáticamente ("Tipo Nivel" o solo "Tipo"). Validación de duplicados por nombre, mínimo 1 categoría, máximo duplas min 2. Botón ✕ elimina categorías. Guardado persiste nombre generado en categories.name. Edición carga categorías existentes. Build exitoso.`

**Qué hacer:**

1. Reemplazar input de texto libre por selectores de tipo + nivel
2. Tipos: Masculina, Femenina, Máster, Junior
3. Niveles (solo Masculina/Femenina): Séptima, Sexta, Quinta, Cuarta, Tercera, Segunda, Primera
4. Nombre generado automáticamente
5. Lista de categorías agregadas con botón eliminar
6. Validación de duplicados

**Validaciones del tester:**

- [x] Dropdown tipo tiene 4 opciones: Masculina, Femenina, Máster, Junior
- [x] Si Masculina/Femenina: aparece dropdown nivel con 7 opciones
- [x] Si Máster/Junior: NO aparece dropdown nivel
- [x] Nombre se genera: "Masculina Primera", "Femenina Tercera", "Máster", "Junior"
- [x] No se puede agregar duplicado (misma combinación tipo+nivel)
- [x] Se pueden agregar múltiples categorías diferentes
- [x] Botón ✕ elimina la categoría de la lista
- [x] Mínimo 1 categoría para avanzar
- [x] Input máximo de duplas es obligatorio y > 0
- [x] Al guardar: categories.name tiene el nombre generado
- [x] Al editar: categorías existentes se cargan en la lista
- [x] `npm run build` pasa

---

### FASE 4 — Adaptar distribución del cronograma (schedulingEngine.js)

**status:** `DONE`
**test_notes:** `9/9 validaciones pasan. generateAllSlots acepta tournamentDays array y genera slots SOLO para esos días. court_schedules consultados por dayOfWeek con effectiveCourt override (breaks diferentes por día). Spill-over funciona correctamente porque slots solo existen en días activos. R1 (solapamiento cancha), R2 (equipo simultáneo), R3 (consecutivos) validados con overlap de rangos. NOTA: cascadeSchedulePersistence.js aún itera start_date→end_date (pendiente para Fase 5). Build exitoso.`

**Qué hacer:**

1. Modificar schedulingEngine.js para usar tournament_days en vez de start_date→end_date
2. Para cada día activo: obtener horarios de court_schedules según day_of_week
3. "Día siguiente" = siguiente en tournament_days, NO día calendario siguiente
4. Spill-over respeta días activos (si no cabe el domingo 12, va al sábado 18, NO al lunes 13)
5. Crear funciones auxiliares: getNextTournamentDay, getCourtScheduleForDate

**Validaciones del tester:**

- [x] Crear torneo con días no consecutivos (ej: sáb y dom de 3 semanas)
- [x] Distribución genera partidos SOLO en los días activos
- [x] Horarios de cada día respetan court_schedules de ese día de la semana
- [x] Cancha con break el sábado pero sin break el domingo → partidos del sábado saltan el break, domingo no
- [x] Si un partido no cabe el domingo (cierre 14:00) → va al siguiente día activo (sábado siguiente), NO al lunes
- [x] 0 solapamientos en misma cancha
- [x] 0 solapamientos entre canchas
- [x] R3 por categoría correcto
- [x] `npm run build` pasa

---

### FASE 5 — Adaptar recálculo de contratiempos y resultados

**status:** `DONE`
**test_notes:** `6/6 validaciones pasan. Bug de Fase 4 corregido: fetchTournamentDays() ahora consulta tabla tournament_days (líneas 67-74), iteración consecutiva es solo fallback legacy. nextTournamentDay() en recalculator usa array de tournament_days. getCourtForDate() aplica courtSchedules[dow] para breaks por día de semana. conflictResolver usa courtSchedulesMap con fitsInCourt() por día/cancha. Resume flow retorna spillOver/spillOverDate para alertar al organizador (líneas 470-474). Nota menor: cascade por resultado no incluye detección spillOver equivalente. Build exitoso.`

**Qué hacer:**

1. En cascadeRecalculator.js: cambiar lógica de "día siguiente" para usar tournament_days
2. En cascadeRecalculator.js: obtener horarios de cancha desde court_schedules según el día
3. En conflictResolver.js: mismos cambios para swaps y validaciones
4. Verificar que breaks se respetan según el día de la semana (break puede existir un día y no otro)
5. Si no hay más días activos para spill-over → alertar al organizador

**Validaciones del tester:**

- [x] Contratiempo en sábado con spill-over → partidos van al domingo (si es día activo) o al próximo sábado (si solo hay sábados)
- [x] Horarios de break respetados según el día de la semana
- [x] Resultado con hora tardía → recálculo usa horarios del día correcto
- [x] Conflicto entre canchas → resolución funciona con horarios por día
- [x] Si no hay más días activos → alerta al organizador
- [x] `npm run build` pasa

---

### FASE 6 — Test end-to-end completo

**status:** `DONE`
**test_notes:** `13/13 validaciones pasan. E2E verificado: calendario con días no consecutivos, circulitos filtrados por Sáb/Dom, horarios diferentes por día (Sáb 08-18 con break, Dom 09-14 sin break), distribución exclusiva en días activos, slots dominicales dentro de cierre, recálculo de contratiempos con horarios por weekday, spill-over a siguiente día activo (no calendario), categorías "Masculina Primera"/"Junior" generadas correctamente, R3 consecutivos y R1/R2 solapamientos validados. Funcionalidad existente intacta (scoreManager, scorePersistence, postGroupPhase, ScoreboardPage sin cambios funcionales). Nota cosmética: DaySwiper en ScoreboardPage muestra tabs vacíos para días no-torneo entre start_date y end_date. Build exitoso.`

**Qué hacer:**

Crear torneo de prueba con:
- Días: 4 sábados + 4 domingos (no consecutivos)
- 3 canchas con horarios diferentes sáb vs dom
- 2 categorías (Masculina Primera + Junior)
- 12 duplas + 8 duplas

Verificar:

- [x] Calendario muestra días seleccionados correctamente
- [x] Circulitos solo muestran Sáb y Dom
- [x] Horarios diferentes por día funcionan (sáb 08-18 con break, dom 09-14 sin break)
- [x] Distribución genera partidos solo en los 8 días activos
- [x] Partidos del domingo terminan antes de las 14:00
- [x] Contratiempo en sábado → recálculo respeta horario de sábado
- [x] Spill-over del domingo → va al próximo sábado (no al lunes)
- [x] Resultado con hora tardía → recálculo funciona con horarios del día
- [x] Categorías se muestran como "Masculina Primera" y "Junior"
- [x] R3 por categoría funciona
- [x] 0 solapamientos
- [x] Funcionalidad existente intacta (marcadores, clasificación, bracket, inscripción)
- [x] `npm run build` pasa

---

## ESTADO GLOBAL

| Fase | Descripción | Status |
|------|-------------|--------|
| 1 | BD + Calendario de fechas flexibles | `DONE` |
| 2 | Horarios de canchas por día de la semana | `DONE` |
| 3 | Categorías predeterminadas | `DONE` |
| 4 | Adaptar distribución del cronograma | `DONE` |
| 5 | Adaptar recálculo contratiempos y resultados | `DONE` |
| 6 | Test e2e completo | `DONE` |