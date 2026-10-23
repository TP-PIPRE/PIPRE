# Revisión de contratos frontend/backend

Fecha: 23 de octubre de 2026. Este informe actualiza los pendientes de integración detectados en la revisión visual anterior.

## Alcance

Se compararon llamadas, cuerpos, respuestas, paginación, DTO Java/TypeScript, permisos y consumidores de las páginas. Se corrigieron los flujos existentes y se ejecutaron pruebas unitarias y comprobaciones contra Docker local.

**`data-science/` no se modificó, reconstruyó ni reinició.** Tampoco se cambiaron los modelos ni algoritmos de IA, sus endpoints o el proxy de IA. No se añadieron dependencias ni migraciones de base de datos.

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

## Validaciones ejecutadas

- **Frontend:** 27 pruebas correctas en 7 archivos. Incluyen autenticación actual, sesión corrupta, 401/403, telemetría de fondo, respuestas 201 vacías, paginación, creación/edición real del componente de retos, metadatos y deduplicación de ranking.
- **Backend:** 58 pruebas correctas, sin fallos ni errores, mediante Maven en un contenedor aislado. Incluyen registro público sin privilegios, respuesta completa de cursos, conservación del seeder y reglas de propiedad ejecutadas mediante el interceptor real de seguridad de métodos.
- **Compilación:** TypeScript y build de Vite correctos. Backend y frontend reconstruidos en Docker. Permanece el aviso de bundle JavaScript superior a 500 kB y un aviso existente de MapStruct sobre `updatedAt`.
- **HTTP local:** 22 comprobaciones correctas: registro de un estudiante temporal, login, permiso de perfil propio/ajeno, 401/403, cookie válida después de un 403, telemetría propia/ajena, curso LOW, lectura de metadatos, actualización HIGH, actividad 201 vacía, PUT de actividad, conservación de misiones y rechazo de escrituras ajenas en los cuatro recursos restantes, más logout.
- **Datos de prueba:** curso, módulo, lección, actividad, estudiante y telemetría temporales limpiados al terminar. La eliminación de la fila de telemetría confirmó que el intento había persistido.
- **Navegador:** login de ADMIN llega al panel permitido; logout real vuelve al acceso; el estudiante ve el ranking global y por grupos sin la consulta por curso reservada.
- **ESLint:** quedan 36 errores y 3 advertencias heredadas de efectos, `any` y exportaciones. No se declara aprobado el lint general.
- **Integridad del alcance:** `git diff -- data-science` sin cambios. Se guardó un respaldo de PostgreSQL antes de actualizar el backend en la carpeta de artefactos de esta sesión (`pipre-before-contracts.sql`).

## Incoherencias pendientes que requieren trabajo funcional

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
