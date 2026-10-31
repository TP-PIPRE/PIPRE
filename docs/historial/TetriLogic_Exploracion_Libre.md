# TetriLogic: exploración libre de piezas

**Informe histórico: exploración libre anterior al 28/10/2026.** Describe el periodo sin objetivos ni victoria. Después se restauraron [filas y columnas](../simuladores/TetriLogic_Filas_Columnas.md), y el 30/10 se autorizó [trazabilidad en ambos juegos](../informes/Integracion_TetriLogic_NeonFlow_ML.md). No aplicar la prohibición anterior de objetivos o telemetría al modo vigente.

## Referencia y diagnóstico

Referencia: [video de manipulación de piezas, intervalo 1:17–2:15](https://youtu.be/yZx1Wx2DVOc?t=77). Se inspeccionaron fotogramas de ese intervalo y breves tramos de reproducción: selección resaltada, pieza que acompaña al cursor, previsualización sobre cuadrícula, giro con R y bandeja externa cuyos huecos quedan visibles al usar piezas. Se reprodujo esa mecánica con la identidad visual de PIPRE; se excluyeron los objetivos y las condiciones del juego de referencia.

El simulador anterior utilizaba arrastre HTML, comprobación de reglas v2, precedencias, contactos, conteos, celdas obligatorias, bloqueos y giros exigidos. La interacción y las explicaciones seguían dependiendo de retos. El cambio actual separa la geometría de manipulación de esas condiciones históricas.

## Comportamiento implementado

- `/simulador` abre directamente TetriLogic libre. El selector ofrece treinta distribuciones de tamaño e inventario, sin exigir un curso o completar niveles anteriores.
- Los accesos de cursos conservan `courseId` e `activity`; resuelven la actividad correspondiente y verifican la configuración persistida. Las plantillas anteriores también abren una experiencia libre con su propio tamaño e inventario.
- La lista de actividades presenta las entradas TetriLogic como tableros de exploración, con sus dimensiones. No muestra dificultad ni instrucciones históricas de reglas; mantiene el nombre docente y la identidad de la actividad. Los cursos mixtos conservan las instrucciones de Neon Flow y el estado de plantillas desconocidas.
- Arrastrar desde la bandeja o desde cualquier casilla de una pieza colocada. El punto de agarre se mantiene bajo el cursor; el contorno anticipa el encaje y distingue colocaciones válidas e inválidas.
- Girar 90° con R, botón Girar o clic derecho. Durante el arrastre gira el borrador que acompaña al cursor; se confirma al soltar. En el tablero se conserva la casilla tomada como pivote. La pieza cuadrada no cambia de posición al girar.
- Una colocación/giro que salga del tablero o choque con otra pieza conserva el estado anterior, sin desplazamientos automáticos para forzar el encaje.
- Devolver por arrastre a la bandeja, botón Devolver o Supr/Retroceso. Cada pieza es independiente de las demás; conserva su orientación al volver.
- Escape cancela la selección y el arrastre. La interrupción del puntero también restaura la pieza anterior. Restablecer, con confirmación, devuelve el inventario a su orientación inicial.
- Alternativa al arrastre: seleccionar pieza y pulsar una casilla. Flechas desplazan una pieza colocada; R gira. Las acciones están disponibles como botones nativos, con foco visible y mensajes breves anunciados.

Las únicas restricciones activas son **encajar dentro de la cuadrícula y no superponer piezas**. No hay uso obligatorio del inventario completo, objetivos, conteos, zonas bloqueadas de reto, contactos, precedencias, orientaciones exigidas, pistas condicionadas, comprobación, victoria, temporizador, puntuación o progreso. Las colocaciones libres no se envían como resultados ni telemetría de intentos.

## Interfaz y compatibilidad

Cuadrícula continua de hasta 420 px y bandeja independiente a la derecha en escritorio, debajo en móvil. Los huecos de piezas colocadas mantienen estable el inventario. Miniaturas y números sustituyen etiquetas técnicas repetidas. Sólo se muestran Girar, Devolver, Restablecer y una ayuda breve; se conservan fuente, tokens, temas e iconos Lucide de PIPRE. No se añadieron dependencias.

Los treinta JSON v2 y las migraciones V14/V15 permanecen intactos. La API conserva sus contratos y metadatos docentes. El cargador verifica identidad, versión y configuración completa antes de abrir el espacio, que consume exclusivamente dimensiones e inventario. Los errores y plantillas desconocidas conservan un estado explícito, sin sustituir el tablero silenciosamente.

Los motores anteriores y `HistoricalTetriLogicStage` se conservan exclusivamente para compatibilidad y pruebas del contenido publicado; ninguna ruta de aplicación abre ese contenedor histórico. No es una nueva versión del puzzle v2 ni una modificación silenciosa de sus reglas persistidas: es una experiencia libre que no evalúa ese puzzle. Si se retoman retos en el futuro, deben definirse como un alcance separado, con revisión pedagógica y versionado del contenido correspondiente.

**Cantidad:** cero actividades nuevas y cero plantillas nuevas. Permanecen treinta configuraciones TetriLogic y dos de Neon Flow, 32 actividades oficiales almacenadas. No equivale a 32 retos activos con victoria ni a la meta histórica de 60 retos completada. No borrar o duplicar datos para ajustar la cifra.

## Archivos principales

- `frontend/src/application/usecases/tetrilogic/freePlay.ts`: geometría y estado libre sin dependencias de reto.
- `frontend/src/ui/components/TetriLogic/useFreePieceInteraction.ts`: puntero, agarre, previsualización, rotación, teclado y cancelación.
- `FreeTetriLogicStage.tsx` y `freePlay.css`: espacio libre responsive y acciones mínimas.
- `Board.tsx`, `PieceTray.tsx` y `PiecePreview.tsx`: componentes reutilizados, contornos, capturas de puntero y bandeja externa.
- `TetriLogicStage.tsx`, `PersistedTetriLogicStage.tsx` y `frontend/src/ui/pages/Simulador.tsx`: rutas activas libres y carga persistida.
- `frontend/src/ui/pages/PaginaInicio.tsx` y `frontend/tests/unit/FreeCatalogEntry.test.tsx`: entrada coherente desde cursos y comprobación de que Neon Flow conserva sus instrucciones.
- `HistoricalTetriLogicStage.tsx`: contenedor utilizado sólo por regresiones históricas.
- `frontend/tests/unit/TetriFreePlay.test.ts` y `TetriFreeInteraction.test.tsx`: geometría, teclado, puntero mouse/touch simulado y colocación del inventario de las treinta configuraciones.
- Pruebas de selección de actividad, accesibilidad, carga persistida y pruebas históricas adaptadas para distinguir las dos experiencias.
- `AGENTS.md`, guía de implementación, informes de contratos/TetriLogic/UX, pendientes del SSD, GDD y sistema de diseño: cambio de alcance explícito para futuras continuaciones.

## Validación y límites

Validaciones ejecutadas sobre este cambio:

- **219 pruebas frontend aprobadas en 21 archivos** (`pnpm --dir frontend test:run`). Incluyen geometría libre, soltar fuera del tablero, colisiones, pivote, cuadrado, bordes superior/izquierdo, cancelación, vuelta a bandeja, teclado, mouse/touch simulado, giro durante arrastre y colocación de todo el inventario en las treinta distribuciones. También conservan regresiones de Neon Flow y del motor histórico, identificadas como tales.
- **47 comprobaciones HTTP aprobadas** contra Docker/PostgreSQL: treinta configuraciones completas, actividades vinculadas, autenticación, permisos, plantilla desconocida, creación/edición parcial/recarga y respuestas 201 vacías. Se limpió únicamente el curso temporal propio. PostgreSQL confirmó 30 configuraciones TetriLogic, 30 actividades oficiales TetriLogic, 2 Neon Flow y 2 cursos; no quedaron cursos de prueba.
- TypeScript y build de producción aprobados, incluida la reconstrucción final de **sólo frontend** en Docker. Bundle principal aproximado de 706 kB: persiste el aviso de tamaño mayor de 500 kB; no impide compilar.
- ESLint dirigido a los archivos de código y pruebas modificados en esta revisión: aprobado. No se declara resuelto el lint global histórico del proyecto.
- `python scripts/generate_tetrilogic_catalog.py --check`: aprobado para las treinta configuraciones, testigos y V14 congelada. `git diff --check`: aprobado.
- Navegador real: arrastrar desde bandeja, mover tomando una casilla lateral, colocación inválida conservada y devolución por arrastre; giro con R en inventario y tablero, giro rechazado junto al borde superior, botón Girar y restablecimiento confirmado. Entrada desde curso y cambio de actividad 1 → 30: tamaño 4×4 → 6×6 e inventario correcto desde PostgreSQL, sin condiciones de reto.
- Consola del navegador sin errores ni advertencias en la inspección final.
- Revisión visual en 1440×900, 768×1024, 390×844 y 320×740: sin desbordamiento horizontal de página. En 320 px las celdas 6×6 midieron aproximadamente 45 px y los controles Girar/Devolver 44 px de alto. Temas claro y oscuro comprobados; tamaño temporal y tema restaurados al finalizar. Las capturas `tetrilogic-free-*.png` y registros de pruebas/HTTP se conservan en los artefactos locales de esta sesión.
- `data-science/` sin cambios. El contenedor `pipre-ml-ia` conserva identidad y estado detenido; su `StartedAt` sigue siendo del día anterior, sin arranque en esta revisión. Docker actualizó su metadato `FinishedAt` al iniciar el daemon; por ello no se declara igualdad de todos sus metadatos antes/después. PostgreSQL, backend y frontend quedan activos.

Los resultados de otros informes son históricos y no sustituyen estas pruebas. La revisión de arrastre con mouse fue real; el giro mientras se mantiene el puntero y los gestos táctiles tienen cobertura automatizada, no se presentan como una prueba física de pantalla táctil.

Pendientes de validación ampliada, fuera de una comprobación de escritorio: dispositivo táctil físico, lector de pantalla y piloto con estudiantes. Las pruebas automatizadas de eventos táctiles no equivalen a una prueba física ni a certificación WCAG.

Las posiciones libres son locales a la sesión y se restablecen al salir o cambiar de distribución; no se añadió guardado/reanudación. Los textos históricos del catálogo y del editor se conservan en la base y no se presentan como reglas en la lista de actividades TetriLogic ni dentro del simulador. La descripción general guardada del curso sigue mostrándose en su tarjeta; una revisión editorial de esos metadatos debe preservar las personalizaciones docentes y las migraciones aplicadas.

No se modificaron backend, contratos de API, migraciones aplicadas ni `data-science` en este cambio de alcance. Los cambios backend existentes en la rama pertenecen a los lotes anteriores.
