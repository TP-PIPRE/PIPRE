# Roles y endpoints del backend

**Revisado contra controladores y SecurityConfig el 30/10/2026.** [Índice](../README.md) · [Autenticación](Guia_Migracion_Autenticacion.md).

## Convenciones

- Backend: `STUDENT`, `TEACHER`, `ADMIN`; frontend: `student`, `docente`, `admin`.
- **Propio** exige que el ID de estudiante/usuario de la ruta o cuerpo coincida con la sesión. **Sí** conserva las validaciones de existencia y negocio.
- Los permisos de esta tabla describen el código actual, no un plan para implementarlo. La interfaz puede ofrecer menos acciones que la API.
- Todas las rutas de las tablas de recursos llevan el prefijo `/api/v1`.

## Rutas públicas

| Método | Ruta | Observación |
|---|---|---|
| POST | `/auth/login` | Emite cookie HttpOnly y datos de usuario. |
| POST | `/auth/logout` | Expira la cookie; el filtro permite también una sesión caducada o ausente. |
| POST | `/users` | Registro; no concede libremente roles privilegiados. |
| GET | `/` del servidor, `/v3/api-docs/**`, `/scalar/**`, `/actuator/health/**` | Excepciones públicas declaradas por SecurityConfig, fuera del prefijo de recursos cuando corresponda. |

La regla pública `/api/v1/auth/**` no implica que exista cualquier endpoint bajo ese prefijo: sólo login/logout están implementados en AuthController.

## Currículo, grupos y plantillas

| Método / recurso | STUDENT | TEACHER | ADMIN |
|---|---|---|---|
| GET `/courses` | Sí | Sí | Sí |
| POST `/courses`; PUT/DELETE `/courses/{idCourse}` | No | Sí | Sí |
| GET `/modules/course/{idCourse}` | Sí | Sí | Sí |
| POST `/modules`; DELETE `/modules/{idModule}` | No | Sí | Sí |
| GET `/lessons/module/{idModule}` | Sí | Sí | Sí |
| POST `/lessons` | No | Sí | Sí |
| GET `/activities/lesson/{idLesson}` y `/activities/{id}` | Sí | Sí | Sí |
| POST `/activities`; PUT/DELETE `/activities/{id}` | No | Sí | Sí |
| GET `/neonflow/templates/{templateId}` | Sí | Sí | Sí |
| GET `/tetrilogic/templates/{templateId}` | Sí | Sí | Sí |
| GET `/groups` y `/groups/{idGroup}` | Sí | Sí | Sí |
| GET `/group-students/{idGroup}` | Sí | Sí | Sí |
| POST `/group-students`; DELETE `/group-students/{idGroup}/{idStudent}` | No | Sí | Sí |
| GET `/ranking/course/{courseId}` y `/ranking/module/{moduleId}` | No | Sí | Sí |

Las plantillas tienen endpoints de lectura, sin edición de geometría por API. La autorización actual de docentes/administradores es por rol; esta tabla no inventa una restricción por propiedad del curso que no esté implementada.

## Datos personales, observaciones y roles

| Método / recurso | STUDENT | TEACHER | ADMIN |
|---|---|---|---|
| GET `/users` | No | Sí | Sí |
| GET `/users/{userId}` | Propio | Sí | Sí |
| GET `/profile/{idStudent}`, `/profile/{idStudent}/achievements`, `/profile/{idStudent}/history` | Propio | Sí | Sí |
| GET `/activity-results/user/{idStudent}` | Propio | Sí | Sí |
| POST `/activity-results` | Propio en cuerpo | Sí | Sí |
| GET `/simulations/user/{idStudent}` | Propio | Sí | Sí |
| POST `/simulations` | Propio en cuerpo | Sí | Sí |
| GET `/module-progress/user/{idStudent}` | Propio | Sí | Sí |
| POST `/module-progress` | Propio en cuerpo | Sí | Sí |
| GET `/help-requests/{idStudent}` | Propio | Sí | Sí |
| POST `/help-requests` | Propio en cuerpo | Sí | Sí |
| GET `/dropout-risk/{idStudent}` | Propio | Sí | Sí |
| POST `/telemetry` | Propio en cuerpo | Sí | Sí |
| POST `/performance/rating` | Sí | Sí | Sí |
| GET `/roles`; POST `/roles/user` | No | No | Sí |

`POST /telemetry` conserva la comprobación de estudiante y contexto; el observador de los simuladores sólo envía desde sesiones estudiantiles. Tener acceso a recursos de resultados no implica que una victoria del simulador los escriba automáticamente. `/performance/rating` es un recurso existente, no una rúbrica nueva aprobada para puntuar los sesenta retos.

## Fuentes y límites

Ver [SecurityConfig](../../backend/src/main/java/com/pipre/backend/infrastructure/configuration/SecurityConfig.java), [SecurityService](../../backend/src/main/java/com/pipre/backend/infrastructure/security/SecurityService.java) y [controladores](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller). La restricción ADMIN de RoleController está declarada en la clase y se aplica a sus métodos.

401 indica falta de autenticación; 403 falta de permiso. Para revisar cambios futuros contrastar filtro, anotación de clase, anotación de método y validaciones del caso de uso. Esta edición documental no volvió a ejecutar pruebas HTTP ni modificó los permisos.
