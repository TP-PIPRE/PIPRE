# Instrucciones para agentes de PIPRE

Estas instrucciones se aplican a todo el repositorio.

## Alcance vigente de TetriLogic — filas y columnas, 28/10/2026

La instrucción más reciente del usuario **restaura los objetivos por fila y columna para completar el reto**, manteniendo la manipulación directa del modo libre. Leer [la revisión de conteos y apariencia](docs/TetriLogic_Filas_Columnas.md); el [modo libre anterior](docs/TetriLogic_Exploracion_Libre.md) queda como historial. `/simulador` abre TetriLogic y las actividades siguen resolviendo su plantilla desde el backend. Usar sus dimensiones, inventario y `constraints`. Durante la exploración se permiten conteos intermedios mayores al objetivo; sólo se completa cuando coinciden todos los conteos definidos, incluidos los ceros. Mantener límites y colisiones. No restaurar bloqueos de reto, puntos obligatorios, orden, contactos, orientaciones exigidas, pistas condicionadas, temporizador, puntuación ni telemetría de intentos.

Los treinta JSON v2 y V14/V15 permanecen inmutables; el modo activo toma sólo sus conteos, sin evaluar las demás condiciones históricas. `HistoricalTetriLogicStage` sólo se usa en pruebas de compatibilidad. El catálogo mantiene 30 configuraciones TetriLogic y 2 Neon Flow (32 actividades). Una confirmación local de reto completado **no guarda progreso ni concede puntos**. No declarar entregados 60 retos ni el SSD integral. Neon Flow y `data-science` conservan su alcance anterior.

## Antes de implementar retos

Lee la [guía de implementación de los 30 retos por juego](docs/Guia_Implementacion_30_Retos.md) y el [estado actual de los contratos](docs/Informe_Contratos_Frontend_Backend.md), especialmente su cierre de pendientes. Para cambios de interfaz conserva el [sistema de diseño](design-system/pipre/MASTER.md).

La meta acordada es **30 retos de Neon Flow y 30 retos de TetriLogic: 60 en total**. Al 26 de octubre de 2026, el código y PostgreSQL local incorporan **30 tableros oficiales TetriLogic v2 y dos de Neon Flow: 32 de 60**; faltan 28 de Neon Flow. Las dos plantillas antiguas de TetriLogic se conservan por compatibilidad y no se cuentan otra vez. Revisar el [informe TetriLogic](docs/Informe_TetriLogic_30_Retos.md) y sus [pendientes](docs/Pendientes_TetriLogic_SSD.md): V14 y V15 ya se validaron y aplicaron en PostgreSQL local; los prototipos editados se preservan para revisión docente. No declarar implementado el SSD integral, la puntuación o los retos diarios.

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
