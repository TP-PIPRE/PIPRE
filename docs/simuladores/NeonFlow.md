# Neon Flow: funcionamiento vigente

**Revisado el 10/11/2026.** [Estado del proyecto](../ESTADO_ACTUAL.md) · [Índice](../README.md).

## Objetivo e interacción

Guiar el haz del emisor hasta los receptores del color correspondiente. Hay treinta configuraciones oficiales con tableros 4×4, 5×5 y 6×6.

La dificultad aumenta en bloques de cinco retos. El mínimo de espejos necesarios crece de dos a siete. Desde el primer nivel hay que desviar el haz y elegir entre varios puntos de giro para sortear los obstáculos.

| Niveles | Tablero | Mínimo de espejos |
|---|---|---|
| 1–5 | 4×4 | 2 |
| 6–10 | 4×4 | 3 |
| 11–15 | 5×5 | 4 |
| 16–20 | 5×5 | 5 |
| 21–25 | 6×6 | 6 |
| 26–30 | 6×6 | 7 |

1. Seleccionar un espejo o filtro de la bandeja y pulsar una celda vacía, o arrastrar el componente.
2. Pulsar un espejo para girarlo 90°; también admite clic derecho. No se coloca sobre el emisor, muros, receptores ni celdas ocupadas.
3. Pulsar **Comprobar** para visualizar el recorrido y validar los receptores. Un fallo permite seguir experimentando.
4. **Reiniciar** limpia la configuración del intento cuando el control está habilitado. **Pista** ofrece ayuda contextual en el piloto y ayuda general en los demás casos.

El inventario de componentes ópticos funciona como herramientas reutilizables; no representa el inventario finito de TetriLogic. Esta documentación no incorpora nuevas restricciones de cantidad o puntuación.

## Reglas del recorrido

| Elemento | Comportamiento |
|---|---|
| Emisor | Define posición, dirección y color inicial. Su celda se reserva. |
| Espejo `MIRROR_90` | Desvía el haz según orientación. La línea visual coincide con el motor. |
| Filtro `FILTER` | Deja pasar únicamente su color compatible. |
| Obstáculo `BLOCK` | Detiene el haz. |
| Receptor `RECEPTOR` | Detiene el haz; sólo aparece iluminado si recibe el color correcto. |

El trazado limita sus iteraciones. La condición de éxito usa tanto la presencia del receptor real como el color; alcanzar una coordenada sin esa condición no basta. El catálogo actual tiene un receptor por tablero; no se supone que el haz atraviese receptores para iluminar otros posteriores.

## Actividades y compatibilidad

Las actividades oficiales apuntan a `neonflow-v3-1`…`30` desde V32. El frontend verifica identidad, versión y configuración desde `GET /api/v1/neonflow/templates/{templateId}`. Los tableros v2 de V16 siguen disponibles para referencias existentes y el diario. La práctica de Neon Flow abre la serie v3.

V32 actualiza las vinculaciones originales de las actividades oficiales y respeta las vinculaciones y textos personalizados. Las dos versiones del mismo nivel comparten el mejor puntaje y el progreso. El tutor lleva el contador por plantilla, de modo que el tablero v3 empieza con sus propios consejos. El comando `node scripts/verify_neonflow_progression.mjs` comprueba las soluciones y su número mínimo de giros con los mismos tableros del cliente, servidor y migración.

Los prototipos `neonflow-1/2` conservan sus geometrías anteriores 5×5 y se identifican como **Versión anterior** en el catálogo/selector. Los alias `neonflow-3`…`30` mantienen enlaces compatibles; no suman otros 28 retos. Cambiar de actividad carga su tablero y reinicia su estado local.

## Tutor contextual

**Pista** presenta un consejo por pulsación y recorre seis consejos sobre el recorrido del haz, los espejos y los filtros. Al salir del reto y volver, el contador visible y la secuencia de consejos generales empiezan de nuevo. Una recarga conserva ambos. En una partida verificada, cada entrega confirmada queda registrada como `HELP` con `source=STATIC` para las estrellas del intento.

Con el tutor progresivo habilitado, los retos oficiales ofrecen cinco consejos fijos y tres generados por Ollama. Las ocho ayudas son gratuitas para la rúbrica de estrellas. A partir de la novena, el estudiante confirma si desea otra ayuda y el servidor registra la penalización cuando la entrega. [Tutor progresivo y activación local](../guias/Ayudas_Progresivas_Neon_Flow.md)

## Telemetría y límites

Se observan selección, colocación, giro, comprobación, reinicio, ayuda y cierre del episodio. Las partidas con el tutor progresivo registran las entregas en el servidor y conservan el cupo por estudiante y reto. Los resultados declarados por el cliente se usan para telemetría. La pérdida de conexión no bloquea el juego, pero la entrega de observaciones no está garantizada ante cierre forzado.

Desde el 02/11, las partidas estudiantiles oficiales usan además una sesión verificada: el servidor reproduce acciones y raycast, confirma la victoria y calcula las mejores estrellas y [logros](../guias/Sistema_35_Logros.md). El tablero espera al inicio de sesión. Si falla la conexión, muestra la opción de reintentar. Reiniciar después de una victoria abre otro intento para mejorar la calificación. La vista previa docente y los prototipos permanecen fuera del progreso de los 60 niveles oficiales.

Fuentes: [componente de juego](../../frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx), [validación de receptores](../../frontend/src/application/usecases/neonflow/board.ts), [raycast](../../frontend/src/application/usecases/neonflow/raycast.ts) y [contratos](../guias/Contratos_Frontend_Backend.md).
