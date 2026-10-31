# Revisión del SSD e implementación de los 30 retos de TetriLogic

**Informe histórico del 26/10/2026.** Revisión de `SSD_TetriLogic_Revision_Integral_PIPRE.docx`, aportado por el usuario. Conserva el diagnóstico, catálogo y pruebas originales, sin declarar entregado el SSD integral. Las condiciones v2 descritas aquí no son todas reglas del modo activo. Consultar [TetriLogic vigente](../simuladores/TetriLogic_Filas_Columnas.md), [pendientes](../simuladores/Pendientes_TetriLogic_SSD.md) e [integración del 30/10](../informes/Integracion_TetriLogic_NeonFlow_ML.md).

## Diagnóstico y decisión de implementación

El SSD es coherente para construir los tableros: exige tres o cuatro tetrominós, como máximo una forma repetida una vez, uso obligatorio de todas las piezas, objetivos exactos por fila/columna y soluciones alternativas válidas. Las sumas de objetivos deben ser 12 o 16. La distribución 4×4 para 1–5, 5×5 para 6–20 y 6×6 para 21–30 coincide con el GDD del repositorio.

No proporciona las treinta geometrías concretas, las listas de piezas ni las soluciones de cada reto. Se construyeron configuraciones deterministas, se congelaron como versión 2 y se verificaron con un solucionador independiente y con la interfaz real. La dificultad pedagógica todavía necesita una prueba con estudiantes: solvencia matemática no demuestra progresión cognitiva ni eficacia educativa.

Los prototipos anteriores tenían seis piezas globales y condiciones de victoria distintas. Reutilizar silenciosamente `tetrilogic-1` y `tetrilogic-2` habría cambiado actividades existentes. Se conservaron ambas plantillas y su componente, y se añadieron **`tetrilogic-v2-1` a `tetrilogic-v2-30`**. Las plantillas antiguas no cuentan como retos adicionales del catálogo oficial v2.

Las propuestas de puntuación 60+25+15, estrellas, XP y umbrales de guía siguen sujetas a piloto en el propio SSD. No se convirtieron en reglas definitivas. Reto diario, ML y tutor IA son ampliaciones distintas del catálogo; `data-science`, modelos, endpoints, proxy y contenedor permanecen excluidos.

## Alcance implementado

- Treinta configuraciones únicas, con las siete familias O/I/T/S/Z/L/J representadas. Catorce retos usan tres piezas y dieciséis usan cuatro.
- Inventario por plantilla, todas las filas y columnas —incluidos objetivos cero—, bloqueos, celdas obligatorias, precedencias, contactos y orientaciones restringidas cuando corresponden.
- Encaje y rotación en incrementos de 90°, sin reflejos. Colocación por arrastre, clic, toque y teclado; rotación en el inventario o tablero; devolución de piezas, cancelación y reinicio con confirmación.
- Los conteos exactos, contactos y orientaciones se comprueban al terminar. Se permiten disposiciones intermedias que todavía no cumplen los objetivos. La precedencia se aplica a la primera colocación; al devolver una pieza deben devolverse antes sus dependientes colocados.
- Pista general y pista específica estáticas por nivel. La específica se habilita tras tres comprobaciones incorrectas, como umbral de trabajo todavía pendiente de calibración. Estas consultas no incrementan `pistasIa`.
- Reiniciar conserva duración, movimientos acumulados, comprobaciones y ayudas del intento. Reintentar después del resultado comienza otro intento local. Se mantiene el envío de telemetría cruda existente, sin atribuirle un progreso o puntuación que todavía no se persisten.
- Una referencia de movimientos positiva por reto, obtenida de su solución comprobada. Es orientativa, no una afirmación de mínimo global, no penaliza tiempo y no impide completar el nivel.
- Catálogo, editor docente y simulador enlazados por actividad y `levelTemplate`; se incluye continuación a la siguiente actividad jugable del curso.

## Las diez mecánicas del SSD

Cada fila del catálogo tiene una aplicación concreta de las mecánicas, no sólo una etiqueta:

| Mecánica | Aplicación en todas las configuraciones v2 |
|---|---|
| Encajar | Límites, bloqueos y colisiones comprobados antes de confirmar una colocación. |
| Rotar | Inventario orientable y solución comprobada que incluye al menos una pieza no O girada. |
| Completar configuraciones | Usar todas las piezas y satisfacer cada objetivo numérico. |
| Completar patrones | Una a tres celdas marcadas deben quedar ocupadas, además del patrón de conteos. |
| Restricciones de colocación | Celdas bloqueadas, límites y ausencia de superposición. |
| Orden | Una precedencia breve en 1–10; cadenas de todas las piezas en 11–30. |
| Espacios limitados | Inventario de 12/16 celdas, tamaño finito y bloqueos. No se obliga a llenar las celdas libres. |
| Dependencias | Pares de piezas que deben compartir un lado al terminar. |
| Restricciones combinadas | Conteos, patrones, orden y contactos simultáneos; orientaciones adicionales en 11–30. |
| Optimización | Referencia visible de movimientos y conteo de acciones confirmadas; sin un premio o límite duro inventado. |

La equivalencia pedagógica de estas aplicaciones y su intensidad deben revisarse en piloto. La optimización se presenta como objetivo formativo y medición, no como sistema de puntuación terminado.

## Contratos y persistencia

Se conserva `Curso → Módulo → Lección → Actividad → levelTemplate → configuración → simulador`.

V14 añade `tetrilogic_templates` con ID, versión y configuración JSONB inmutable, y enlaza `act-c002-1` a `act-c002-30` con el curso `c002`. Se conservan IDs de actividades y resultados anteriores. Los datos no dependen de forzar otra ejecución de `CourseSeederService`.

La migración crea exclusivamente la estructura y las actividades oficiales faltantes. Las misiones nuevas sólo se insertan para actividades recién creadas. Los dos prototipos se reasignan a v2 únicamente si **todos sus metadatos editables y su única misión coinciden con el seeder original**. Si un docente cambió esos datos se preservan; debe revisar y elegir la plantilla v2 desde Retos. No se deben borrar esos registros para alcanzar una cifra.

La prueba en la base existente detectó una variante histórica: V13 incorporó `description` como columna nullable sin completar las descripciones antiguas. V14 conservó correctamente esas filas y dejó sólo 28 enlaces v2. Como V14 ya estaba aplicada, se añadió **V15**, que actualiza exclusivamente los dos prototipos originales con descripción nula y demás metadatos/misión intactos. Conserva los IDs de actividades y misiones; las coordenadas o misiones editadas impiden la actualización automática. V14 no se reescribió. Tras V15 hay treinta actividades oficiales con su plantilla correspondiente en PostgreSQL local.

La API agrega sólo lectura:

```text
GET /api/v1/tetrilogic/templates/{templateId}
→ { templateId, version, config }
```

Requiere autenticación y los roles existentes. No se añade un endpoint de escritura de tableros ni de reclamación de puntos. El frontend carga la configuración persistida y comprueba su correspondencia con la versión revisada; un fallo o discrepancia muestra un error reintentable, sin sustituirla por otro tablero local.

Se corrigió además la respuesta a métodos HTTP no soportados: el servidor real redirigía el error 405 a un segundo control de autenticación y terminaba devolviendo 401. El manejador ahora responde directamente con 405 y la cabecera `Allow`, sin cambiar permisos ni exponer una escritura. Una prueba con Tomcat en puerto aleatorio y la comprobación sobre Docker cubren este caso; la sesión autenticada sigue permitiendo GET después del rechazo.

La copia JSON del catálogo en frontend y el recurso backend derivan del mismo generador de contenido. Las posiciones de solución permanecen en pruebas; la respuesta pública no incluye `placements` ni `solution`. Que el navegador conozca reglas y geometría no le concede autoridad para otorgar puntos.

## Presentación e interacción

Las capturas proporcionadas se usaron como referencia de composición: tablero central, conteos junto a los bordes, inventario separado y bloqueos con trama. Se conservan los tokens, fuente Geist local y temas de PIPRE; no se copian imágenes, marcas ni reglas adicionales del juego de referencia.

Los conteos muestran segmentos y números actuales/objetivo; completar o exceder un objetivo tiene indicación visual y texto accesible. Las piezas conservan forma, color y letra. Los controles permiten rotación antes de colocar, devolución y cancelación explícita. El resultado bloquea movimientos posteriores y permite reintentar o continuar.

Se comprobó reflujo a 320, 390, 768 y 1440 px sin desbordamiento horizontal de página; temas claro y oscuro. En la cuadrícula 6×6 de 320 px, cada celda mide aproximadamente 32 px, con alternativa por teclado. No se declara certificación WCAG ni prueba de usabilidad con estudiantes.

## Validaciones ejecutadas

- Solucionador independiente: 30 de 30 configuraciones resueltas sin consultar las soluciones de construcción. Búsqueda acotada; 929 nodos en conjunto y 117 como máximo para un reto en esta ejecución.
- Frontend: **131 pruebas aprobadas en 17 archivos**, incluidas las treinta resoluciones por la UI, reglas negativas y soluciones alternativas, persistencia, editor, cambio de actividad, rotación por clic derecho/teclado, devolución, bloqueo tras victoria, continuación y nuevo intento.
- Backend: **78 pruebas aprobadas**, cero fallos, errores u omisiones. Se ejecutaron con JVM 25.0.3 y compilación `release 21`; el proyecto conserva su objetivo Java 21. Incluye instalación vacía, actualización de prototipos con descripción normal/nula, conservación de ediciones, migraciones Flyway/H2, arranque Spring/JPA y HTTP con login JWT real. El caso 405 se comprueba también mediante un servidor Tomcat real, con conservación de sesión y `Allow`.
- Revisión visual con API nativa temporal y base H2: login estudiantil, catálogo de treinta actividades con tres páginas, inicio del reto 30, lectura de configuración persistida, giros, colocación, conteos y victoria. La base temporal no modifica PostgreSQL. Se retiró el harness de revisión y se cerraron los servidores temporales al terminar.
- TypeScript y compilación de producción aprobados; ESLint de todos los archivos de código y pruebas modificados aprobado. El lint general conserva **25 errores y dos advertencias anteriores**, en otros archivos. Sigue el aviso de bundle mayor de 500 kB (712 kB en esta compilación); no se declara aprobado el lint general.
- PostgreSQL **16.15 real**: **46 comprobaciones aprobadas en seis bases aisladas**, con instalación nueva, prototipos originales, ediciones docentes, descripciones nulas y rollback/reintento transaccional de V14/V15. Se validaron JSONB, relaciones, igualdad de las treinta configuraciones e historial de simulaciones/resultados. El contenedor temporal no tuvo red ni puertos publicados y se eliminó al terminar.
- Docker local: inicio autorizado por el usuario, respaldo previo de PostgreSQL y reconstrucción de backend/frontend. V14 y V15 aplicadas; un arranque posterior de Spring con **Java 21** confirmó las quince migraciones válidas y ninguna nueva pendiente. Resultado final: dos cursos, 32 actividades, treinta configuraciones y treinta enlaces TetriLogic v2; sin cursos de prueba sobrantes.
- API sobre Docker/PostgreSQL: **47 comprobaciones aprobadas**, incluidas lectura exacta de las treinta configuraciones, treinta actividades enlazadas, login estudiante/docente, 401/403/404/405, crear con 201 vacío, editar/recargar y actualización parcial sin perder metadatos/misiones. Se rechazaron entorno incompatible y orden inválido; sólo se limpió el curso temporal propio.
- Conservación de la base local: **seis comprobaciones aprobadas** contra la instantánea anterior. Cursos, módulos y lecciones originales intactos; IDs de actividades y misiones preservados; sólo las descripciones/plantillas y los textos de misión de los dos prototipos originales se actualizaron. Se añadieron exactamente 28 actividades y 28 misiones.
- Navegador sobre Docker/PostgreSQL: catálogo de treinta retos, victoria del reto 1, continuación al 2 con tablero/estado propios, selección del 30 y victoria con giros, colocación y conteos; reintento del 30 con métricas a cero e inventario restaurado. También se creó curso/módulo/lección/reto temporal desde el editor docente, se cambió plantilla 1 → 30, descripción, orden y misión, se recargó y se inició como estudiante el tablero 6×6 correcto. Se limpió exclusivamente ese curso temporal por API comprobando su identidad. Las pruebas automatizadas adicionales cubren teclado, devolución y los treinta tableros.
- Exclusión vigente: sin cambios en `data-science/` ni operaciones de inicio, reconstrucción o reinicio de su servicio durante esta continuación. Su ID y estado detenido se compararon antes/después. Los servicios necesarios de PIPRE quedan funcionando en `http://localhost:5173` (frontend) y `http://localhost:8081` (backend).

En la consulta remota de esta entrega, la última migración de `origin/develop` era V13, sin colisión con V14/V15. Volver a verificar la rama destino antes de integrar cambios de otros compañeros. El código queda sin commit en `codex/tetrilogic-30-retos`, basado en el `develop` actualizado (PR anterior ya integrado).

Las comprobaciones H2 y PostgreSQL se ejecutaron por separado. Se conservan las migraciones V1–V13 intactas y V14/V15 quedan congeladas tras su aplicación. El respaldo anterior a V14 está en los artefactos locales de esta sesión: `pipre-before-tetrilogic-20261026.sql` (35 541 bytes). No contiene las nuevas actividades de este lote.

## Archivos principales

- Contenido: `scripts/generate_tetrilogic_catalog.py`, `scripts/verify_tetrilogic_catalog.py`, `scripts/verify_tetrilogic_postgres.py`, `frontend/src/shared/constants/tetrilogicCatalog.json`, recurso backend `catalog/tetrilogic-v2.json`, V14 y V15.
- Motor: tipos TetriLogic, `rules.ts`, `levelConfigs.ts`, `activityLevels.ts` y validación de `Activity.java`.
- Persistencia y API: `TetriLogicTemplate`, puertos, servicio de lectura, entidad JPA, repositorio/adaptador, controlador de plantillas y respuesta 405 en `GlobalExceptionHandler`.
- Interfaz: `TetriLogicStage`, `OfficialTetriLogicStage`, `PersistedTetriLogicStage`, `LegacyTetriLogicStage`, `Board`, `PieceTray`, `tetrilogic.css`, `Simulador` y opción compatible de reinicio en `gameStore`.
- Pruebas: catálogo oficial, reglas, interacción, configuración persistida, editor, compatibilidad antigua, contrato backend, migración y HTTP.

## Conteo y siguiente trabajo

En código y en PostgreSQL local: **TetriLogic 30/30 v2 + Neon Flow 2/30 = 32/60**. Se mantienen dos plantillas TetriLogic antiguas por compatibilidad, sin contarlas otra vez. Otros entornos deben aplicar V14/V15 con respaldo y revisar los prototipos que hayan sido editados antes de afirmar el mismo conteo.

El [documento de pendientes](../simuladores/Pendientes_TetriLogic_SSD.md) contiene el punto de continuación, decisiones, pruebas de despliegue y funcionalidades que el SSD completo aún requiere. No declarar completo el proyecto de 60 retos ni el SSD integral por haber implementado este catálogo.

## Inventario de configuraciones

Todos los niveles tienen conteos de ambas orientaciones, patrones, precedencia, contacto y referencia de movimientos. La siguiente tabla sirve para revisar contenido, no para revelar sus posiciones resueltas.

| Reto | Título | Tablero | Inventario | Bloqueos | Celdas obligatorias | Referencia de movimientos |
|---|---|---|---|---|---|---|
| 1 | Primer encuentro | 4×4 | I1, S1, O1 | 1 | 1 | 4 |
| 2 | Giro de perspectiva | 4×4 | Z1, I1, J1 | 1 | 1 | 8 |
| 3 | El hueco cuenta | 4×4 | S1, T1, I1 | 1 | 1 | 11 |
| 4 | Formas en diálogo | 4×4 | Z1, I1, J1 | 1 | 1 | 6 |
| 5 | Una decisión previa | 4×4 | O1, I1, L1 | 1 | 1 | 5 |
| 6 | Un espacio mayor | 5×5 | L1, I1, O1 | 1 | 1 | 5 |
| 7 | Escalera de celdas | 5×5 | L1, Z1, T1, J1 | 2 | 1 | 7 |
| 8 | Dos caminos | 5×5 | O1, Z1, T1, L1 | 2 | 1 | 7 |
| 9 | Encuentro de esquinas | 5×5 | T1, I1, O1 | 2 | 1 | 9 |
| 10 | Plan antes de actuar | 5×5 | L1, I1, O1, Z1 | 2 | 1 | 8 |
| 11 | Columnas desiguales | 5×5 | S1, O1, T1, L1 | 2 | 2 | 11 |
| 12 | Ritmo de tres | 5×5 | T1, I1, T2 | 2 | 2 | 6 |
| 13 | La cuarta pieza | 5×5 | Z1, L1, I1, T1 | 3 | 2 | 12 |
| 14 | Conexiones | 5×5 | J1, Z1, O1, S1 | 3 | 2 | 9 |
| 15 | Orientaciones compartidas | 5×5 | J1, Z1, I1 | 3 | 2 | 7 |
| 16 | Filas en equilibrio | 5×5 | J1, T1, S1, J2 | 3 | 2 | 8 |
| 17 | Paso a paso | 5×5 | L1, I1, T1, O1 | 3 | 2 | 9 |
| 18 | Espacios reservados | 5×5 | L1, I1, O1 | 3 | 2 | 6 |
| 19 | Cruce de condiciones | 5×5 | L1, J1, T1, I1 | 4 | 2 | 6 |
| 20 | Plan completo | 5×5 | O1, Z1, I1, O2 | 4 | 2 | 6 |
| 21 | Horizonte de seis | 6×6 | L1, I1, S1 | 4 | 3 | 8 |
| 22 | Patrón abierto | 6×6 | I1, S1, O1, Z1 | 4 | 3 | 11 |
| 23 | Conexión obligatoria | 6×6 | I1, S1, T1, O1 | 4 | 3 | 10 |
| 24 | Cuatro decisiones | 6×6 | O1, I1, O2 | 4 | 3 | 6 |
| 25 | Lectura de columnas | 6×6 | L1, J1, T1, Z1 | 5 | 3 | 5 |
| 26 | Límites y giros | 6×6 | L1, J1, Z1, T1 | 5 | 3 | 7 |
| 27 | Orden y contacto | 6×6 | S1, T1, O1 | 5 | 3 | 9 |
| 28 | Alternativas válidas | 6×6 | T1, Z1, I1, T2 | 5 | 3 | 9 |
| 29 | Síntesis de patrones | 6×6 | Z1, J1, S1, L1 | 5 | 3 | 7 |
| 30 | Integración final | 6×6 | T1, J1, Z1 | 5 | 3 | 9 |
