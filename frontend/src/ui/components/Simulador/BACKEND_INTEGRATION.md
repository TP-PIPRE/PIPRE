# Integración con Backend — Simuladores 3D PIPRE

## Estado Actual

Los simuladores funcionan **100% con datos mock en frontend**. No hay dependencia de backend para operar. Esta guía documenta cada punto de integración para conectar con el backend real.

**Backend real**: `https://pipre-backend.yoshua-cloud.dedyn.io/api/v1`

## Convenciones Generales

- **Autenticación**: Todas las requests deben incluir header `Authorization: Bearer <jwt>` (excepto login/register)
- **Roles**: `DOCENTE` puede CRUD cursos; `ESTUDIANTE` puede leer cursos y enviar resultados
- **IDs**: tipo `VARCHAR(255)` para compatibilidad con UUIDs o IDs alfanuméricos

---

## 1. Endpoints del API Real

### Cursos
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/api/v1/courses` | Todos los cursos |
| `GET` | `/api/v1/courses/{id}` | Curso por ID |
| `POST` | `/api/v1/courses` | Crear curso |
| `PUT` | `/api/v1/courses` | Actualizar curso |
| `DELETE` | `/api/v1/courses/{id}` | Eliminar curso |

### Resultados de Actividades
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/v1/activity-results` | Guardar resultado (usado por simulador) |
| `GET` | `/api/v1/activity-results/user/{idStudent}` | Resultados de un estudiante |

### Simulaciones
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/v1/simulations` | Guardar simulación |
| `GET` | `/api/v1/simulations/user/{idStudent}` | Simulaciones de un estudiante |

### Grupos / Ranking
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/api/v1/group-students/{idGroup}` | Estudiantes de un grupo (usado para ranking) |
| `POST` | `/api/v1/group-students` | Agregar estudiante a grupo |

### Autenticación
| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/v1/auth/login` | Iniciar sesión |
| `POST` | `/api/v1/auth/register` | Registrar usuario |
| `GET` | `/api/v1/auth/me` | Usuario actual desde token |

---

## 2. Endpoints Faltantes en el Backend (frontend solo mock)

Estos endpoints **NO existen** en el backend real. El frontend usa datos mock en memoria:

| Endpoint Faltante | Estado Actual | Frontend |
|-------------------|---------------|----------|
| `GET/POST/PUT/DELETE /api/v1/challenges/*` | No existe | `DocenteRetosPage.tsx` usa mock en localStorage |
| `POST /api/v1/resultados` | No existe | `SimuladorUseCase.ts` usa mock en memoria (`mockResults`) |
| `GET /api/v1/resultados/estudiante/{id}` | No existe | No usado (removido de apiService) |
| `GET /api/v1/resultados/curso/{id}` | No existe | No usado (removido de apiService) |
| `GET /api/v1/ranking/curso/{id}` | No existe | No usado (removido de apiService) |
| `GET /api/v1/ranking/global` | No existe | No usado (removido de apiService) |
| `POST/GET /api/v1/ensamblaje*` | No existe | No implementado |

---

## 3. Puntos de Integración en el Código

### `application/usecases/SimuladorUseCase.ts`
- **`saveResult()`** (línea 210): Actualmente guarda en `mockResults[]` en memoria (array local).
  **Conexión real**: Reemplazar con `apiService.results.postResult({ id_student, id_activity, score, attempts })`
  → `POST /api/v1/activity-results`
- **`loadChallengesByCourse()`** (línea 64-81): Retorna `MOCK_CHALLENGES` estático.
  Endpoint real NO existe; queda como mock hasta que el backend implemente `GET /api/v1/challenges/course/{id}`.
- **`getCourseRanking()`** y **`getGlobalRanking()`**: Removidos de `apiService.ts`. Ranking ahora usa `apiService.ranking.getGroupRanking()`.

### `application/context/SimuladorProvider.tsx`
- **`completeChallenge()`**: Llama a `simuladorUseCase.saveResult()`. Cuando se implemente backend, el saveResult enviará a `POST /api/v1/activity-results`.

### `ui/pages/RankingPage.tsx`
- Llama a `apiService.ranking.getGroupRanking("group-1")` → `GET /api/v1/group-students/{idGroup}`
- **Mock fallback**: `MOCK_RANKING_SEED` (5 estudiantes) en caso de error de red.

### `ui/pages/DocenteRetosPage.tsx`
- **Puramente mock**: CRUD de retos en localStorage.
- Backend NO tiene endpoints de challenges; esta página quedará mock hasta que se implementen.

### `ui/pages/Simulador.tsx`
- **Línea 63**: `loadChallengeFromCourse(courseId)` — mock, parámetro viene de la ruta `/simulador/{courseId}`.

---

## 4. Flujo Completo (con Backend)

```
1. Docente crea curso → POST /api/v1/courses
2. Docente crea retos → (MOCK: localStorage, sin backend)
3. Estudiante ingresa a /cursos → GET /api/v1/courses
4. Estudiante ve retos → (MOCK: SimuladorUseCase.loadChallengesByCourse)
5. Estudiante programa y ejecuta → feedback visual/sonoro local
6. Estudiante completa TODAS las misiones → se calcula puntaje
7. Se envía resultado → POST /api/v1/activity-results
8. Ranking carga datos → GET /api/v1/group-students/{idGroup}
```

---

## 5. Modelo de Base de Datos (actividad-resultados)

```sql
CREATE TABLE activity_result (
  id          SERIAL PRIMARY KEY,
  id_student  VARCHAR(255) NOT NULL,
  id_activity VARCHAR(255) NOT NULL,
  score       INT NOT NULL DEFAULT 0,
  attempts    INT DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_student, id_activity)
);
```

**Lógica de upsert (conservar mayor puntaje):**
```sql
INSERT INTO activity_result (id_student, id_activity, score, attempts)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  score = GREATEST(score, VALUES(score)),
  attempts = attempts + 1;
```

---

## 6. Cómo Activar el Backend

### Controladores Java existentes en el backend real

| Controlador | Endpoints | Estado |
|-------------|-----------|--------|
| `AuthController` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | ✅ Existe |
| `CourseController` | `GET/POST/PUT/DELETE /courses` | ✅ Existe |
| `ActivityResultController` | `POST /activity-results`, `GET /activity-results/user/{id}` | ✅ Existe |
| `SimulationController` | `POST /simulations`, `GET /simulations/user/{id}` | ✅ Existe |
| `GroupStudentController` | `GET /group-students/{id}`, `POST /group-students` | ✅ Existe |

### Controladores a implementar en el backend

| Controlador | Endpoints | Prioridad |
|-------------|-----------|-----------|
| `ChallengeController` | `GET/POST/PUT/DELETE /challenges`, `GET /challenges/course/{id}` | Alta (desbloquea editor de retos) |
| `EnsamblajeController` | `POST/GET /ensamblaje` | Media (persistencia de hardware) |

### Pasos de activación

1. **Autenticación JWT** ya funciona.
2. **Courses** ya funciona.
3. **Activity-results** ya funciona — conectar `SimuladorUseCase.saveResult()`.
4. **Group-students** ya funciona — RankingPage ya conectado.
5. **Challenges** no existe — queda mock hasta implementar `ChallengeController`.
6. **Ensamblaje** no existe — queda pendiente para versión futura.
