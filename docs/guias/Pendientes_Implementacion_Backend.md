# Pendientes de implementación y validación del backend

**Revisión: 05/11/2026.** Lista vigente de continuidad de la [auditoría del backend](../informes/Auditoria_Backend_2026_11_05.md). Estos puntos no se presentan como implementados. Las correcciones y pruebas terminadas se describen en el informe, sin mezclar sus resultados con las propuestas siguientes.

## Integridad y reglas funcionales

| ID | Prioridad | Qué falta | Evidencia y siguiente paso | Criterio de cierre |
|---|---|---|---|---|
| B01 | Alta | Restricciones únicas de pertenencia a grupo y progreso académico por estudiante/módulo. | V3/V5 permiten duplicados; las escrituras de los servicios ahora se serializan, pero una escritura SQL externa puede eludirlas. Consultar duplicados sin alterar datos y acordar su conciliación antes de crear una migración aditiva posterior a la última disponible. No modificar V1–V21 ni borrar historial automáticamente. | Migración probada sobre una copia con duplicados, conservación del historial y pruebas concurrentes con las restricciones activas. |
| B02 | Alta, requiere definición | Contrato de calificación académica y estados de progreso. | `SaveResultService` admite score declarado y `SaveModuleProgressService` admite estado/porcentaje manual. Son contratos existentes, separados de victorias verificadas y nuevos logros. Falta definir rúbrica, escala máxima, quién puede calificarlos y transiciones permitidas. No convertir estas entradas en evidencia de aprendizaje ni fuente de XP. | Contrato aprobado, validaciones de dominio y pruebas de autorización, límites, transiciones y compatibilidad del consumidor. |
| B03 | Media | Idempotencia de resultados académicos y simulaciones declaradas. | Sus POST conservan el comportamiento de crear un registro por petición; no hay clave de intento común. No deduplicar por estudiante/actividad: puede haber intentos legítimos distintos. | Definir una clave de reintento, añadir persistencia compatible y demostrar que repetir el mismo intento no lo duplica y otro intento sí se conserva. |
| B04 | Media, requiere definición | Alcance de lectura y gestión por grupo/curso/docente. | `GroupController`, rankings y CRUD curricular comprueban roles; el esquema actual no representa propiedad docente ni todas las asignaciones curriculares. Las operaciones personales sí comprueban estudiante. | Definir pertenencia/propiedad, modelarla y probar matrices de acceso entre docentes y grupos, sin bloquear el catálogo actual por inferencias. |
| B05 | Media | Reanudar un tablero parcialmente resuelto. | Las sesiones y acciones se persisten en servidor; el frontend todavía no reconstruye una partida al volver a entrar. Los ejercicios ya completados sí permanecen guardados. | Recuperación autorizada de sesión/estado y reconexión del simulador; pruebas de recarga, cierre de sesión y reintento sin pérdida ni doble recompensa. |
| B06 | Media, propuesta previa | PATCH explícito y actividades asignadas a grupos. | No son errores nuevos ni endpoints implementados. El PUT de actividad mantiene su edición parcial compatible. | Completar el contrato y la aceptación de [Pendientes de endpoints](Pendientes_Endpoints_Backend.md), con migración nueva sólo si procede. |
| B11 | Media, requiere definición | Agregados de bloques usados y eficiencia del perfil. | `GetStudentProfileService` devuelve `totalBlocksUsed=0` y `efficiencyAvg=null`: no hay un cálculo verificado de esos agregados. Definir fuente, significado, unidad y representación de «sin datos»; no convertir colocaciones o telemetría en una medida pedagógica por inferencia. | Contrato documentado, agregación con datos de procedencia válida y pruebas con/sin datos; consumidores que distingan ausencia de información de un cero medido. |
| B12 | Media | Contrato JSON de paginación independiente de clases internas de Spring. | Cursos/actividades devuelven `Page`; Spring Data avisa al serializar `PageImpl` de que su estructura no está garantizada entre versiones. La respuesta actual se conserva para no romper TypeScript. | DTO o adaptación explícita que preserve `content`, totales y demás campos consumidos, con pruebas de esquema y compatibilidad; no activar otro formato global silenciosamente. |

## Operación y seguridad que requieren un lote propio

La corrección de vulnerabilidades de dependencias permanece pausada por instrucción del usuario. Esta auditoría no cambia credenciales ni configura producción.

| ID | Prioridad | Qué falta | Evidencia y siguiente paso | Criterio de cierre |
|---|---|---|---|---|
| B07 | Alta antes de despliegue | Estrategia CSRF coherente con autenticación mediante cookie. | `SecurityConfig` desactiva CSRF; la cookie es HttpOnly y existe configuración de SameSite/CORS. Revisar los orígenes y el despliegue real antes de cambiar el contrato de autenticación. | Diseño documentado y pruebas con navegador de petición legítima, petición entre sitios y cierre de sesión; conservar el flujo de acceso. |
| B08 | Alta antes de despliegue | Robustez del limitador de inicio de sesión. | `LoginRateLimiterFilter` confía en `X-Forwarded-For`, conserva un mapa en memoria por instancia y separa la comprobación del contador de su incremento. Falta definir proxies fiables, atomicidad, expiración y comportamiento con varias réplicas. | Pruebas de límite concurrente, IP manipulada, limpieza de memoria y despliegue detrás del proxy acordado. |
| B09 | Alta antes de despliegue | Aislar las cuentas de arranque y la configuración local respecto a producción. | Revisar los seeders y perfiles existentes; no se cambian cuentas ni secretos reales en este lote. `pipre.seed.demo-data` permanece desactivado. | Producción arranca sin cuentas de demostración ni secretos por defecto, con validación automatizada del perfil y plan de provisión autorizado. |
| B10 | Media | Observabilidad y límites operativos. | Los fallos inesperados ahora responden 500 con mensaje genérico y se registran; falta política acordada de retención, correlación de solicitudes, límites de colecciones y monitorización. | Política de datos y pruebas de carga/consulta representativas; no registrar credenciales ni atribuir puntuación pedagógica a telemetría declarada. |

## Cobertura y alcance aún no acreditado

- La suite de contratos inventaría rutas y permisos y ejecuta flujos representativos. No equivale a probar todas las combinaciones de campos, filtros y roles de todos los endpoints. Ampliar los casos según el reporte JaCoCo y la matriz de rutas exportada en `backend/target/api-contract-inventory.json`.
- La cobertura final de líneas es 97,07 % en las 12 clases críticas y 72,44 % global; la de ramas críticas es 75,92 %. Falta ampliar pruebas de comportamiento en controladores (68,25 % de líneas), adaptadores de persistencia (56,93 %), mappers (52,14 %) y seguridad (76,47 %), además de errores/alternativas señalados por JaCoCo. Los seeders tienen 14,60 % y necesitan escenarios de preservación/idempotencia en bases aisladas; no activar datos de demostración en la aplicación para elevar cobertura.
- Falta automatizar en CI la ejecución completa con Java 21, la integración PostgreSQL aislada y la publicación de reportes. Las instrucciones reproducibles están en [Pruebas del backend](../../backend/TESTING.md).
- Los avisos del compilador sobre mapeos, API obsoleta y tipos genéricos requieren revisión específica. Comprobar qué campos asignan explícitamente los adaptadores antes de cambiar mappers o suprimir avisos.
- Los adaptadores históricos `PlayerProfileRepositoryAdapter` y `PlayerAchievementRepositoryAdapter` conservan responsabilidades del esquema anterior y no son la fuente del flujo L01–L35 actual. Revisar sus referencias y consumidores antes de una limpieza de código; no reactivarlos, borrar desbloqueos ni recalcular XP como parte de esa limpieza.
- Falta verificar la compatibilidad del despliegue remoto, carga sostenida, interrupción/reinicio de procesos y recuperación ante fallos de red reales. Este lote usa bases desechables y no modifica datos ni contenedores de la aplicación local.
- `data-science/`, sus modelos, endpoints, proxy y contenedor siguen excluidos. Su contrato, pruebas de servicios externos y futura selección de retos mediante IA requieren autorización y trabajo separados; el generador procedural no depende de IA.
- La auditoría no implementa el SSD integral, una rúbrica pedagógica ni una validación causal del aprendizaje. Consultar también los [pendientes de simuladores/SSD](../simuladores/Pendientes_TetriLogic_SSD.md).

## Orden sugerido para continuar

1. Acordar las reglas pendientes de B02/B04 y el entorno de despliegue de B07–B09.
2. Revisar duplicados históricos en una copia y preparar B01 con una migración nueva y reversible a nivel de aplicación.
3. Ampliar cobertura de los módulos con menor evaluación y llevar la suite a CI.
4. Implementar reanudación e idempotencia de contratos declarativos cuando sus identificadores y comportamiento estén definidos.

Los identificadores de esta lista son referencias de trabajo; no sustituyen las autorizaciones del usuario ni convierten propuestas en requisitos activos de implementación.
