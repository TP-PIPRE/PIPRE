# Pendientes y continuidad del SSD de TetriLogic

**Revisado: 30/10/2026.** Este es el listado vigente; las restricciones e ideas de versiones anteriores permanecen en el [informe histórico del SSD](../historial/Informe_TetriLogic_30_Retos.md). [Estado actual](../ESTADO_ACTUAL.md) · [Reglas activas](TetriLogic_Filas_Columnas.md).

## Implementado y validado en la integración

- [x] Treinta configuraciones oficiales por juego, sesenta en total, sin duplicar alias/prototipos.
- [x] Actividad → plantilla → configuración persistida → tablero, con metadatos/misiones y selección de lección conservados.
- [x] TetriLogic con manipulación directa, límites/colisiones y éxito por conteos exactos de ambos ejes, incluidos ceros; excesos intermedios permitidos.
- [x] V14/V15 para TetriLogic, V16 para Neon Flow y V17 para trazabilidad, aplicadas localmente y congeladas.
- [x] Intentos/acciones de ambos juegos autorizados y contextualizados sin duplicar entidades de intento.
- [x] Estudiante/actividad/versiones, tiempos, estado inicial/final, eventos y ayudas estáticas diferenciadas de IA.
- [x] Identidad, compatibilidad, acotación de eventos e idempotencia de solicitudes, incluidos reintentos concurrentes en PostgreSQL.
- [x] Abandono al salir/desmontar y cola por estudiante; no se promete entrega garantizada ante cierre o corte eléctrico.

Las evidencias completas son las del [informe de integración](../informes/Integracion_TetriLogic_NeonFlow_ML.md): no ejecutar otra vez generación/migraciones para recrear trabajo ya entregado. Las cifras anteriores de V14/V15, 78 pruebas o 32 actividades corresponden a checkpoints del 26/10, conservados en el historial.

## Pendientes técnicos y de datos

| Pendiente | Restricción de implementación |
|---|---|
| Guardado y reanudación de partida | Definir un contrato distinto de la cola de telemetría; guardar eventos no restaura piezas ni progreso. |
| Solución verificada en servidor | Reproducir historial y reglas antes de otorgar resultados autorizados. Las trazas actuales llevan `clientReported=true`. |
| Revisiones de actividad | Diseñar cómo aceptar una traza todavía no recibida si el docente cambió la plantilla durante la resolución, sin mezclar versiones. |
| Calidad y privacidad del dataset | Separar cuentas/pruebas/demostraciones, revisar contexto nulo, truncamientos y procedencia; definir retención y exportación seudonimizada. |
| Persistencia Docker de PostgreSQL | Revisar volumen nombrado y recuperación con respaldo; el Compose local actual no declara ese volumen. No cambiar ni recrear la base como parte de una edición documental. |
| Calidad general | Reducir bundle/lint, actualizar diagramas del esquema y ampliar pruebas con lector de pantalla y dispositivo táctil físico. |

El bootstrap todavía crea diez estudiantes ficticios además de las cuentas de acceso. `pipre.seed.demo-data=false` no los elimina ni etiqueta automáticamente los datos antiguos; no suponer un dataset de estudiantes reales.

## Decisiones funcionales pendientes

Puntuación, XP, estrellas, recompensas, desbloqueos, ranking derivado de victorias y progreso entre sesiones necesitan una rúbrica acordada y cálculo autorizado/idempotente. Las propuestas numéricas del SSD son antecedentes; no son reglas aprobadas ni campos que deban inventarse por este listado.

Los objetivos por filas/columnas son el alcance vigente. **No reactivar** bloqueos, puntos obligatorios, precedencias, contactos, giros finales exigidos, pistas condicionadas ni temporizador visible por encontrar sus datos en un JSON histórico. La equivalencia pedagógica y dificultad requieren piloto, sin asumir que solvencia demuestra aprendizaje.

Guía de solución, políticas de ayudas o autonomía necesitan una nueva definición explícita; no añadir umbrales históricos de tres/cinco fallos al modo activo. Las soluciones de pruebas no se publican en respuestas del catálogo.

## IA y reto diario: fuera del alcance actual

`data-science`, modelos, endpoints, proxy y contenedor siguen excluidos. La autorización de trazabilidad no levanta esa exclusión. Tutor adaptativo, agregación ML y retos diarios son propuestas separadas; no implementarlos automáticamente desde este documento.

Los generadores de catálogo son herramientas offline de contenido congelado, no servicios ML ni generadores de retos diarios. Versionado de instancias, zona horaria del producto, semillas, premios y límites del SSD diario requieren acuerdos posteriores; no se fija aquí una política.

## Continuación segura

1. Leer [AGENTS.md](../../AGENTS.md), [estado actual](../ESTADO_ACTUAL.md) y [guía de retos](../guias/Guia_Implementacion_30_Retos.md).
2. Consultar rama, esquema y versiones del entorno concreto; respaldar antes de migrar. No asumir que otro entorno ya recibió V1…V17.
3. Usar únicamente `--check` en ambos generadores. Una nueva geometría/versionado requiere migración posterior disponible, sin editar SQL publicado.
4. Preservar actividades docentes y datos anteriores; no borrar cursos ni inflar el conteo para cumplir una meta.
5. Validar sólo lo que cambie y registrar comandos/resultados reales. [Ejecución y comprobaciones](../sistema/06_Guia_Despliegue_Ejecucion_Local.md).

La preparación de Git y las verificaciones de la integración del 30/10 constan en su informe. No interpretar una fusión pendiente de commit como autorización para abortarla, reiniciarla, crear commits o hacer push.
