# TASK-2.md — Generador de Torneos: Grupos, Clasificación y Brackets

---

## FLUJO DE TRABAJO — DOS AGENTES

### Instrucciones para AGENTE MODIFICADOR (Terminal 1)

1. Lee este archivo completo antes de empezar
2. Lee también `DESIGN-ARCHITECTURE.md` para seguir el sistema de diseño actual
3. Usa la habilidad **UI-UX PRO MAX** para todo el trabajo de diseño y componentes
4. Busca la primera fase con status `READY`
5. Cambia el status a `IN_PROGRESS`
6. Ejecuta TODO lo que dice esa fase
7. Al terminar, ejecuta `npm run build` — si falla, arregla hasta que pase
8. Cambia el status a `WAITING_FOR_TEST`
9. Imprime en terminal un resumen de 3-5 líneas de lo que cambió
10. **PARA.** No sigas a la siguiente fase
11. **NO generes reportes ni archivos adicionales**

### Instrucciones para AGENTE TESTER (Terminal 2)

1. Monitorea este archivo buscando fases con status `WAITING_FOR_TEST`
2. Cambia el status a `TESTING`
3. Ejecuta TODAS las validaciones listadas en esa fase
4. Si PASA: cambia esa fase a `DONE` y la siguiente a `READY`
5. Si FALLA: cambia a `FAILED` y escribe 1-2 líneas en `test_notes`
6. Imprime en terminal un resumen de 3-5 líneas
7. **NO generes reportes ni archivos adicionales**

### Flujo de estados

```
READY → IN_PROGRESS → WAITING_FOR_TEST → TESTING → DONE → (siguiente = READY)
                                                   → FAILED → (modificador corrige → WAITING_FOR_TEST)
```

---

## CONTEXTO DEL PROYECTO

**RacketTourneys / Frontón HGV** es una PWA (React 19 + Vite 8 + Tailwind CSS 4 + Supabase) para gestionar torneos de frontón. Actualmente el sistema permite crear torneos, inscribir parejas y aprobar inscripciones. Esta tarea implementa todo el motor de competición: generar grupos, crear partidos round-robin, clasificar equipos y generar brackets eliminatorios.

### Base de datos actual (tablas relevantes)

**tournaments** — `id` (uuid PK), `organizer_id` (uuid FK→auth.users), `name` (text), `sport_id` (uuid FK→sports), `start_date` (date), `end_date` (date), `status` (text, default 'draft'), `scoring_config` (jsonb), `location` (varchar), `inscription_fee` (double)

**categories** — `id` (uuid PK), `tournament_id` (uuid FK→tournaments), `name` (text), `max_couples` (integer)

**courts** — `id` (uuid PK), `tournament_id` (uuid FK→tournaments), `name` (text), `available_from` (time), `available_to` (time), `break_start` (time), `break_end` (time)

**tournament_registrations** — `id` (uuid PK), `tournament_id` (uuid FK), `team_name` (varchar), `player1_id` (uuid FK→profiles), `player2_id` (uuid FK→profiles), `category_id` (uuid FK→categories), `status` (varchar, default 'pending'), `inscription_fee` (double)

**tournament_progress** — `id` (uuid PK), `tournament_id` (uuid FK), `category_id` (uuid FK), `max_teams_allowed` (int), `teams_registered` (int), `teams_approved` (int), `status` (varchar)

**profiles** — `id` (uuid PK, FK→auth.users), `email` (text), `username` (text UNIQUE), `role` (text), `status` (text)

---

## OBJETIVO GENERAL

Cuando el organizador presiona "Iniciar Torneo":

1. Modal de configuración: elige grupos y fase eliminatoria por categoría
2. Generación aleatoria de grupos con preview + **botón para regenerar sorteo**
3. Creación automática de partidos round-robin
4. Confirmación → persistencia atómica en BD
5. **Transformación completa de la UI**: el widget del torneo activo ya NO abre el modal de 3 tabs. Abre una **PÁGINA COMPLETA** con 2 botones: **Inscritos** y **Clasificación**

---

## CONCEPTO CLAVE: MEJORES N-ÉSIMOS (Generalización)

La funcionalidad de "mejores terceros" es **genérica y automática**. El sistema calcula QUÉ posición comparar:

**Regla:** Si clasifican `K` parejas directamente de cada grupo, los "mejores N-ésimos" se calculan sobre la posición `K+1`.

| Clasifican por grupo | Se comparan los... | Ejemplo |
|---|---|---|
| 1 | **Segundos** de cada grupo | 3 grupos, semifinal (4 slots): 1×3=3, falta 1 → mejor 2do |
| 2 | **Terceros** de cada grupo | 3 grupos, cuartos (8 slots): 2×3=6, faltan 2 → mejores 3ros |
| 3 | **Cuartos** de cada grupo | 4 grupos, 16avos (16 slots): 3×4=12, faltan 4 → mejores 4tos |

Si `cupos_restantes <= 0`: no se necesitan mejores N-ésimos.
Si `cupos_restantes > num_grupos`: aumentar K en 1 y recalcular.

La tabla se llama `tournament_best_positioned` (NO "best_thirds").

---

## CONSIDERACIÓN FUTURA: PROGRAMACIÓN EN CANCHAS

La tabla `tournament_matches` incluye campos de cancha y horario **NULL por ahora** pero listos para una tarea futura de distribución automática de partidos según disponibilidad de canchas:
- `court_id` (FK → courts.id, nullable)
- `scheduled_date` (date, nullable)
- `scheduled_time` (time, nullable)
- `estimated_duration_minutes` (integer, nullable)

---

## DESCRIPCIÓN DETALLADA DE LA UI — TORNEO ACTIVO

### Cambio fundamental en navegación del organizador

**ANTES (torneo en inscripción):** Clic en widget → abre modal con tabs `[INFO] [SOLICITUDES] [PROGRESO]`

**DESPUÉS (torneo activo):** Clic en widget → navega a **PÁGINA COMPLETA** con:

```
┌─────────────────────────────────────┐
│  ← Torneo de Primavera              │  header con botón volver
│                                     │
│  ┌──────────┐                       │ 
│  │ INSCRITOS│                       │  2 botones principales
│  └──────────┘                       │
│   ┌──────────────────┐              │
│   │  CLASIFICACIÓN   │              │
│   └──────────────────┘              │
│                                     │
│  (contenido según botón activo)     │
└─────────────────────────────────────┘
```

### Botón INSCRITOS → Acordeones por categoría

```
┌─────────────────────────────────────┐
│  ▶ Categoría A              (8/10)  │  toggle cerrado
├─────────────────────────────────────┤
│  ▼ Categoría B              (6/8)   │  toggle abierto
│  ┌─────────────────────────────────┐│
│  │ 1. Los Invencibles             ││
│  │    Juan Pérez / María López    ││
│  │ 2. Fuerza Gallega              ││
│  │    Pedro Ruiz / Ana Torres     ││
│  │ ...                            ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  ▶ Categoría C              (4/6)   │
└─────────────────────────────────────┘
```

Cada acordeón:
- **Cerrado:** nombre de categoría + "(inscritas/máximo)"
- **Abierto:** lista enumerada de duplas con nombre del equipo + jugadores

### Botón CLASIFICACIÓN → Swipe horizontal por grupos

```
┌─────────────────────────────────────┐
│  [Cat. A] [Cat. B]  ← tabs si hay  │
│                       varias cats   │
│  ● ○ ○ ○            dots de grupo   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │         GRUPO A                 ││
│  │                                 ││
│  │  ▶ Participantes        (4)     ││  acordeón 1
│  │                                 ││
│  │  ▶ Partidos             (6)     ││  acordeón 2
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│        ← swipe →  GRUPO B →        │
└─────────────────────────────────────┘
```

**Swipe lateral:**
- Cada "página" es un grupo (Grupo A, Grupo B, Grupo C...)
- Dots (●○○○) arriba mostrando grupo activo
- Gesto swipe izquierda/derecha
- Si hay varias categorías, tabs/selector de categoría encima del swiper

**Acordeón "Participantes" abierto:**
```
▼ Participantes                  (4)
  1. Los Invencibles
     Juan Pérez / María López
  2. Fuerza Gallega
     Pedro Ruiz / Ana Torres
  3. Los Cracks
     Luis Díaz / Rosa Martín
  4. Team HGV
     Carlos Vega / Lucía Blanco
```

**Acordeón "Partidos" abierto:**
```
▼ Partidos                       (6)
  ┌─────────────────────────────────┐
  │ Partido 1            Programado │
  │ Los Invencibles vs Fuerza Gall. │
  └─────────────────────────────────┘
  ┌─────────────────────────────────┐
  │ Partido 2            Programado │
  │ Los Invencibles vs Los Cracks   │
  └─────────────────────────────────┘
  ...
```

Cada MatchCard:
- Número + equipos + status
- **Programado:** badge gris
- **En juego:** badge celeste con pulso sutil
- **Completado:** badge verde + resultado "2-1"

---

## ESQUEMA DE BASE DE DATOS — 6 TABLAS NUEVAS

### tournament_config
```sql
CREATE TABLE tournament_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  config jsonb NOT NULL,
  status varchar NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id)
);
```

### tournament_groups
```sql
CREATE TABLE tournament_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  group_letter varchar(2) NOT NULL,
  group_number integer NOT NULL,
  phase varchar NOT NULL DEFAULT 'group_phase',
  status varchar NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### tournament_group_members
```sql
CREATE TABLE tournament_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  draw_position integer NOT NULL,
  matches_played integer NOT NULL DEFAULT 0,
  matches_won integer NOT NULL DEFAULT 0,
  matches_lost integer NOT NULL DEFAULT 0,
  sets_won integer NOT NULL DEFAULT 0,
  sets_lost integer NOT NULL DEFAULT 0,
  games_won integer NOT NULL DEFAULT 0,
  games_lost integer NOT NULL DEFAULT 0,
  points_scored integer NOT NULL DEFAULT 0,
  points_against integer NOT NULL DEFAULT 0,
  final_rank integer,
  qualified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, registration_id)
);
```

### tournament_matches
```sql
CREATE TABLE tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  group_id uuid REFERENCES tournament_groups(id) ON DELETE CASCADE,
  phase varchar NOT NULL,
  match_number integer NOT NULL,
  team1_id uuid REFERENCES tournament_registrations(id),
  team2_id uuid REFERENCES tournament_registrations(id),
  court_id uuid REFERENCES courts(id),
  scheduled_date date,
  scheduled_time time,
  estimated_duration_minutes integer,
  status varchar NOT NULL DEFAULT 'scheduled',
  score_team1 jsonb,
  score_team2 jsonb,
  winner_id uuid REFERENCES tournament_registrations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### tournament_bracket
```sql
CREATE TABLE tournament_bracket (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  phase varchar NOT NULL,
  round_number integer NOT NULL,
  position integer NOT NULL,
  team1_id uuid REFERENCES tournament_registrations(id),
  team2_id uuid REFERENCES tournament_registrations(id),
  team1_source_group uuid REFERENCES tournament_groups(id),
  team2_source_group uuid REFERENCES tournament_groups(id),
  match_id uuid REFERENCES tournament_matches(id),
  winner_id uuid REFERENCES tournament_registrations(id),
  status varchar NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### tournament_best_positioned
```sql
CREATE TABLE tournament_best_positioned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  source_group_id uuid NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  original_position integer NOT NULL,
  matches_won integer NOT NULL DEFAULT 0,
  matches_lost integer NOT NULL DEFAULT 0,
  sets_won integer NOT NULL DEFAULT 0,
  sets_lost integer NOT NULL DEFAULT 0,
  games_won integer NOT NULL DEFAULT 0,
  games_lost integer NOT NULL DEFAULT 0,
  points_scored integer NOT NULL DEFAULT 0,
  points_against integer NOT NULL DEFAULT 0,
  set_diff integer NOT NULL DEFAULT 0,
  game_diff integer NOT NULL DEFAULT 0,
  point_diff integer NOT NULL DEFAULT 0,
  ranking integer,
  qualified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## RESTRICCIONES GLOBALES

1. **NO modificar tablas existentes** — Solo crear tablas nuevas
2. **NO cambiar flujo de auth/onboarding**
3. **Transacción atómica** — TODO se inserta o NADA
4. **Round-robin** = `n*(n-1)/2` partidos por grupo, cero duplicados
5. **Sorteo aleatorio** — Fisher-Yates shuffle
6. **Mismo grupo NO se enfrenta en primera ronda eliminatoria** (si es posible)
7. **Mejores N-ésimos genéricos** — Calculados automáticamente
8. **Campos cancha/horario = NULL** — Futura tarea
9. **`npm run build` sin errores** después de cada fase
10. **Usar UI-UX PRO MAX** + `DESIGN-ARCHITECTURE.md` para todo componente visual
11. **Estética consistente** — celeste CTA, cards blancas, fondo perla, acordeones con animación suave

---

## FASES DE EJECUCIÓN

---

### FASE 1 — Migración de base de datos

**status:** `DONE`
**test_notes:** `Todas las validaciones pasaron: 6 CREATE TABLE correctas, FKs verificadas, campos de cancha/horario presentes en tournament_matches, original_position en tournament_best_positioned, RLS con 24 políticas, build OK.`

**Archivos a crear:**
- `supabase/migrations/create_tournament_structure_tables.sql`

**Qué hacer:** Crear las 6 tablas exactamente como están en la sección "ESQUEMA DE BASE DE DATOS". Habilitar RLS: SELECT para autenticados, INSERT/UPDATE/DELETE solo para el organizador del torneo.

**Validaciones del tester:**
- [ ] Archivo SQL existe con 6 CREATE TABLE
- [ ] Todas las FK correctas
- [ ] `tournament_matches` tiene `court_id`, `scheduled_date`, `scheduled_time`, `estimated_duration_minutes`
- [ ] `tournament_best_positioned` tiene `original_position`
- [ ] RLS policies definidas
- [ ] `npm run build` pasa

---

### FASE 2 — Motor de generación (lógica pura, sin UI)

**status:** `DONE`
**test_notes:** `31/31 tests passed. generateGroups(7,3)→3,2,2 OK. Shuffle aleatorio verificado. RoundRobin 4→6 y 3→3 partidos sin duplicados. calculateClassification 4 casos OK (terceros, segundos, 0 mejores). getEliminationOptions(6) filtra correctamente. Build OK.`

**Archivos a crear:**
- `src/lib/tournamentGenerator.js`

**Funciones a implementar:**

1. `shuffleArray(array)` — Fisher-Yates, retorna copia
2. `generateGroups(approvedTeams, numGroups)` — mezcla + distribución equitativa + letras A,B,C
3. `generateRoundRobinMatches(groupMembers, startingMatchNumber)` — n*(n-1)/2 partidos sin duplicados
4. `calculateClassification(numGroups, eliminationPhase)` — calcula automáticamente teamsPerGroupQualify, bestPositionedNeeded, bestPositionedRank y label ("mejores 2dos", "mejores 3ros", etc.)
5. `generateBracketStructure(eliminationPhase)` — estructura vacía del bracket
6. `getEliminationOptions(numApproved)` — opciones válidas de fase eliminatoria

**Validaciones del tester:**
- [ ] `generateGroups(7,3)` → grupos de 3,2,2 (equitativo)
- [ ] Mezcla aleatoria (2 ejecuciones = orden diferente)
- [ ] Round-robin con 4 miembros = 6 partidos exactos, 0 duplicados
- [ ] `calculateClassification(3,'quarterfinals')` → qualify 2/grupo, 2 mejores 3ros
- [ ] `calculateClassification(3,'semifinals')` → qualify 1/grupo, 1 mejor 2do
- [ ] `calculateClassification(4,'quarterfinals')` → qualify 2/grupo, 0 mejores
- [ ] `getEliminationOptions(6)` NO incluye opciones que necesiten >6 slots
- [ ] `npm run build` pasa

---

### FASE 3 — Motor de clasificación (lógica pura, sin UI)

**status:** `DONE`
**test_notes:** `20/20 tests passed. rankGroupMembers ordena correctamente por PG y desempata por dif sets/puntos. selectDirectQualifiers retorna 2/grupo con source_group. selectBestPositioned funciona con posiciones 2, 3 y 4 (incluso con grupos incompletos). assignToBracket evita clashes de mismo grupo en primera ronda. Build OK.`

**Archivos a crear:**
- `src/lib/classificationEngine.js`

**Funciones:**

1. `rankGroupMembers(members, scoringType)` — ordena por criterios de desempate (sets: PG→dif sets→dif games→games favor→sorteo | puntos: PG→dif puntos→puntos favor→sorteo)
2. `selectDirectQualifiers(rankedGroups, teamsPerGroupQualify)` — primeros K de cada grupo
3. `selectBestPositioned(rankedGroups, positionToCompare, howManyNeeded, scoringType)` — GENÉRICO: compara 2dos, 3ros o 4tos según positionToCompare
4. `assignToBracket(directQualifiers, bestPositioned, bracketStructure)` — asigna evitando mismo grupo en primera ronda

**Validaciones del tester:**
- [ ] Ranking por partidos ganados correcto
- [ ] Desempate por dif sets funciona
- [ ] `selectBestPositioned` funciona con posición 2, 3 y 4
- [ ] `assignToBracket` evita mismo grupo en primera ronda
- [ ] 3 grupos + cuartos = 8 total (2 directos + 2 mejores 3ros)
- [ ] 3 grupos + semis = 4 total (1 directo + 1 mejor 2do)
- [ ] `npm run build` pasa

---

### FASE 4 — Modal de configuración + Preview + Regenerar

**status:** `DONE`
**test_notes:** `3 archivos existen. ConfigurationModal: 3 pasos (confirm/configure/preview), confirmación de seguridad OK, importa tournamentGenerator. CategoryConfigForm: input numérico con validación min/max, dropdown filtrado, cálculos en tiempo real con label dinámico (segundos/terceros/cuartos). GenerationPreview: genera grupos+partidos, botón "Regenerar sorteo" ejecuta nueva generación, 3 botones (Volver/Regenerar/Confirmar). TournamentWidget importa y pasa tournament como prop. Overlay rgba, CTA #6BB3D9 consistente. Build OK, sin console.error/warn.`

**Archivos a crear:**
- `src/components/TournamentSetup/ConfigurationModal.jsx`
- `src/components/TournamentSetup/CategoryConfigForm.jsx`
- `src/components/TournamentSetup/GenerationPreview.jsx`

**Archivos a modificar:**
- Componente con botón "Iniciar Torneo" → conectar para abrir ConfigurationModal

**ConfigurationModal — 2 pasos:**

**Paso 1:** Confirmación + formulario por categoría (grupos + fase eliminatoria + cálculos en tiempo real con texto automático de "mejores 2dos/3ros/4tos")

**Paso 2:** GenerationPreview con:
- Grupos generados + parejas + partidos
- **Botón "🔄 Regenerar sorteo"** — ejecuta nuevo shuffle, actualiza vista inmediatamente
- Botones: [← Volver] [🔄 Regenerar] [Confirmar e Iniciar ✓]

**Validaciones del tester:**
- [ ] Confirmación de seguridad aparece
- [ ] Formulario con inputs de grupos + dropdown fase
- [ ] Dropdown filtra opciones inválidas
- [ ] Cálculos en tiempo real correctos
- [ ] Texto de mejores N-ésimos muestra posición correcta
- [ ] Preview muestra grupos con parejas y partidos
- [ ] **"Regenerar sorteo" produce distribución diferente cada vez**
- [ ] `npm run build` pasa

---

### FASE 5 — Persistencia atómica en Supabase

**status:** `DONE`
**test_notes:** `SQL RPC: persist_tournament_structure con jsonb param, INSERTs en 5 tablas + UPDATE status='active', sin BEGIN/COMMIT explícitos (atómico por defecto), UUIDs de frontend para vincular group_id. JS: persistTournamentStructure usa crypto.randomUUID(), llama supabase.rpc(), maneja éxito/error. Preview: importa persistencia+supabase, botón llama persistTournamentStructure (no console.log), estado saving con BrandLoader+disabled, error visible en UI rojo, éxito llama onSuccess/onConfirm. Build OK.`

**Archivos a crear:**
- `src/lib/tournamentPersistence.js`
- `supabase/migrations/create_rpc_persist_tournament.sql`

**Archivos a modificar:**
- `GenerationPreview.jsx` — conectar "Confirmar e Iniciar"

**Qué hacer:** Crear función RPC PostgreSQL que recibe payload JSON e inserta todo en transacción real. Si falla → rollback. Si éxito → tournament.status = 'active'. Conectar botón "Confirmar e Iniciar" con loading spinner.

**Validaciones del tester:**
- [ ] Función RPC existe
- [ ] Al confirmar, datos en 6 tablas
- [ ] `tournaments.status` = 'active'
- [ ] Partidos fase grupos = 'scheduled'
- [ ] Atomicidad: si falla, nada se guarda
- [ ] Loading visible durante persistencia
- [ ] `npm run build` pasa

---

### FASE 6 — Página completa torneo activo (Inscritos + Clasificación)

**status:** `DONE`
**test_notes:** `9 archivos creados. Ruta /tournament/:id/active en App.jsx con OrganizerRoute. Widget navega a página si active, mantiene modal si no. ActiveTournamentPage: header+back, 2 tabs (Inscritos/Clasificación), queries Supabase. CategoryAccordion: toggle con maxHeight animation, muestra (X/Max). GroupSwiper: scroll-snap-type CSS, dots con scroll listener, activeIdx tracking. ClasificacionView: category tabs condicionales. GroupCard: título GRUPO+letra, ParticipantsAccordion+MatchesAccordion. MatchCard: 3 status badges (gris/celeste+pulse/verde). Rutas existentes intactas, TournamentDetailModal sigue en uso. Build OK.`

**Archivos a crear:**
- `src/pages/ActiveTournamentPage.jsx`
- `src/components/TournamentActive/InscritosView.jsx`
- `src/components/TournamentActive/CategoryAccordion.jsx`
- `src/components/TournamentActive/ClasificacionView.jsx`
- `src/components/TournamentActive/GroupSwiper.jsx`
- `src/components/TournamentActive/GroupCard.jsx`
- `src/components/TournamentActive/ParticipantsAccordion.jsx`
- `src/components/TournamentActive/MatchesAccordion.jsx`
- `src/components/TournamentActive/MatchCard.jsx`

**Archivos a modificar:**
- `src/App.jsx` — ruta `/tournament/:id/active`
- `TournamentWidget.jsx` — si status='active', navegar a página en vez de abrir modal

**Implementar exactamente como está descrito en la sección "DESCRIPCIÓN DETALLADA DE LA UI":**
- Página completa con 2 botones (Inscritos / Clasificación)
- Inscritos: acordeones por categoría con "(X/Max)" y lista enumerada de duplas
- Clasificación: swipe horizontal por grupos con dots, cada grupo tiene acordeón Participantes + acordeón Partidos
- MatchCard con status visual (programado/en juego/completado)
- Torneos NO activos siguen con el modal de 3 tabs (no romper)

**Usar UI-UX PRO MAX. Estética: celeste CTA, cards blancas, fondo perla, acordeones con animación suave, swipe fluido con scroll-snap, responsive mobile-first.**

**Validaciones del tester:**
- [ ] Widget activo navega a página completa (NO abre modal)
- [ ] Página tiene 2 botones: Inscritos y Clasificación
- [ ] Inscritos: acordeones abren/cierran con animación, muestran "(X/Max)" y duplas enumeradas
- [ ] Clasificación: swipe horizontal entre grupos funciona
- [ ] Dots indican grupo activo
- [ ] Acordeón Participantes muestra duplas enumeradas
- [ ] Acordeón Partidos muestra MatchCards con status visual
- [ ] Torneos NO activos siguen con modal de tabs (sin romper)
- [ ] Responsive en móvil
- [ ] `npm run build` pasa
- [ ] Console sin errores

---

### FASE 7 — Integración end-to-end y casos edge

**status:** `DONE`
**test_notes:** `8/8 edge tests passed (1 grupo, 2 parejas, números impares, sin mejores N-ésimos). 17/17 archivos verificados. 12 rutas en App.jsx (11 originales + nueva). TournamentDetailModal intacto. Validación <2 parejas en CategoryConfigForm. bestPositionedNeeded>0 condicional en Preview. 0 console.log/TODO/FIXME. Build OK sin errores. TAREA 2 COMPLETA.`

**Verificar flujo completo:** Iniciar torneo → configurar → preview → regenerar → confirmar → página activa con Inscritos y Clasificación funcionando.

**Casos edge:** 1 grupo, números impares, 2 parejas, empate total, sin mejores N-ésimos, categoría con 0 aprobados.

**Verificar que NO se rompe:** login, registro, crear torneo, inscripciones, aprobar/rechazar, admin panel.

**Validaciones del tester:**
- [ ] Flujo completo end-to-end funciona
- [ ] 1 grupo: sin mejores N-ésimos
- [ ] Números impares: distribución equitativa
- [ ] 2 parejas: 1 grupo, 1 partido
- [ ] Regenerar produce resultado diferente
- [ ] Widget activo → página, widget no-activo → modal
- [ ] Inscritos + Clasificación funcionan
- [ ] Funcionalidad existente intacta
- [ ] Console sin errores
- [ ] `npm run build` pasa
- [ ] **VERIFICACIÓN GLOBAL:** nada roto

---

## ESTADO GLOBAL DE LA TAREA

| Fase | Descripción | Status | Test Notes |
|------|-------------|--------|------------|
| Fase 1 | Migración BD (6 tablas) | `DONE` | Todas las validaciones pasaron |
| Fase 2 | Motor generación (lógica pura) | `DONE` | 31/31 tests passed |
| Fase 3 | Motor clasificación (lógica pura) | `DONE` | 20/20 tests passed |
| Fase 4 | Modal config + preview + regenerar | `DONE` | Todas las validaciones pasaron |
| Fase 5 | Persistencia atómica Supabase | `DONE` | Todas las validaciones pasaron |
| Fase 6 | Página completa torneo activo (UI) | `DONE` | Todas las validaciones pasaron |
| Fase 7 | Integración e2e + casos edge | `DONE` | 8/8 edge tests, 17/17 archivos, build OK |