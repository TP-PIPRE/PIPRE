# Estado actual de PIPRE

**Referencia consolidada: 30/10/2026.** Describe el código de la integración local en `Feature/Tetrilogic-avances`. No afirma un despliegue de producción ni sustituye las instrucciones de [AGENTS.md](../AGENTS.md).

## Catálogo y conexión

| Juego | Curso | Actividades oficiales | Plantillas oficiales |
|---|---|---|---|
| Neon Flow | `c001` | `act-c001-v2-1`, `act-c001-v2-2`, `act-c001-3`…`30` | `neonflow-v2-1`…`30` |
| TetriLogic | `c002` | `act-c002-1`…`30` | `tetrilogic-v2-1`…`30` |
| Total | Dos cursos | **60 retos: 30 por juego** | 60 configuraciones oficiales |

Las plantillas `neonflow-1/2` conservan sus tableros anteriores 5×5; `neonflow-3`…`30` son alias compatibles del nuevo catálogo. También se conservan `tetrilogic-1/2`. Ningún alias o prototipo se cuenta otra vez. La base local existente tiene 62 actividades al preservar los dos prototipos Neon Flow; una instalación nueva incorpora 60 oficiales. Las personalizaciones docentes de otros entornos pueden exigir revisión manual.

El flujo es **curso → módulo → lección → actividad → plantilla → configuración → simulador**. Los accesos de actividades usan `/simulador/:courseId?activity=:idActivity`. `c001` y `c002` se resuelven por actividad, no por el nombre del curso. `/simulador` abre la práctica TetriLogic independiente. Una actividad desconocida, ajena al curso o sin plantilla compatible muestra un estado explícito.

## Mecánicas vigentes

**TetriLogic:** manipulación directa con bandeja externa; selección, arrastre, giro de 90°, devolución y teclado. Se mantienen límites y colisiones. Se completa automáticamente cuando todos los objetivos definidos de filas y columnas coinciden, incluidos ceros. Durante la exploración se permite superar un objetivo. No exige llenar toda la cuadrícula.

El modo activo sólo consume tamaño, inventario y conteos del catálogo publicado. No evalúa bloqueos de reto, puntos obligatorios, precedencias, contactos ni giros finales exigidos. No presenta temporizador, puntuación ni pistas condicionadas. `HistoricalTetriLogicStage` se conserva sólo para compatibilidad en pruebas. Ver [reglas e interacción](simuladores/TetriLogic_Filas_Columnas.md).

**Neon Flow:** guiar el haz con espejos y filtros; comprobar el recorrido y el color de los receptores. El haz se detiene en obstáculos, filtros incompatibles y receptores, con un límite de iteraciones para evitar ciclos. El botón Pista muestra una ayuda estática, no una respuesta del servicio IA. Ver [funcionamiento](simuladores/NeonFlow.md).

## Persistencia y trazabilidad

Las migraciones publicadas son **V1…V17**. V13 incorpora metadatos de actividad, V14/V15 el catálogo TetriLogic y compatibilidad de prototipos, V16 Neon Flow y V17 contexto de intentos. No reescribirlas. Los generadores se usan con `--check`.

La autorización del 30/10 permite registrar intentos y acciones de ambos juegos en `telemetry_attempts`. Incluyen estudiante autorizado, actividad opcional, plantilla, versión de reglas, tiempos, eventos y estado inicial/final. Los reintentos aceptados son idempotentes. La práctica independiente admite actividad nula; los registros anteriores conservan contexto nulo.

Las trazas son **declaradas por el cliente**. Persistirlas no valida la solución en servidor, no guarda/reanuda el tablero y no crea una nota, XP, estrellas, ranking ni progreso académico. La cola y el envío al salir son de mejor esfuerzo: un corte eléctrico puede perder acciones aún no enviadas. [Contrato vigente](guias/Contratos_Frontend_Backend.md).

La generación automática de resultados, simulaciones y analítica de demostración está desactivada por defecto con `pipre.seed.demo-data=false`. El bootstrap de usuarios todavía crea las tres cuentas de acceso y diez estudiantes ficticios cuando se ejecuta; esa opción no elimina esas cuentas ni identifica retroactivamente la procedencia de datos históricos. No tratarlos como observaciones reales de aprendizaje.

## Roles, paneles y alcance excluido

El backend usa `STUDENT`, `TEACHER`, `ADMIN`; el frontend representa `student`, `docente`, `admin`. Docentes y administradores acceden a gestión; el estudiante sólo puede operar sus propios recursos personales donde se comprueba identidad. El JWT se guarda en cookie HttpOnly; los metadatos visibles del frontend no autorizan llamadas. [Matriz de permisos](guias/Clasificacion_Endpoints_Roles.md).

Las pantallas académicas consumen sus recursos existentes; las nuevas trazas no alimentan automáticamente sus calificaciones o predicciones. `data-science/`, sus modelos, endpoints, proxy y contenedor siguen excluidos. No se entrega el SSD integral, tutor adaptativo, reto diario, modelo ML entrenado ni una validación causal/pedagógica del aprendizaje.

## Evidencias y pendientes

El [informe de integración](informes/Integracion_TetriLogic_NeonFlow_ML.md) registra 291 pruebas frontend, 86 backend, 91 comprobaciones HTTP y 20 comprobaciones PostgreSQL aisladas, además de conservación de 111 filas históricas y revisión visual. Son resultados de aquella implementación; la reorganización documental no volvió a ejecutar esas suites.

Quedan pendientes reanudación, verificación de soluciones en servidor, rúbrica, evaluación pedagógica, privacidad/retención y pipeline seudonimizado. También requieren revisión la persistencia Docker de PostgreSQL mediante volumen nombrado, la configuración general de despliegue, el lint global y las pruebas con lector de pantalla/dispositivo táctil físico. [Continuidad y límites](simuladores/Pendientes_TetriLogic_SSD.md).

Las propuestas de [PATCH y asignación de actividades a grupos](guias/Pendientes_Endpoints_Backend.md) están separadas del contrato actual y no son un requisito ya implementado del catálogo. La [revisión de endpoints IA y datos](../req-ia-endpoints.md) documenta alineación parcial, diferencias de rutas/DTO y agregación futura; no autoriza cambios en el servicio de IA.
