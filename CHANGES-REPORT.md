# CHANGES-REPORT.md — TASK-002
# Rediseño del Sistema de Puntuación — RacketTourneys

**Agente**: Modificador
**Fecha**: 2026-03-27
**Estado**: Completado

---

## Resumen ejecutivo

Se reemplazó completamente el sistema de puntuación de `CreateTournamentPage`. El sistema anterior era un selector plano (`sets` / `points`) con 3 inputs fijos. El nuevo sistema es un componente modular con 2 modalidades (Sets y Puntos), sub-modalidades, validaciones en tiempo real y preview dinámico.

---

## Archivos creados

### `src/components/ScoringSystem/ScoringSystemSelector.jsx`
Componente padre. Gestiona el switch principal Sets/Puntos. Acepta `value` (scoringConfig actual) y `onChange` (setter del padre). Renderiza `SetsScoringForm` o `PointsScoringForm` según la modalidad activa, y `ScoringPreview` con la config actual.

### `src/components/ScoringSystem/SetsScoringForm.jsx`
Gestiona el switch secundario Normal/Suma dentro de Sets. Al cambiar de sub-modalidad llama `onChange(null)` para invalidar la config y forzar re-fill. Renderiza `NormalSetsForm` o `SumaSetsForm`.

### `src/components/ScoringSystem/NormalSetsForm.jsx`
Formulario para Sets - Normal. Inputs:
- `setsTotal`: entero 1–5 (default: 3)
- `gamesPerSet`: entero 1–12 (default: 6)

Usa `useEffect` para sincronizar estado local con el padre. Si ambos valores son válidos, emite:
```json
{ "modalidad": "sets", "subModalidad": "normal", "setsTotal": 3, "gamesPerSet": 6 }
```
Si alguno es inválido, emite `null` (bloquea el submit).

### `src/components/ScoringSystem/SumaSetsForm.jsx`
Formulario para Sets - Suma. Inputs:
- `setsTotalSum`: entero 1–10 (default: 6)
- `gamesTotalPerSetSum`: entero 2–20 (default: 12)

Emite:
```json
{ "modalidad": "sets", "subModalidad": "suma", "setsTotalSum": 6, "gamesTotalPerSetSum": 12 }
```

### `src/components/ScoringSystem/PointsScoringForm.jsx`
Formulario para Puntos. Inputs:
- `matchesTotalSum`: entero 1–10 (default: 3)
- `pointsToWinMatch`: entero 5–100 (default: 21)
- `closingRule`: switch via `ClosingRuleSwitch` (default: 'diferencia')

Emite:
```json
{ "modalidad": "puntos", "matchesTotalSum": 3, "pointsToWinMatch": 21, "closingRule": "diferencia" }
```

### `src/components/ScoringSystem/ClosingRuleSwitch.jsx`
Switch completamente controlado (sin estado interno). Opciones: `diferencia` / `muerte-subita`. Muestra descripción de la regla activa debajo.

### `src/components/ScoringSystem/ScoringPreview.jsx`
Preview en tiempo real de la config. Se muestra debajo de los forms. Presenta:
- Sets/Normal: modalidad, sets totales, games/set, descripción
- Sets/Suma: modalidad, sets suma, games suma, descripción
- Puntos: modalidad, partidos, puntos, regla de cierre, descripción de la regla

---

## Archivos modificados

### `src/pages/CreateTournamentPage.jsx`

**Estado eliminado**:
- `scoreFormat` (string: 'sets' | 'points')
- `setsToPlay` (number)
- `gamesPerSet` (number)
- `pointsToPlay` (number)

**Estado nuevo**:
- `scoringConfig` (object | null, default: null)

**Import agregado**:
- `ScoringSystemSelector` desde `../components/ScoringSystem/ScoringSystemSelector`

**SectionCard "Formato de puntuación"**: Reemplazado de ~35 líneas de JSX inline a:
```jsx
<ScoringSystemSelector value={scoringConfig} onChange={setScoringConfig} />
```

**handleSubmit payload**: Reemplazado de 4 campos (`score_format`, `sets_to_play`, `games_per_set`, `points_to_play`) a 1 campo JSONB:
```js
scoring_config: scoringConfig
```

**Submit disabled**: Añadida condición `|| !scoringConfig` — el botón queda deshabilitado mientras la config sea inválida o null.

---

## Outputs JSON generados

| Modalidad | Sub | JSON |
|-----------|-----|------|
| Sets | Normal | `{ modalidad: "sets", subModalidad: "normal", setsTotal: N, gamesPerSet: N }` |
| Sets | Suma | `{ modalidad: "sets", subModalidad: "suma", setsTotalSum: N, gamesTotalPerSetSum: N }` |
| Puntos | — | `{ modalidad: "puntos", matchesTotalSum: N, pointsToWinMatch: N, closingRule: "diferencia" \| "muerte-subita" }` |

---

## Notas para el Tester

### NOTA IMPORTANTE — DB Migration requerida
El payload de Supabase ahora envía `scoring_config: {...}` (JSONB) en lugar de los 4 campos separados anteriores. Si la tabla `tournaments` en Supabase **no** tiene columna `scoring_config jsonb`, la inserción fallará con error `column "scoring_config" does not exist`.

Acción necesaria en Supabase:
```sql
ALTER TABLE tournaments
  ADD COLUMN scoring_config jsonb,
  DROP COLUMN IF EXISTS score_format,
  DROP COLUMN IF EXISTS sets_to_play,
  DROP COLUMN IF EXISTS games_per_set,
  DROP COLUMN IF EXISTS points_to_play;
```
(O crear solo la columna nueva si se quieren mantener las antiguas por compatibilidad.)

### Flujo de estado
- Al montar cada leaf form, `useEffect` emite inmediatamente los valores por defecto (válidos) → `scoringConfig` se establece con los defaults de Sets/Normal al cargar la página.
- Al cambiar switch principal o sub-switch → `onChange(null)` → `scoringConfig = null` → submit deshabilitado → el nuevo form monta y emite sus defaults.
- Validaciones en tiempo real: si el usuario borra un campo o pone valor fuera de rango, el campo muestra borde rojo + mensaje, y `onChange(null)` bloquea el submit.

### Tokens de diseño usados
Todos los tokens de color usados están definidos en `tailwind.config.js`:
- `bg-neon-900/40`, `border-neon-700`, `text-neon-300`, `shadow-neon-sm` (toggle activo)
- `bg-surface-800`, `border-border-default`, `text-ink-secondary` (toggle inactivo)
- `border-border-subtle` (separador en preview)
- `text-ink-muted`, `text-ink-primary` (textos)
- `red-700`, `red-400` (errores de validación)

---

## Criterios de aceptación — Estado

| Criterio | Estado |
|----------|--------|
| ScoringSystemSelector.jsx creado | ✅ |
| SetsScoringForm.jsx con Normal/Suma | ✅ |
| PointsScoringForm.jsx con ClosingRuleSwitch | ✅ |
| ScoringPreview.jsx | ✅ |
| Switch Sets/Puntos funciona | ✅ |
| Sub-switches en Sets funcionan | ✅ |
| Inputs con validaciones en tiempo real | ✅ |
| Preview actualiza con cada cambio | ✅ |
| Output JSON correcto por modalidad | ✅ |
| Integrado en CreateTournamentPage | ✅ |
| Design system mantenido | ✅ |
| DB migration documentada | ⚠️ Pendiente ejecución |
