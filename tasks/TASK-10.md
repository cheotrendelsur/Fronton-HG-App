# TASK-10 — Portal del Jugador (4 Pantallas + Navegación)

## Objetivo

Construir el portal completo del jugador: Dashboard, Torneos, Clasificación y Perfil. Debe ser la parte más estética de toda la app. Animaciones suaves, transiciones vivas, microinteracciones que den vida a cada componente. TODO debe seguir estrictamente `DESIGN-ARCHITECTURE.md` y el skill `.claude/skills/ui-ux-pro-max/SKILL.md`.

**REGLA DE ORO:** Cada funcionalidad descrita aquí debe ser REAL y FUNCIONAL — no mocks, no datos hardcodeados, no placeholders. Todo se alimenta de Supabase en tiempo real.

---

## Archivos de referencia obligatorios

Antes de cada fase, leer estos archivos completos:

- `CLAUDE.md`
- `DESIGN-ARCHITECTURE.md`
- `.claude/skills/ui-ux-pro-max/SKILL.md`
- Esta tarea (`TASK-10.md`)

---

## MIGRACIONES SQL

Ejecutar ANTES de empezar cualquier fase. Estas migraciones preparan la BD para todas las funcionalidades del portal del jugador.

```sql
-- 1. Agregar avatar_url a profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;

-- 2. Tabla de preferencias del jugador
CREATE TABLE IF NOT EXISTS player_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  theme varchar DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  notify_schedule_changes boolean DEFAULT true,
  notify_setbacks boolean DEFAULT true,
  notify_results boolean DEFAULT true,
  notify_general boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Agregar campos de premiación y reglamento a tournaments
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS prize_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rules_summary text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT NULL;

-- 4. RLS para player_preferences
ALTER TABLE player_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own preferences"
  ON player_preferences FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Players can insert own preferences"
  ON player_preferences FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own preferences"
  ON player_preferences FOR UPDATE
  USING (auth.uid() = player_id);

-- 5. Índices para consultas frecuentes del jugador
CREATE INDEX IF NOT EXISTS idx_registrations_player1
  ON tournament_registrations(player1_id);
CREATE INDEX IF NOT EXISTS idx_registrations_player2
  ON tournament_registrations(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_team1
  ON tournament_matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team2
  ON tournament_matches(team2_id);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled
  ON tournament_matches(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, read, created_at DESC);
```

---

## FASE 1 — Esqueleto de navegación y layout del jugador

**Status:** READY

### Qué construir

1. **Layout del jugador (`PlayerLayout.jsx`):**
   - Wrapper que contiene el bottom navigation bar y el área de contenido.
   - El bottom nav es FIJO en la parte inferior, siempre visible.
   - El área de contenido tiene scroll independiente con padding inferior suficiente para no quedar tapado por el nav.

2. **Bottom Navigation Bar (`PlayerBottomNav.jsx`):**
   - 4 tabs con íconos y label:
     - **Inicio** → `/player` (ícono: Home)
     - **Torneos** → `/player/torneos` (ícono: Trophy)
     - **Clasificación** → `/player/clasificacion` (ícono: BarChart3)
     - **Perfil** → `/player/perfil` (ícono: User)
   - Tab activo resaltado con color primario de la paleta gallega + indicador superior (pill o dot animado).
   - Transición suave al cambiar de tab: el ícono activo hace un leve scale-up (1.0 → 1.15) con spring animation.
   - En móvil: ocupa todo el ancho, altura ~64px, fondo con glassmorphism sutil (backdrop-blur + semi-transparencia).
   - Safe area padding para dispositivos con notch.

3. **Routing:**
   - Rutas protegidas: solo usuarios autenticados con rol `player` (o cualquier rol que tenga registraciones como jugador).
   - `/player` → `PlayerDashboard.jsx` (placeholder por ahora)
   - `/player/torneos` → `PlayerTournaments.jsx` (placeholder)
   - `/player/torneos/:tournamentId` → `PlayerTournamentDetail.jsx` (placeholder)
   - `/player/clasificacion` → `PlayerClassification.jsx` (placeholder)
   - `/player/perfil` → `PlayerProfile.jsx` (placeholder)
   - Cada placeholder muestra solo el nombre de la página centrado para validar que la navegación funciona.

4. **Detección del jugador:**
   - Crear hook `usePlayerContext.js` que exponga:
     - `playerId` — el `auth.uid()` del usuario logueado.
     - `playerProfile` — datos de `profiles` (username, email, avatar_url).
     - `playerRegistrations` — todas las registraciones aprobadas del jugador (query a `tournament_registrations` donde `player1_id = playerId OR player2_id = playerId` con status `approved`).
     - `loading`, `error`.
   - Este hook se usa en TODAS las pantallas del portal.

5. **Animaciones de transición entre páginas:**
   - Al navegar entre tabs, el contenido entra con un fade-in + slide-up sutil (translateY 8px → 0, opacity 0 → 1, duración 200ms, ease-out).
   - NO usar librerías externas de animación — solo CSS transitions/animations y el atributo `key` de React para forzar re-render.

### Tests fase 1

- [ ] Las 4 rutas cargan sus placeholders correctamente.
- [ ] El bottom nav resalta el tab activo según la ruta actual.
- [ ] `usePlayerContext` retorna datos reales del jugador logueado.
- [ ] `playerRegistrations` retorna las inscripciones aprobadas con sus categorías.
- [ ] La transición de página es visible (fade-in + slide-up).
- [ ] `npm run build` pasa limpio.

---

## FASE 2 — Dashboard del jugador (Pantalla de Inicio)

**Status:** WAITING

### 2A. Hero Widget — Próximo Partido

**Componente:** `NextMatchHero.jsx`

**Datos:** Consultar `tournament_matches` donde (`team1_id` o `team2_id` esté en las registraciones del jugador) AND `status = 'scheduled'` AND `scheduled_date >= hoy` ORDER BY `scheduled_date ASC, scheduled_time ASC` LIMIT 1. Si está en fase de eliminación y aún no tiene equipo asignado (TBD), buscar el primer partido con equipo asignado.

**Qué mostrar:**
- Nombre del torneo (join con `tournaments.name`).
- Etiqueta de categoría (join con `categories.name`) como badge de color.
- Fecha formateada en español ("Sáb 11 Abr") y hora ("08:00").
- Nombre de la cancha (join con `courts.name`).
- Rivales: "Equipo A vs Equipo B" usando `team_name` de `tournament_registrations`.
- Countdown en vivo si el partido es hoy o mañana: "En 2h 35m" — actualizado cada minuto con `setInterval`.
- Si no hay próximo partido: mostrar mensaje "No tienes partidos programados" con ilustración sutil.

**Diseño:**
- Tarjeta prominente con gradiente suave usando colores primarios de la paleta gallega.
- Bordes redondeados (16px), sombra elevada.
- El countdown debe tener un leve pulse animation cuando queden menos de 60 minutos.

---

### 2B. Torneos Activos — Carrusel

**Componente:** `ActiveTournamentsCarousel.jsx`

**Datos:** Consultar `tournaments` donde `status = 'active'` y el jugador tenga al menos una registración aprobada. Para cada torneo, listar TODAS las categorías en las que está inscrito (puede estar en más de una categoría del mismo torneo).

**Qué mostrar por tarjeta:**
- Nombre del torneo.
- Estado del torneo (badge: "En curso", "Inscripción", etc.).
- Lista de categorías en las que participa, cada una con su badge de color.
- Fecha de inicio y fin del torneo.
- Barra de progreso visual: % de partidos completados de ese jugador en ese torneo.

**Diseño:**
- Carrusel horizontal con snap scroll (CSS `scroll-snap-type: x mandatory`).
- Cada tarjeta ocupa ~85% del ancho de pantalla para que se vea la siguiente asomándose.
- Indicadores de dots debajo del carrusel (activo = lleno, inactivo = outline).
- Si solo hay 1 torneo: la tarjeta se centra sin carrusel.
- Si hay 0 torneos: ocultar la sección entera.

---

### 2C. Resultados Recientes

**Componente:** `RecentResults.jsx`

**Datos:** Consultar `tournament_matches` donde el jugador participó (via `team1_id` o `team2_id`) AND `status = 'completed'` ORDER BY `updated_at DESC` LIMIT 3.

**Qué mostrar por resultado:**
- Marcador: "Equipo A  2 - 1  Equipo B" (join con `tournament_registrations.team_name`).
- Badge de categoría.
- Indicador de resultado: victoria (verde), derrota (rojo) según `winner_id`.
- Fecha del partido.

**Diseño:**
- Lista vertical con tarjetas compactas.
- Borde izquierdo de color según resultado (verde victoria, rojo derrota).
- Si no hay resultados: ocultar sección.

---

### 2D. Tabla de Grupo en Vivo — Carrusel

**Componente:** `LiveGroupTable.jsx`

**Datos:** Para cada categoría activa del jugador en fase de grupos:
- Consultar `tournament_group_members` del grupo donde está el jugador.
- Join con `tournament_registrations` para obtener `team_name`.
- Ordenar por: points DESC, (sets_won - sets_lost) DESC, (games_won - games_lost) DESC.

**Qué mostrar:**
- Encabezado: nombre del torneo + categoría.
- Tabla con columnas: Pos, Equipo, PJ, PG, PP, Sets (G-P), Games (G-P), Pts.
- La fila del jugador resaltada con fondo suave del color primario.
- Si el jugador está en múltiples grupos (por estar en varias categorías): carrusel horizontal deslizable entre tablas.

**Lógica de visibilidad:**
- Este componente SOLO aparece si el jugador tiene al menos un grupo activo en fase de grupos.
- Si TODAS las categorías del jugador ya pasaron a eliminatoria: el componente desaparece automáticamente.
- Determinar esto consultando: si todos los partidos `group_phase` del jugador en una categoría están `completed`, esa categoría ya no muestra tabla.

**Diseño:**
- Tabla con filas alternadas (zebra striping sutil).
- Carrusel con mismo patrón de snap scroll que el de torneos.
- Header sticky dentro de cada tabla.

---

### 2E. Alertas Rápidas

**Componente:** `QuickAlerts.jsx`

**Datos:** Consultar `notifications` donde `user_id = playerId` AND `read = false` ORDER BY `created_at DESC` LIMIT 5.

**Qué mostrar:**
- Ícono según tipo: ⏰ `schedule_change`, ⚠️ `setback`, 📢 `general`.
- Mensaje de la notificación.
- Tiempo relativo ("hace 5 min", "hace 1h").
- Tap en la notificación → marcarla como `read = true` (UPDATE en `notifications`).

**Diseño:**
- Si hay notificaciones no leídas: badge numérico rojo en el ícono de Inicio del bottom nav.
- Lista colapsable: muestra las primeras 2 con botón "Ver todas" que expande.
- Cada alerta tiene una animación de entrada escalonada (staggered) al cargar.
- Al marcar como leída: la alerta se desvanece con slide-out suave.

---

### 2F. Orden y composición del Dashboard

**Componente:** `PlayerDashboard.jsx`

Orden vertical de los componentes en la pantalla:

1. Header con saludo: "Hola, {username}" + avatar pequeño (si tiene).
2. `QuickAlerts` (solo si hay alertas no leídas).
3. `NextMatchHero`.
4. `ActiveTournamentsCarousel`.
5. `LiveGroupTable` (solo si aplica).
6. `RecentResults`.

- Pull-to-refresh: al hacer pull down se recargan todos los datos.
- Skeleton loaders mientras cargan los datos (con shimmer animation).
- Cada sección tiene un título descriptivo ("Próximo partido", "Torneos activos", etc.) con tipografía según `DESIGN-ARCHITECTURE.md`.

### Tests fase 2

- [ ] El hero muestra el próximo partido real del jugador logueado con todos los datos (torneo, categoría, rivales, cancha, fecha, hora).
- [ ] El countdown se actualiza en vivo.
- [ ] El carrusel de torneos muestra todos los torneos activos con las categorías correctas del jugador.
- [ ] Los resultados recientes muestran marcador y resultado correcto (victoria/derrota).
- [ ] La tabla de grupo muestra la clasificación real con la fila del jugador resaltada.
- [ ] Si el jugador tiene varias categorías, la tabla es un carrusel deslizable.
- [ ] Las alertas se marcan como leídas al tocar y desaparecen con animación.
- [ ] El badge del bottom nav refleja el conteo de alertas no leídas.
- [ ] Skeleton loaders aparecen mientras cargan los datos.
- [ ] `npm run build` pasa limpio.

---

## FASE 3 — Pantalla de Torneos (Búsqueda e Inscripción)

**Status:** WAITING

### 3A. Buscador y Filtros

**Componente:** `TournamentSearch.jsx`

**Datos:** Consultar `tournaments` con filtros dinámicos.

**Funcionalidad:**
- Input de búsqueda por texto: filtra `tournaments.name` con `ILIKE '%texto%'`.
- Filtros colapsables (drawer que sube desde abajo con animación):
  - **Estado:** Inscripción abierta / En curso / Finalizado (chips seleccionables).
  - **Fechas:** Rango de fechas con date picker nativo.
  - **Categorías:** Multi-select de categorías disponibles.
- Botón de "Limpiar filtros" para resetear.
- Los filtros se aplican en tiempo real (debounce de 300ms en el input de texto).

**Diseño:**
- Barra de búsqueda sticky en la parte superior con ícono de lupa.
- Ícono de filtro a la derecha que abre el drawer.
- Chips de filtros activos visibles debajo de la barra (removibles con tap en la X).

---

### 3B. Directorio de Torneos

**Componente:** `TournamentDirectory.jsx`

**Datos:** Resultado de la query filtrada. Por defecto muestra torneos con `status = 'inscription'` primero, luego `active`.

**Qué mostrar por tarjeta:**
- Cover image (si tiene `cover_image_url`) o gradiente por defecto.
- Nombre del torneo.
- Fechas (inicio - fin).
- Ubicación (`location`).
- Costo de inscripción (`inscription_fee`) formateado como moneda.
- Cantidad de categorías disponibles (count de `categories` del torneo).
- Badge de estado.
- Si el jugador ya está inscrito: badge "Inscrito" con check verde.

**Diseño:**
- Grilla responsive: 1 columna en móvil, 2 en tablet.
- Tarjetas con hover/press animation (scale 0.98 al presionar).
- Si no hay resultados: ilustración de "No se encontraron torneos" con sugerencia de ajustar filtros.
- Infinite scroll o "Cargar más" si hay muchos torneos.

---

### 3C. Vista Detallada del Torneo

**Componente:** `PlayerTournamentDetail.jsx` (ruta `/player/torneos/:tournamentId`)

**Datos:** Consultar `tournaments` por ID, join con `categories`, `courts`, `tournament_days`.

**Qué mostrar:**
- Header con imagen de portada (o gradiente) y nombre del torneo superpuesto.
- Sección de info:
  - Fechas del torneo (días seleccionados de `tournament_days`).
  - Ubicación.
  - Costo de inscripción.
  - Descripción (`tournaments.description`).
- Sección de categorías: lista de todas las `categories` del torneo con `name` y `max_couples`.
- Sección de canchas: nombres de las `courts` del torneo.
- Sección de premiación (`prize_description`) — solo si tiene contenido.
- Sección de reglamento (`rules_summary`) — solo si tiene contenido.
- Botón de inscripción sticky en la parte inferior (solo si `status = 'inscription'`).
- Si ya está inscrito: mostrar en qué categorías y con qué compañero.

**Diseño:**
- Scroll vertical con parallax sutil en la imagen de portada.
- Secciones con separadores claros.
- Botón de inscripción: pill ancho, color primario, con animación de press.

---

### 3D. Flujo de Inscripción Multicategoría

**Componente:** `TournamentInscriptionModal.jsx`

**Flujo paso a paso (multi-step modal):**

**Paso 1 — Selección de categorías:**
- Mostrar todas las categorías del torneo como checkboxes.
- Cada categoría muestra: nombre, plazas disponibles (max_couples - inscritos actuales), si ya está inscrito (deshabilitado con check).
- El jugador puede seleccionar MÚLTIPLES categorías.
- Categorías llenas: deshabilitadas con label "Completa".

**Paso 2 — Selección de compañero por categoría:**
- Por cada categoría seleccionada: un campo de búsqueda de compañero.
- Búsqueda en `profiles` con `ILIKE` por `username` o `email`.
- Autocompletado con lista desplegable de resultados.
- Un mismo compañero puede repetirse en varias categorías o ser diferente en cada una.
- Validar que el compañero no esté ya inscrito en esa categoría con otra pareja.

**Paso 3 — Confirmación y resumen:**
- Resumen de todas las inscripciones: categoría + compañero.
- Costo total: `inscription_fee × cantidad_de_categorías`.
- Botón "Confirmar inscripción".
- Al confirmar: INSERT en `tournament_registrations` una fila por cada categoría seleccionada con `status = 'pending'` y el `team_name` autogenerado como "Apellido1 / Apellido2" (usando los username de ambos jugadores).

**Datos generados por inscripción (por cada categoría):**
```
tournament_registrations:
  - tournament_id: el torneo
  - category_id: la categoría seleccionada
  - player1_id: el jugador logueado
  - player2_id: el compañero seleccionado
  - team_name: "{username_player1} / {username_player2}"
  - status: 'pending' (el organizador la aprueba después)
```

**Diseño:**
- Modal fullscreen en móvil (slide-up desde abajo).
- Stepper visual arriba: 3 dots/pasos con el activo resaltado.
- Transición entre pasos con slide horizontal.
- Botones "Atrás" y "Siguiente" en cada paso.
- Loading spinner en el botón de confirmar mientras se hace el INSERT.
- Success screen con animación de confetti o check verde tras inscripción exitosa.

### Tests fase 3

- [ ] La búsqueda filtra torneos en tiempo real por nombre.
- [ ] Los filtros de estado, fecha y categoría funcionan y se combinan.
- [ ] Las tarjetas del directorio muestran datos reales de Supabase.
- [ ] Tap en una tarjeta navega a la vista detallada con datos completos.
- [ ] El badge "Inscrito" aparece si el jugador ya tiene registración aprobada.
- [ ] El modal de inscripción permite seleccionar múltiples categorías.
- [ ] La búsqueda de compañero funciona con autocompletado real.
- [ ] No se puede seleccionar un compañero ya inscrito en esa categoría con otra pareja.
- [ ] Al confirmar se crean los registros en `tournament_registrations` con status `pending`.
- [ ] El team_name se genera correctamente.
- [ ] Categorías llenas aparecen deshabilitadas.
- [ ] `npm run build` pasa limpio.

---

## FASE 4 — Pantalla de Clasificación (Hub Competitivo)

**Status:** WAITING

### 4A. Selector de Contexto Doble

**Componente:** `ClassificationContextSelector.jsx`

**Funcionalidad:**
- **Selector primario (Torneo):** Dropdown o selector horizontal que muestra SOLO los torneos en los que el jugador tiene inscripciones aprobadas con status activo. El primero se selecciona por defecto.
- **Selector secundario (Categoría):** Aparece debajo del selector de torneo. Muestra SOLO las categorías en las que el jugador está inscrito DENTRO del torneo seleccionado. La primera se selecciona por defecto.
- Al cambiar torneo → las categorías se actualizan automáticamente.
- Al cambiar categoría → todo el contenido debajo se actualiza.

**Diseño:**
- Selectores como chips horizontales scrollables (si caben en una línea) o dropdowns (si son muchos).
- El chip activo tiene fondo sólido del color primario; los inactivos tienen fondo outline.
- Transición suave al cambiar: el contenido debajo hace un fade-out/fade-in rápido (150ms).

---

### 4B. Mi Itinerario

**Componente:** `MyItinerary.jsx`

**Datos:** Consultar `tournament_matches` del torneo y categoría seleccionados donde el jugador participa (via `team1_id` o `team2_id` de sus registraciones) AND `status IN ('scheduled', 'pending')` ORDER BY `scheduled_date, scheduled_time`.

**Qué mostrar por tarjeta:**
- Fase del partido (badge: "Grupos", "Cuartos", "Semifinal", "Final").
- Rivales (team_name de ambos equipos). Si el rival es TBD: "Por definir".
- Fecha y hora.
- Nombre de la cancha.
- Indicador de estado: "Programado" (azul), "Pendiente" (amarillo).

**Diseño:**
- Timeline vertical con línea conectora entre tarjetas.
- Las tarjetas se escalonan con animación de entrada (staggered slide-in desde la derecha).
- Si no hay partidos pendientes: "Todos los partidos completados" con ícono de check.

---

### 4C. Visualizador Dinámico — Fase de Grupos

**Componente:** `GroupPhaseView.jsx`

**Cuándo se muestra:** Cuando la categoría seleccionada aún tiene partidos de `group_phase` sin completar O si el jugador quiere ver la tabla final.

**Datos:** Misma query que `LiveGroupTable` del dashboard pero para la categoría seleccionada específicamente.

**Qué mostrar:**
- Tabla completa del grupo: Pos, Equipo, PJ, PG, PP, SG, SP, Dif. Sets, GG, GP, Dif. Games, Pts.
- Fila del jugador resaltada.
- Indicadores de clasificación: las primeras N posiciones (las que clasifican) tienen un borde verde a la izquierda.

**Diseño:**
- Tabla con scroll horizontal si no cabe en pantalla (en móvil las columnas de Games pueden requerir scroll).
- Header sticky.
- Zebra striping.
- La fila del jugador tiene fondo con color primario al 10% de opacidad.

---

### 4D. Visualizador Dinámico — Bracket de Eliminatoria

**Componente:** `BracketView.jsx`

**Cuándo se muestra:** Cuando la categoría seleccionada tiene partidos de eliminatoria (`quarterfinals`, `semifinals`, `final`).

**Datos:** Consultar `tournament_bracket` y `tournament_matches` para la categoría seleccionada. Join con `tournament_registrations` para obtener team_names.

**Qué mostrar:**
- Llave (bracket) completa desde cuartos (si los hay) hasta la final.
- Cada nodo del bracket muestra:
  - team_name de ambos equipos (o "Por definir" si TBD).
  - Marcador si el partido está completado.
  - Resaltado del ganador.
- El camino del jugador iluminado: las llaves donde participa tienen borde/fondo destacado.

**Interacción:**
- Drag-to-pan: el bracket se puede arrastrar horizontalmente para ver todas las rondas.
- Pinch-to-zoom (opcional): si el bracket es grande.
- El bracket se centra automáticamente en la posición del jugador al cargar.

**Diseño:**
- Estructura clásica de llave deportiva: líneas conectoras entre rondas.
- Cada partido es una tarjeta compacta con los dos equipos apilados.
- El camino del jugador se resalta con el color primario (borde más grueso + fondo suave).
- Partidos completados en gris; partidos pendientes con borde punteado.
- La final se destaca con ícono de trofeo.

**Implementación técnica:**
- Usar un contenedor con `overflow: auto` y `touch-action: pan-x pan-y`.
- El bracket se renderiza como un CSS Grid o Flexbox anidado (NO SVG ni canvas).
- Cada ronda es una columna; las conexiones se hacen con pseudo-elementos CSS (::before, ::after con borders).

---

### 4E. Navegación Externa

**Componente:** `ExternalNavigation.jsx`

**Funcionalidad:**
- Sección debajo del bracket/tabla con links a:
  - "Ver todos los grupos" → expande un acordeón mostrando las tablas de TODOS los grupos de esa categoría (no solo el del jugador).
  - "Ver bracket completo" → muestra el bracket sin resaltado del camino propio, mostrando todos los partidos.
- Esto permite al jugador ver cómo van los demás.

**Diseño:**
- Botones outline con ícono de flecha/expand.
- El contenido expandido aparece con animación de acordeón (height 0 → auto con transición).

### Tests fase 4

- [ ] El selector de torneo muestra solo torneos donde el jugador está inscrito.
- [ ] Al cambiar torneo, las categorías se actualizan correctamente.
- [ ] Mi Itinerario muestra los partidos futuros reales del jugador en la categoría seleccionada.
- [ ] La tabla de grupo muestra la clasificación real con la fila resaltada.
- [ ] El bracket renderiza correctamente la estructura de eliminatoria.
- [ ] El camino del jugador está visualmente resaltado en el bracket.
- [ ] Drag-to-pan funciona en el bracket.
- [ ] Los grupos de otros jugadores se pueden ver en la navegación externa.
- [ ] Las transiciones entre grupo y bracket son suaves.
- [ ] `npm run build` pasa limpio.

---

## FASE 5 — Pantalla de Perfil

**Status:** WAITING

### 5A. Cabecera de Identidad

**Componente:** `ProfileHeader.jsx`

**Datos:** `profiles` del jugador logueado.

**Funcionalidad:**
- Avatar circular grande (80px) con la inicial del username como fallback si no tiene `avatar_url`.
- Botón de cámara/edición sobre el avatar para cambiar imagen.
- Al tap en editar avatar: abrir selector de imagen nativo del dispositivo.
- Subir imagen a Supabase Storage (bucket `avatars`), guardar la URL pública en `profiles.avatar_url`.
- Nombre de usuario prominente debajo del avatar.
- Email debajo del nombre (texto secundario).

**Diseño:**
- Fondo con gradiente suave detrás de la cabecera.
- Avatar con borde blanco (3px) y sombra sutil.
- Botón de cámara: círculo pequeño posicionado en la esquina inferior-derecha del avatar.

---

### 5B. Resumen Estadístico

**Componente:** `PlayerStats.jsx`

**Datos:** Calcular a partir de `tournament_matches` donde el jugador participó y `status = 'completed'`:
- Total partidos jugados (count).
- Partidos ganados (count donde `winner_id` es el equipo del jugador).
- Partidos perdidos.
- Win rate (%) = ganados / jugados × 100.
- Sets a favor / en contra (sum de score_team1 o score_team2 según sea).

**Filtro por categoría:**
- Dropdown que permite ver estadísticas globales o filtradas por una categoría específica.
- Las categorías disponibles son todas en las que el jugador ha participado históricamente.

**Diseño:**
- Grid de 2×2 con las stats principales: Jugados, Ganados, Perdidos, Win Rate.
- Cada celda es una tarjeta compacta con el número grande y el label pequeño debajo.
- Win rate con color condicional: verde (≥60%), amarillo (40-59%), rojo (<40%).
- Animación de los números al cargar: counter-up de 0 al valor final (300ms).

---

### 5C. Gestión de Cuenta

**Componente:** `AccountManagement.jsx`

**Funcionalidad:**
- Campos editables:
  - **Username:** input de texto, validar unicidad contra `profiles` antes de guardar.
  - **Email:** input de texto, validar formato.
  - **Contraseña:** botón que abre un sub-formulario con: contraseña actual, nueva contraseña, confirmar nueva. Usar `supabase.auth.updateUser({ password })`.
- Botón "Guardar cambios" que solo se habilita si hay cambios.
- Loading state en el botón mientras se guarda.
- Toast de confirmación al guardar exitosamente.

**Diseño:**
- Formulario con secciones separadas (datos personales vs contraseña).
- Inputs con estilo consistente con el resto de la app.
- Validación inline: errores en rojo debajo del campo.

---

### 5D. Preferencias

**Componente:** `PlayerPreferences.jsx`

**Datos:** `player_preferences` del jugador. Si no existe fila, crear una con defaults al montar el componente.

**Funcionalidad:**
- **Tema visual:** Toggle switch entre Claro y Oscuro.
  - Al cambiar: actualizar `player_preferences.theme` y aplicar el tema inmediatamente (cambiar clase en `<html>` o usar CSS variables).
  - El tema debe persistir entre sesiones (leído de BD al iniciar).
- **Notificaciones:** 4 toggle switches independientes:
  - Cambios de horario (`notify_schedule_changes`).
  - Contratiempos de cancha (`notify_setbacks`).
  - Resultados de partidos (`notify_results`).
  - Generales (`notify_general`).
- Cada toggle hace UPDATE inmediato en `player_preferences` (auto-save, sin botón de guardar).

**Diseño:**
- Sección de toggles con separadores entre cada opción.
- Toggle switches con animación suave (spring) al cambiar estado.
- Label a la izquierda, toggle a la derecha.

---

### 5E. Acciones Base

**Componente:** Integrado en `PlayerProfile.jsx`

**Funcionalidad:**
- **Cerrar sesión:** Botón outline rojo. Al tap: `supabase.auth.signOut()` → redirigir a la pantalla de login.
- **Términos de uso:** Link que abre un modal con texto de términos (placeholder de texto por ahora, pero el modal debe funcionar).

**Diseño:**
- Botón de cerrar sesión en la parte inferior de la pantalla, separado del resto por un espaciado generoso.
- "Términos de uso" como link de texto underline, no como botón.

---

### 5F. Composición del Perfil

**Componente:** `PlayerProfile.jsx`

Orden vertical:
1. `ProfileHeader`
2. `PlayerStats`
3. `AccountManagement`
4. `PlayerPreferences`
5. Separador
6. Acciones base (cerrar sesión + términos)

### Tests fase 5

- [ ] El avatar muestra la imagen de Supabase Storage o la inicial como fallback.
- [ ] Se puede subir una imagen nueva y se refleja inmediatamente.
- [ ] Las estadísticas son correctas comparando manualmente con los datos de `tournament_matches`.
- [ ] El filtro por categoría en estadísticas funciona.
- [ ] Se puede editar username y email con validación.
- [ ] Se puede cambiar la contraseña.
- [ ] El toggle de tema claro/oscuro funciona y persiste entre sesiones.
- [ ] Los toggles de notificaciones se guardan automáticamente.
- [ ] Cerrar sesión redirige al login.
- [ ] `npm run build` pasa limpio.

---

## FASE 6 — Animaciones, pulido visual y UX final

**Status:** WAITING

### Qué hacer

Esta fase es de PULIDO. Todo debe funcionar ya. Aquí se mejora la experiencia visual.

1. **Skeleton loaders para TODAS las pantallas:**
   - Cada componente que hace fetch debe mostrar un skeleton con shimmer animation mientras carga.
   - Los skeletons deben reflejar la forma del contenido real (no un spinner genérico).

2. **Pull-to-refresh en todas las pantallas:**
   - Gesto de pull down → recarga los datos de la pantalla actual.
   - Indicador visual (spinner circular que aparece al tirar).

3. **Empty states con ilustración:**
   - Cada sección que puede estar vacía debe tener un mensaje amigable con icono o ilustración SVG simple.
   - Ejemplos: "No tienes partidos programados", "No hay torneos disponibles", "Aún no tienes resultados".

4. **Microinteracciones:**
   - Botones: efecto ripple al presionar.
   - Tarjetas: leve scale (0.98) al presionar, volver a 1.0 al soltar.
   - Toggles: spring animation (overshoot sutil).
   - Números: counter-up animation al aparecer por primera vez.
   - Listas: staggered entrance (cada item entra 50ms después del anterior).

5. **Transiciones de navegación:**
   - Dashboard ↔ Torneos ↔ Clasificación ↔ Perfil: fade + slide-up (200ms).
   - Lista → Detalle (torneos): slide-in desde la derecha (250ms).
   - Modals: slide-up desde abajo (300ms) con backdrop fade.

6. **Responsive final:**
   - Verificar que todo se ve bien en:
     - iPhone SE (375px).
     - iPhone 14/15 (390px).
     - Android estándar (360px).
     - iPad (768px).
   - El bottom nav NO aparece en tablet si se usa en landscape.

7. **Accesibilidad básica:**
   - Todos los botones tienen `aria-label`.
   - Los colores cumplen contraste mínimo WCAG AA.
   - Focus visible en todos los elementos interactivos.

### Tests fase 6

- [ ] Skeletons aparecen en todas las pantallas durante la carga.
- [ ] Pull-to-refresh funciona en dashboard, torneos, clasificación y perfil.
- [ ] Empty states se muestran correctamente cuando no hay datos.
- [ ] Las animaciones son fluidas (no hay jank/stutter).
- [ ] La navegación entre tabs tiene transición visible.
- [ ] El modal de inscripción tiene animación de entrada y salida.
- [ ] Se ve bien en iPhone SE (375px).
- [ ] Se ve bien en iPad (768px).
- [ ] `npm run build` pasa limpio.
- [ ] Lighthouse performance score ≥ 80.

---

## NOTAS PARA EL AGENTE MODIFICADOR

- **NO borres nada del portal del organizador.** Todo lo de `/organizer/*` debe seguir funcionando.
- Lee `DESIGN-ARCHITECTURE.md` COMPLETO antes de cada fase — la paleta de colores, tipografía, espaciados y border-radius están definidos ahí.
- Lee `.claude/skills/ui-ux-pro-max/SKILL.md` para las directrices de diseño avanzado.
- Usa componentes atómicos reutilizables: si 2 pantallas usan una tarjeta similar, extrae un componente compartido.
- Todos los queries a Supabase deben manejar errores y loading states.
- Las animaciones deben ser CSS puro (transitions + keyframes). NO instalar framer-motion ni librerías de animación.
- Respetar la zona horaria de Venezuela (UTC-4) en todas las fechas/horas mostradas.

## NOTAS PARA EL AGENTE TESTER

- En cada fase, verificar que TODOS los tests listados pasan.
- Verificar que el portal del organizador no se rompió (`/organizer/*` sigue funcionando).
- Verificar responsividad en al menos 2 anchos distintos (375px y 768px) usando DevTools.
- Verificar que `npm run build` pasa sin warnings relevantes.
- Si encuentras datos incorrectos (ej: estadísticas que no cuadran, partidos de otra categoría mezclados), reportar como FAILED con detalle exacto.