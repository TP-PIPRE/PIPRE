# Puntaje verificado, XP y permisos

Reglas aprobadas por el usuario el 06/11/2026. Sustituyen las propuestas de nota académica o gestión docente global dentro de este alcance. No modifican las reglas de victoria, estrellas, catálogo, selección procedural ni IA.

## Puntos y XP

Una victoria persistida y validada por `game-sessions` concede entre 50 y 100 puntos. Se usa esta fórmula entera:

```text
50
+ floor(30 × movimientosReferencia / max(movimientosReferencia, movimientos))
+ floor(20 × 180000 / (180000 + duraciónMs))
```

Los movimientos y la duración proceden del servidor. La referencia cuenta las colocaciones y giros de 90° de las soluciones locales comprobadas; no se entrega la solución en las respuestas. La duración incluye el intervalo fuera de la aplicación al reanudar. No se añade un temporizador visible a TetriLogic. Los puntos no son una nota ni una medida validada de aprendizaje.

- Ejercicio oficial: identidad canónica por plantilla/juego, aunque existan varias actividades que abran ese tablero. Los alias compatibles comparten identidad.
- Ejercicio diario: identidad del UUID persistido del ejercicio; se conservan sus puntos después del día.
- El total del ranking suma los mejores puntajes. Repetir o empeorar no suma; mejorar sólo añade la diferencia positiva.
- El recibo de finalización conserva el puntaje del intento, mejor puntaje, incremento, total y XP diario concedido. Repetir una finalización devuelve el mismo recibo.
- Cinco diarios correctos conceden **50 XP una vez por estudiante/fecha `America/Lima`**. Los primeros cuatro no conceden ese bono ni completan el conjunto. Se preservan el XP y los desbloqueos anteriores por logros.
- Un bloqueo por estudiante, claves únicas y recibos transaccionales evitan duplicaciones por concurrencia. Los POST declarativos históricos no conceden puntos ni XP.

El historial identifica `SERVER_VERIFIED` frente a `LEGACY_DECLARED`. Una victoria anterior sin recibo mantiene puntaje nulo; no se recalifica. Los resúmenes de puntos de la interfaz sólo usan valores verificados. `efficiencyAvg` describe el promedio de `100 × referencia / max(referencia, movimientos)` en los recibos nuevos. `totalBlocksUsed` cuenta piezas presentes en esas soluciones verificadas. Sin recibos, ambos son nulos; no se inventa un cero observado ni una calificación pedagógica.

## Matriz de acceso

| Operación | Administrador | Docente | Estudiante |
|---|---|---|---|
| Crear/eliminar cursos | Sí | No | No |
| Gestionar contenido | Todos | Cursos asignados | No |
| Crear/asignar aulas y membresías | Sí | No | No |
| Consultar aulas | Todas | Asignadas | Propias, sin ampliar progreso ajeno |
| Consultar progreso personal | Global | Estudiantes de sus aulas | Propio |
| Resolver con puntos/XP | Vista previa | Vista previa | Sí |
| Ranking | Global/curricular/aulas | Sus cursos/aulas | Según configuración |
| Usuarios/roles | Sí | No | No |

Prioridad de roles: administrador, docente y estudiante. Un usuario de gestión con varios roles sigue en vista previa. Las asignaciones se guardan explícitamente en V22; no se deduce un docente a partir de datos históricos. Un aula asignada con cursos asociados también permite gestionar ese contenido a su docente. Una asignación directa de curso no concede acceso a todos sus estudiantes.

`/docente/administracion` permite crear aulas, asociar docentes/cursos, asignar estudiantes/actividades, añadir/retirar roles, activar/desactivar cuentas y configurar el ranking. Retirar un rol docente elimina sus asignaciones; desactivar conserva el historial. El servidor impide retirar el último rol o el último administrador activo. Los JWT se comparan con el estado activo y los roles vigentes en cada petición; un cambio de roles requiere un acceso con claims coincidentes.

Visibilidad estudiantil: `CLASSROOM` por defecto, `HIDDEN` o `GLOBAL`, editable sólo por administrador. El ranking global usa un endpoint específico; no enumera aulas ajenas ni abre el progreso de sus integrantes. La posición del perfil sigue la visibilidad y, por aula, muestra su mejor posición entre sus aulas.

## Recuperación y compatibilidad

`GET /game-sessions/active` recupera sólo una partida del estudiante autenticado que coincida con juego, plantilla, actividad y diario. Devuelve 204 si no hay coincidencia. Los diarios deben seguir siendo del día y respetar el orden. No cambia ni abandona una partida por consultar.

El frontend reconstruye inventario, posiciones y giros desde el estado confirmado, sin reenviar movimientos ya aceptados. Continúa en `revision + 1`; el reinicio explícito permite abrir otro intento. Las acciones aún sin confirmación al cerrar abruptamente siguen siendo de mejor esfuerzo. La telemetría mantiene su condición de observación declarada y empieza el nuevo episodio con el estado recuperado.

En la práctica libre, `?level=<número>` conserva la selección del tablero al recargar en ambos simuladores. En las actividades y los diarios, el contexto persistido sigue determinando el tablero.

V1–V21 permanecen intactas. V22–V26 son aditivas y no están aplicadas a la base de la aplicación por este trabajo. **Antes de actualizar una instalación existente, ejecutar [el preflight de integridad](../../scripts/preflight-integrity.sql)**. V25 rechaza duplicados sin elegir ni borrar historial; si aparecen, su conciliación requiere revisión de los datos y una decisión explícita del operador. Configurar después las asignaciones docentes desde administración.
