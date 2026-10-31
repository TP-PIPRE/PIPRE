# Pendientes de endpoints del backend

**Revisado el 30/10/2026 contra código y esquema local V17.** Este documento separa los dos bloques aún propuestos en la [lista histórica](../historial/req-backend-mejoras.md): actualización mediante `PATCH` y asignación de actividades a grupos. No son dos rutas exactas ni funcionalidades implementadas; cada bloque necesita los endpoints indicados abajo.

[Índice](../README.md) · [Contratos vigentes](Contratos_Frontend_Backend.md) · [Revisión IA y datos](../../req-ia-endpoints.md).

## Resumen y alcance

| Bloque | Situación actual | Trabajo pendiente |
|---|---|---|
| Actualización parcial explícita | Hay PUT de actividades/cursos; el de actividad ya conserva los campos omitidos. No hay `@PatchMapping`. | Definir y exponer PATCH sin romper PUT ni su compatibilidad. |
| Grupo → actividades | `groups` y `activities` existen; `group_students` vincula estudiantes a grupos. No existe relación grupo–actividad. | Definir alcance de asignación, persistir la relación y exponer consulta/asignación/retirada. |

Los antiguos pendientes de consultar actividad/grupo, enriquecer DTO, `performance/rating`, ayudas, progreso y riesgo ya tienen implementaciones. Cursos y actividades ya ofrecen paginación; ampliarla a otras colecciones requiere un inventario posterior, no recrear los endpoints existentes. La consulta general `GET /help-requests` del borrador antiguo no existe: la interfaz actual utiliza el historial por estudiante.

Esta entrega sólo documenta. No añade API, migraciones ni tablas; no modifica `data-science`, proxy o modelos. Las propuestas IA y su agregación se detallan separadamente en el documento enlazado, sin convertirlas en una autorización de implementación.

## 1. PATCH de actividades y cursos

### Rutas propuestas

| Método y ruta | Finalidad | Permisos propuestos |
|---|---|---|
| `PATCH /api/v1/activities/{id}` | Modificar sólo campos presentes de una actividad. | TEACHER / ADMIN, conservando las comprobaciones existentes. |
| `PATCH /api/v1/courses/{idCourse}` | Modificar sólo campos presentes de un curso. | TEACHER / ADMIN. |

**Contrato propuesto:** JSON de campos explícitos y respuesta 200 con el DTO actualizado. No se declara compatibilidad con un estándar de patch que todavía no se implemente. PUT mantiene sus respuestas/comportamiento actuales.

```json
{
  "description": "Objetivo revisado del reto",
  "displayOrder": 3
}
```

Omitir un campo conserva el valor anterior. Distinguir ausencia, `null` y lista vacía antes de implementar: no definir de forma implícita que `null` borre campos o reinicie valores. Para misiones, una lista vacía explícita puede representar retirada total sólo con un contrato acordado. Rechazar campos desconocidos o no editables y conservar IDs, resultados y trazas.

Validar plantilla/entorno de forma conjunta, lección existente, orden positivo y niveles/enums del contrato. En cursos no reutilizar sin adaptación `UpdateCoursesService`: actualmente construye los detalles con el request y no ofrece la misma semántica parcial que actividades.

### Impacto de datos y aceptación

No requiere nuevas columnas para los campos ya soportados. Reutilizar dominio, puertos, persistencia y transacciones; un PATCH no debe crear otra actividad ni reinicializar relaciones. Definir detección de ediciones concurrentes antes de prometer prevención de actualizaciones perdidas; no existe aquí una garantía de control optimista nueva.

- [ ] Acordar campos editables, ausencia/null, arrays, errores y respuesta.
- [ ] Añadir DTO/puerto/caso de uso/controlador siguiendo las capas del proyecto.
- [ ] Probar modificación de un campo conservando el resto, misiones y asociaciones.
- [ ] Probar 401/403, inexistentes, plantilla incompatible y error sin escritura parcial.
- [ ] Mantener PUT y consumidores antiguos funcionando.

## 2. Asignación de actividades a grupos

### Relación de datos propuesta

La base local tiene `groups(id_group)`, `activities(id_activity)` y `group_students(id_ranking, id_group, id_student)`. No hay `group_activities` ni FK que asigne actividades a grupos. Que una actividad pertenezca a un curso y un estudiante a un grupo no crea esa asignación.

Proponer una tabla de asociación `group_activities`, con:

- `id_group` e `id_activity` del tipo compatible con sus claves actuales (`VARCHAR(36)`). Los IDs son cadenas opacas, no todos UUID: existen actividades como `act-c001-30`.
- Clave primaria compuesta o restricción única `(id_group, id_activity)` y FK a ambos recursos.
- Índice para la consulta inversa cuando sea necesario; definir borrado de asignaciones sin borrar actividad, resultados o trazas.

Requiere una **nueva migración aditiva posterior a la última versión disponible**, no editar V1…V17. No se crea en esta entrega. No rellenar asignaciones deduciéndolas del ranking ni de la primera lección encontrada.

### Rutas propuestas

| Método y ruta | Contrato propuesto |
|---|---|
| `GET /api/v1/groups/{idGroup}/activities` | Página de actividades asignadas, con IDs, plantilla, entorno y metadatos vigentes; sin duplicados. |
| `PUT /api/v1/groups/{idGroup}/activities/{idActivity}` | Asignación idempotente: repetir no crea otra relación. Respuesta propuesta 204. |
| `DELETE /api/v1/groups/{idGroup}/activities/{idActivity}` | Retirar sólo la asignación. Respuesta propuesta 204; acordar inexistentes sin borrar el reto. |

La escritura queda para docentes/administradores. Para lectura estudiantil comprobar pertenencia al grupo; definir además el alcance curricular y qué docentes gestionan cada grupo antes de implementarlo. Las tablas actuales no prueban por sí solas propiedad docente de un grupo o relación grupo–curso.

Conservar el inicio del tablero por `idActivity` y verificar su pertenencia al curso correspondiente. Asignar un reto no cambia su plantilla, concede puntos ni obliga a bloquear otros retos del catálogo actual.

### Aceptación

- [ ] Acordar visibilidad, alcance curricular, permisos e inexistentes.
- [ ] Crear relación mediante migración nueva, con FK/únicos y conservación de datos.
- [ ] Conectar todas las capas y, si se aprueba su uso, navegación frontend.
- [ ] Probar asignación repetida/concurrente, consulta paginada y retirada sin pérdida del reto.
- [ ] Probar grupo/actividad inexistentes, estudiante ajeno y conservación de resultados/telemetría.
- [ ] Resolver el tablero asignado y comprobar su solución real.

## Relación con los endpoints IA

**La alineación es parcial.** La nueva asociación no es necesaria para agregar observaciones de estudiantes de un grupo: esa membresía ya existe en `group_students`. Sí sería necesaria si se quisiera filtrar por «retos asignados a este grupo». No mezclar los dos significados.

El borrador IA tenía una ruta de feedback incorrecta y respuestas distintas de TypeScript. También exigía score, nivel lógico y errores sin una procedencia válida para los juegos activos. El [documento IA actualizado](../../req-ia-endpoints.md) separa contrato existente, propuesta de agregación desde Spring, datos disponibles y métricas todavía indefinidas. Añadir PATCH o `group_activities` no soluciona automáticamente esas diferencias.

## Comprobaciones de esta revisión

Se leyeron controladores/casos de uso, DTO Java/TypeScript, migraciones y entidades. PostgreSQL local confirmó V16/V17 exitosas, columnas y FK de las tablas relevantes, y ausencia de asociación grupo–actividad. La inspección usó sólo metadatos; no consultó información personal ni escribió en la base.

Las casillas anteriores son criterios para una implementación futura, no pruebas ejecutadas de endpoints nuevos. Las rutas IA se inspeccionaron estáticamente sin importar la aplicación ni iniciar/entrenar modelos; no se verificó la publicación remota.

La validación documental revisó 34 Markdown y 213 enlaces locales sin destinos/anclas rotos, además de cinco ejemplos JSON válidos. Las huellas de los 602 archivos no Markdown existentes coinciden con la instantánea previa: código, migraciones, modelos y SQL permanecen intactos. No se ejecutaron suites de aplicación por una edición exclusivamente documental.
