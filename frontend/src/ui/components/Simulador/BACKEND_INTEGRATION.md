# Integración con Backend — Simuladores 3D PIPRE

## Estado Actual (Junio 2026)

Los simuladores, el ranking, la gestión de retos y la autenticación están **conectados al backend real**. Solo quedan como mock los endpoints que el backend aún no expone (ranking histórico global).

**Backend real**: `https://pipre-backend.yoshua-cloud.dedyn.io/api/v1`

## Convenciones Generales

- **Autenticación**: JWT Bearer via `axiosInstance.ts` interceptor (excepto login/register)
- **Roles**: `DOCENTE` puede CRUD cursos; `ESTUDIANTE` puede leer cursos y enviar resultados
- **IDs**: `VARCHAR(255)` — UUIDs devueltos por backend
- **CamelCase**: Backend devuelve `idCourse`, `idModule`, `idLesson`, `idActivity`, `firstName`, `lastName`
- **Simulaciones**: El request body usa snake_case (`id_student`, `id_activity`, `result`), igual que la respuesta (`id_simulation`, `result`)

---

## 1. Endpoints del API Real — Estado

### Autenticación ✅
| Método | Endpoint | Estado |
|--------|----------|--------|
| `POST` | `/auth/login` | ✅ 200, devuelve JWT string |
| `POST` | `/users` | ✅ 201, devuelve UUID string |
| `GET` | `/auth/me` | ✅ Funciona |

### Cursos ✅
| Método | Endpoint | Estado |
|--------|----------|--------|
| `GET` | `/courses` | ✅ 200, `[{idCourse, name, description?, level?}]` |
| `POST` | `/courses` | ✅ 201 |
| `PUT` | `/courses` | ✅ 200 |
| `DELETE` | `/courses/{id}` | ✅ 200 |

### Módulos, Lecciones, Actividades ✅
| Método | Endpoint | Estado |
|--------|----------|--------|
| `GET` | `/modules/course/{idCourse}` | ✅ `[{idModule, title}]` |
| `GET` | `/lessons/module/{idModule}` | ✅ `[{idLesson, title}]` |
| `GET` | `/activities/lesson/{idLesson}` | ✅ `[{idActivity, name}]` |
| `POST` | `/activities` | ❌ **BUG**: Falla 400 — `CreateActivityCommand` DTO no incluye `logicLevel`, pero columna DB `logic_level` es NOT NULL |

### Simulaciones (usado como store de retos) ✅
| Método | Endpoint | Estado |
|--------|----------|--------|
| `POST` | `/simulations` | ✅ 201 — body: `{id_student, id_activity, result}` |
| `GET` | `/simulations/user/{userId}` | ✅ 200 — `[{id_simulation, result}]` (NO incluye `id_activity`) |

### Resultados de Actividades ✅
| Método | Endpoint | Estado |
|--------|----------|--------|
| `POST` | `/activity-results` | ✅ 201 (con JWT) |
| `GET` | `/activity-results/user/{idStudent}` | ✅ Existe (no usado actualmente) |

### Grupos / Ranking ✅
| Método | Endpoint | Estado |
|--------|----------|--------|
| `GET` | `/group-students/{idGroup}` | ✅ 200 — `[{idStudent, totalPoints, position}]` |
| `POST` | `/group-students` | ✅ Existe |

---

## 2. Endpoints Faltantes en el Backend (frontend usa workarounds)

| Endpoint Faltante | Workaround en Frontend |
|-------------------|------------------------|
| `GET/POST/PUT/DELETE /challenges/*` | Todo el CRUD de retos se hace via `POST /simulations` + `GET /simulations/user/{userId}`. El `result` JSON contiene `{type: "challenge", courseId, title, ...}`. Soft-delete via `deleted: true`. |
| `GET /ranking/curso/{id}` / `GET /ranking/global` | `RankingPage.tsx` usa `GET /group-students/{idGroup}` + localStorage fallback (`pipre_results`) |
| `POST/GET /ensamblaje*` | No implementado — port assignments guardados en localStorage (`pipre_assignments`) |

---

## 3. Puntos de Integración en el Código

### `infrastructure/api/apiService.ts`
- **`simulations.postResult()`** → `POST /simulations` — guarda/actualiza retos y resultados de simulación
- **`simulations.getByUser(userId)`** → `GET /simulations/user/{userId}` — carga retos
- **`activities.getByLesson(lessonId)`** → `GET /activities/lesson/{idLesson}` — workaround para obtener `idActivity` (reemplaza a `activities.create()` que está roto)
- **`courses.getAll/create/update/delete`** → endpoints correspondientes
- **`modules.getByCourse(courseId)`** → `GET /modules/course/{idCourse}`
- **`lessons.getByModule(moduleId)`** → `GET /lessons/module/{idModule}`
- **`results.postResult()`** → `POST /activity-results`
- **`ranking.getGroupRanking(groupId)`** → `GET /group-students/{idGroup}`

### `application/usecases/SimuladorUseCase.ts`
- **`loadChallengesByCourse()`**: Usa `getAuthState().user.id` (UUID real desde registro) para llamar a `GET /simulations/user/{userId}`. Deduplica por `id_activity` (parseado de `result` JSON), conserva último `id_simulation`.
- **`saveResult()`**: Guarda en localStorage (`pipre_results`) como fallback. Cuando se envíe al backend, usa `POST /activity-results`.

### `ui/pages/DocenteRetosPage.tsx`
- **Crear reto**: `handleChallengeSubmit()` — usa `GET /activities/lesson/{idLesson}` para obtener `idActivity` (workaround), luego guarda via `POST /simulations` con `result: JSON.stringify({type:"challenge", courseId, title, ...})`
- **Listar retos**: `fetchChallengesByCourse()` — `GET /simulations/user/{userId}`, parsea `result` JSON, filtra por `type==="challenge" && courseId===courseId && !deleted`
- **Eliminar reto**: `handleDeleteChallenge()` — soft-delete via `POST /simulations` con `result: JSON.stringify({deleted:true, type:"challenge", courseId})`
- **Reordenar**: `moveChallengeOrder()` — actualiza `order` en el `result` JSON y persiste via `POST /simulations`

### `ui/pages/CursosPage.tsx`
- **fetchChallenges**: Ahora usa `GET /simulations/user/{userId}` con parsing de JSON (mismo approach que DocenteRetosPage)

### `ui/pages/RankingPage.tsx`
- **fetchRanking**: `GET /group-students/{idGroup}` → mapea `RankingDTO` a `RankingEntry`. Fallback: `localStorage pipre_results` + `MOCK_RANKING_SEED`.

### `ui/pages/LoginPage.tsx`
- Formularios en camelCase (`firstName`, `lastName`). Registro captura UUID y lo guarda en `localStorage pipre_registered_users`.

### `infrastructure/adapters/http/AuthAdapter.ts`
- `register()`: Envía camelCase, recibe UUID, lo guarda en `pipre_registered_users` en localStorage
- `login()`: Busca UUID en localStorage por email del JWT (los usuarios creados antes de este fix no tienen UUID, no pueden usar simulaciones)

---

## 4. Flujo Completo (con Backend)

```
1. Docente crea/edita reto en DocenteRetosPage
   → GET /activities/lesson/{idLesson} (para obtener idActivity)
   → POST /simulations (guarda reto como JSON en result)

2. Estudiante ingresa a /cursos
   → GET /courses
   → GET /simulations/user/{userId} (carga retos, filtra por courseId, type="challenge")

3. Estudiante programa y ejecuta en simulador
   → feedback visual/sonoro local (100% frontend)

4. Estudiante completa reto
   → POST /activity-results (guarda puntaje)
   → localStorage pipre_results (fallback)

5. Ranking
   → GET /group-students/{idGroup} → renderiza top 3 + tabla
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

---

## 6. Bugs Conocidos y Workarounds

### `POST /activities` — Falla 400 🐛
- **Causa**: `CreateActivityCommand` DTO no incluye `logicLevel`, pero columna DB `logic_level` tiene `NOT NULL`
- **Workaround**: Usar `GET /activities/lesson/{idLesson}` para obtener un `idActivity` existente y reutilizarlo como placeholder. Todos los retos se diferencian por `type: "challenge"` en el `result` JSON, no por `id_activity`.
- **Fix permanente**: El backend debe agregar `logicLevel` al DTO o hacer la columna nullable.

### `GET /simulations/user/{userId}` — No devuelve `id_activity`
- **Causa**: La respuesta solo incluye `id_simulation` y `result`
- **Workaround**: Parsear `result.idActivity` desde el JSON y deduplicar por ese campo, manteniendo el último `id_simulation` por grupo.
- **Impacto**: El reordenamiento de retos requiere parsear todos los resultados para encontrar el match.

### Usuarios sin UUID en localStorage
- **Causa**: Usuarios registrados antes de implementar `pipre_registered_users` no tienen UUID asociado
- **Impacto**: No pueden usar simulaciones
- **Fix**: Solo aplica a usuarios legacy. Nuevos registros guardan UUID automáticamente.

---

## 7. Controladores Java (Backend)

| Controlador | Endpoints | Estado |
|-------------|-----------|--------|
| `AuthController` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | ✅ |
| `CourseController` | `GET/POST/PUT/DELETE /courses` | ✅ |
| `ActivityResultController` | `POST /activity-results`, `GET /activity-results/user/{id}` | ✅ |
| `SimulationController` | `POST /simulations`, `GET /simulations/user/{id}` | ✅ |
| `GroupStudentController` | `GET /group-students/{id}`, `POST /group-students` | ✅ |

### Controladores a implementar (futuro)

| Controlador | Endpoints | Prioridad |
|-------------|-----------|-----------|
| `ChallengeController` | `GET/POST/PUT/DELETE /challenges`, `GET /challenges/course/{id}` | Alta (eliminaría workaround de simulations) |
| `EnsamblajeController` | `POST/GET /ensamblaje` | Media (persistencia real de hardware) |
