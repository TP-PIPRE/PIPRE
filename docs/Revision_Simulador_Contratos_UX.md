# Revisión de conexiones y claridad del simulador TetriLogic

> **Revisión posterior vigente, última petición del 28/10/2026:** [mejora de piezas y objetivos por filas/columnas](TetriLogic_Filas_Columnas.md). Tras el modo totalmente libre se restaura sólo la coincidencia de conteos para completar el reto; no las demás restricciones ni métricas. Este documento conserva el diagnóstico y las pruebas anteriores. Los datos v2 publicados siguen intactos.

26 de octubre de 2026. Continuación del [informe de los 30 retos](Informe_TetriLogic_30_Retos.md). Esta revisión mejora presentación, carga e interacción; **no cambia las reglas de los tableros, las condiciones de victoria ni el catálogo v2**.

## Contratos y conexiones revisados

Se conserva el recorrido `Curso → Módulo → Lección → Actividad → levelTemplate → configuración persistida → simulador`. La actividad elegida y su pertenencia al curso siguen comprobándose; no se utiliza el nombre del curso para decidir el tablero.

Las 47 comprobaciones HTTP ejecutadas sobre Docker/PostgreSQL volvieron a aprobar: treinta configuraciones iguales al catálogo revisado, treinta actividades con su plantilla correspondiente, autenticación, permisos, configuración desconocida, rechazo de escritura de plantillas, crear/editar/recargar y conservación de metadatos/misiones. No se detectó un nuevo desajuste de DTO o de datos del backend en ese recorrido. El curso temporal propio de la prueba fue eliminado al terminar.

Se añadió el contrato TypeScript `TetriLogicTemplateResponseDTO` a los modelos de API y su lector a `apiService`. Conserva `{ templateId, version, config }`, la cookie de autenticación y la comparación completa con el contenido revisado. No cambia la respuesta del servidor.

Límites que siguen pendientes: `POST telemetry` guarda estudiante, juego y métricas crudas, pero todavía no identifica la actividad/versión de tablero ni representa una sesión reanudable. La victoria sigue validándose en el cliente; no crea por sí misma un resultado puntuado, XP o progreso. No se envió un campo nuevo que el servidor pudiera ignorar para aparentar esa conexión. Esas ampliaciones siguen en las secciones 2/3 del [documento de pendientes](Pendientes_TetriLogic_SSD.md); tampoco se cambiaron modelos o endpoints de IA.

### Problemas corregidos

| Problema | Corrección y límite |
|---|---|
| El componente de carga podía conservar un tablero anterior mientras recibía otro `config` sin desmontarse. La ruta ya usaba claves, pero el componente reutilizable dependía de esa protección externa. | Se vincula cada estado a la configuración solicitada, se oculta el anterior y se cancela la solicitud al cambiar o desmontar. Una respuesta obsoleta no sustituye la selección actual. |
| Los códigos de pieza y el objetivo se repetían en cabecera, reglas, inventario, celdas y misiones. | Miniaturas con números estables del 1 al 4; un número por pieza colocada, en vez de una letra en cada casilla. Los nombres accesibles se conservan y se añade el número como descripción. |
| `T1 → J1`, contactos y ángulos exigían interpretar identificadores técnicos. | Pares de miniaturas que coinciden con el inventario, explicación breve del momento de aplicación y vistas de los giros finales permitidos. |
| Seleccionar otra pieza colocada mientras había una seleccionada intentaba mover la primera y producía colisiones. | Se puede seleccionar directamente otra pieza del tablero. Elegir una casilla de la misma pieza sigue permitiendo moverla; colocar una del inventario sigue pasando por la validación de colisiones. |
| El arrastre de una pieza colocada ignoraba qué casilla se había tomado. | El mensaje de arrastre transporta el desplazamiento desde su origen. Al soltar se conserva la casilla bajo el cursor. Los mensajes antiguos con sólo `pieceId` siguen funcionando. |
| Las acciones de giro por teclado/clic derecho de la bandeja podían invocar callbacks con `disabled`. | Se comprueba el estado antes de invocarlos. El motor también conserva su protección tras la victoria. |
| El indicador `30/30` usaba el número de plantilla incluso si la actividad docente tenía otro orden. | Se retiró ese contador ambiguo. El selector conserva la actividad y el título guardados; no se aparenta un progreso persistente. |
| Los estilos globales de `lab-shell` y títulos anulaban dimensiones del componente. | Selectores del simulador con prioridad suficiente, cabecera compacta y tablero de tamaño limitado. No se cambian los estilos de Neon Flow. |

## Presentación aplicada

- Un solo objetivo breve junto al tablero; controles con etiquetas cortas y nombres accesibles.
- Las piezas se reconocen por forma, color y un número que no cambia al devolverlas al inventario. Las dos piezas de una misma forma también se distinguen por su número.
- Reglas específicas visibles; explicación general en **Cómo jugar**, con foco y cierre de teclado del modal existente. Los atajos del tablero no actúan dentro de esa ayuda.
- Descripción y misiones persistidas disponibles en **Instrucciones del reto**. Los textos estándar quedan plegados; las instrucciones personalizadas se abren inicialmente. Se elimina sólo la repetición literal de párrafos, conservando los títulos de misión.
- Los términos de medición o formación que no ayudan a colocar piezas dejan de ocupar el panel principal. La referencia de movimientos se explica dentro de la ayuda; no se presenta como un máximo o mínimo demostrado.
- Se mantienen fuente local, colores semánticos, temas y componentes de PIPRE, sin dependencias nuevas.

## Cómo funciona realmente la lógica actual

| Regla | Significado | Momento de validación |
|---|---|---|
| Todas las piezas | Deben colocarse las tres o cuatro piezas del inventario. Cada una ocupa cuatro casillas. No es necesario llenar el tablero. | Al pulsar Comprobar. |
| Filas y columnas | `2/4` indica dos casillas ocupadas frente a cuatro requeridas. Cada fila y columna debe alcanzar exactamente su meta; una meta cero debe quedar libre. | Los conteos se actualizan al jugar; su coincidencia exacta se exige al comprobar. |
| Límites y bloqueos | Una pieza no puede salir del tablero, ocupar un candado o superponerse a otra. | Al intentar colocar o girar. |
| Puntos | Todas las casillas marcadas con punto deben estar cubiertas. | Al comprobar. |
| Orden | `1 → 2` exige que la pieza 1 entre antes que la 2. No significa izquierda/derecha ni proximidad. Después pueden moverse. Para devolver la primera hay que retirar antes sus dependientes colocadas. | Primera colocación y devolución al inventario. |
| Contacto | Las parejas indicadas deben compartir al menos un lado entre casillas. Una esquina no basta. | Al comprobar. |
| Giro final | Si una pieza tiene orientaciones indicadas, debe terminar en una de ellas. Puede girarse en pasos de 90°, sin reflejarla. | Al comprobar; los límites y las colisiones se comprueban también durante cada giro. |

El reto 30, por ejemplo, usa tres piezas en una cuadrícula 6×6: ocupa doce casillas, no treinta y seis. Exige la primera colocación `1 → 2 → 3`, contactos `1–2` y `1–3`, y giro de la pieza 1 a 90° o 270°. El encaje y los conteos por sí solos no bastan para ganar ese reto.

Los estados intermedios pueden incumplir conteos, contacto o giro final. Esto permite explorar y recolocar antes de comprobar. Pulsar Comprobar incorrectamente no termina el intento; habilita la pista específica después de tres comprobaciones fallidas. Reiniciar conserva métricas del intento; Volver a intentar tras la victoria inicia otro.

## Decisiones pendientes antes de cambiar la lógica

Los treinta retos actuales incluyen orden y contacto; desde el 11 hay también orientaciones restringidas. Eso sigue la interpretación de las diez mecánicas del SSD aplicada al catálogo, pero no demuestra una progresión pedagógica adecuada. La presentación anterior dificultaba comprenderlo.

Propuesta para discutir, **no implementada**: empezar con encaje, bloqueos, puntos y conteos; introducir contacto más adelante; reservar orden y giro final para retos avanzados o modos específicos. Quitar condiciones amplía el conjunto de soluciones válidas y puede reducir la dificultad aunque la geometría no cambie. Debe volver a verificarse cada nivel afectado y revisarse con docentes.

V14/V15 ya están aplicadas: no editar sus SQL ni regenerar las configuraciones v2. Un cambio aprobado en reglas requiere una versión nueva de contenido y una migración aditiva, conservando los tableros e historial anteriores. No añadir puntuación o progreso automático sin definir su contrato.

## Validación de esta revisión

- Frontend: **140 pruebas aprobadas en 18 archivos**. Incluyen los treinta tableros resueltos mediante los componentes reales, selección directa, desplazamiento de arrastre, acciones deshabilitadas, carga cancelada, respuesta incompatible y ayuda/instrucciones docentes.
- TypeScript y build de producción aprobados. La compilación conserva el aviso de bundle superior a 500 kB (aproximadamente 716 kB); no se cambió el reparto de módulos en esta revisión.
- ESLint dirigido a todos los archivos de código y pruebas de esta revisión: aprobado. El resultado del lint global histórico sigue documentado en el informe previo; no se declara que sus errores generales estén resueltos.
- API real Docker/PostgreSQL: **47 comprobaciones aprobadas**. Catálogo congelado verificado con `generate_tetrilogic_catalog.py --check`.
- Reconstrucción limitada al frontend. No se han cambiado backend, migraciones aplicadas, permisos, puntuación o `data-science` en esta revisión. Los resultados de las 78 pruebas backend y 46 comprobaciones de migración pertenecen al lote anterior y no equivalen a una nueva ejecución aquí.

Revisión visual ejecutada en el frontend de Docker con PostgreSQL:

- 1440×900, 768×1024, 390×844 y 320×740: sin desbordamiento horizontal de página. En 320 px las celdas 6×6 midieron aproximadamente 34,5 px; se conserva la alternativa de teclado. En escritorio la acción Comprobar quedó completamente dentro de los primeros 900 px (borde inferior aproximado de 873 px).
- Temas claro y oscuro, ayuda móvil, cierre con Escape y retorno al juego. El color efectivo de Comprobar en oscuro fue texto `#10251E` sobre `#5EE0B4`, conforme a los tokens existentes. No se declara una auditoría de contraste completa ni certificación WCAG.
- Victoria del reto 30 con las mismas reglas, mediante giros, clic derecho y colocación. Cambio al reto 1, selección directa de otra pieza colocada y rechazo correcto al devolver una pieza con dependiente. Regreso al 30 con métricas/inventario nuevos.
- Consola del navegador sin errores en la revisión final. El arrastre con desplazamiento y las respuestas de red incompatibles/canceladas se verificaron mediante pruebas automatizadas; no se presenta como una prueba física de arrastre o de pantalla táctil.
- Tamaño del navegador restaurado al finalizar. Capturas locales de escritorio, tablet, móvil, tema oscuro, ayuda y victoria conservadas en los artefactos de esta sesión (`tetrilogic-ux-*.png`).

El total oficial sigue siendo TetriLogic 30/30 y Neon Flow 2/30: **32/60**. No se añadieron actividades ni plantillas en este lote.

## Archivos de esta revisión

- `frontend/src/infrastructure/api/apiService.ts` y `models/apiModels.ts`: lector y contrato de plantillas.
- `frontend/src/ui/components/TetriLogic/PersistedTetriLogicStage.tsx`: identidad de carga y cancelación.
- `OfficialTetriLogicStage.tsx`, `Board.tsx`, `PieceTray.tsx`, `tetrilogic.css`: composición, textos, selección y arrastre.
- `PiecePreview.tsx` y `TetriLogicRules.tsx`: miniaturas reutilizadas, reglas e instrucciones.
- `frontend/tests/unit/TetriClarity.test.tsx`, `TetriInteractions.test.tsx` y `PersistedTetriLogic.test.tsx`: regresiones y claridad.
- Esta revisión y las referencias actualizadas en el informe de contratos, informe TetriLogic y sistema de diseño.
