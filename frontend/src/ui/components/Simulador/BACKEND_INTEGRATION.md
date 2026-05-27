# Integración con Backend — Simuladores 3D PIPRE

## Estado Actual

Actualmente los simuladores funcionan **100% con datos mock en frontend**. No hay dependencia de backend para operar. Esta guía documenta cada punto de integración necesario para conectar con el backend real.

---

## 1. Endpoints del API

### Retos (Challenges)

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/api/v1/courses/{courseId}/challenges` | Obtener retos de un curso |
| `POST` | `/api/v1/challenges` | Crear nuevo reto |
| `PUT` | `/api/v1/challenges/{id}` | Actualizar reto existente |
| `DELETE` | `/api/v1/challenges/{id}` | Eliminar reto |

### Simulaciones / Resultados

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/v1/simulations` | Guardar resultado de simulación |
| `GET` | `/api/v1/simulations/user/{studentId}` | Obtener historial de simulaciones |

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

---

## 3. Puntos de Integración en el Código

### `application/usecases/SimuladorUseCase.ts`
- **Línea 64-81**: Reemplazar `loadChallengesByCourse` para que llame a `apiService.challenges.getByCourse(courseId)` en lugar de usar `MOCK_CHALLENGES`
- **Línea 150-157**: Implementar `submitResult` para enviar resultados al API

```typescript
// Reemplazar:
const courseChallenges = simuladorUseCase.current.loadChallengesByCourse(cId);
// Con:
const challenges = await apiService.challenges.getByCourse(cId);
```

### `application/context/SimuladorProvider.tsx`
- **Línea 111-113**: Sección `/* BACKEND: usar apiService... */` en `loadChallengeFromCourse`
- **Línea 130-132**: Sección `/* BACKEND: Enviar resultado al API */` en `completeMission`

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
7. Estudiante completa misión → POST /api/v1/simulations (resultado)
8. Docente ve resultados en dashboard → GET /api/v1/simulations/user/{id}
```

---

## 5. Cómo Activar el Backend

1. **Implementar el controlador Java** `ChallengeController` con los endpoints listados
2. **Crear la entidad JPA** `ChallengeEntity` con campo JSON para `simulatorConfig`
3. **En frontend**: eliminar/reemplazar las secciones marcadas con `/* BACKEND: */`
4. **Descomentar** las importaciones de `apiService` en los archivos correspondientes
5. **Configurar `axiosInstance.ts`** con la URL base correcta del backend

> **Nota**: El frontend está preparado para funcionar con o sin backend. Mientras no se implemente el backend, los datos mock garantizan que la experiencia del simulador sea completamente funcional.
