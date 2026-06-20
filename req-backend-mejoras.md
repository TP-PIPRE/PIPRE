# Mejoras futuras para el Backend

Basado en el análisis del código fuente real del backend (`backend/src/main/java/com/pipre/backend/`) y los contratos que el frontend espera.

## Prioridad Alta (necesario para features actuales del frontend)

### 1. Endpoint `GET /api/v1/activities/{id}`

El repositorio ya soporta `findById()` pero no hay controller ni use case expuesto.

**Controller a crear:**
```java
@GetMapping("/api/v1/activities/{idActivity}")
public ActivityDTO getById(@PathVariable String idActivity)
```

**Response actual:**
```json
{ "idActivity": "uuid", "name": "Actividad X" }
```

**Response deseado (ver punto 2):**
```json
{
  "idActivity": "uuid",
  "name": "Actividad X",
  "complexity": "MEDIUM",
  "difficulty": "EASY",
  "logicLevel": 2,
  "type": "robotics",
  "environment": "obstacle",
  "missions": [
    { "id": "m1", "title": "Llegar al otro lado", "objective": "Cruza el puente", "maxBlocks": 10 }
  ],
  "startingPosition": { "x": 0, "z": 0 },
  "targetPosition": { "x": 30, "z": 0 }
}
```

---

### 2. Enriquecer `ActivityDTO`

Actualmente `ActivityDTO` solo tiene `{idActivity, name}`. La entidad `ActivityJpaEntity` tiene más campos en la base de datos (`logicLevel`) y el spec espera muchos más.

**Campos a añadir:**

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `complexity` | String (enum) | `"EASY"`, `"MEDIUM"`, `"HARD"` |
| `difficulty` | String (enum) | `"EASY"`, `"MEDIUM"`, `"HARD"` |
| `logicLevel` | Integer | `2` |
| `type` | String (enum) | `"robotics"`, `"theoretical"`, `"quiz"` |
| `environment` | String | `"obstacle"`, `"maze"`, `"battle"`, `"space"` |
| `missions` | Array | `[{id, title, objective, maxBlocks}]` |
| `startingPosition` | Object | `{x: number, z: number}` |
| `targetPosition` | Object | `{x: number, z: number}` |

**Nota:** Si estos campos no existen en la tabla `activity`, se deben agregar como columnas nuevas o como tablas relacionadas (ej: `mission`).

---

### 3. Endpoint `POST /api/v1/performance/rating`

Los DTO `RatingRequestDTO` y `RatingResponseDTO` ya existen en `adapters/in/web/dto/` pero **no hay controller que los use**.

Este endpoint es parte del flujo FE-08: el frontend envía el resultado de una actividad y el backend debe:
1. Recibir `{idActivity, idResult, idHelpRequest}`
2. Opcionalmente, orquestar la llamada a la IA (`POST /code-feedback/analyze`) para obtener feedback
3. Devolver `{result, accuracy, precision}`

**Controller a crear:**
```java
@PostMapping("/api/v1/performance/rating")
public RatingResponseDTO rate(@RequestBody RatingRequestDTO request)
```

---

### 4. Enriquecer `POST /api/v1/simulations` — Request

Actualmente solo acepta `{result, idStudent, idActivity}`. Debería aceptar datos completos de simulación:

```json
{
  "idStudent": "uuid",
  "idActivity": "uuid",
  "blocklyCode": "...",
  "pseudocode": "...",
  "pseintDiagram": "...",
  "blocksUsage": 5,
  "codeUsage": 3,
  "sensorError": 0.1,
  "resolutionTime": 45000,
  "environment": "obstacle",
  "missions": [...],
  "startingPosition": { "x": 0, "z": 0 },
  "targetPosition": { "x": 30, "z": 0 },
  "result": "SUCCESS"
}
```

---

### 5. Enriquecer `SimulationDTO` — Response

Actualmente solo devuelve `{idSimulation, result}`. Debería devolver:

```json
{
  "idSimulation": "uuid",
  "student": { "idUser": "uuid", "firstName": "...", "lastName": "..." },
  "activity": { "idActivity": "uuid", "name": "..." },
  "environment": "obstacle",
  "missions": [...],
  "startingPosition": { "x": 0, "z": 0 },
  "targetPosition": { "x": 30, "z": 0 },
  "result": "SUCCESS",
  "predictedScore": 85
}
```

---

### 6. Enriquecer `ResultDTO`

Actualmente solo devuelve `{idActivity, score}`. Debería incluir:

```json
{
  "idResult": "uuid",
  "idStudent": "uuid",
  "idActivity": "uuid",
  "score": 95,
  "attempts": 3,
  "date": "2026-06-19T10:30:00Z"
}
```

---

### 7. Controladores faltantes (domain/repo existen, controller no)

| Endpoint | Domain existe | Repo existe | Controller |
|----------|:------------:|:-----------:|:----------:|
| `GET/POST /api/v1/help-requests` | ✅ `HelpRequest` | ✅ `HelpRequestJpaRepository` | ❌ |
| `GET /api/v1/help-requests/{idStudent}` | ✅ | ✅ | ❌ |
| `POST /api/v1/module-progress` | ✅ `ModuleProgress` | ✅ `ModuleProgressJpaRepository` | ❌ |
| `GET /api/v1/module-progress/user/{idStudent}` | ✅ | ✅ | ❌ |
| `GET /api/v1/dropout-risk/{idStudent}` | ✅ `DropoutRisk` | ✅ `DropoutRiskJpaRepository` | ❌ |

---

## Prioridad Media (mejoras de completitud)

### 8. Endpoint `GET /api/v1/groups/{idGroup}`

`GroupRepositoryPort.findById()` existe pero no hay controller.

```java
@GetMapping("/api/v1/groups/{idGroup}")
public GroupDTO getById(@PathVariable String idGroup)
```

### 9. Añadir `description` a `GroupDTO`

Actualmente: `{idGroup, groupName}`. Deseado: `{idGroup, groupName, description}`.

Requiere agregar columna `description` en la tabla `grupo` y en `GroupJpaEntity`.

---

## Prioridad Baja (a futuro)

### 10. CRUD completo
- `DELETE /api/v1/activities/{id}`, `PUT /api/v1/activities/{id}`
- `DELETE /api/v1/courses/{id}`, `DELETE /api/v1/modules/{id}`, etc.
- `PATCH` endpoints para actualizaciones parciales

### 11. Relación Grupos ↔ Actividades (opcional)
Si se desea el flujo "Grupo → Actividades" del spec original, se necesita una nueva tabla/relación entre `grupo` y `activity`. Actualmente no existe.

### 12. Paginación en endpoints de listado
`GET /api/v1/courses`, `GET /api/v1/activities/lesson/{id}`, etc. deberían soportar paginación.

---

## Resumen de endpoints a crear

| Método | Endpoint | Prioridad |
|--------|----------|-----------|
| `GET` | `/api/v1/activities/{idActivity}` | 🔴 Alta |
| `POST` | `/api/v1/performance/rating` | 🔴 Alta |
| `POST` | `/api/v1/help-requests` | 🔴 Alta |
| `GET` | `/api/v1/help-requests/{idStudent}` | 🔴 Alta |
| `POST` | `/api/v1/module-progress` | 🔴 Alta |
| `GET` | `/api/v1/module-progress/user/{idStudent}` | 🔴 Alta |
| `GET` | `/api/v1/dropout-risk/{idStudent}` | 🔴 Alta |
| `GET` | `/api/v1/groups/{idGroup}` | 🟡 Media |
| `PUT` | `/api/v1/activities/{id}` | 🟢 Baja |
| `DELETE` | `/api/v1/activities/{id}` | 🟢 Baja |
