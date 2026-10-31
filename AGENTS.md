# Instrucciones para agentes de PIPRE

Estas instrucciones se aplican a todo el repositorio.

La documentación se organiza desde [docs/README.md](docs/README.md). Consultar [el estado consolidado](docs/ESTADO_ACTUAL.md) y distinguir guías vigentes, informes fechados e historial; no reactivar requisitos de un checkpoint antiguo.

## Integración vigente y trazabilidad autorizada — 30/10/2026

La autorización posterior del usuario permite **registrar intentos y acciones en ambos juegos**. Esta excepción sustituye la prohibición de telemetría de TetriLogic del checkpoint del 28/10; no autoriza puntuación, progreso académico automático ni cambios en `data-science`. Leer el [informe de integración y preparación ML](docs/informes/Integracion_TetriLogic_NeonFlow_ML.md).

El catálogo integrado tiene **30 TetriLogic v2 + 30 Neon Flow v2 = 60 retos oficiales**, con soluciones comprobadas y configuración persistida. Los dos prototipos Neon Flow `neonflow-1/2` conservan su geometría 5×5 y no se cuentan otra vez; `neonflow-3`…`30` son alias compatibles. Una base local existente puede tener 62 actividades al conservar esos dos prototipos. Las plantillas históricas TetriLogic también se conservan. No confundir cantidad física, alias y retos oficiales.

V16 incorpora Neon Flow de forma aditiva; V17 amplía `telemetry_attempts` con contexto JSONB, vínculo opcional a actividad, recepción y huella idempotente. Ambas se aplicaron en PostgreSQL local: **no editar V1…V17 ni regenerar sus SQL**. Los generadores sólo se usan con `--check`. Mantener los eventos tipados, la autorización por estudiante y los reintentos idempotentes. Las trazas son observaciones declaradas por el cliente; no certifican solución ni aprendizaje. No atribuir contexto inventado a datos antiguos y no enviar resultados aleatorios a analítica: `pipre.seed.demo-data` permanece desactivado por defecto.

## Alcance vigente de TetriLogic — filas y columnas, 28/10/2026

La mecánica vigente **restaura los objetivos por fila y columna para completar el reto**, manteniendo la manipulación directa del modo libre. Leer [la revisión de conteos y apariencia](docs/simuladores/TetriLogic_Filas_Columnas.md); el [modo libre anterior](docs/historial/TetriLogic_Exploracion_Libre.md) queda como historial. `/simulador` abre TetriLogic y las actividades siguen resolviendo su plantilla desde el backend. Usar sus dimensiones, inventario y `constraints`. Durante la exploración se permiten conteos intermedios mayores al objetivo; sólo se completa cuando coinciden todos los conteos definidos, incluidos los ceros. Mantener límites y colisiones. No restaurar bloqueos de reto, puntos obligatorios, orden, contactos, orientaciones exigidas, pistas condicionadas, temporizador visible ni puntuación. La trazabilidad autorizada el 30/10 registra el proceso sin condicionar la interacción.

Los treinta JSON TetriLogic v2 y V14/V15 permanecen inmutables; el modo activo toma sólo sus conteos, sin evaluar las demás condiciones históricas. `HistoricalTetriLogicStage` sólo se usa en pruebas de compatibilidad. Una confirmación local de reto completado **no guarda progreso académico ni concede puntos**; su observación puede persistirse en telemetría. No declarar implementado el SSD integral. `data-science` conserva su exclusión.

## Antes de implementar retos

Lee la [guía de implementación de los 30 retos por juego](docs/guias/Guia_Implementacion_30_Retos.md) y los [contratos vigentes](docs/guias/Contratos_Frontend_Backend.md). El [informe anterior de contratos](docs/historial/Informe_Contratos_Frontend_Backend.md) conserva el cierre de pendientes y pruebas de aquel lote como historial. Para cambios de interfaz conserva el [sistema de diseño](design-system/pipre/MASTER.md).

La meta acordada es **30 retos de Neon Flow y 30 retos de TetriLogic: 60 en total**. El estado integrado del 30/10 se detalla arriba; el checkpoint del 26/10 (32 de 60) es histórico. Las plantillas antiguas se conservan por compatibilidad y no se cuentan otra vez. Revisar el [informe TetriLogic](docs/historial/Informe_TetriLogic_30_Retos.md) y sus [pendientes](docs/simuladores/Pendientes_TetriLogic_SSD.md). Los prototipos editados se preservan para revisión docente. No declarar implementado el SSD integral, la puntuación o los retos diarios.

## Regla obligatoria: cada reto debe abrir su tablero

**Un reto no está terminado por existir en un seeder, una tarjeta o una respuesta de API. Debe poder seleccionarse en el catálogo y abrir el tablero correcto, con una solución comprobada.** Conserva el flujo:

`Curso → Módulo → Lección → Actividad persistida → levelTemplate → configuración del tablero → simulador`

- Persistir `idLesson`, `environment`, `levelTemplate`, `displayOrder`, descripción y misiones que correspondan al reto.
- Conectar cada plantilla nueva en `frontend/src/shared/constants/levelConfigs.ts`, `frontend/src/application/usecases/activityLevels.ts` y la validación de plantillas de `backend/src/main/java/com/pipre/backend/domain/entities/activity/Activity.java`.
- Verificar que `DocenteRetosPage` permite seleccionarla y guardarla, que `PaginaInicio` envía el ID de la actividad y que `Simulador` resuelve `/simulador/:courseId?activity=:idActivity`. No usar únicamente el ID/nombre del curso para decidir qué tablero abrir.
- El tablero debe consumir la configuración de la plantilla elegida, incluido el inventario que necesite. Guardar instrucciones o coordenadas en la API no configura automáticamente la geometría del juego.
- Una plantilla desconocida debe seguir mostrando un estado pendiente explícito. No sustituirla silenciosamente por el primer nivel ni contar duplicados o fichas sin tablero para llegar a 30 por juego.
- Comprobar la solución de cada nivel nuevo con las reglas reales, no sólo que renderiza. Ampliar la cobertura para todos los niveles, sin limitarla a los dos iniciales de cada juego.

## Persistencia y compatibilidad

- `CourseSeederService` sólo crea los cursos oficiales cuando faltan. Añadir retos únicamente dentro de esos métodos **no los incorpora a bases de datos que ya tienen esos cursos**. Proveer una incorporación aditiva e idempotente para instalaciones existentes, siguiendo la guía.
- No editar migraciones Flyway ya aplicadas, incluidas V13, V14 y V15; utilizar la siguiente versión disponible. El generador TetriLogic debe usarse con `--check` después de publicar V14, sin reescribirla. No borrar/recrear cursos para actualizar el catálogo ni sobrescribir actividades editadas por docentes.
- Mantener compatibilidad con actividades antiguas y con la edición de descripción, orden, plantilla, misiones y lección. Conservar permisos de estudiante/docente/administrador y respuestas 201 vacías donde corresponda.
- No modificar `data-science/`, su contenedor, modelos, endpoints ni proxy de IA mientras el usuario mantenga esa exclusión. No inventar reglas de puntuación, XP, estrellas o progreso automático: siguen pendientes de definición funcional.

## Criterio de entrega

Seguir la lista de aceptación de la guía. Para cada lote informar: actividades añadidas, plantillas conectadas, cantidad oficial por juego y total, pruebas realmente ejecutadas y pendientes. Verificar crear/editar/recargar/iniciar el reto, la selección entre actividades del mismo curso y la resolución del tablero. No declarar completada la meta hasta verificar 30 retos oficiales jugables por juego, 60 en total, en frontend y backend.
