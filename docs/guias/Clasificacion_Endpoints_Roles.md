# Roles y endpoints del backend

**Revisado contra controladores y SecurityConfig el 06/11/2026. La matriz aprobada sustituye la gestión docente global anterior.** [Índice](../README.md) · [Autenticación](Guia_Migracion_Autenticacion.md).

## Convenciones

- Backend: `STUDENT`, `TEACHER`, `ADMIN`; frontend: `student`, `docente`, `admin`.
- **Propio** exige que el ID de estudiante/usuario de la ruta o cuerpo coincida con la sesión. **Sí** conserva las validaciones de existencia y negocio. **Asignado** exige curso/aula persistidos. El acceso docente a datos personales exige un estudiante de sus aulas, sin roles de gestión; la promoción no deja acceso por una membresía antigua.
- Los permisos de esta tabla describen el código actual, no un plan para implementarlo. La interfaz puede ofrecer menos acciones que la API.
- Todas las rutas de las tablas de recursos llevan el prefijo `/api/v1`.

## Rutas públicas

| Método | Ruta | Observación |
|---|---|---|
| POST | `/auth/login` | Emite cookie HttpOnly y datos de usuario. |
| GET | `/auth/csrf` | Token enmascarado para escrituras de navegador/cookie. |
| POST | `/auth/logout` | Expira la cookie; el filtro permite también una sesión caducada o ausente. |
| POST | `/users` | Registro; no concede libremente roles privilegiados. |
| GET | `/` del servidor, `/v3/api-docs/**`, `/scalar/**`, `/actuator/health/**` | Excepciones públicas declaradas por SecurityConfig, fuera del prefijo de recursos cuando corresponda. |

La regla pública `/api/v1/auth/**` no implica que exista cualquier endpoint bajo ese prefijo: login/logout y la consulta CSRF son las rutas implementadas. Las escrituras de navegador/cookie requieren CSRF incluso en recursos públicos.

## Currículo, grupos y plantillas

| Método / recurso | STUDENT | TEACHER | ADMIN |
|---|---|---|---|
| GET `/courses` | Sí | Asignados | Sí |
| POST `/courses`; PUT/PATCH/DELETE `/courses/{idCourse}` | No | No | Sí |
| GET `/modules/course/{idCourse}` | Sí | Asignado | Sí |
| POST `/modules`; DELETE `/modules/{idModule}` | No | Asignado | Sí |
| GET `/lessons/module/{idModule}` | Sí | Asignado | Sí |
| POST `/lessons` | No | Asignado | Sí |
| GET `/activities/lesson/{idLesson}` y `/activities/{id}` | Sí | Asignado | Sí |
| POST `/activities`; PUT/PATCH/DELETE `/activities/{id}` | No | Asignado y destino permitido | Sí |
| GET `/neonflow/templates/{templateId}` | Sí | Sí | Sí |
| GET `/tetrilogic/templates/{templateId}` | Sí | Sí | Sí |
| GET `/groups` y `/groups/{idGroup}` | Propios | Asignados | Sí |
| GET `/group-students/{idGroup}` | Propio si ranking visible | Asignado | Sí |
| POST `/group-students`; DELETE `/group-students/{idGroup}/{idStudent}` | No | No | Sí |
| GET `/ranking/course/{courseId}` y `/ranking/module/{moduleId}` | No | Asignado | Sí |

Las plantillas tienen endpoints de lectura, sin edición de geometría por API. La política AcademicAccessPolicy usa las asignaciones explícitas de V22. El catálogo estudiantil compartido conserva su acceso; esto no concede lecturas de progreso privado. [Reglas y administración](Puntaje_Ranking_Acceso.md).

Las rutas de `/administration/**`, PUT `/rankings/settings`, PUT `/users/{id}/status` y la escritura de asignaciones de actividades a aulas son ADMIN. GET de actividades del aula exige pertenencia/asignación; GET `/rankings/global` admite ADMIN o estudiante con GLOBAL configurado. GET `/rankings/settings` exige autenticación. Retirar roles usa DELETE `/roles/user/{userId}/{roleId}`, sólo ADMIN.

## Datos personales, observaciones y roles

| Método / recurso | STUDENT | TEACHER | ADMIN |
|---|---|---|---|
| GET `/users` | No | No | Sí |
| GET `/users/{userId}` | Propio | Estudiante asignado o propio | Sí |
| GET `/profile/{idStudent}`, `/profile/{idStudent}/achievements`, `/profile/{idStudent}/history` | Propio | Estudiante asignado o propio | Sí |
| GET `/profile/{idStudent}/game-progress`, `/profile/{idStudent}/achievements/export` | Propio | Estudiante asignado o propio | Sí |
| GET `/daily-challenges/today?studentId=...` | Propio | Estudiante asignado o propio | Sí |
| GET `/game-sessions/active` | Propio y contexto coincidente | No | No |
| POST `/game-sessions` | Propio en cuerpo | No | No |
| POST `/game-sessions/{sessionId}/actions`, `/game-sessions/{sessionId}/complete` | Sesión propia | No | No |
| GET `/activity-results/user/{idStudent}` | Propio | Estudiante asignado o propio | Sí |
| POST `/activity-results` | Propio en cuerpo | Sólo propio | Sí |
| GET `/simulations/user/{idStudent}` | Propio | Estudiante asignado o propio | Sí |
| POST `/simulations` | Propio en cuerpo | Sólo propio | Sí |
| GET `/module-progress/user/{idStudent}` | Propio | Estudiante asignado o propio | Sí |
| POST `/module-progress` | Propio en cuerpo | Sólo propio | Sí |
| GET `/help-requests/{idStudent}` | Propio | Estudiante asignado o propio | Sí |
| POST `/help-requests` | Propio en cuerpo | Sólo propio | Sí |
| GET `/dropout-risk/{idStudent}` | Propio | Estudiante asignado o propio | Sí |
| POST `/telemetry` | Propio en cuerpo | Sólo propio | Sí |
| POST `/performance/rating` | Sí | Sí | Sí |
| GET `/roles`; POST `/roles/user` | No | No | Sí |

`POST /telemetry` conserva la comprobación de estudiante y contexto; el observador de los simuladores sólo envía desde sesiones estudiantiles. Tener acceso a recursos de resultados no implica que una victoria del simulador los escriba automáticamente. `/performance/rating` es un recurso existente, no una rúbrica nueva aprobada para puntuar los sesenta retos.

## Fuentes y límites

Ver [SecurityConfig](../../backend/src/main/java/com/pipre/backend/infrastructure/configuration/SecurityConfig.java), [SecurityService](../../backend/src/main/java/com/pipre/backend/infrastructure/security/SecurityService.java) y [controladores](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller). La restricción ADMIN de RoleController está declarada en la clase y se aplica a sus métodos.

401 indica falta de autenticación; 403 falta de permiso. Para revisar cambios futuros contrastar filtro, anotación de clase, anotación de método y validaciones del caso de uso. Las rutas del 02/11 conservan su [evidencia histórica](../informes/Implementacion_35_Logros_2026_11_02.md); los cambios de permisos y endpoints se validan en el [lote del 06/11](../informes/Implementacion_Pendientes_2026_11_06.md). Las sesiones puntuables exigen STUDENT sin ADMIN/TEACHER, incluidos usuarios con varios roles. Los permisos históricos no se amplían por existir gamificación.
