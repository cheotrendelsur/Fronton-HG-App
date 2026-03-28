# TASK-003: Dashboard de Torneos para Organizador

> **SCOPE**: Sistema completo de gestión de torneos post-creación.
> **COMPLEJIDAD**: Alta | **FASES**: 5 | **TIMELINE**: 10-12 horas

---

## 1. DESCRIPCIÓN GENERAL

Después de crear un torneo, el organizador accede a un dashboard en `/tournaments` donde puede:
1. Ver torneos activos (en inscripción/ejecución)
2. Ver historial de torneos pasados
3. Editar información del torneo (INFO tab)
4. Gestionar solicitudes de participantes (SOLICITUDES tab)
5. Monitorear progreso de inscripción por categoría (PROGRESO tab)

---

## 2. ANÁLISIS DE BASE DE DATOS

### 2.1 Tablas Existentes (YA CREADAS)
```
✓ tournaments        → Base principal (organizer_id, scoring_config, status)
✓ categories         → Categorías del torneo (tournament_id, name, max_couples)
✓ courts             → Canchas disponibles (tournament_id, name, horarios)
✓ profiles           → Usuarios del sistema (id, email, username, role)
✓ sports             → Deportes (name)
```

### 2.2 Modificaciones a Tablas Existentes (CRÍTICO)
```sql
-- 1. Agregar columna location a tournaments
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS location varchar;

-- 2. Agregar columna status a tournaments (si no existe)
-- Status: 'draft' | 'inscription' | 'active' | 'finished'
-- YA EXISTE EN TU ESTRUCTURA ✓

-- 3. Verificar que tournaments tenga organizer_id
-- YA EXISTE ✓
```

### 2.3 Nuevas Tablas (CREAR ESTAS)
```sql
-- TABLA 1: tournament_registrations
-- Gestiona solicitudes de duplas a participar en un torneo
CREATE TABLE tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name varchar NOT NULL,
  player1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  status varchar NOT NULL DEFAULT 'pending', 
  -- pending = solicitud nueva
  -- approved = admitida
  -- rejected = rechazada
  inscription_fee float,
  requested_at timestamp NOT NULL DEFAULT now(),
  decided_at timestamp,
  decided_by uuid REFERENCES profiles(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- TABLA 2: tournament_progress
-- Controla el progreso de inscripciones por categoría
CREATE TABLE tournament_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  max_teams_allowed int NOT NULL,
  teams_registered int NOT NULL DEFAULT 0,
  teams_approved int NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'open',
  -- open = disponible
  -- full = lleno
  -- closed = cerrado
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- TABLA 3: tournament_edits_history (opcional pero recomendada)
-- Auditoría de cambios realizados por el organizador
CREATE TABLE tournament_edits_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL REFERENCES profiles(id),
  field_name varchar NOT NULL,
  old_value text,
  new_value text,
  edited_at timestamp NOT NULL DEFAULT now()
);
```

### 2.4 Índices (CREAR ESTOS)
```sql
CREATE INDEX idx_tournament_registrations_tournament 
ON tournament_registrations(tournament_id);

CREATE INDEX idx_tournament_registrations_status 
ON tournament_registrations(status);

CREATE INDEX idx_tournament_registrations_category 
ON tournament_registrations(category_id);

CREATE INDEX idx_tournament_progress_tournament 
ON tournament_progress(tournament_id);

CREATE INDEX idx_tournaments_organizer 
ON tournaments(organizer_id);

CREATE INDEX idx_tournaments_status 
ON tournaments(status);

CREATE INDEX idx_tournament_edits_tournament 
ON tournament_edits_history(tournament_id);
```

---

## 3. FASES DE DESARROLLO

### **FASE 1: Setup y Estructura Base** (2 horas)

**Objetivo**: Crear páginas, layouts y estructura de componentes

**Archivos a crear:**
```
src/pages/TournamentsPage.jsx
src/components/TournamentsDashboard/
├── TournamentsPageLayout.jsx       (layout principal)
├── ActiveTournaments.jsx           (sección activos)
├── HistoryTournaments.jsx          (sección historial)
└── TournamentWidget.jsx            (card de torneo)
```

**Funcionalidades:**
- Página con 2 secciones: Activos + Historial
- Estado global para tournamentsList, selectedTournament
- Setup de rutas

**Criterios aceptación:**
- ✓ Página carga sin errores
- ✓ Layout básico presente
- ✓ No hay datos aún (será Phase 2)

---

### **FASE 2: Vista de Torneos Activos + Historial** (2.5 horas)

**Objetivo**: Cargar y mostrar torneos del organizador

**Archivos a crear:**
```
src/components/TournamentsDashboard/
├── TournamentWidget.jsx            (actualizado con info)
├── ActiveTournaments.jsx           (actualizado con datos)
└── HistoryTournaments.jsx          (actualizado con datos)
```

**Widget Info:**
```
┌─────────────────────────────────────────┐
│ 🏆 RacketPro Cup                        │
│ 📍 Cancha Municipal                     │
│ 👤 Org: Juan García                     │
│ 📅 5-10 Dic 2026                        │
│ 💰 $50/dupla                            │
│ 🎯 A, B, C                              │
└─────────────────────────────────────────┘
```

**APIs:**
- GET `/api/tournaments/organizer/:organizerId` → lista de torneos
- Filtrar por status (inscription | active | finished)

**Criterios aceptación:**
- ✓ Carga torneos del organizador
- ✓ Info mostrada correctamente
- ✓ Separación Activos/Historial

---

### **FASE 3: Modal Detalle + Info Tab** (3 horas)

**Objetivo**: Modal editable con los datos del torneo

**Archivos a crear:**
```
src/components/TournamentsDashboard/
├── TournamentDetailModal.jsx       (modal principal)
├── Tabs/
│   ├── InfoTab.jsx                 (editar información)
│   ├── SolicitudesTab.jsx          (gestionar solicitudes)
│   └── ProgresoTab.jsx             (ver progreso)
└── EditTournamentForm.jsx          (formulario editable)
```

**Modal Structure:**
```
┌──────────────────────────────────┐
│ [INFO] [SOLICITUDES] [PROGRESO]  │  ← Switch de tabs
├──────────────────────────────────┤
│                                  │
│ FORMULARIO EDITABLE:             │
│ - Nombre del torneo              │
│ - Descripción (opcional)         │
│ - Ubicación (obligatorio)        │
│ - Fechas inicio/fin              │
│ - Formato puntuación (Sets/Ptos) │
│ - Categorías (no editable)       │
│ - Canchas y horarios             │
│ - Cupos por categoría            │
│                                  │
│ [GUARDAR]                        │
└──────────────────────────────────┘
```
**Funcionalidades INFO Tab:**
- Mostrar todos los campos rellenados
- Permitir edición
- Botón GUARDAR → actualiza en BD
- Validaciones (igual que CreateTournament)
- Feedback visual de guardado

**APIs:**
- GET `/api/tournaments/:tournamentId` → detalle
- PUT `/api/tournaments/:tournamentId` → actualizar

**Criterios aceptación:**
- ✓ Modal abre al clickear widget
- ✓ Switch entre tabs funciona
- ✓ Formulario editable
- ✓ Ediciones se guardan en BD
- ✓ No rompe inscripciones existentes

---

### **FASE 4: Solicitudes Tab** (2.5 horas)

**Objetivo**: Gestionar solicitudes de participantes

**Archivos a crear:**
```
src/components/TournamentsDashboard/Tabs/
├── SolicitudesTab.jsx             (contenedor)
├── RequestsSection.jsx            (solicitudes recientes)
├── ApprovedSection.jsx            (admitidas/rechazadas)
└── RegistrationRequestCard.jsx    (widget de solicitud)
```

**Sub-sección 1: Solicitudes Recientes**
```
┌──────────────────────────────────┐
│ SOLICITUDES NUEVAS (3 pending)   │
├──────────────────────────────────┤
│                                  │
│ Juan García + María López        │
│ Categoría: A                     │
│ Solicitado: 27 Mar 2026          │
│                                  │
│ [ADMITIR]  [RECHAZAR]            │
│                                  │
└──────────────────────────────────┘
```

**Sub-sección 2: Admitidas/Rechazadas**
```
Filtro: [Todas] [Admitidas] [Rechazadas]

✓ Juan García + María López (Cat: A) - Admitida
✓ Carlos Rodríguez + Ana Martín (Cat: B) - Admitida
✗ Pedro López + Sofia García (Cat: C) - Rechazada
```

**Acciones:**
- Click [ADMITIR]:
  - Crear registro en tournament_registrations (status: approved)
  - Actualizar tournament_progress (+1 equipo)
  - Mover a sección "Admitidas"
  
- Click [RECHAZAR]:
  - Crear registro en tournament_registrations (status: rejected)
  - NO incrementar contador
  - Mover a sección "Rechazadas"

**APIs:**
- GET `/api/tournament-registrations/:tournamentId?status=pending`
- POST `/api/tournament-registrations/:registrationId/approve`
- POST `/api/tournament-registrations/:registrationId/reject`

**Criterios aceptación:**
- ✓ Muestra solicitudes recientes
- ✓ Admitir/Rechazar funciona
- ✓ Data se guarda en tournament_registrations
- ✓ Progreso se actualiza automáticamente
- ✓ Lista de admitidas actualiza en tiempo real

---

### **FASE 5: Progreso Tab + Validaciones** (2 horas)

**Objetivo**: Ver progreso de inscripción por categoría

**Archivos a crear:**
```
src/components/TournamentsDashboard/Tabs/
└── ProgresoTab.jsx
└── CategoryProgressCard.jsx       (card de categoría)
```

**UI de Progreso:**
```
┌────────────────────────────────────────┐
│ CATEGORÍA A                  12/16     │
│ ▓▓▓▓▓▓▓▓░░░░░░░░ (75%)                │
│ Estado: ABIERTA                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ CATEGORÍA B                   4/4      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (100%) ✓             │
│ Estado: LLENA                          │
└────────────────────────────────────────┘
```

**Lógica de colores:**
- 🟢 Verde: 100% (lleno)
- 🟡 Amarillo: 50-99% (parcial)
- 🔴 Rojo: 0-49% (bajo)

**Validación crítica:**
- Si `teams_approved == max_teams_allowed`:
  - Estado → FULL
  - **NO permite más solicitudes** para esa categoría
  - Al usuario que intenta postularse → error "Categoría llena"

**APIs:**
- GET `/api/tournament-progress/:tournamentId`
- Actualización automática al aprobar/rechazar solicitudes

**Criterios aceptación:**
- ✓ Barras se calculan correctamente (% = aprobadas/máximo)
- ✓ Colores cambian según %
- ✓ Cuando categoría llena (100%) → no permite más postulaciones
- ✓ Actualización en tiempo real al admitir/rechazar

---

## 4. LISTA COMPLETA DE COMPONENTES
```
src/pages/
└── TournamentsPage.jsx

src/components/TournamentsDashboard/
├── TournamentsPageLayout.jsx
├── ActiveTournaments.jsx
├── HistoryTournaments.jsx
├── TournamentWidget.jsx
├── TournamentDetailModal.jsx
├── EditTournamentForm.jsx
└── Tabs/
    ├── InfoTab.jsx
    ├── SolicitudesTab.jsx
    │   ├── RequestsSection.jsx
    │   ├── ApprovedSection.jsx
    │   └── RegistrationRequestCard.jsx
    └── ProgresoTab.jsx
        └── CategoryProgressCard.jsx
```

---

## 5. DATOS A GUARDAR EN SUPABASE

### Cuando se APRUEBA una solicitud:
```json
tournament_registrations:
{
  id: uuid,
  tournament_id: uuid,
  team_name: string,
  player1_id: uuid,
  player2_id: uuid,
  category_id: uuid,
  status: "approved",
  requested_at: timestamp,
  decided_at: now(),
  decided_by: organizer_id
}

tournament_progress:
{
  teams_approved: +1,
  status: (recalcular: si teams_approved == max_teams_allowed → "full")
}
```

### Cuando se EDITA un torneo:
```json
tournaments:
{
  // Lo que se edite (name, location, dates, etc)
  updated_at: now()
}

tournament_edits_history:
{
  tournament_id: uuid,
  edited_by: organizer_id,
  field_name: "nombre_del_campo",
  old_value: "...",
  new_value: "...",
  edited_at: now()
}
```

---

## 6. TIMELINE ESTIMADO

| Fase | Descripción | Horas | Acum |
|------|-------------|-------|------|
| 1 | Setup y estructura | 2h | 2h |
| 2 | Vista de torneos | 2.5h | 4.5h |
| 3 | Modal Info Tab | 3h | 7.5h |
| 4 | Solicitudes Tab | 2.5h | 10h |
| 5 | Progreso Tab | 2h | 12h |
| **TOTAL** | | | **12h** |

---

## 7. CRITERIOS DE ACEPTACIÓN (MODIFICADOR + TESTER)

### Modificador
✅ Todas las tablas creadas (tournament_registrations, tournament_progress, tournament_edits_history)
✅ Columna location agregada a tournaments
✅ Todos los componentes listados creados
✅ Cada tab funcional (Info, Solicitudes, Progreso)
✅ Ediciones se guardan en BD
✅ Solicitudes generan registros en tournament_registrations
✅ Progreso se actualiza automáticamente
✅ Sin regresiones en CreateTournament

### Tester
✅ Página carga sin errores
✅ Widget muestra info correcta
✅ Modal abre al clickear widget
✅ Switch entre 3 tabs funciona suave
✅ **INFO Tab**: editar + guardar actualiza BD
✅ **SOLICITUDES Tab**: admitir/rechazar funciona
✅ **PROGRESO Tab**: barras calcula % correcto
✅ Si categoría 100% → error al postularse
✅ Responsive mobile
✅ Sin console errors
✅ Design system preservado

---

## 8. PASOS PREVIOS (MANUAL - CRÍTICO)

**ANTES de que Claude comience, ejecuta en Supabase SQL Editor:**
```sql
-- 1. Agregar location a tournaments
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS location varchar;

-- 2. Crear tabla tournament_registrations
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name varchar NOT NULL,
  player1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  status varchar NOT NULL DEFAULT 'pending',
  inscription_fee float,
  requested_at timestamp NOT NULL DEFAULT now(),
  decided_at timestamp,
  decided_by uuid REFERENCES profiles(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- 3. Crear tabla tournament_progress
CREATE TABLE IF NOT EXISTS tournament_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  max_teams_allowed int NOT NULL,
  teams_registered int NOT NULL DEFAULT 0,
  teams_approved int NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'open',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- 4. Crear tabla tournament_edits_history
CREATE TABLE IF NOT EXISTS tournament_edits_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL REFERENCES profiles(id),
  field_name varchar NOT NULL,
  old_value text,
  new_value text,
  edited_at timestamp NOT NULL DEFAULT now()
);

-- 5. Crear índices
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament 
ON tournament_registrations(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status 
ON tournament_registrations(status);

CREATE INDEX IF NOT EXISTS idx_tournament_progress_tournament 
ON tournament_progress(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournaments_organizer 
ON tournaments(organizer_id);

CREATE INDEX IF NOT EXISTS idx_tournaments_status 
ON tournaments(status);
```

✅ Verifica en Supabase que todas las tablas existan
✅ Verifica que tournaments tiene columna location
✅ ENTONCES: Claude puede comenzar

---

## 9. REFERENCIAS

- DESIGN-SYSTEM-CURRENT.md (mantener estética)
- DATABASE-SCHEMA.md (nuevas tablas ↑)
- TASK-001.md, TASK-002.md (completadas)
- CreateTournamentPage.jsx (reutilizar formulario)