# Revisión de contratos frontend/backend

Fecha: 23 de octubre de 2026. Este informe actualiza los pendientes de integración detectados en la revisión visual anterior.

**Estado actualizado:** se implementaron los pendientes técnicos descritos en [Cierre de pendientes](#cierre-de-pendientes-implementables). Las validaciones de la primera revisión se conservan como historial.

**Continuación del catálogo:** la meta es 30 retos de Neon Flow y 30 de TetriLogic, **60 en total**. Antes de ampliarlo, seguir [AGENTS.md](../AGENTS.md) y la [guía de implementación de los 30 retos por juego](Guia_Implementacion_30_Retos.md), que exige conectar cada actividad con su tablero y verificar su solución. Hay dos actividades oficiales conectadas por juego, cuatro en total; faltan 28 por juego y 56 en conjunto.

## Alcance

Se compararon llamadas, cuerpos, respuestas, paginación, DTO Java/TypeScript, permisos y consumidores de las páginas. Se corrigieron los flujos existentes y se ejecutaron pruebas unitarias y comprobaciones contra Docker local.

**`data-science/` no se modificó, reconstruyó ni reinició.** Tampoco se cambiaron los modelos ni algoritmos de IA, sus endpoints o el proxy de IA. No se añadieron dependencias. La primera revisión no necesitó migraciones; el cierre posterior incorpora únicamente la migración aditiva V13 para metadatos de actividades.

## Fallos corregidos

| Área | Antes | Corrección |
|---|---|---|
| Rol de inicio de sesión | Se intentaba leer el JWT HttpOnly y adivinar roles por el correo | Se usa exclusivamente `LoginResponseDTO.user.role`; las respuestas incompletas se rechazan |
| Cookie de autenticación | JavaScript intentaba leer/escribir/borrar el JWT | El servidor y el navegador gestionan el JWT; el cliente sólo guarda metadatos de navegación |
| Logout | Se borraban cookies visibles sin llamar al servidor | `POST auth/logout` limpia la cookie HttpOnly antes de salir; un error de red no se presenta como cierre satisfactorio |
| 401/403 | Cualquier falta de permiso cerraba la sesión | 401 indica sesión inválida; 403 conserva la sesión. El backend devuelve 401 explícitamente sin autenticar |
| Registro | `roleIdList: []` fallaba porque se exigía un rol interno | DTO público separado: el servidor asigna STUDENT cuando faltan roles. Sólo ADMIN puede asignar roles privilegiados |
| Datos del registro | Institución/zona se pedían aunque el backend no las guardaba | El formulario y el request usan los campos realmente soportados; se eliminó el índice local de UUID innecesario |
| Administrador | El frontend rechazaba el panel docente aunque el backend permite ADMIN | Guard, redirección y navegación coherentes para docentes y administradores |
| Propiedad de datos | Cualquier estudiante podía leer perfiles ajenos y enviar escrituras con otro ID | Perfil, telemetría, resultados, simulaciones, progreso y ayudas comprueban identidad; docentes/administradores conservan sus permisos |
| Telemetría | `fetch('/api/v1/telemetry')` terminaba en el servidor estático del frontend en Docker | Usa el cliente configurado de Spring con cookies; conserva el comportamiento no bloqueante ante errores de fondo |
| Cursos | Se enviaban BASIC/INTERMEDIATE/ADVANCED; la API sólo admite LOW/MEDIUM/HIGH | Valores del editor alineados con el enum del dominio |
| Edición de cursos | GET sólo devolvía nombre e ID, perdiendo descripción/nivel al editar | `CourseDTO` incluye descripción y nivel persistidos |
| Crear actividad | Se esperaba `{idActivity}` de una respuesta 201 vacía | El cliente acepta el cuerpo vacío y recarga la colección |
| Editar actividad | El formulario se cerraba sin ejecutar PUT | Se envía PUT con los metadatos, misiones y coordenadas existentes |
| Lección del reto | Se sustituía por la primera lección del curso y se leía estado obsoleto tras un await | Se conserva `idLesson`, se resuelve su módulo y se usa el ID devuelto al cargar las lecciones |
| Metadatos del reto | Dificultad/configuración se reemplazaban por valores fijos al leer | El editor conserva los valores reales de la actividad |
| Campos sin persistencia | Descripción, puntos, orden y resultado esperado parecían guardarse | Se señalan y deshabilitan los campos sin contrato; el orden se identifica como temporal de la sesión |
| Misiones | El ID basado en la longitud podía duplicarse después de eliminar una misión | Las nuevas misiones reciben UUID |
| Errores de CRUD | Errores sólo en consola y cursos ficticios presentados como reales | Errores visibles y sin fallback de cursos inventados; el formulario conserva su estado ante un fallo |
| Paginación | Las funciones “getAll” truncaban en 100 elementos e ignoraban sort | Recorren las páginas cuando se pide toda la colección; respetan paginación/sort explícitos |
| Otros DTO | `id_simulation`, `timesRequested`, `riesgo/nivel` y cuerpos de ayuda no coincidían | Tipos de simulación, resultados, ayuda, progreso y riesgo alineados con Java |
| Ranking | Estudiantes duplicados por pertenecer a varios grupos; filtros reservados visibles al estudiante | Se deduplica por estudiante; la pestaña por curso se ofrece a los roles autorizados |
| Modal de ranking docente | El selector de curso seguía mostrando el primer grupo | Consulta el curso elegido y reúne los grupos para la vista global; usa los nombres reales devueltos |
| Proxy de desarrollo | La selección de backend sólo leía variables del proceso | Vite carga las variables `VITE_` del `.env` para el proxy de Spring |
| Reinicio | El seeder eliminaba todos los cursos, incluidos los creados por el usuario | Sólo crea cursos oficiales ausentes; conserva cursos, cambios y resultados existentes |

## Validaciones de la primera revisión (histórico)

- **Frontend:** 27 pruebas correctas en 7 archivos. Incluyen autenticación actual, sesión corrupta, 401/403, telemetría de fondo, respuestas 201 vacías, paginación, creación/edición real del componente de retos, metadatos y deduplicación de ranking.
- **Backend:** 58 pruebas correctas, sin fallos ni errores, mediante Maven en un contenedor aislado. Incluyen registro público sin privilegios, respuesta completa de cursos, conservación del seeder y reglas de propiedad ejecutadas mediante el interceptor real de seguridad de métodos.
- **Compilación:** TypeScript y build de Vite correctos. Backend y frontend reconstruidos en Docker. Permanece el aviso de bundle JavaScript superior a 500 kB y un aviso existente de MapStruct sobre `updatedAt`.
- **HTTP local:** 22 comprobaciones correctas: registro de un estudiante temporal, login, permiso de perfil propio/ajeno, 401/403, cookie válida después de un 403, telemetría propia/ajena, curso LOW, lectura de metadatos, actualización HIGH, actividad 201 vacía, PUT de actividad, conservación de misiones y rechazo de escrituras ajenas en los cuatro recursos restantes, más logout.
- **Datos de prueba:** curso, módulo, lección, actividad, estudiante y telemetría temporales limpiados al terminar. La eliminación de la fila de telemetría confirmó que el intento había persistido.
- **Navegador:** login de ADMIN llega al panel permitido; logout real vuelve al acceso; el estudiante ve el ranking global y por grupos sin la consulta por curso reservada.
- **ESLint:** quedan 36 errores y 3 advertencias heredadas de efectos, `any` y exportaciones. No se declara aprobado el lint general.
- **Integridad del alcance:** `git diff -- data-science` sin cambios. Se guardó un respaldo de PostgreSQL antes de actualizar el backend en la carpeta de artefactos de esta sesión (`pipre-before-contracts.sql`).

## Diagnóstico original de pendientes (histórico)

1. **Editor y simulador usan modelos distintos.** Los tableros ejecutan niveles locales, no una configuración completa descargada de la actividad. `Neon Flow - Nivel 2` existe en los datos iniciales, mientras que el cliente sólo define un nivel de Neon Flow. Una actividad creada desde el editor no crea automáticamente un tablero jugable. Resolverlo requiere definir un contrato de niveles y su validación pedagógica, no sólo renombrar campos.
2. **Telemetría y progreso no son equivalentes.** Guardar un intento en `telemetry_attempts` no crea un resultado puntuado ni actualiza automáticamente XP, estrellas, ranking o progreso. No se inventó una regla de calificación para conectarlos.
3. **Cursos nuevos necesitan estructura.** Para crear retos se requiere un módulo y una lección. Sus endpoints existen, pero falta un flujo completo de creación de esa estructura en la interfaz. El editor ahora informa de la ausencia en vez de aparentar éxito.
4. **Campos futuros del reto.** Descripción, puntos, orden persistente, recompensa y resultado esperado no existen en el contrato actual de actividades. Una implementación real necesita acordar DTO, dominio y migración. El límite de bloques sí se conserva por misión; no hay un límite global del reto persistido.
5. **IA pendiente.** Los errores de los análisis, los datos derivados usados por sus tarjetas y la integración del proxy de IA quedan fuera de esta intervención por la indicación de no cambiar data-science.
6. **Métricas y soporte de demostración.** Algunas pantallas usan datos de ejemplo y el envío de soporte no está conectado a mensajería real. No se presentaron como funcionalidades integradas nuevas.
7. **Despliegue y seguridad adicionales.** La configuración de la cookie sigue siendo la de localhost. Para producción deben revisarse Secure, SameSite y CORS. Esta revisión no sustituye una auditoría completa de seguridad ni cambia los algoritmos de calificación.

## Archivos principales de esta revisión

- `frontend/src/infrastructure/adapters/http/AuthAdapter.ts`
- `frontend/src/infrastructure/store/authStore.ts`, `gameStore.ts`
- `frontend/src/infrastructure/api/axiosInstance.ts`, `apiService.ts`, `errors.ts`, `models/apiModels.ts`
- `frontend/src/infrastructure/ports/IAuthRepository.ts`
- `frontend/src/application/hooks/useAuth.ts`, `usecases/LoginUserUseCase.ts`, `usecases/mergeRankings.ts`
- `frontend/src/ui/router/index.tsx`, `ui/components/common/Navbar.tsx`
- `frontend/src/ui/pages/LoginPage.tsx`, `DocenteRetosPage.tsx`, `DocenteDashboard.tsx`, `PaginaInicio.tsx`, `RankingPage.tsx`
- `frontend/vite.config.ts`
- `frontend/tests/unit/AuthAdapter.test.ts`, `ApiContract.test.ts`, `SessionContract.test.ts`, `ChallengeEditorContract.test.tsx`, `MergeRankings.test.ts`, `SimulatorAccessibility.test.tsx`
- `backend/src/main/java/com/pipre/backend/adapters/in/web/dto/RegisterUserRequestDTO.java`
- Controladores Java: `UserController`, `ProfileController`, `TelemetryController`, `ResultController`, `SimulationController`, `ModuleProgressController`, `HelpRequestController`
- `backend/src/main/java/com/pipre/backend/application/dto/CourseDTO.java`, `application/useCases/GetCoursesService.java`
- `backend/src/main/java/com/pipre/backend/infrastructure/configuration/SecurityConfig.java`, `infrastructure/util/seed/CourseSeederService.java`
- Pruebas Java: `UserRegistrationContractTest`, `StudentOwnershipContractTest`, `GetCoursesContractTest`, `CourseSeederPreservationTest`

## Cierre de pendientes implementables

Implementación posterior del 23 de octubre de 2026. Se conserva la arquitectura por capas y se reutilizan los endpoints y componentes existentes.

| Pendiente | Estado actual | Alcance y límites |
|---|---|---|
| Editor y simulador desconectados | Resuelto mediante plantillas | Cada actividad puede guardar `levelTemplate`. El catálogo abre `/simulador/:courseId?activity=:idActivity`; el simulador carga las actividades del curso y ejecuta la plantilla elegida, con título, descripción y misiones reales. Funciona con cursos de UUID, cursos que combinan juegos y enlaces directos. Las actividades sin una plantilla reconocida muestran un estado pendiente; nunca se sustituuyen por un tablero ajeno. |
| Segundo nivel de Neon Flow | Resuelto | Se añadió el tablero con muros correspondiente al segundo nivel oficial. Una prueba verifica una solución con dos espejos usando `raycast` sin cambiarlo. |
| Tableros de TetriLogic | Resuelto | El inventario original O/I/T/S no permitía cubrir el primer tablero completo. Se añadieron una O y una I adicionales, conservando las piezas existentes. Dos pruebas completan ambos tableros mediante la interfaz y las reglas originales. Las piezas repetidas tienen etiquetas accesibles diferentes. |
| Estructura de cursos nuevos | Resuelto | En Gestión de Retos se crean módulos y lecciones y se consultan sus IDs reales tras respuestas 201 vacías. Se conserva el texto ante errores. El editor selecciona lecciones válidas; cambiar a un módulo vacío no reutiliza la lección anterior. Las respuestas asíncronas obsoletas se descartan. |
| Descripción y orden del reto | Resuelto | `description` y `displayOrder` atraviesan DTO, dominio, persistencia y frontend. Se guardan al crear y editar; el catálogo y simulador usan el orden persistido, con desempate estable. El orden debe ser un entero positivo. Se retiraron los botones de orden temporal para no simular persistencia. |
| Otros campos del reto | Parcial | Puntos, recompensas y resultado esperado siguen deshabilitados. El límite de bloques por misión conserva su contrato; no se ha añadido un límite global ni una restricción de movimientos a los juegos. |
| Telemetría, XP, estrellas y progreso automático | Pendiente funcional | Los intentos siguen siendo telemetría cruda. No hay una rúbrica para convertir tiempo, movimientos, reinicios o pistas en puntos y recompensas, ni una equivalencia entre movimientos y bloques. No se inventaron reglas ni se modificaron los algoritmos de calificación. |
| Métricas ficticias | Resuelto | La pantalla consulta estudiantes de grupos sin duplicados, resultados, último progreso por módulo y análisis de riesgo ya guardados en Spring. Muestra ausencia de registros y fallos parciales de forma distinta de cero. No ejecuta modelos de IA ni inventa tendencias. |
| Solicitudes de soporte ficticias | Resuelto para el contrato disponible | Se sustituyeron los mensajes de ejemplo y el formulario sin envío por el historial real de `help-requests`: estudiante, fecha e interacciones registradas. La mensajería directa continúa pendiente de un contrato de tickets/mensajes; no se hace pasar una solicitud de ayuda de IA por un chat. |
| Cookie y CORS de despliegue | Implementado y configurable | Login y logout usan la misma configuración: HttpOnly, Secure, SameSite y ruta. CORS admite orígenes exactos configurados, sin comodín con credenciales. SameSite=None sin Secure se rechaza al arrancar. Se corrige también la selección de rol principal cuando un administrador tiene STUDENT antes de ADMIN en su lista. |
| Data-science e IA | Fuera del alcance por indicación del usuario | Sin cambios de archivos, endpoints, proxy, modelos, algoritmos ni contenedor. |

### Contrato y migración

- `V13__playable_activity_metadata.sql` añade tres columnas a `activities`: `description`, `display_order` y `level_template`. No elimina tablas ni datos; sólo enlaza los cuatro IDs oficiales con plantillas conocidas. No asigna tableros a actividades personalizadas antiguas.
- Las solicitudes anteriores sin los nuevos campos siguen siendo válidas. Una actualización que los omita conserva sus valores; las misiones omitidas también se conservan.
- Plantillas admitidas: `neonflow-1`, `neonflow-2`, `tetrilogic-1`, `tetrilogic-2`. La API comprueba que correspondan al entorno. Un editor libre de tableros queda fuera de esta entrega.
- La plantilla determina geometría e inventario. Las misiones se muestran como instrucciones, sin reemplazar las condiciones de victoria existentes.
- Se guardó un respaldo previo a V13: `pipre-before-pending.sql`, fuera del repositorio, en los artefactos de esta sesión.

### Configuración de despliegue

Las variables están documentadas en `.env.example` y se transmiten a backend en ambos archivos principales de Compose:

```dotenv
# Local HTTP
PIPRE_COOKIE_SECURE=false
PIPRE_COOKIE_SAME_SITE=Lax
PIPRE_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Para HTTPS, configurar `PIPRE_COOKIE_SECURE=true`, `PIPRE_ALLOWED_ORIGINS` con el origen real del frontend (sin ruta ni barra final) y un `JWT_SECRET` propio. `Lax` es el valor inicial; `None` se admite únicamente con Secure cuando el despliegue realmente necesita cookies entre sitios. Los valores `VITE_` se incorporan al compilar el frontend.

La restricción de orígenes sigue la [guía de CORS de Spring](https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html). Esto no constituye una auditoría de seguridad: HTTPS/proxy de producción y el diseño completo de [protección CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html) requieren validación antes de un despliegue público. No se ha afirmado haber probado un dominio HTTPS real.

### Validación de esta implementación

- **40 pruebas frontend aprobadas en 13 archivos**, incluida creación de estructura con 201 vacío, fallo de guardado, metadatos persistidos en el editor, módulo vacío, selección de actividad dentro del curso, plantillas desconocidas, agregación de métricas, ayudas reales y resolución de ambos tableros de TetriLogic.
- **67 pruebas backend aprobadas**, incluidas compatibilidad del contrato, conservación de metadatos/misiones, rechazo de orden inválido/plantilla incompatible, atributos de cookie local/HTTPS y prioridad del rol ADMIN.
- **TypeScript y compilación de producción correctos**; backend y frontend actualizados en Docker local. No se reconstruyeron dependencias de esos servicios.
- **22 comprobaciones HTTP aprobadas** sobre autenticación, cookie, CORS permitido/rechazado, creación de curso/módulo/lección/actividad, lectura y edición de los nuevos campos, errores 400, compatibilidad de solicitudes anteriores, permisos del estudiante, migración del segundo nivel oficial y logout. Las entidades temporales de estas comprobaciones se eliminaron al terminar.
- **Navegador:** se creó un curso temporal, su módulo, lección y actividad desde el frontend. El catálogo abrió el ID correcto y mostró el segundo tablero, descripción y misión guardados. Se verificaron el formulario móvil, el laboratorio a 320/390/768/1440 px y las tablas de métricas con desplazamiento dentro de su contenedor. No se encontró desbordamiento horizontal de página en las resoluciones revisadas.
- **ESLint:** quedan 25 errores y 2 advertencias del código previo, frente a 36 errores y 3 advertencias de la primera revisión. No se declara aprobado el lint general. Persisten el aviso de bundle superior a 500 kB y el aviso de MapStruct sobre `updatedAt`.
- **Data-science:** `git diff -- data-science` vacío; el ID y la fecha de inicio del contenedor son idénticos antes y después de actualizar backend/frontend.

### Archivos de esta implementación

- Backend: `CreateActivityCommand`, `ActivityDTO`, `ActivityDtoMapper`, `Activity`, `ActivityJpaEntity`, `CreateActivityService`, `UpdateActivityService`, `CourseSeederService`, `AuthController`, `CorsConfig`, `BrowserSecurityProperties`, `application.yaml` y migración V13.
- Backend, pruebas: `ActivityMetadataContractTest`, `BrowserSecurityPropertiesTest`, `AuthRolePriorityTest`.
- Frontend, casos de uso: `activityLevels.ts`, `loadCourseActivities.ts`, `loadTeacherMetrics.ts`.
- Frontend, componentes: `CourseStructure.tsx`, `HelpRequestHistory.tsx`, `Modal.tsx`, `NeonFlowStage.tsx`, `TetriLogicStage.tsx`, `PieceTray.tsx`.
- Frontend, pantallas: `Simulador.tsx`, `PaginaInicio.tsx`, `DocenteRetosPage.tsx`, `DocenteMetricasPage.tsx`, `DocenteEstudiantesPage.tsx`; modelos `apiModels.ts` y tableros `levelConfigs.ts`.
- Frontend, pruebas nuevas/actualizadas: `ActivitySimulator`, `CourseStructure`, `AcademicMetrics`, `HelpRequestHistory`, `NeonLevelTemplates`, `TetriLevelSolvability`, `ChallengeEditorContract`, `SimulatorAccessibility`.
- Configuración y documentación: `.env.example`, `docker-compose.local.yaml`, `docker-compose.yaml`, este informe y el sistema de diseño.

### Próximas decisiones necesarias

1. Acordar rúbrica de puntuación, acumulación de XP/estrellas, reintentos e idempotencia antes de vincular victorias con resultados y progreso persistente.
2. Definir contrato de mensajes/tickets si se necesita responder a estudiantes; el historial disponible sólo contiene solicitudes e interacciones de ayuda.
3. Diseñar el contrato de un editor libre de tableros si las cuatro plantillas dejan de ser suficientes.
4. Validar dominios, HTTPS, proxy y CSRF en el despliegue real; completar la limpieza del lint y la división del bundle en un trabajo específico.
