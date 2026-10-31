# Neon Flow: funcionamiento vigente

**Revisado: 30/10/2026.** [Estado del proyecto](../ESTADO_ACTUAL.md) · [Índice](../README.md).

## Objetivo e interacción

Guiar el haz del emisor hasta los receptores del color correspondiente. Hay treinta configuraciones oficiales con tableros 4×4, 5×5 y 6×6.

1. Seleccionar un espejo o filtro de la bandeja y pulsar una celda vacía, o arrastrar el componente.
2. Pulsar un espejo para girarlo 90°; también admite clic derecho. No se coloca sobre el emisor, muros, receptores ni celdas ocupadas.
3. Pulsar **Comprobar** para visualizar el recorrido y validar los receptores. Un fallo permite seguir experimentando.
4. **Reiniciar** limpia la configuración del intento cuando el control está habilitado. **Pista** ofrece una explicación estática general.

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

Las plantillas oficiales son `neonflow-v2-1`…`30`, persistidas por V16 y leídas desde `GET /api/v1/neonflow/templates/{templateId}`. El frontend verifica identidad, versión y configuración antes de jugar. La respuesta no contiene soluciones.

Los prototipos `neonflow-1/2` conservan sus geometrías anteriores 5×5 y se identifican como **Versión anterior** en el catálogo/selector. Los alias `neonflow-3`…`30` mantienen enlaces compatibles; no suman otros 28 retos. Cambiar de actividad carga su tablero y reinicia su estado local.

## Telemetría y límites

Se observan selección, colocación, giro, comprobación, reinicio, ayuda estática y cierre del episodio. La ayuda estática registra `source=STATIC` y no incrementa `pistasIa`. El resultado es declarado por el cliente; no concede puntos ni progreso académico. La pérdida de conexión no bloquea el juego, pero la entrega de observaciones no está garantizada ante cierre forzado.

Fuentes: [componente de juego](../../frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx), [validación de receptores](../../frontend/src/application/usecases/neonflow/board.ts), [raycast](../../frontend/src/application/usecases/neonflow/raycast.ts) y [contratos](../guias/Contratos_Frontend_Backend.md).
