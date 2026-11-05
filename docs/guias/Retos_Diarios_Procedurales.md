# Cinco retos diarios procedurales

Contrato actualizado el 05/11/2026: **el diario se completa únicamente al validar sus cinco ejercicios**. Sustituye la selección única del diario para la interfaz actual; no modifica el catálogo académico de **30 Neon Flow + 30 TetriLogic = 60 retos oficiales**.

## Construcción y selección

`DailyChallengeSelectionPolicy` recibe estudiante y fecha y propone cinco especificaciones: juego, nivel base y márgenes. La implementación actual `RandomDailySelectionPolicy` usa `SecureRandom` para seleccionar dos bases de cada juego y una quinta aleatoria, con cinco bases distintas y orden mezclado. Así cada conjunto nuevo incluye ambos simuladores (2+3). Los conjuntos ya persistidos no se sortean otra vez. Una futura política adaptativa podrá sustituirla mediante inyección de dependencias, conservando el generador y sus validaciones. No se implementa IA, consulta de modelos ni predicción de rendimiento.

`ProceduralDailyGenerator` construye variantes por traslación de los tableros v2 inmutables: varía ancho/alto, posición del emisor, obstáculos, receptores y piezas de la solución; en TetriLogic desplaza los objetivos de filas/columnas y añade objetivos cero a los márgenes. Mantiene inventarios, colores, giros, trayectoria óptica, límites y colisiones. No reactiva condiciones históricas de TetriLogic. Es generación constructiva a partir de bases comprobadas, no creación irrestricta de geometrías.

Las dificultades inicial/intermedia/avanzada corresponden a bases 1–10/11–20/21–30; son una clasificación técnica provisional, no una medición pedagógica ni una adaptación al alumno. El número base se conserva como procedencia, nunca como una victoria del catálogo oficial.

Las soluciones testigo, copiadas de los fixtures comprobados, residen sólo en recursos backend. El generador transforma el testigo y reproduce sus colocaciones mediante `BoardRules.apply`; rechaza acciones ilegales o un resultado que no satisfaga `BoardRules.isSolved`. La API no publica testigos. Antes de guardar se exigen cinco configuraciones con geometrías distintas; una política inválida revierte toda la transacción, sin publicar conjuntos parciales.

## Persistencia, calendario y autorización

```text
GET /api/v1/daily-challenges/today/set?studentId=...
→ date, timeZone, expiresAt, challenges[5]
```

Cada elemento incluye ID propio, orden 1–5, juego, nivel/plantilla base, dificultad, configuración completa, `startedAt`, `completedAt`, `bestStars` y estado `PENDING`, `IN_PROGRESS` o `COMPLETED`. El conjunto publica `completedCount`, `progressPercent`, `status` y `completed`, calculados en servidor. La fecha procede del reloj servidor en `America/Lima`. El acceso conserva autorización propia o docente/administrador.

V20 añade `procedural_daily_sets` y `procedural_daily_challenges`, con clave estudiante/fecha y restricción única de posición. La generación ocurre al primer acceso del día, bajo el bloqueo transaccional existente de la fila del estudiante. Cabecera y cinco snapshots se guardan juntos; solicitudes concurrentes reutilizan el mismo conjunto. No necesita un cron ni genera conjuntos para usuarios inactivos. Recargar, abrir otra pestaña o reiniciar el servidor no vuelve a sortear tableros ya persistidos. Los conjuntos anteriores se conservan.

La interfaz consulta al montar, al recibir una victoria confirmada, al recuperar foco/visibilidad y al vencer `expiresAt`, con revisión periódica cada minuto como respaldo. Una pestaña suspendida se actualiza al volver; una desconexión muestra error y reintenta. No se promete renovación mientras el dispositivo esté sin red. Ante error no se sustituye el conjunto por retos locales inventados.

El endpoint anterior `/today` conserva su forma para clientes antiguos y datos de racha; su indicador de finalización consulta el conjunto cuando existe. Una partida del diario antiguo puede seguir validándose como nivel oficial, pero no acredita una nueva fecha diaria por sí sola. La interfaz vigente juega los snapshots mediante `/simulador?daily=true`; muestra sólo el ejercicio disponible, un indicador de progreso y, tras validarlo, el botón para continuar. No renderiza el listado inferior ni permite seleccionar anticipadamente los cinco ejercicios. El servidor también rechaza iniciar uno con anteriores aún pendientes. Una URL antigua con un ejercicio futuro abre el primero disponible, sin revelar el futuro. Los snapshots y los resultados individuales permanecen guardados.

## Validación y progreso

Las sesiones existentes reciben `dailyChallengeId`. Para IDs procedurales, el servidor comprueba propietario, fecha, juego y plantilla base y usa **la configuración persistida** en cada acción y finalización. No confía en geometría, éxito, tiempo ni estrellas enviados por el cliente. Una actividad académica no puede asociarse a una sesión procedural.

Se conservan el registro de victoria verificada y los recibos idempotentes, y se guardan por ejercicio el primer inicio, la primera finalización y la mejor estrella. **Únicamente 5/5 victorias validadas acreditan la fecha diaria y permiten sumar esa fecha a L31/L34.** De 1 a 4 ejercicios el progreso se conserva pero no se registra una nueva finalización diaria. Repetir no duplica la fecha ni XP; se mantienen el bloqueo por estudiante y las restricciones únicas. Los historiales y recompensas anteriores no se borran ni se recalifican. Si existe una acreditación del día actual proveniente de la regla anterior y su conjunto está incompleto, la lectura actual no lo presenta como completado ni suma ese día a la racha actual hasta 5/5. No se alteran las fechas anteriores.

Progreso general: 0/5 = 0 % y `PENDING`; 1–4/5 = 20–80 % e `IN_PROGRESS`; 5/5 = 100 % y `COMPLETED`. Un ejercicio abierto puede estar en progreso mientras el conjunto permanece en 0 % por no tener aún victorias. Una finalización tras medianoche no acredita el día anterior ni el siguiente. Puede cerrarse la sesión antigua, pero no iniciar otra sobre un conjunto vencido.

Las variantes no incrementan `game_level_progress`, maestrías ni L01–L30 y no sirven para L33; no equivalen a resolver su base oficial. Los desbloqueos por racha conservan la evaluación/XP idempotentes existentes. Los intentos procedurales usan el registro servidor de sesiones/acciones; no se envían como telemetría declarativa de una geometría oficial distinta. Las trazas del catálogo conservan su funcionamiento.

La recarga mantiene conjunto, completados y mejores estrellas. Como en el canal anterior, no se rehidrata la colocación parcial del tablero al recargar; las acciones aceptadas quedan en la sesión servidor y un nuevo intento abandona la sesión activa anterior. La interfaz no afirma haber reanudado esa partida.

## Instalación y límites

Flyway aplica las versiones pendientes al arrancar el backend actualizado. V20 ya está aplicada localmente y es inmutable. V21 añade `started_at` y recupera el primer inicio de las sesiones existentes; no borra ejercicios ni modifica sus geometrías/completados. Respaldar la base según el procedimiento habitual; no ejecutar SQL manual ni modificar V1–V20. Los datos históricos se preservan. No se modifican `data-science`, endpoints IA, modelos ni proxy. No se añaden actividades al catálogo ni se cuentan las cinco variantes como cinco retos oficiales nuevos.

Ver los antecedentes en el [informe de implementación](../informes/Retos_Diarios_Procedurales_2026_11_04.md) y las pruebas vigentes en el [informe de finalización 5/5 del 05/11](../informes/Diario_Finalizacion_Cinco_2026_11_05.md).
