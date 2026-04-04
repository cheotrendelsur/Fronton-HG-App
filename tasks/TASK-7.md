# TASK-7 — Gestión Dinámica de Contratiempos por Cancha

---

## Resumen

Implementar un sistema que permita al organizador pausar el cronograma de una cancha específica cuando ocurre un contratiempo (lluvia, lesión, falla de equipamiento, etc.), y al reanudar, recalcular automáticamente los horarios de todos los partidos pendientes en esa cancha. Incluye notificaciones in-app a los jugadores afectados y resolución automática de conflictos de horarios entre canchas.

---

## Problema que resuelve

En un torneo real, las canchas pueden sufrir contratiempos que pausan temporalmente el juego: lluvia, mantenimiento, lesión de un jugador, problemas eléctricos, etc. Actualmente el organizador no tiene forma de reflejar esto en el cronograma. Los jugadores siguen viendo horarios que ya no son reales, y el organizador no tiene herramientas para gestionar la situación.

---

## UI — Nueva pestaña "Canchas" en el torneo activo

### Ubicación

En la página del torneo activo (ActiveTournamentPage), que actualmente tiene las pestañas "Inscritos" y "Clasificación", agregar una tercera pestaña llamada "Canchas".

### Navegación dentro de "Canchas"

El contenido es un swipe horizontal (igual que el DaySwiper de marcadores). Cada "página" del swipe representa UNA cancha del torneo. Dots de navegación arriba indicando cuántas canchas hay y cuál está activa.

### Vista de cada cancha — Estado NORMAL (sin contratiempo)

```
┌─────────────────────────────────────────┐
│  Cancha Principal                       │
│  Estado: ✓ Operativa                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ⚠ Declarar contratiempo       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Próximos partidos:                     │
│  ┌─────────────────────────────────┐    │
│  │ 10:15 · Primera · Grupo A      │    │
│  │ C.Méndez / M.González          │    │
│  │ vs P.Álvarez / A.Fernández     │    │
│  ├─────────────────────────────────┤    │
│  │ 11:10 · Segunda · Grupo B      │    │
│  │ R.Moreno / I.García            │    │
│  │ vs F.Ramos / P.Silva           │    │
│  ├─────────────────────────────────┤    │
│  │ 12:05 · Primera · Grupo C      │    │
│  │ Por definir vs Por definir     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Historial de contratiempos: (0)        │
└─────────────────────────────────────────┘
```

- Header: nombre de la cancha + badge de estado (verde "Operativa")
- Botón grande "Declarar contratiempo" con ícono de advertencia (⚠), fondo naranja/amarillo suave
- Los próximos 3 partidos programados en esa cancha (los 3 más cercanos con status='scheduled' o 'pending'), mostrando hora, categoría, fase, y nombres de duplas
- Si un partido no tiene equipos (eliminatoria pendiente): "Por definir vs Por definir"
- Si no quedan partidos pendientes: "✓ Todos los partidos de esta cancha han sido disputados"
- Historial de contratiempos al fondo (acordeón colapsado por defecto)

### Vista de cada cancha — Estado PAUSADA (contratiempo activo)

```
┌─────────────────────────────────────────┐
│  Cancha Principal                       │
│  Estado: ⏸ Pausada — Lluvia            │
│  Pausada desde: 10:32                   │
│  Tiempo detenido: 00:47:23 ⏱           │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ✓ Reanudar cancha              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Próximos partidos (retrasados):        │
│  ┌─────────────────────────────────┐    │
│  │ ⏸ Retrasado · Primera · Grupo A│    │
│  │ C.Méndez / M.González          │    │
│  │ vs P.Álvarez / A.Fernández     │    │
│  │ Hora original: 10:15           │    │
│  ├─────────────────────────────────┤    │
│  │ ...                             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Jugadores notificados: 8              │
└─────────────────────────────────────────┘
```

- Header: nombre de la cancha + badge rojo "Pausada — [Tipo]"
- Hora desde que se pausó + cronómetro visual en tiempo real (mm:ss) mostrando cuánto tiempo lleva pausada
- El botón cambia a "Reanudar cancha" en verde
- Los próximos partidos muestran badge "Retrasado" y la hora original tachada o en gris
- Cantidad de jugadores que fueron notificados

---

## Formulario de contratiempo

Cuando el organizador presiona "Declarar contratiempo", se abre un modal con:

```
┌─────────────────────────────────────────┐
│  Declarar contratiempo              ✕   │
│  Cancha Principal                       │
│                                         │
│  Tipo de contratiempo: *                │
│  ┌─────────────────────────────────┐    │
│  │ Seleccionar...              ▼   │    │
│  └─────────────────────────────────┘    │
│  Opciones: Lluvia, Mantenimiento,       │
│  Lesión de jugador, Falla eléctrica,    │
│  Problema de equipamiento, Otro         │
│                                         │
│  Descripción: *                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ⚠ Al activar, el cronograma de esta   │
│  cancha se pausará y los jugadores      │
│  afectados serán notificados.           │
│                                         │
│  [Cancelar]    [Activar contratiempo]   │
└─────────────────────────────────────────┘
```

- Tipo de contratiempo: dropdown OBLIGATORIO con opciones predefinidas: "Lluvia", "Mantenimiento", "Lesión de jugador", "Falla eléctrica", "Problema de equipamiento", "Otro"
- Si selecciona "Otro": aparece un input de texto para especificar
- Descripción: textarea OBLIGATORIO, mínimo 10 caracteres
- Mensaje de advertencia explicando qué va a pasar
- Botón "Activar contratiempo" DESHABILITADO hasta que ambos campos estén llenos
- Al activar: se registra en la BD, se pausa la cancha, se notifica a los jugadores

---

## Lógica de negocio

### 1. Activar contratiempo (pausar cancha)

Cuando el organizador activa un contratiempo en una cancha:

a) Guardar en la BD:
   - court_id de la cancha afectada
   - tournament_id
   - setback_type (tipo de contratiempo)
   - description (descripción)
   - started_at (timestamp actual — momento exacto de la activación)
   - ended_at (NULL — aún no se ha resuelto)
   - status ('active')
   - affected_matches (array de IDs de partidos pendientes en esa cancha ese día)

b) Marcar la cancha como pausada (puede ser un campo en la tabla courts o en una tabla nueva de contratiempos)

c) NO modificar los horarios todavía — los partidos mantienen sus horarios originales hasta que se reanude. Solo se marca visualmente que están "retrasados".

d) Las demás canchas siguen operando normalmente. Sus partidos no se afectan.

### 2. Durante la pausa

- El cronómetro visual muestra el tiempo transcurrido desde started_at en tiempo real
- Los partidos de esa cancha se muestran como "Retrasados" pero mantienen su hora original visible
- El organizador puede seguir registrando resultados en OTRAS canchas sin problema
- Si el organizador intenta registrar un resultado en la cancha pausada, mostrar advertencia: "Esta cancha está pausada por [tipo]. ¿Deseas registrar el resultado de todos modos?" — permitirlo si confirma (puede ser que el partido se jugó antes de la pausa)

### 3. Reanudar cancha (desactivar contratiempo)

Cuando el organizador presiona "Reanudar cancha":

a) Registrar ended_at con el timestamp actual
b) Calcular la duración del contratiempo: ended_at - started_at = tiempo_pausa
c) Recalcular los horarios de TODOS los partidos pendientes (status='scheduled' o 'pending') en ESA cancha:
   - El próximo partido pendiente empieza a la hora actual (ahora mismo, cuando se reanuda)
   - Los siguientes partidos se calculan en cascada: hora_inicio = hora_fin_del_partido_anterior
   - Respetar la duración estimada de cada partido
   - Respetar el break de la cancha si existe (si un partido quedaría durante el break, saltar al fin del break)
   - Si un partido queda después del horario de cierre de la cancha (available_to), moverlo al día siguiente a la hora de apertura (available_from)

d) Persistir los nuevos horarios en tournament_matches (UPDATE scheduled_date, scheduled_time)
e) Cambiar status del contratiempo a 'resolved'

### 4. Spill-over (salto de día)

Si el retraso acumulado empuja partidos más allá del horario de cierre de la cancha:

- Esos partidos se mueven al DÍA SIGUIENTE del torneo
- Empiezan a la hora de apertura de la cancha (available_from)
- Si el día siguiente también tiene partidos programados en esa cancha, los nuevos se insertan ANTES de los existentes y los existentes se empujan hacia adelante
- Si el día siguiente es posterior a la fecha de finalización del torneo (end_date), el sistema NO mueve el partido sino que alerta al organizador (ver sección de validaciones)

### 5. Múltiples contratiempos

- Una cancha puede tener múltiples contratiempos durante el torneo (ej: lluvia por la mañana, falla eléctrica por la tarde)
- NO puede tener 2 contratiempos ACTIVOS simultáneamente en la misma cancha. Si la cancha ya está pausada, el botón "Declarar contratiempo" está deshabilitado con texto "Cancha ya pausada"
- Cada contratiempo se registra como un evento separado en el historial

### 6. Contratiempos en diferentes canchas simultáneamente

- Cada cancha opera de manera independiente. Si Cancha 1 está pausada y Cancha 2 está operativa, los partidos de Cancha 2 no se afectan
- Es posible tener 2 o más canchas pausadas simultáneamente

---

## Sistema de notificaciones in-app

### Cuándo notificar

Al momento de ACTIVAR un contratiempo:

1. Identificar todos los jugadores que tienen partidos programados ese mismo día en ESA cancha pausada (no en otras canchas)
2. Para cada jugador afectado, crear una notificación

### Contenido de la notificación

"⚠ Contratiempo en [Nombre de la Cancha]: [Tipo de contratiempo]. Tu(s) partido(s) de hoy en esta cancha se encuentran retrasados. Te notificaremos cuando se reanude."

### Dónde se ven las notificaciones

Crear un sistema básico de notificaciones in-app:

- Tabla en la BD: `notifications` con campos: id, user_id, tournament_id, message, type ('setback', 'schedule_change', etc.), read (boolean), created_at
- En la barra de navegación superior de la app, agregar un ícono de campana con badge numérico (cantidad de notificaciones no leídas)
- Al hacer clic en la campana: abrir un panel/página con la lista de notificaciones ordenadas por fecha
- Cada notificación se puede marcar como leída

### Notificación al reanudar

Cuando la cancha se reanuda, enviar otra notificación a los mismos jugadores afectados:

"✓ La [Nombre de la Cancha] ha sido reanudada. Tu próximo partido es a las [nueva hora]. Revisa el cronograma actualizado."

---

## Resolución automática de conflictos entre canchas

### El problema

Cuando se recalculan los horarios de una cancha por un contratiempo, puede pasar que una dupla quede con 2 partidos al mismo tiempo en canchas diferentes. Ejemplo:

- Dupla A tiene un partido en Cancha 1 a las 14:00 y otro en Cancha 2 a las 15:00
- Cancha 1 tuvo un contratiempo de 1 hora → el partido se mueve a 15:00
- Ahora Dupla A tiene 2 partidos a las 15:00 en canchas diferentes → CONFLICTO

### Detección del conflicto

Después de recalcular los horarios de la cancha que se reanudó, el sistema debe:

1. Para cada partido recalculado, obtener team1_id y team2_id
2. Buscar si esos teams tienen otros partidos en OTRAS canchas en el mismo horario (misma fecha, horas que se solapan considerando la duración del partido)
3. Si hay solapamiento → hay conflicto

### Resolución del conflicto

Cuando se detecta un conflicto:

1. Identificar cuál de los 2 partidos es el que se movió (el de la cancha recalculada) — ese es el "partido conflictivo"
2. El partido conflictivo se mueve al siguiente slot disponible en su cancha donde no haya conflicto
3. Verificar que al moverlo, no se genera un nuevo conflicto con otro partido
4. Si no hay slot disponible ese día, mover al día siguiente
5. Reportar al organizador los conflictos detectados y cómo se resolvieron

### Alternativa más simple (si la resolución automática es muy compleja)

Si la resolución automática es demasiado compleja de implementar de manera confiable, implementar en su lugar:

- DETECCIÓN del conflicto: el sistema identifica que hay un solapamiento y le muestra al organizador una alerta visual: "⚠ Conflicto detectado: [Dupla X] tiene 2 partidos al mismo tiempo ([Cancha 1 a las 15:00] y [Cancha 2 a las 15:00]). Ajusta manualmente el cronograma."
- El organizador decide qué hacer (mover uno de los partidos manualmente desde la UI)
- Esta alternativa es aceptable y preferible a una resolución automática buggy

---

## Base de datos

### Tabla nueva: court_setbacks

```sql
CREATE TABLE court_setbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id),
  court_id uuid NOT NULL REFERENCES courts(id),
  setback_type varchar NOT NULL,
  description text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status varchar NOT NULL DEFAULT 'active', -- 'active', 'resolved'
  affected_match_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Tabla nueva: notifications

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  tournament_id uuid NOT NULL REFERENCES tournaments(id),
  message text NOT NULL,
  type varchar NOT NULL DEFAULT 'general', -- 'setback', 'schedule_change', 'general'
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Validaciones estrictas

### 1. Límites de fecha del torneo

Si el desplazamiento en cascada (o spill-over) empuja partidos más allá del end_date del torneo:

- NO mover esos partidos fuera del rango del torneo
- Mostrar al organizador una alerta: "⚠ El retraso excede las fechas del torneo. X partidos quedarían después del [end_date]. ¿Deseas extender el torneo?"
- Mostrar un input de fecha para que el organizador pueda seleccionar una nueva end_date
- Si el organizador extiende la fecha: UPDATE tournaments SET end_date = nueva_fecha, y luego continuar con el spill-over
- Si no extiende: los partidos que no caben se dejan sin reprogramar y se marcan con un badge "Sin horario — requiere extensión"

### 2. Respeto de disponibilidad de cancha

Los nuevos horarios deben respetar:
- available_from y available_to de la cancha
- break_start y break_end si existen
- Un partido no puede empezar si no cabe completo antes del break o antes del cierre

### 3. Prevención de colisiones de duplas (ver sección de resolución de conflictos)

### 4. Validación del formulario

- Tipo de contratiempo: obligatorio, no puede estar vacío
- Descripción: obligatorio, mínimo 10 caracteres
- Si "Otro" seleccionado: el campo de texto personalizado también es obligatorio
- Botón "Activar contratiempo" deshabilitado hasta que ambos campos estén correctamente llenos

### 5. No pausar cancha sin partidos pendientes

Si una cancha no tiene ningún partido pendiente (todos completados o no tiene partidos), el botón "Declarar contratiempo" está deshabilitado con texto "No hay partidos pendientes en esta cancha"

### 6. Registro de resultado durante pausa

Si el organizador intenta registrar un resultado de un partido en una cancha pausada:
- Mostrar confirmación: "Esta cancha está pausada. ¿Registrar resultado de todos modos?"
- Si confirma: permitir el registro normal
- Esto cubre el caso de un partido que se jugó ANTES de que se activara la pausa

---

## Historial de contratiempos

En la vista de cada cancha, debajo de todo, un acordeón "Historial de contratiempos" que al abrirse muestra:

- Lista cronológica (más reciente primero) de todos los contratiempos de esa cancha en este torneo
- Cada entrada: tipo, descripción, hora inicio, hora fin (o "En curso"), duración total
- Estilo: texto gris, compacto, informativo

---

## Lo que NO debe cambiar

- Generación de grupos y partidos
- Distribución inicial del cronograma
- Lógica de resultados y validaciones de scoring
- Clasificación automática y fase eliminatoria
- Progresión del bracket
- Flujo de creación y edición de torneos
- El reajuste dinámico del cronograma (TASK-6) debe seguir funcionando — los contratiempos son un mecanismo ADICIONAL, no un reemplazo

---

## Interacción con TASK-6 (reajuste dinámico)

TASK-6 implementó el reajuste del cronograma basado en la hora real de finalización de cada partido. Los contratiempos son un mecanismo diferente pero complementario:

- TASK-6: ajusta partidos uno por uno cuando se registra un resultado (micro-ajuste)
- TASK-7: pausa toda una cancha y ajusta todos los partidos pendientes de golpe (macro-ajuste)

Ambos deben coexistir. Cuando una cancha se reanuda y se recalculan los horarios, los nuevos horarios se convierten en los "oficiales". Si después el organizador registra un resultado con una hora de finalización diferente, TASK-6 hace su micro-ajuste sobre los horarios ya recalculados por TASK-7.

---

## Criterios de éxito

1. Nueva pestaña "Canchas" en el torneo activo con swipe entre canchas
2. Botón "Declarar contratiempo" funcional con formulario validado
3. Al activar: cancha se marca como pausada, cronómetro visual activo, partidos marcados como "Retrasados"
4. Al reanudar: horarios recalculados en cascada respetando breaks y horarios de cierre
5. Spill-over funciona: partidos fuera de horario se mueven al día siguiente
6. Notificaciones in-app enviadas a jugadores afectados al activar y al reanudar
7. Ícono de campana con badge de notificaciones no leídas
8. Detección de conflictos entre canchas (mínimo detección + alerta, idealmente resolución automática)
9. Historial de contratiempos visible por cancha
10. Validación de fecha del torneo con opción de extensión
11. Las demás canchas no se afectan cuando una se pausa
12. Funcionalidades existentes intactas
13. npm run build pasa sin errores