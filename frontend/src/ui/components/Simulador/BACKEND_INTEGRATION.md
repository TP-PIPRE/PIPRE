# Integración con Backend — Simuladores 3D PIPRE

## Estado Actual

Actualmente los simuladores funcionan **100% con datos mock en frontend**. No hay dependencia de backend para operar. Esta guía documenta cada punto de integración necesario para conectar con el backend real.

## Convenciones Generales

- **Base URL**: `/api/v1`
- **Autenticación**: Todas las requests deben incluir header `Authorization: Bearer <jwt>` (excepto login/register)
- **Roles**: `DOCENTE` puede CRUD cursos y retos; `ESTUDIANTE` puede leer cursos/retos y enviar resultados
- **Formato respuesta error**: `{ "error": string, "message": string, "status": number }`
- **IDs**: tipo `VARCHAR(255)` para compatibilidad con UUIDs o IDs alfanuméricos

---

## 1. Endpoints del API

### Cursos

| Método | Endpoint | Propósito | Rol |
|--------|----------|-----------|-----|
| `GET` | `/api/v1/courses` | Obtener todos los cursos | Ambos |
| `GET` | `/api/v1/courses/{id}` | Obtener un curso por ID | Ambos |
| `POST` | `/api/v1/courses` | Crear nuevo curso | DOCENTE |
| `PUT` | `/api/v1/courses/{id}` | Actualizar curso existente | DOCENTE |
| `DELETE` | `/api/v1/courses/{id}` | Eliminar curso | DOCENTE |

**CourseRequestDTO (frontend → backend):**
```typescript
interface CourseRequestDTO {
  name: string;
  description: string;
  level: "BASIC" | "INTERMEDIATE" | "ADVANCED";
}
```

**CourseResponseDTO (backend → frontend):**
```typescript
interface CourseResponseDTO {
  id_course: string;
  name: string;
  description?: string;
  level?: string;
}
```

### Retos (Challenges)

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/api/v1/courses/{courseId}/challenges` | Obtener retos de un curso |
| `POST` | `/api/v1/challenges` | Crear nuevo reto |
| `PUT` | `/api/v1/challenges/{id}` | Actualizar reto existente |
| `DELETE` | `/api/v1/challenges/{id}` | Eliminar reto |
| `PATCH` | `/api/v1/challenges/reorder` | Reordenar retos (body: `{ challengeId: string, newOrder: number }`) | DOCENTE |

**ChallengeRequestDTO (frontend → backend):**
```typescript
interface ChallengeRequestDTO {
  id_course: string;
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  simulatorConfig: {
    environment: "battle" | "space" | "maze" | "obstacle";
    missions: Array<{
      id: string;
      title: string;
      objective: string;
      maxBlocks: number;
    }>;
    maxBlocks: number;
    allowedHardware?: string[];
    startingPosition?: { x: number; z: number };
    targetPosition?: { x: number; z: number };
  };
  expectedOutput?: string;
  reward?: {
    type: "BADGE" | "POINTS" | "UNLOCK_NEXT";
    value: string | number;
  };
}
```

### Simulaciones / Resultados

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/v1/simulations` | Guardar resultado de simulación |
| `GET` | `/api/v1/simulations/user/{studentId}` | Obtener historial de simulaciones |

### Resultados de Retos (NUEVO)

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/v1/resultados` | Guardar/actualizar resultado de reto (upsert: si ya existe studentId+courseId+challengeId, conservar el score más alto con `GREATEST`) |
| `GET` | `/api/v1/resultados/estudiante/{studentId}` | Obtener resultados de un estudiante |
| `GET` | `/api/v1/resultados/curso/{courseId}` | Obtener resultados de todos los estudiantes en un curso |

### Ranking (NUEVO)

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/api/v1/ranking/curso/{courseId}` | Ranking de estudiantes por curso (ordenados por puntaje descendente) |
| `GET` | `/api/v1/ranking/global` | Ranking global entre todos los cursos |

### Puertos y Hardware (persistencia de ensamblaje)

| Método | Endpoint | Propósito | Rol |
|--------|----------|-----------|-----|
| `POST` | `/api/v1/ensamblaje` | Guardar asignación puerto→hardware de un estudiante en un entorno | ESTUDIANTE |
| `GET` | `/api/v1/ensamblaje/{studentId}/{environment}` | Cargar ensamblaje guardado previamente | ESTUDIANTE |

**EnsamblajeRequestDTO (frontend → backend):**
```typescript
interface EnsamblajeRequestDTO {
  studentId: string;
  environment: "battle" | "space" | "maze" | "obstacle";
  portAssignments: Record<string, string>; // { "slotId": "hardwareId", ... }
}
```

### Autenticación

| Método | Endpoint | Propósito | Rol |
|--------|----------|-----------|-----|
| `POST` | `/api/v1/auth/login` | Iniciar sesión (email + password) | Público |
| `POST` | `/api/v1/auth/register` | Registrar nuevo usuario | Público |
| `GET` | `/api/v1/auth/me` | Obtener usuario actual desde token | Ambos |

**LoginResponseDTO:**
```typescript
interface LoginResponseDTO {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "DOCENTE" | "ESTUDIANTE";
  };
}
```

Todas las requests (excepto login/register) deben incluir:
```
Authorization: Bearer <token>
```

### Configuración Adicional (opcional)

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/api/v1/sound-config` | Configuración remota de sonidos |
| `POST` | `/api/v1/analytics/event` | Eventos de analítica |

---

## 2. DTOs Esperados

### ChallengeResponseDTO (desde backend -> frontend)
```typescript
interface ChallengeResponseDTO {
  id: string;
  id_course: string;
  title: string;
  description: string;
  order: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  simulatorConfig?: {
    environment: "battle" | "space" | "maze" | "obstacle";
    missions: Array<{
      id: string;
      title: string;
      objective: string;
      maxBlocks: number;
    }>;
    maxBlocks: number;
    allowedHardware?: string[];
    startingPosition?: { x: number; z: number };
    targetPosition?: { x: number; z: number };
  };
  expectedOutput?: string;
  reward?: {
    type: "BADGE" | "POINTS" | "UNLOCK_NEXT";
    value: string | number;
  };
}
```

### SimulationRequest (desde frontend -> backend)
```typescript
interface SimulationRequest {
  id_student: string;
  id_activity: string;
  result: string; // JSON string con score, bloques, energía, etc.
}
```

### ResultadoRequestDTO (desde frontend -> backend) — NUEVO
```typescript
interface ResultadoRequestDTO {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  challengeId: string;
  challengeTitle: string;
  environment: string;
  score: number;
  blocks: number;
  energy: number;
}
```

### ResultadoResponseDTO (desde backend -> frontend) — NUEVO
```typescript
interface ResultadoResponseDTO {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  challengeId: string;
  challengeTitle: string;
  environment: string;
  score: number;
  blocks: number;
  energy: number;
  completedAt: string;
}
```

### RankingEntryDTO (desde backend -> frontend) — NUEVO
```typescript
interface RankingEntryDTO {
  position: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  challengesCompleted: number;
  lastUpdated: string;
}
```

## 3. Puntos de Integración en el Código

### `application/usecases/SimuladorUseCase.ts`
- **Línea 64-81**: Reemplazar `loadChallengesByCourse` para que llame a `apiService.challenges.getByCourse(courseId)` en lugar de usar `MOCK_CHALLENGES`
- **Línea 200-215**: Implementar `saveResult` para enviar resultados al API `apiService.resultados.save()`
- **Línea 230-260**: Implementar `getCourseRanking` y `getGlobalRanking` usando `apiService.ranking.getCourseRanking()` y `apiService.ranking.getGlobalRanking()`

```typescript
// Reemplazar:
const courseChallenges = simuladorUseCase.current.loadChallengesByCourse(cId);
// Con:
const challenges = await apiService.challenges.getByCourse(cId);
```

### `application/context/SimuladorProvider.tsx`
- **Línea 200-215**: Sección `/* BACKEND: usar apiService... */` en `loadChallengeFromCourse`
- **Línea 230-240**: Sección `/* BACKEND: Enviar resultado al API */` en `completeChallenge`

### `ui/pages/RankingPage.tsx`
- Usa `apiService.ranking.getCourseRanking()` y `apiService.ranking.getGlobalRanking()` directamente
- Mock fallback: `MOCK_RANKING_SEED` (5 estudiantes estáticos)
- Cuando se conecte el backend, estos endpoints devolverán datos reales de la BD

### `ui/pages/Simulador.tsx`
- **Línea 63**: `loadChallengeFromCourse(courseId)` — llama al use case que mockea datos
- Cuando se conecte el backend, el parámetro `courseId` viene de la URL `/simulador/{courseId}`

### `ui/pages/CursosPage.tsx`
- **Línea 286-297**: Botón "Iniciar" navega a `/simulador/{course.id_course}`
- No requiere cambios para backend — el `courseId` se pasa por ruta

### `infrastructure/audio/SoundManager.ts`
- No requiere backend para funcionar (sonidos locales con Web Audio API)
- Opcional: cargar configuración remota de sonidos desde `/api/v1/sound-config`

---

## 4. Flujo Completo (con Backend)

```
1. Docente crea curso y retos → POST /api/v1/courses, POST /api/v1/challenges
2. Estudiante ingresa a /cursos → GET /api/v1/courses
3. Estudiante ve retos → GET /api/v1/courses/{id}/challenges
4. Estudiante hace clic en "Iniciar" → navega a /simulador/{courseId}
5. Simulador carga retos → SimuladorUseCase.loadChallengesByCourse(courseId)
6. Estudiante programa y ejecuta → feedback visual/sonoro local
7. Estudiante completa TODAS las misiones → auto-detecta fin del reto
8. Se calcula puntaje final y se envía → POST /api/v1/resultados (upsert: conserva el mayor)
9. RankingPage carga datos → GET /api/v1/ranking/curso/{courseId} o GET /api/v1/ranking/global
10. Docente ve resultados en dashboard → GET /api/v1/resultados/curso/{courseId}
```

---

## 5. Modelo de Base de Datos (Resultados)

```sql
CREATE TABLE resultado_reto (
  id              SERIAL PRIMARY KEY,
  student_id      VARCHAR(255) NOT NULL,
  student_name    VARCHAR(255),
  course_id       VARCHAR(255) NOT NULL,
  course_name     VARCHAR(255),
  challenge_id    VARCHAR(255) NOT NULL,
  challenge_title VARCHAR(255),
  environment     VARCHAR(50),
  score           INT NOT NULL DEFAULT 0,
  blocks          INT DEFAULT 0,
  energy          INT DEFAULT 0,
  completed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id, challenge_id)
);
```

**Lógica de upsert (conservar mayor puntaje):**
```sql
INSERT INTO resultado_reto (student_id, student_name, course_id, course_name, challenge_id, challenge_title, environment, score, blocks, energy)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  score = GREATEST(score, VALUES(score)),
  blocks = VALUES(blocks),
  energy = VALUES(energy),
  completed_at = CURRENT_TIMESTAMP,
  student_name = VALUES(student_name),
  challenge_title = VALUES(challenge_title);
```

**Ranking por curso:**
```sql
SELECT student_id, student_name, SUM(score) AS total_score, COUNT(*) AS challenges_completed, MAX(completed_at) AS last_updated
FROM resultado_reto
WHERE course_id = ?
GROUP BY student_id, student_name
ORDER BY total_score DESC;
```

---

## 6. Cómo Activar el Backend

### Controladores Java necesarios

| Controlador | Endpoints | Entidad JPA |
|-------------|-----------|-------------|
| `AuthController` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | `UserEntity` |
| `CourseController` | `GET/POST/PUT/DELETE /courses` | `CourseEntity` |
| `ChallengeController` | `GET/POST/PUT/DELETE /challenges`, `PATCH /challenges/reorder` | `ChallengeEntity` (campo JSON `simulatorConfig`) |
| `ResultadoController` | `POST /resultados`, `GET /resultados/estudiante/{id}`, `GET /resultados/curso/{id}` | `ResultadoEntity` |
| `RankingController` | `GET /ranking/curso/{id}`, `GET /ranking/global` | Query sobre `ResultadoEntity` |
| `EnsamblajeController` | `POST /ensamblaje`, `GET /ensamblaje/{studentId}/{environment}` | `EnsamblajeEntity` (campo JSON `portAssignments`) |

### Pasos

1. **Implementar autenticación JWT** primero (los demás endpoints dependen del token)
2. **Crear entidades JPA** para cada tabla
3. **Implementar controladores** con los endpoints listados en la sección 1
4. **Implementar lógica de upsert** en `ResultadoController` — `ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score))`
5. **Implementar queries de ranking** con `SUM(score)` y `GROUP BY`
6. **En frontend**: eliminar/reemplazar las secciones marcadas con `/* BACKEND: */`
7. **Descomentar** las importaciones de `apiService` en los archivos correspondientes
8. **Configurar `axiosInstance.ts`** con la URL base correcta del backend

### Tablas adicionales necesarias

```sql
-- Usuarios
CREATE TABLE usuario (
  id         VARCHAR(255) PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('DOCENTE', 'ESTUDIANTE') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cursos
CREATE TABLE curso (
  id_course   VARCHAR(255) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  level       VARCHAR(50)
);

-- Retos
CREATE TABLE reto (
  id               VARCHAR(255) PRIMARY KEY,
  id_course        VARCHAR(255) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  orden            INT NOT NULL,
  difficulty       ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
  points           INT NOT NULL DEFAULT 0,
  simulator_config JSON,
  expected_output  TEXT,
  reward           JSON,
  FOREIGN KEY (id_course) REFERENCES curso(id_course)
);

-- Resultados de retos (ver sección 5 para schema completo)
CREATE TABLE resultado_reto (
  id              SERIAL PRIMARY KEY,
  student_id      VARCHAR(255) NOT NULL,
  student_name    VARCHAR(255),
  course_id       VARCHAR(255) NOT NULL,
  challenge_id    VARCHAR(255) NOT NULL,
  score           INT NOT NULL DEFAULT 0,
  blocks          INT DEFAULT 0,
  energy          INT DEFAULT 0,
  completed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id, challenge_id)
);

-- Ensamblaje de puertos
CREATE TABLE ensamblaje (
  id               SERIAL PRIMARY KEY,
  student_id       VARCHAR(255) NOT NULL,
  environment      VARCHAR(50) NOT NULL,
  port_assignments JSON NOT NULL,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (student_id, environment)
);
```

> **Nota**: El frontend está preparado para funcionar con o sin backend. Mientras no se implemente el backend, los datos mock garantizan que la experiencia del simulador sea completamente funcional.
