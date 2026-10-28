# TetriLogic: apariencia de piezas y retos por filas y columnas

28/10/2026. La petición más reciente del usuario restaura los conteos como condición de completar el reto, conservando la manipulación directa implementada en el modo libre anterior.

## Reglas vigentes

- Cada indicador muestra **casillas ocupadas / objetivo** de su fila o columna. Por ejemplo, `2/3` significa que falta ocupar una casilla en esa línea. Los objetivos cero también se comprueban. No hay que rellenar todo el tablero, sino igualar los conteos.
- Se completa el reto cuando coinciden **todos** los objetivos definidos en `constraints`, con geometría dentro del tablero y sin superposiciones. La confirmación aparece automáticamente y no bloquea el tablero; mover o devolver piezas actualiza de nuevo el estado.
- Mientras se experimenta se puede superar un conteo. El indicador lo muestra en rojo y ese estado no completa el reto. Se conservan los indicadores verdes para coincidencias y valores neutros para líneas pendientes. Una línea sin objetivo en una plantilla antigua muestra `—`, sin inventar un cero.
- Se mantienen arrastre con punto de agarre, giro con R/botón/clic derecho, devolución a bandeja, selección por clic/toque, desplazamiento con flechas y cancelación con Escape.
- No se restauran bloqueos, celdas obligatorias, precedencias, contactos, orientaciones exigidas, pistas condicionadas, temporizador, puntuación, XP o progreso. La confirmación es local: no escribe un resultado ni envía telemetría de intento.

## Cambios visuales

El relleno plano y el contorno negro grueso se sustituyen por una silueta continua de esquinas redondeadas, borde tonal fino y cuatro superficies interiores sutiles que permiten reconocer las casillas. La selección usa el primario de PIPRE. Se mantiene un número discreto por pieza, sin tipos técnicos repetidos.

La silueta usada en el tablero y durante el arrastre es la misma, con escala de la cuadrícula. Las miniaturas de la bandeja comparten la paleta más suave. Los indicadores numéricos se alinean arriba de las columnas y a la izquierda de las filas, fuera de la cuadrícula, sin cubrir las piezas. La bandeja sigue separada del tablero.

Se reutilizan los tokens, temas, fuente Geist, iconos Lucide y componentes existentes. No se añadieron dependencias.

## Integración y compatibilidad

El recorrido actividad → plantilla → JSON validado sigue intacto. Se leen tamaño, inventario y objetivos del contenido persistido elegido; no se decide el tablero por el nombre del curso ni se introduce una plantilla alternativa ante errores.

Los treinta JSON v2 y V14/V15 permanecen congelados. Este modo de conteos no reinterpreta ni sobrescribe las demás condiciones del puzzle histórico: las omite expresamente según la petición del usuario. El motor histórico sólo se abre en pruebas de compatibilidad. Las actividades docentes conservan nombre, descripción, orden, misiones y vínculo a lección; la lista de entrada muestra una instrucción breve coherente con los conteos, sin exigir reglas retiradas.

No se añadieron actividades ni plantillas. Se mantienen **30 TetriLogic y 2 Neon Flow: 32 actividades oficiales**. No se declara completada la meta de 60, el SSD integral ni el progreso de estudiantes. Backend, migraciones, Neon Flow y `data-science` no se modifican en este lote.

## Archivos

- `frontend/src/ui/components/TetriLogic/PieceSurface.tsx`: silueta redondeada reutilizada en tablero y arrastre.
- `Board.tsx`, `PiecePreview.tsx` y `freePlay.css`: indicadores y presentación coherente de piezas, bandeja y selección.
- `FreeTetriLogicStage.tsx`: objetivos persistidos y confirmación local automática. Conserva su nombre de archivo por compatibilidad; ya no es una experiencia sin objetivos.
- `frontend/src/application/usecases/tetrilogic/lineGoals.ts`: comprobación exclusiva de conteos y geometría. `rules.ts` reutiliza el cálculo de filas/columnas con un tipo mínimo de entrada.
- `frontend/src/ui/pages/PaginaInicio.tsx`: lista de retos de conteos, manteniendo nombres y actividad seleccionada.
- `frontend/tests/unit/TetriLineGoals.test.tsx`, `TetriFreeInteraction.test.tsx`, `FreeCatalogEntry.test.tsx` y `ActivitySimulator.test.tsx`: validación del nuevo alcance y regresiones de navegación/manipulación.
- `AGENTS.md`, sistema de diseño, guía e informes: alcance vigente; la documentación del modo totalmente libre queda como historial.

## Validación

- **222 pruebas aprobadas en 22 archivos**. Las treinta configuraciones se completan mediante los componentes reales con sus inventarios y giros. Se comprueban ambos ejes, objetivos cero, exceso permitido sin victoria, reglas antiguas excluidas, colisiones y actualización al mover/devolver/restablecer piezas.
- TypeScript, build de producción y ESLint dirigido aprobados. El build conserva el aviso histórico de bundle mayor de 500 kB (aproximadamente 708 kB).
- `generate_tetrilogic_catalog.py --check`: las treinta configuraciones, testigos y V14 congelada siguen coincidiendo.
- Frontend actualizado en Docker con `up --build -d --no-deps frontend`, sin reconstruir backend, PostgreSQL ni `data-science`.
- Navegador real: retos 9 y 30 completados con conteos correctos. El 30 se resolvió colocando Z y J antes de T, sin exigir precedencias históricas. Comprobados giro, arrastre de pieza colocada, devolución a bandeja, actualización de conteos y retirada/restauración de la confirmación al incumplir/corregir un objetivo cero.
- Temas claro/oscuro y resoluciones 1440×900, 768×1024, 390×844 y 320×740 revisados sin desbordamiento horizontal de página. En el tablero 6×6 a 320 px, las celdas midieron aproximadamente 37,7 px; se conserva selección por clic/teclado como alternativa al arrastre. Los indicadores permanecen fuera de las celdas y alineados con sus ejes.
- Capturas `tetrilogic-counts-*.png` y registros de pruebas/build/Docker conservados en los artefactos locales de esta sesión. Se restaura el tema y el tamaño del navegador al finalizar.
- Consola del navegador sin errores ni advertencias en la inspección final.
- PostgreSQL confirmó 30 configuraciones, 30 actividades oficiales TetriLogic y 2 Neon Flow. El contenedor de `data-science` conserva identidad, estado detenido y `StartedAt` sin cambios. `git diff --check` aprobado, sin modificaciones en `data-science/`.

Los resultados HTTP detallados de la revisión anterior son históricos; no se presenta como nueva ejecución de ese conjunto en este lote. La carga real de plantillas y el cambio de actividad se comprobaron en el navegador contra el backend local.

## Límites y continuidad

Las posiciones y la confirmación del reto son locales a la sesión; no se añadió guardado/reanudación ni concesión de resultados. El contenido v2 sigue incluyendo condiciones históricas en sus JSON, aunque este modo activo sólo compruebe filas y columnas. No editar las migraciones publicadas para borrarlas.

Siguen pendientes una prueba con pantalla táctil física, lector de pantalla y piloto con estudiantes. La cobertura de puntero touch simulado y la revisión responsive no equivalen a esas pruebas ni a una certificación WCAG.
