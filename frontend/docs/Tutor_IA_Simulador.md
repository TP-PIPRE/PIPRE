# Tutor de IA para el Simulador

## 1. Objetivo Pedagógico

El tutor de IA debe actuar como un guía socrático contextual. Su función es orientar al
estudiante durante la resolución de un reto sin entregar automáticamente la solución.

El sistema debe fortalecer:

- Análisis lógico.
- Reconocimiento de patrones.
- Razonamiento espacial.
- Planificación.
- Resolución autónoma de problemas.

La retroalimentación debe adaptarse al nivel del estudiante y al estado real del tablero.

## 2. Flujo de Integración

```text
AiFeedbackToast
      |
      v
gameStore.requestHint()
      |
      v
POST /api/v1/ai/hints
      |
      v
AiHintController
      |
      v
GenerateHintUseCase
      |
      v
AiServicePort
      |
      v
Adaptador OpenAI o servicio ML
```

El frontend continuará mostrando un mensaje estático mientras el backend de IA no esté
disponible. Esta estrategia garantiza continuidad de uso y evita bloquear la partida.

## 3. Contexto de la Solicitud

La solicitud debe contener únicamente información necesaria para generar una pista:

```json
{
  "studentId": "string",
  "game": "neonflow",
  "levelTemplate": "neonflow-v2-12",
  "boardState": {},
  "moves": 8,
  "failedChecks": 2,
  "resets": 1,
  "previousHints": 1,
  "locale": "es"
}
```

El contenido exacto de `boardState` depende del simulador:

- Neon Flow: emisor, receptores, espejos, filtros, muros y trayectoria calculada.
- TetriLogic: piezas colocadas, celdas bloqueadas, restricciones y piezas disponibles.

No deben enviarse contraseñas, tokens, nombres completos ni información personal no
necesaria para la generación de la pista.

## 4. Contrato de Respuesta

La respuesta debe validarse contra un esquema estable antes de mostrarse al estudiante:

```json
{
  "message": "Observa el espejo ubicado en la fila 2, columna 3.",
  "hintLevel": 1,
  "type": "ROTATION_HINT",
  "targetCell": {
    "x": 2,
    "y": 1
  }
}
```

Tipos recomendados:

- `GENERAL_GUIDANCE`: orientación conceptual.
- `ROTATION_HINT`: sugerencia de giro.
- `POSITION_HINT`: sugerencia de ubicación.
- `COLOR_HINT`: análisis de filtros y colores.
- `CONSTRAINT_HINT`: explicación de una restricción incumplida.
- `FINAL_GUIDANCE`: ayuda avanzada sin revelar toda la solución.

## 5. Niveles Progresivos de Ayuda

El tutor debe evitar proporcionar la solución completa desde la primera solicitud.

### Nivel 1 — Orientación General

Describe la regla o el objetivo que debe revisar el estudiante.

Ejemplo:

> Revisa el punto donde el haz cambia de dirección antes de modificar una pieza.

### Nivel 2 — Ubicación o Elemento

Indica una fila, columna, coordenada o pieza relevante.

Ejemplo:

> Observa el espejo ubicado en la fila 2, columna 3.

### Nivel 3 — Regla Aplicable

Explica por qué la configuración actual no cumple la regla.

Ejemplo:

> El filtro bloquea el haz porque su color no coincide con el color emitido.

### Nivel 4 — Orientación Avanzada

Sugiere una acción concreta, pero conserva la decisión final para el estudiante.

Ejemplo:

> Prueba girar el espejo 90 grados y verifica nuevamente la trayectoria.

## 6. Tutor para Neon Flow

El tutor debe analizar la trayectoria resultante del raycasting y reconocer:

- Primer punto donde el haz se detiene.
- Espejo con orientación incompatible.
- Filtro cuyo color no coincide con el emisor.
- Receptor que todavía no recibe el haz.
- Ruta que no respeta los muros del tablero.

Ejemplos de retroalimentación:

- **Análisis lógico:** "El haz llega al filtro, pero la condición de color no se cumple."
- **Reconocimiento de patrones:** "La ruta necesita repetir el mismo giro en las dos esquinas."
- **Resolución de problemas:** "El muro bloquea la trayectoria directa; busca una ruta alternativa por la fila superior."

## 7. Tutor para TetriLogic

El tutor debe analizar:

- Celdas ocupadas por una pieza.
- Colisiones con otras piezas.
- Celdas bloqueadas.
- Piezas fuera del tablero.
- Conteos actuales de filas y columnas.
- Rotaciones disponibles.
- Piezas que todavía permanecen en la bandeja.

Ejemplos de retroalimentación:

- **Reconocimiento de patrones:** "La fila 2 necesita una celda adicional para cumplir su objetivo."
- **Razonamiento espacial:** "La pieza T puede cubrir el espacio libre junto al bloqueado si la giras."
- **Resolución de problemas:** "Antes de colocar la pieza I, revisa el conteo de la columna 3."

## 8. Integración con el Estado del Juego

Al solicitar una pista, el frontend debe:

1. Ejecutar `requestHint()` en `useGameStore`.
2. Incrementar la métrica `pistasIa`.
3. Construir el contexto del nivel actual.
4. Solicitar la pista al backend.
5. Mostrar la respuesta en `AiFeedbackToast`.
6. Registrar el tipo de pista y el nivel de ayuda utilizado.

Si el backend no responde, el frontend debe utilizar una pista estática asociada al nivel.
El fallo del servicio de IA no debe bloquear la interacción del tablero ni cambiar el
resultado del reto.

## 9. Validación y Seguridad

- Validar que `game` sea `neonflow` o `tetrilogic`.
- Validar que `levelTemplate` pertenezca al curso solicitado.
- Rechazar coordenadas fuera de los límites del tablero.
- Ignorar recomendaciones que intenten modificar directamente el resultado.
- Aplicar autenticación JWT al endpoint.
- Aplicar autorización por rol para el uso del servicio.
- Limitar la cantidad de solicitudes por intento para evitar abuso.
- No almacenar prompts completos si contienen información innecesaria del estudiante.

## 10. Telemetría del Tutor

Además de `pistasIa`, el backend puede registrar:

| Métrica | Descripción |
|--------|-------------|
| `hintLevel` | Nivel de ayuda entregado |
| `hintType` | Tipo de pista generada |
| `targetCell` | Coordenada sugerida, si existe |
| `responseTimeMs` | Tiempo de respuesta del servicio IA |
| `accepted` | Si el estudiante continuó con una acción relacionada |
| `resultAfterHint` | Resultado posterior a la pista |

Estas variables permiten estudiar la relación entre retroalimentación, autonomía y éxito.

## 11. Fallback Estático

Mientras el servicio real no esté conectado, cada Stage debe conservar un mensaje
pedagógico estático. Ejemplos:

- Neon Flow: "Revisa la rotación del espejo en la coordenada indicada y comprueba nuevamente la trayectoria."
- TetriLogic: "Observa la fila con menor conteo y prueba una rotación antes de colocar la pieza."

El fallback debe respetar el nivel y el juego actual; no debe presentar una pista de
TetriLogic dentro de Neon Flow ni viceversa.

## 12. Roadmap de Implementación

### Fase 1 — Fallback Local

- Toast funcional.
- Mensajes estáticos por juego.
- Registro de `pistasIa` en telemetría.

### Fase 2 — Contrato Backend

- `AiHintController`.
- DTO de solicitud y respuesta.
- `GenerateHintUseCase`.
- Validación del contexto del nivel.

### Fase 3 — Adaptador IA

- `AiServicePort`.
- Adaptador para proveedor de IA o servicio ML interno.
- Control de timeout, reintentos y límites de consumo.

### Fase 4 — Personalización Pedagógica

- Historial de pistas por estudiante.
- Ajuste automático del nivel de ayuda.
- Indicadores para el docente.
- Evaluación estadística del impacto de la retroalimentación.
