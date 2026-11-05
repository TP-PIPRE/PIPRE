# Estado actual de PIPRE

**Referencia funcional: 02/11/2026; dependencias: 04/11; diario 5/5: 05/11/2026.** La integración funcional incluye el sistema de 35 logros y se incorporó a `develop` mediante el PR #72 (`554cf0f`). Los parches Maven de la revisión del 04/11 permanecen como cambios locales sin commit. No afirma un despliegue de producción ni sustituye las instrucciones de [AGENTS.md](../AGENTS.md).

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

Las migraciones aplicadas localmente son **V1…V19**. V13 incorpora metadatos de actividad, V14/V15 el catálogo TetriLogic y compatibilidad de prototipos, V16 Neon Flow, V17 contexto de intentos, V18 logros/progreso y V19 sesiones verificadas. No reescribirlas. Los generadores se usan con `--check`.

La autorización del 30/10 permite registrar intentos y acciones de ambos juegos en `telemetry_attempts`. Incluyen estudiante autorizado, actividad opcional, plantilla, versión de reglas, tiempos, eventos y estado inicial/final. Los reintentos aceptados son idempotentes. La práctica independiente admite actividad nula; los registros anteriores conservan contexto nulo.

Las trazas son **declaradas por el cliente**. Persistirlas no valida la solución en servidor, no guarda/reanuda el tablero y no crea una nota, XP, estrellas, ranking ni progreso académico. La cola y el envío al salir son de mejor esfuerzo: un corte eléctrico puede perder acciones aún no enviadas. [Contrato vigente](guias/Contratos_Frontend_Backend.md).

La generación automática de resultados, simulaciones y analítica de demostración está desactivada por defecto con `pipre.seed.demo-data=false`. El bootstrap de usuarios todavía crea las tres cuentas de acceso y diez estudiantes ficticios cuando se ejecuta; esa opción no elimina esas cuentas ni identifica retroactivamente la procedencia de datos históricos. No tratarlos como observaciones reales de aprendizaje.

## Logros, estrellas y diario — autorización del 02/11

El catálogo activo tiene **35 logros L01–L35**; los diez anteriores y sus desbloqueos quedan como historial inactivo. L01–L30 exigen ambos niveles del mismo número, L31/L34 rachas diarias de 5/10 fechas, L32/L35 tres estrellas en los 30 niveles de cada juego y L33 tres niveles consecutivos del mismo juego en menos de 180 segundos de servidor. Se guardan mejores estrellas y XP global sin duplicados, incluso con varias membresías.

El nuevo canal `game-sessions` persiste inicio y acciones, reproduce las reglas activas y valida la victoria en el servidor. No usa éxito, estrellas ni tiempo declarados por el navegador como autoridad. La rúbrica `game-stars-v1` y la idempotencia se detallan en la [guía de logros](guias/Sistema_35_Logros.md). No reinterpreta resultados antiguos ni otorga notas o progreso de lecciones.

Inicio y Perfil ofrecen [cinco retos diarios procedurales](guias/Retos_Diarios_Procedurales.md), persistidos por estudiante/fecha en `America/Lima` y renovados automáticamente en la interfaz. Los conjuntos nuevos incluyen ambos juegos (dos de cada uno y un quinto aleatorio), sin IA. Desde el 05/11, sólo completar y validar los cinco ejercicios (5/5 = 100 %) acredita la fecha para la racha; cada ejercicio conserva inicio, completado y mejores estrellas, sin otorgar progreso de la base oficial. La interfaz presenta un único ejercicio disponible y el progreso confirmado, sin el listado inferior de niveles. V21 registra el inicio de cada ejercicio y ya está aplicada en PostgreSQL local; se conservaron V1–V20. La [verificación del flujo 5/5](informes/Diario_Finalizacion_Cinco_2026_11_05.md) registra 345 pruebas frontend, 253 backend y 88 comprobaciones contra Docker aprobadas. V20 añade los conjuntos diarios sin reescribir V1–V19 y ya se aplicó en PostgreSQL del Docker local durante la verificación posterior del 04/11. Backend/frontend locales actualizados: 66 comprobaciones HTTP y cinco victorias procedurales verificadas, con ambos simuladores; la cuenta QA se retiró. El endpoint diario anterior conserva compatibilidad. El perfil muestra categorías, condiciones, fechas, progreso por juego y notificaciones tras confirmación. La exportación autenticada y la [consulta SQL](Consultas_35_Logros.sql) distinguen estado actual y desbloqueos dentro de una ventana inclusiva; los 16 días de tesis no limitan la plataforma.

Se conserva el tablero manipulable después de resolver; reiniciarlo abre otro intento puntuable. Las acciones aún en memoria pueden perderse con un corte y no se reanuda el tablero al recargar. Docentes/administradores mantienen vista previa sin adjudicarse logros estudiantiles.

## Roles, paneles y alcance excluido

El backend usa `STUDENT`, `TEACHER`, `ADMIN`; el frontend representa `student`, `docente`, `admin`. Docentes y administradores acceden a gestión; el estudiante sólo puede operar sus propios recursos personales donde se comprueba identidad. El JWT se guarda en cookie HttpOnly; los metadatos visibles del frontend no autorizan llamadas. [Matriz de permisos](guias/Clasificacion_Endpoints_Roles.md).

Las pantallas académicas consumen sus recursos existentes; las trazas no alimentan automáticamente sus calificaciones o predicciones. `data-science/`, sus modelos, endpoints, proxy y contenedor siguen excluidos. No se entrega el SSD integral, tutor adaptativo, modelo ML entrenado ni una validación causal/pedagógica del aprendizaje. El diario mínimo y la gamificación del 02/11 tienen su propio contrato; no equivalen al SSD completo.

## Evidencias y pendientes

El [informe de integración](informes/Integracion_TetriLogic_NeonFlow_ML.md) registra 291 pruebas frontend, 86 backend, 91 comprobaciones HTTP y 20 comprobaciones PostgreSQL aisladas, además de conservación de 111 filas históricas y revisión visual. Son resultados de aquella implementación; la reorganización documental no volvió a ejecutar esas suites.

La [revisión posterior de simuladores del 30/10](informes/Revision_Exhaustiva_Simuladores_2026_10_30.md) ejecutó 307 pruebas frontend, 98 backend, 167 comprobaciones HTTP y 20 PostgreSQL aisladas. Corrige reinicio Neon Flow tras éxito, bloqueo de cola por rechazo permanente y desbordamientos numéricos en trazas. Se abrieron los 60 tableros en navegador, se probó edición docente/curso mixto y se conservaron 172 filas previas tras limpiar los fixtures propios. No añade reglas de juego ni implementa ML.

El [lote de 35 logros del 02/11](informes/Implementacion_35_Logros_2026_11_02.md) ejecutó **335 pruebas frontend, 246 backend, 227 comprobaciones HTTP y 29 comprobaciones PostgreSQL aisladas**. Verificó victorias de los 60 niveles, maestrías, concurrencia, permisos, exportación, diario y conservación histórica. La revisión en navegador confirmó L01, mejores estrellas, notificación/perfil y el diario; se comprobaron anchos de 320, 390, 768 y 1440 px. Las rachas de varios días y límites temporales se probaron con reloj controlado, sin alterar el reloj del entorno local.

Quedan pendientes reanudación, evaluación pedagógica, privacidad/retención y pipeline seudonimizado. También requieren revisión la persistencia Docker de PostgreSQL mediante volumen nombrado, la configuración general de despliegue, el lint global y las pruebas con lector de pantalla/dispositivo táctil físico. [Continuidad y límites](simuladores/Pendientes_TetriLogic_SSD.md).

La [corrección de dependencias con pnpm del 02/11](informes/Actualizacion_Dependencias_Pnpm_2026_11_02.md) dejó un único lockfile, actualizó las librerías afectadas y retiró la CLI de shadcn conservando sus estilos locales. Aquel lote ya está integrado en `develop` mediante el PR #72. La [revisión del 04/11](informes/Revision_Seguridad_2026_11_04.md) repite la auditoría frontend con cero avisos y valida 335 pruebas y build. Además aplica parches compatibles Maven que reducen sus avisos OSV de 68 a 2; los dos restantes de Spring MVC permanecen visibles y documentados, sin identificar sus condiciones de exposición en las funciones actuales. No se declara seguridad integral ni contador Dependabot remoto verificado. El lint global conserva 25 errores y 2 advertencias anteriores.

Las propuestas de [PATCH y asignación de actividades a grupos](guias/Pendientes_Endpoints_Backend.md) están separadas del contrato actual y no son un requisito ya implementado del catálogo. La [revisión de endpoints IA y datos](req-ia-endpoints.md) documenta alineación parcial, diferencias de rutas/DTO y agregación futura. El [plan de implementación ML](guias/Plan_Implementacion_ML.md) ordena contratos, calidad, validación y evaluación antes de modificar IA; no constituye una implementación ni levanta su exclusión.
