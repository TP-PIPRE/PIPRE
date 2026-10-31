# GDD Curso 2 - TetriLogic (Razonamiento Espacial y Patrones)

> **Alcance vigente, revisado el 30/10/2026:** [manipulación directa y reto por filas/columnas](../docs/simuladores/TetriLogic_Filas_Columnas.md). Se completa al igualar todos los conteos publicados, incluidos los ceros. No se restauran bloqueos, puntos obligatorios, orden, contactos, orientaciones exigidas, puntuación ni temporizador visible. Las reglas siguientes conservan el historial del diseño anterior. La confirmación es local, sin progreso académico automático; el usuario autorizó registrar intentos/acciones el 30/10. Ver [estado consolidado](../docs/ESTADO_ACTUAL.md).

Actualización del 26/10/2026: el catálogo v2 sigue el SSD revisado por el equipo. Consultar el [informe de los treinta retos](../docs/historial/Informe_TetriLogic_30_Retos.md) y sus [pendientes](../docs/simuladores/Pendientes_TetriLogic_SSD.md) para distinguir tableros implementados de puntuación, progreso y Reto diario todavía pendientes.

## 1. Objetivo Cognitivo

Desarrollar identificación de patrones, razonamiento espacial, planificación y resolución de problemas[cite: 15].

## 2. Mecánica Principal

El jugador debe encajar piezas geométricas (Tetriminos) en un tablero bajo restricciones específicas para completar configuraciones o patrones[cite: 15].

## 3. Tablero y Progresión

- Niveles 1 al 5: Tablero de 4x4[cite: 15].
- Niveles 6 al 20: Tablero de 5x5[cite: 15].
- Niveles 21 al 30: Tablero de 6x6[cite: 15].
- Existen celdas bloqueadas en distintas posiciones y restricciones por conteo de celdas por fila/columna[cite: 15].

## 4. Componentes (Piezas)

Formadas por celdas conectadas[cite: 15]. Formas disponibles:

- Tetrimino O (cuadrado)[cite: 15].
- Tetrimino I (pieza larga)[cite: 15].
- Tetrimino T[cite: 15].
- Tetriminos S y Z[cite: 15].
- Tetriminos L y J[cite: 15].

Cada reto v2 tiene tres o cuatro tetrominós y como máximo una forma repetida una vez. Se deben usar todas las piezas; los objetivos de filas y columnas suman 12 o 16 respectivamente. No es obligatorio cubrir todas las celdas libres.

## 5. Acciones y Reglas de Colocación

- **Trasladar / Arrastrar:** Mover pieza con el click izquierdo[cite: 15].
- **Rotar:** Girar piezas en incrementos de 90° con R o click derecho[cite: 15].
- **Condiciones de Colocación Válida:**
  1. Estar completamente dentro del tablero[cite: 15].
  2. No ocupar una celda bloqueada[cite: 15].
  3. No superponerse con otra pieza[cite: 15].
  4. Cumplir restricciones del nivel[cite: 15].

## 6. Condiciones de Victoria y Registro (Telemetría)

- **Victoria:** Cumplir todas las condiciones requeridas por el nivel[cite: 15].
- **Tiempo en el SSD actualizado:** el modo pedagógico principal registra duración sin derrota automática por lentitud. Un límite temporal sólo corresponde a un modo que lo declare expresamente; ese modo aún no está implementado.
- **Registro en BD por intento:** `tiempo`, `movimientos`, `reinicios`, `pistas utilizadas` y `resultado final`[cite: 15].
