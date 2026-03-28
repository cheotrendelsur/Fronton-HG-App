# TASK-001: Limpieza de código muerto (Dead Code)

> **OBJETIVO ÚNICO Y ESTRICTO**: Eliminar código no utilizado preservando 100% de funcionalidad y estética.

---

## 1. DESCRIPCIÓN GENERAL

Esta tarea consiste en una **limpieza exhaustiva de código muerto** del proyecto RacketTourneys.

**Scope**: Remover código que:
- No se usa en ninguna parte de la aplicación
- Es código duplicado/redundante (mismo propósito, múltiples implementaciones)
- Es código comentado extenso (debug, ejemplos viejos)
- Son imports sin usar en módulos
- Son variables/funciones definidas pero nunca llamadas
- Son hooks/utilidades obsoletas

**NOtat importante**: Esta tarea es **exclusivamente de limpieza**. NO hay refactoring, NO hay nuevas features, NO hay cambios de lógica.

---

## 2. LÍMITES ABSOLUTOS (NO TOCAR)

### 2.1 Funcionalidad Phase 1 — INTACTA
```
✗ Auth (login, signup, verificación)
✗ Roles y Guards (admin, organizer, player)
✗ OnboardingPage
✗ Admin Panel (aprobación/rechazo de torneos)
✗ CreateTournament
✗ Dashboard (con datos mock está bien)
✗ PWA configuration
```

**Regla**: Si algo está en Phase 1 y funciona, NO lo tocas. Ni siquiera refactorices.

### 2.2 Estética — SIN CAMBIOS
```
✗ Colores (design tokens)
✗ Tipografía
✗ Componentes visuales
✗ Layout/estructura
✗ Animaciones
```

**Regla**: El usuario no debe ver NINGÚN cambio visual.

### 2.3 Carpetas/Archivos a IGNORAR
```
public/                    ← Nunca tocar
node_modules/             ← Nunca tocar
.git/                      ← Nunca tocar
package.json              ← NO cambiar versiones
tailwind.config.js        ← Tocar solo si hay imports muertos
index.css                 ← Tocar solo si hay CSS muerto
.env.example              ← Nunca tocar
```

---

## 3. CATEGORÍAS DE CÓDIGO A ELIMINAR

### 3.1 Dead Code Obvio
```
- Funciones definidas pero nunca llamadas
- Variables asignadas pero nunca usadas
- Componentes importados pero nunca renderizados
- useEffect listeners sin referencias
- console.log() de debug
- Código comentado de múltiples líneas (comentarios útiles SÍ se mantienen)
```

**Ejemplos**:
```javascript
// ❌ ELIMINAR
const oldFormatter = (date) => { ... }  // nunca usada
console.log("DEBUG:", data);            // debug
/* 
  OLD IMPLEMENTATION:
  ... 20 líneas de código comentado ...
*/

// ✅ MANTENER
// Este hook sincroniza auth con localStorage — crítico para PWA
useEffect(() => { ... }, []);
```

### 3.2 Imports Sin Usar
```
import { unusedFunction } from './utils';
import React from 'react';  // Si no se usa JSX en el archivo
```

### 3.3 Código Duplicado/Redundante
```
- Dos versiones del mismo hook (ej: useVisibilityRefresh + listener en AuthContext)
- Dos utilidades que hacen lo mismo con nombres diferentes
- Props duplicadas que se pasan pero nunca se usan
```

### 3.4 Props Sin Usar
```jsx
// ❌ ELIMINAR
<Dashboard data={data} unusedProp="value" />
// En Dashboard: nunca se usa unusedProp

// ✅ MANTENER
<Dashboard data={data} />
```

### 3.5 Variables Locales Sin Usar
```javascript
// ❌ ELIMINAR
const [unused, setUnused] = useState(null);

// ✅ MANTENER
const [formData, setFormData] = useState({});  // Se usa en el form
```

---

## 4. PROCESO DE LIMPIEZA

### 4.1 Análisis (Orden sugerido)
```
1. Revisar archivos src/hooks/
   - ¿Cada hook se importa en algún lado?
   - ¿Hay lógica duplicada entre hooks?
   
2. Revisar src/utils/
   - ¿Cada función se usa?
   - ¿Hay utilidades obsoletas?
   
3. Revisar src/components/
   - ¿Cada componente se importa?
   - ¿Hay componentes placeholder sin lógica?
   
4. Revisar src/pages/
   - ¿Hay imports sin usar?
   - ¿Hay variables declaradas pero sin usar?
   
5. Revisar index.css
   - ¿Hay CSS classes sin usar?
```

### 4.2 Verificación ANTES de eliminar
```
REGLA: Busca en TODA la app antes de eliminar algo.

Ejemplo:
┌─ Voy a eliminar useVisibilityRefresh.js
├─ Busco: "useVisibilityRefresh" en TODO el codebase
├─ Resultado: No encontrado en ningún lado ✓
└─ Puedo eliminarlo ✓

Otro ejemplo:
┌─ Voy a eliminar función oldFormatter() en utils/dateHelpers.js
├─ Busco: "oldFormatter" en TODO el codebase
├─ Resultado: Encontrado en AdminPanel.jsx (línea 45) ✗
└─ NO puedo eliminarlo (se usa)
```

---

## 5. ARCHIVOS A REVISAR PRIORITARIAMENTE

| Archivo | Prioridad | Qué buscar |
|---------|-----------|-----------|
| `src/hooks/useVisibilityRefresh.js` | 🔴 ALTA | ¿Se usa? ¿Es duplicado de AuthContext? |
| `src/utils/` | 🔴 ALTA | Funciones sin llamadas |
| `src/components/` | 🟠 MEDIA | Componentes sin importar |
| `src/pages/` | 🟠 MEDIA | Imports sin usar |
| `tailwind.config.js` | 🟡 BAJA | Classes CSS no usadas |
| `index.css` | 🟡 BAJA | Selectors CSS muertos |

---

## 6. CRITERIOS DE ACEPTACIÓN

✅ **La tarea se considera COMPLETA cuando:**
```
1. ✓ No hay funciones/variables sin usar
2. ✓ No hay imports sin usar
3. ✓ No hay código comentado extenso (solo comentarios útiles)
4. ✓ No hay console.log() de debug
5. ✓ NO hay cambios en funcionalidad Phase 1
6. ✓ NO hay cambios visuales
7. ✓ npm install ejecuta sin errores
8. ✓ Todos los componentes Phase 1 cargan sin errores
9. ✓ CLEANUP-REPORT.md generado con detalles
10. ✓ Cada cambio justificado y verificado
```

---

## 7. QUÉ GENERAR (Outputs)

### 7.1 CLEANUP-REPORT.md
Archivo que documenta:
```
## Código Eliminado
- Archivo: src/hooks/useVisibilityRefresh.js
  Razón: Lógica duplicada en AuthContext.useEffect
  Búsqueda: No encontrado en imports de la app
  Seguro: SÍ

- Archivo: src/utils/oldFormatter.js
  Razón: Función nunca llamada
  Búsqueda: Verificado en 50+ archivos
  Seguro: SÍ

## Imports Removidos
- En src/pages/Dashboard.jsx
  Removido: import { unused } from '../utils'
  Razón: Variable nunca usada
  
## Código Comentado Eliminado
- En src/components/AdminPanel.jsx (líneas 45-65)
  Eliminado: 20 líneas de implementación vieja
  
## Resultado Final
- Archivos modificados: 8
- Líneas eliminadas: 250+
- Funcionalidad preservada: 100% ✓
- Errores encontrados: 0
```

---

## 8. NOTAS IMPORTANTES

**Para el Modificador:**

- Sé **meticuloso** en la búsqueda. No asumas.
- Usa **Ctrl+F (Find in Files)** en VS Code para buscar usos.
- Si hay **duda**, reporta como "posible eliminar" en CLEANUP-REPORT.md en lugar de eliminar.
- **Cada eliminación** debe tener justificación.
- **Después de cada cambio**, verifica que no rompiste imports.

**Para el Tester:**

- Verifica que **npm install** ejecuta sin errores.
- Prueba que **Auth funciona** (login, signup).
- Verifica que **Dashboard carga** (aunque sea con datos mock).
- Prueba que **Admin panel funciona** (botones de aprobar/rechazar).
- Verifica que **CreateTournament funciona**.
- Revisa **CLEANUP-REPORT.md** — cada cambio tiene justificación.
- Si encuentras un import roto → es un error de la limpieza.

---

## 9. TIMELINE
```
Análisis:          30-45 minutos
Limpieza:          1-2 horas
Testing:           30 minutos
Total estimado:    2-3 horas
```

---

## 10. REFERENCIAS

- Ver: DESIGN-SYSTEM-CURRENT.md (qué NO cambiar)
- Ver: CLAUDE.md (arquitectura del proyecto)
- Ver: Phase 1 features en CLAUDE.md