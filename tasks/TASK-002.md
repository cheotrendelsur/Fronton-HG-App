# TASK-002: Rediseño del Sistema de Puntuación en CreateTournament

> **OBJETIVO**: Reemplazar completamente el sistema de puntuación actual por un nuevo sistema modular con Sets y Puntos como modalidades principales.

---

## 1. DESCRIPCIÓN GENERAL

Rediseñar la sección de puntuación en **CreateTournamentPage** para permitir al organizador elegir entre dos modalidades:
- **Sets**: Modalidad tradicional de tenis con sets y games
- **Puntos**: Modalidad de puntos directos

Cada modalidad tendrá sus propios inputs y configuraciones específicas.

---

## 2. ARQUITECTURA DE LA SOLUCIÓN

### 2.1 Componente Principal: ScoringSystemSelector
```
ScoringSystemSelector (componente padre)
├── Switch Principal: "Sets" | "Puntos"
├── Conditional Render:
│   ├── Si Sets → <SetsScoringForm />
│   └── Si Puntos → <PointsScoringForm />
└── Output: scoringConfig (objeto JSON)
```

---

## 3. MODALIDAD SETS

### 3.1 Estructura General
```
SETS (Switch activo)
├── Sub-modalidad selector: "Normal" | "Suma"
└── Conditional render:
    ├── Si Normal → <NormalSetsForm />
    └── Si Suma → <SumaSetsForm />
```

### 3.2 Sub-modalidad: NORMAL (Tradicional)

**Descripción**: Sistema tradicional de tenis.
- Sets totales a jugar entre 2 jugadores
- Games requeridos para ganar cada set

**UI Mockup**:
```
┌─────────────────────────────────┐
│ Sets - Modalidad Normal         │
├─────────────────────────────────┤
│                                 │
│ Sets totales a jugar            │
│ ┌───────────────────────────┐   │
│ │ [____]  (ej: 3)           │   │
│ │ Número de sets totales 
           del partido        │   │
│ └───────────────────────────┘   │
│                                 │
│ Games para ganar cada set       │
│ ┌───────────────────────────┐   │
│ │ [____]  (ej: 6)           │   │
│ │ Mínimo de games para      │   │
│ │ ganar un set              │   │
│ └───────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Inputs**:
```javascript
{
  setsTotal: number,          // 1-5 (mínimo 1, máximo 5)
  gamesPerSet: number,        // 1-12 (típicamente 2, 4, 6, 8, 10, 12)
}
```

**Validaciones**:
- setsTotal >= 1
- gamesPerSet >= 1
- gamesPerSet debe ser >= 1
- todos los inputs admiten unicamente numeros enteros positivos en el rango establecido

**Ejemplo**: 3 sets a 6 games = "Mejor de 3" a 6 juegos

---

### 3.3 Sub-modalidad: SUMA

**Descripción**: Sistema acumulativo donde se suman sets y games totales.
- Sets totales acumulados (suma de ambos jugadores)
- Games totales acumulados por set (suma de ambos jugadores)

**UI Mockup**:
```
┌─────────────────────────────────┐
│ Sets - Modalidad Suma           │
├─────────────────────────────────┤
│                                 │
│ Sets totales a jugar (suma)     │
│ ┌───────────────────────────┐   │
│ │ [____]  (ej: 6)           │   │
│ │ sets totales por partido  │   │
│ │                           │   │
│ └───────────────────────────┘   │
│                                 │
│ Games totales por set (suma)    │
│ ┌───────────────────────────┐   │
│ │ [____]  (ej: 12)          │   │
│ │ Suma de games entre       │   │
│ │ ambos jugadores por set   │   │
│ └───────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Inputs**:
```javascript
{
  setsTotalSum: number,       // 1-10 (suma entre dos jugadores)
  gamesTotalPerSetSum: number, // 2-20 (suma entre dos jugadores)
}
```

**Validaciones**:
- setsTotalSum >= 1
- gamesTotalPerSetSum >= 2

**Ejemplo**: 6 sets a suma 12 games por set el partido puede tener como resultado 9-3 en el primer sets

---

## 4. MODALIDAD PUNTOS

### 4.1 Estructura General
```
PUNTOS (Switch activo)
├── Input: Número de partidos
├── Input: Puntos para ganar
├── Switch Secundario: Regla de cierre
│   ├── "Diferencia de 2"
│   └── "Muerte Súbita / Punto de Oro"
└── Output: pointsConfig
```

### 4.2 UI Mockup
```
┌─────────────────────────────────┐
│ Puntos - Sistema Directo        │
├─────────────────────────────────┤
│                                 │
│ Partidos totales a jugar (suma) │
│ ┌───────────────────────────┐   │
│ │ [____]  (ej: 3)          │   │
│ │ Partidos a ugar en total  │   │
│ │ por ambos equipos         │   │
│ └───────────────────────────┘   │
│                                 │
│ Puntos para ganar un partido    │
│ ┌───────────────────────────┐   │
│ │ [____]  (ej: 21)          │   │
│ │ Puntos mínimos para       │   │
│ │ ganar un partido          │   │
│ └───────────────────────────┘   │
│                                 │
│ Regla de cierre                 │
│ ┌─────────────┬─────────────┐   │
│ │ Diferencia  │  Muerte     │   │
│ │     de 2    │  Súbita     │   │
│ └─────────────┴─────────────┘   │
│ (Switch button)                 │
│                                 │
└─────────────────────────────────┘
```

### 4.3 Inputs

**Partidos totales**:
```javascript
{
  matchesTotalSum: number,    // 1-10 (suma entre ambos equipos)
}
```
- Validación: >= 1

**Puntos para ganar**:
```javascript
{
  pointsToWinMatch: number,   // 5-100 (típicamente 21, 25, 30)
}
```
- Validación: >= 5

### 4.4 Switch Secundario: Regla de Cierre

**Opción 1: Diferencia de 2**
```
Si el marcador llega a igualar (ej: 20-20 en 21 puntos):
- Se sigue jugando hasta que haya diferencia de 2 puntos
- Ejemplo: 22-20 (diferencia de 2) = fin del partido
```

**Opción 2: Muerte Súbita / Punto de Oro**
```
Si el marcador llega a igualar (ej: 20-20 en 21 puntos):
- Se juega UN punto más (point of glory / muerte súbita)
- Quien gane ese punto gana el partido
```

---

## 5. DATOS DE SALIDA (Output)

El componente debe generar un objeto JSON que se guarde en Supabase:
```javascript
// Modalidad Sets - Normal
{
  modalidad: "sets",
  subModalidad: "normal",
  setsTotal: 3,
  gamesPerSet: 6,
}

// Modalidad Sets - Suma
{
  modalidad: "sets",
  subModalidad: "suma",
  setsTotalSum: 2,
  gamesTotalPerSetSum: 4,
}

// Modalidad Puntos - Diferencia
{
  modalidad: "puntos",
  matchesTotalSum: 3,
  pointsToWinMatch: 30,
  closingRule: "diferencia",
}

// Modalidad Puntos - Muerte Súbita
{
  modalida: "puntos",
  matchesTotalSum: 3,
  pointsToWinMatch: 30,
  closingRule: "muerte-subita",
}
```

---

## 6. COMPONENTES A CREAR/MODIFICAR

### 6.1 Nuevos Componentes
```
src/components/ScoringSystem/
├── ScoringSystemSelector.jsx          (componente padre)
├── SetsScoringForm.jsx                (Sets)
│   ├── NormalSetsForm.jsx             (Sub-component)
│   └── SumaSetsForm.jsx               (Sub-component)
├── PointsScoringForm.jsx              (Puntos)
│   └── ClosingRuleSwitch.jsx          (Switch secundario)
└── ScoringPreview.jsx                 (Preview del config)
```

### 6.2 Archivo a Modificar
```
src/pages/CreateTournamentPage.jsx
- Integrar <ScoringSystemSelector />
- Capturar output del scoring
- Enviar a Supabase
```

---

## 7. ESPECIFICACIONES DE UX

### 7.1 Switch Principal (Sets | Puntos)

**Estilo**: Button toggle (como en nav)
```
┌─────────────┬──────────────┐
│   SETS      │   PUNTOS     │
└─────────────┴──────────────┘
      ↑ activo
```

- Click alterna entre modalidades
- Color neon cuando activo (mantener design system)
- Transición suave

### 7.2 Sub-switches (en Sets)
```
┌─────────────┬──────────────┐
│   NORMAL    │    SUMA      │
└─────────────┴──────────────┘
      ↑ activo
```

### 7.3 Input Validation

- En tiempo real (mientras escribe)
- Mostrar error si input inválido
- Deshabilitar submit si algo falta

### 7.4 Preview
```
Mostrar siempre un preview del sistema elegido:
✓ Modalidad Sets - Normal
  Sets: 3 | Games/set: 6
  (Sistema de "Mejor de 3" a 6 juegos)

✓ Modalidad Puntos
  Partidos: 15 | Puntos: 21
  Regla: Diferencia de 2
```

---

## 8. LÍMITES Y RESTRICCIONES

### NO TOCAR
```
✗ CreateTournamentPage estructura general
✗ Navegación entre pasos
✗ Design tokens (colores, tipografía)
✗ Fase 1 validations (si existen)
```

### SÍ MODIFICAR
```
✓ Sección de puntuación (reemplazar)
✓ Agregar nuevos inputs
✓ Agregar validaciones
✓ Cambiar data enviada a Supabase
```

---

## 9. CRITERIOS DE ACEPTACIÓN

### Para Modificador
✅ Componentes creados:
- [ ] ScoringSystemSelector.jsx
- [ ] SetsScoringForm.jsx con NormalSetsForm y SumaSetsForm
- [ ] PointsScoringForm.jsx con ClosingRuleSwitch
- [ ] ScoringPreview.jsx

✅ Funcionalidad:
- [ ] Switch Sets/Puntos funciona
- [ ] Sub-switches en Sets funcionan
- [ ] Inputs aceptan valores correctos
- [ ] Validaciones funcionan
- [ ] Output JSON generado correctamente
- [ ] Integrado en CreateTournamentPage

✅ Datos:
- [ ] Se guarda correctamente en Supabase
- [ ] Schema soporta nueva estructura

### Para Tester
✅ Testing:
- [ ] Todos los switches funcionan
- [ ] Inputs aceptan/rechazan valores correctamente
- [ ] Validaciones muestran mensajes claros
- [ ] Preview actualiza correctamente
- [ ] Data se guarda en Supabase sin errores
- [ ] CreateTournamentPage no tiene regresiones
- [ ] Design system se mantiene (colores, fonts)
- [ ] Sin console errors
- [ ] Responsive en mobile

---

## 10. NOTAS IMPORTANTES

**Para el Modificador:**
- Mantén consistencia con DESIGN-SYSTEM-CURRENT.md
- Usa componentes reutilizables
- Cada sub-componente debe ser testeable independientemente
- Documenta props esperadas

**Para el Tester:**
- Prueba cada combinación de switches
- Verifica inputs con valores límite (0, 999, etc)
- Comprueba que CreateTournamentPage aún funciona al 100%
- Valida data en Supabase después de crear torneo

---

## 11. TIMELINE
```
Análisis:          30 minutos
Componentes:       2 horas
Integración:       1 hora
Testing:           1 hora
Total estimado:    4-4.5 horas
```

---

## 12. REFERENCIAS

- DESIGN-SYSTEM-CURRENT.md (colores, tokens, componentes)
- CreateTournamentPage.jsx (contexto de integración)
- DATABASE-SCHEMA.md (schema de tournamentScoringConfig)