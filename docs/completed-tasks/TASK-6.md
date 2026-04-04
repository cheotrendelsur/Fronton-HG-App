# TASK-6 — Reajuste Dinámico del Cronograma en Tiempo Real

---

## Resumen

El cronograma del torneo se genera al inicio con horarios estimados, pero en la realidad los partidos pueden terminar antes o después de lo previsto. Esta tarea implementa un sistema que ajusta automáticamente el cronograma de los partidos restantes cada vez que el organizador registra el resultado de un partido, basándose en la hora real de finalización.

---

## Problema que resuelve

Actualmente el cronograma es estático. Si un partido estaba estimado para terminar a las 10:00 pero en realidad terminó a las 10:30, todos los partidos siguientes siguen mostrando sus horarios originales, que ya no son reales. Los jugadores ven horarios incorrectos y no saben cuándo juegan realmente. Lo mismo ocurre si un partido termina antes de lo previsto — el cronograma no se adelanta.

---

## Cómo debe funcionar

### 1. Input de fecha y hora en el formulario de resultados

En la página de marcadores, cuando el organizador presiona "Registrar" en un partido y se abre el recuadro para colocar el resultado, deben aparecer 2 inputs adicionales:

- **Fecha de finalización:** input de tipo fecha, se rellena automáticamente con la fecha de HOY (la fecha en la que el organizador está abriendo el formulario)
- **Hora de finalización:** input de tipo hora, se rellena automáticamente con la hora actual (la hora exacta en la que el organizador abre el formulario)

Estos inputs son editables — el organizador puede ajustarlos si no está registrando el resultado en el momento exacto en que terminó el partido. Pero por defecto vienen pre-rellenados con la fecha y hora actuales para mayor comodidad.

Estos inputs representan el momento exacto en el que el partido TERMINÓ en la vida real. Este dato es fundamental para recalcular el cronograma.

Los inputs deben aparecer en la parte superior del formulario, debajo de la información del partido y ANTES de los campos de resultado (sets/puntos). Deben verse claramente identificados con una etiqueta como "¿Cuándo terminó este partido?" o similar.

### 2. Guardado de la hora de finalización

Cuando el organizador presiona "Guardar resultado", además de guardar el score, winner_id y status='completed', se debe guardar la fecha y hora de finalización del partido. Esto puede guardarse en tournament_matches en un campo existente o nuevo — puede ser `actual_end_time` (timestamp) o usar los campos `scheduled_date` y `scheduled_time` actualizados con los valores reales de finalización, o un campo nuevo. La decisión de implementación queda libre.

### 3. Reajuste automático del cronograma

Inmediatamente después de guardar el resultado de un partido, el sistema debe recalcular los horarios de TODOS los partidos que aún no se han disputado en ESA MISMA CANCHA para ese día. La lógica es:

- La hora de finalización del partido que acaba de terminar es la hora de inicio del SIGUIENTE partido en esa misma cancha
- A partir de ahí, cada partido siguiente se recalcula: su hora de inicio es la hora de finalización del partido anterior (hora de inicio + duración estimada del partido)
- Este recálculo es en cascada: si el partido 1 terminó 30 minutos tarde, el partido 2 se mueve 30 minutos, el partido 3 también se mueve 30 minutos, y así sucesivamente

**Ejemplo concreto — Retraso:**
- Cancha Principal, partidos del día originales: 08:00, 09:00, 10:00, 11:00 (duración estimada 60 min cada uno)
- El partido de las 08:00 termina a las 09:30 (30 min de retraso)
- Reajuste: el de las 09:00 se mueve a 09:30, el de las 10:00 se mueve a 10:30, el de las 11:00 se mueve a 11:30

**Ejemplo concreto — Adelanto:**
- Cancha Principal, partidos del día: 08:00, 09:00, 10:00, 11:00
- El partido de las 08:00 termina a las 08:40 (20 min antes de lo esperado)
- Reajuste: el de las 09:00 se mueve a 08:40, el de las 10:00 se mueve a 09:40, el de las 11:00 se mueve a 10:40

### 4. Restricción de horario de cancha

Si al recalcular, un partido queda fuera del horario disponible de la cancha (después del `available_to`), ese partido y todos los que le siguen en esa cancha deben moverse al siguiente día del torneo en esa misma cancha, respetando el horario de apertura (`available_from`).

**Ejemplo:**
- Cancha Principal: disponible 08:00-18:00
- Por retrasos acumulados, el partido que originalmente era a las 17:00 ahora queda a las 18:30
- 18:30 está fuera del horario (18:00 es el cierre)
- Ese partido se mueve al DÍA SIGUIENTE a las 08:00 (hora de apertura)
- Si hay más partidos después de ese, también se mueven al día siguiente a continuación

Si la cancha tiene break (ej: 12:00-13:00), los partidos reajustados también deben respetar el break. Si un partido quedaría durante el break, se mueve a después del break.

### 5. Solo se ajustan partidos no disputados

El reajuste SOLO afecta a partidos con status='scheduled' o status='pending' (no disputados). Los partidos ya completados (status='completed') no se tocan — su horario queda como registro histórico de cuándo se jugaron.

### 6. Solo se ajusta la cancha afectada

Cuando termina un partido en la Cancha Principal, solo se reajustan los partidos de la Cancha Principal. Los partidos de la Cancha Norte y Cancha Sur no se mueven — cada cancha tiene su propio flujo de tiempo independiente.

Excepción: si una dupla tiene un partido pendiente en otra cancha y ese partido ahora se solapa temporalmente con un partido reajustado donde juega esa misma dupla, entonces el sistema debe detectar el conflicto y ajustar también. Pero esto es un caso edge — el ajuste principal es por cancha.

### 7. El orden de los partidos NUNCA cambia

El reajuste solo modifica `scheduled_date` y `scheduled_time` de los partidos pendientes. NUNCA cambia:
- El orden de los partidos (partido 1 siempre va antes que partido 2)
- La cancha asignada (si un partido estaba en Cancha Principal, sigue en Cancha Principal)
- Los equipos asignados (team1_id, team2_id no se tocan)
- La fase del partido (group_phase, quarterfinals, etc.)
- El status del partido (solo scheduled y pending se reajustan, completed nunca)

### 8. Visualización actualizada

Después del reajuste, la página de marcadores debe refrescar los horarios para que el organizador vea los nuevos horarios inmediatamente. Los jugadores que consulten el cronograma también deben ver los horarios actualizados.

En la card de cada partido pendiente en la página de marcadores, si el horario fue reajustado respecto al original, se podría mostrar una indicación visual sutil (opcional) como un pequeño ícono o texto que diga "Horario actualizado" para que se sepa que ese horario cambió.

---

## Lo que NO debe cambiar

- La generación de grupos y partidos (TASK-2)
- La distribución inicial del cronograma (TASK-3)
- La lógica de resultados y validaciones de scoring (TASK-4)
- La clasificación automática y fase eliminatoria
- La progresión del bracket (cuartos → semis → final)
- El flujo de creación y edición de torneos
- La estructura de las tablas de la BD (se pueden agregar campos nuevos si es necesario, pero no eliminar ni renombrar los existentes)

---

## Consideraciones técnicas

- El reajuste debe ser rápido — no recalcular todo el cronograma del torneo, solo los partidos pendientes de la cancha afectada en el día afectado (y potencialmente el día siguiente si hay desbordamiento)
- Si múltiples canchas están operando simultáneamente y se registran resultados en rápida sucesión, cada ajuste debe basarse en el estado más reciente del cronograma
- El campo de hora de finalización debe guardarse en la BD para tener un registro histórico de cuándo terminó realmente cada partido
- Los ajustes deben persistirse en tournament_matches (actualizar scheduled_date y scheduled_time de los partidos afectados)
- Si un día del torneo queda sin partidos después del reajuste (porque todos se movieron al día siguiente), está bien — ese día simplemente aparece vacío en el marcador

---

## Criterios de éxito

1. Al abrir el formulario de resultado, aparecen inputs de fecha y hora pre-rellenados con la fecha y hora actuales
2. Al guardar el resultado, los partidos pendientes de esa cancha se reajustan automáticamente
3. Si un partido termina tarde, los siguientes se retrasan proporcionalmente
4. Si un partido termina temprano, los siguientes se adelantan proporcionalmente
5. Si un partido queda fuera del horario de la cancha, se mueve al día siguiente respetando horarios y breaks
6. Los horarios actualizados se reflejan inmediatamente en la página de marcadores
7. El orden de los partidos nunca cambia — solo sus horarios
8. Los partidos ya completados no se modifican
9. Ninguna funcionalidad existente se rompe
10. npm run build pasa sin errores