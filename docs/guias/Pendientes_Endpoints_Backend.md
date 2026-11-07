# Estado de PATCH y actividades por aula

**Implementación del 06/11/2026**, posterior a la propuesta del 30/10. Las decisiones de permisos aprobadas por el usuario sustituyen la propuesta docente global. Ver [puntaje y acceso](Puntaje_Ranking_Acceso.md) y [evidencia de implementación](../informes/Implementacion_Pendientes_2026_11_06.md). No se modifica IA.

## Actualización parcial explícita

| Ruta | Permiso | Respuesta |
|---|---|---|
| `PATCH /api/v1/courses/{id}` | ADMIN | 200 con CourseDTO |
| `PATCH /api/v1/activities/{id}` | ADMIN o docente del curso, incluida la lección destino | 200 con ActivityDTO |

El cuerpo es un objeto JSON parcial explícito, no JSON Patch ni JSON Merge Patch. Omitir conserva el valor anterior; `null`, objeto vacío, campos desconocidos o tipos incorrectos devuelven 400. Los campos editables de curso son `name`, `description`, `level`. En actividades se admiten los campos de CreateActivityCommand, con validación de nivel lógico, orden, plantilla/entorno y lección. Una descripción vacía es texto explícito; `missions: []` retira las misiones. IDs, resultados, simulaciones y trazas no son campos editables.

```json
{"description":"Objetivo revisado","displayOrder":3}
```

Se reutilizan los servicios y las transacciones existentes. Un bloqueo de la fila protege la mezcla de campos en PATCH; no se promete control optimista entre ediciones completas PUT o SQL externo. Los PUT conservan sus rutas y respuestas anteriores. Se corrigió la persistencia para que editar los detalles de un curso conserve sus módulos y editar una actividad conserve sus simulaciones históricas.

## Asignaciones a aulas

V22 añade `group_activities`, con PK compuesta y FK; también incorpora las relaciones explícitas de docentes y cursos. No se rellenan asignaciones por inferencia.

| Ruta | Permiso | Respuesta |
|---|---|---|
| `GET /api/v1/groups/{group}/activities` | ADMIN, docente asignado o estudiante del aula | 200, página de ActivityDTO |
| `PUT /api/v1/groups/{group}/activities/{activity}` | ADMIN | 204 idempotente |
| `DELETE /api/v1/groups/{group}/activities/{activity}` | ADMIN | 204 idempotente |

Las consultas conservan el orden de presentación, paginan con un máximo de 100 y no duplican actividades. Los padres inexistentes devuelven 404 cuando el solicitante tiene permiso para consultarlos; un estudiante/docente sin asignación recibe 403. Asignar un reto requiere asociar primero su curso al aula. Retirar el curso retira sus asociaciones de retos del aula, conservando las actividades y su historial. Retirar una asignación repetidamente no borra el ejercicio. Si una actividad cambia a otro curso, la lista del aula sólo la muestra cuando ese curso también está asociado; el conteo paginado aplica el mismo filtro. Así no se expone contenido ajeno ni se ofrece al docente un tablero fuera de su alcance.

Administración permite seleccionar aula, curso y actividad persistida para asignarla o retirarla. La asignación no bloquea el catálogo estudiantil existente, no cambia la plantilla ni concede puntos. El tablero sigue abriéndose por `idActivity` con la configuración persistida. La selección procedural diaria continúa siendo independiente de estas asignaciones y de IA.

## Aceptación

Se verificaron conservación de campos/relaciones, misiones vacías, entradas inválidas sin escrituras parciales, permisos, asignación concurrente e idempotente, consulta paginada y retirada sin pérdida del reto en H2 y PostgreSQL desechable. El navegador verifica crear, editar, recargar, iniciar y eliminar actividades con los permisos actuales. Los 60 tableros conservan sus pruebas de solución. La [evidencia](../informes/Implementacion_Pendientes_2026_11_06.md) identifica los resultados y límites de cada suite; no acredita despliegue remoto.
