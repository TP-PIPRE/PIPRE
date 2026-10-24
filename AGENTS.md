# Instrucciones para agentes de PIPRE

Estas instrucciones se aplican a todo el repositorio.

## Antes de implementar retos

Lee la [guía de implementación de los 30 retos por juego](docs/Guia_Implementacion_30_Retos.md) y el [estado actual de los contratos](docs/Informe_Contratos_Frontend_Backend.md), especialmente su cierre de pendientes. Para cambios de interfaz conserva el [sistema de diseño](design-system/pipre/MASTER.md).

La meta acordada es **30 retos de Neon Flow y 30 retos de TetriLogic: 60 en total**. Actualmente hay dos actividades oficiales conectadas por juego (cuatro en total); faltan 28 por juego, 56 en conjunto. La meta todavía no está implementada.

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
- No editar migraciones Flyway ya aplicadas, incluida V13; utilizar la siguiente versión disponible. No borrar/recrear cursos para actualizar el catálogo ni sobrescribir actividades editadas por docentes.
- Mantener compatibilidad con actividades antiguas y con la edición de descripción, orden, plantilla, misiones y lección. Conservar permisos de estudiante/docente/administrador y respuestas 201 vacías donde corresponda.
- No modificar `data-science/`, su contenedor, modelos, endpoints ni proxy de IA mientras el usuario mantenga esa exclusión. No inventar reglas de puntuación, XP, estrellas o progreso automático: siguen pendientes de definición funcional.

## Criterio de entrega

Seguir la lista de aceptación de la guía. Para cada lote informar: actividades añadidas, plantillas conectadas, cantidad oficial por juego y total, pruebas realmente ejecutadas y pendientes. Verificar crear/editar/recargar/iniciar el reto, la selección entre actividades del mismo curso y la resolución del tablero. No declarar completada la meta hasta verificar 30 retos oficiales jugables por juego, 60 en total, en frontend y backend.
