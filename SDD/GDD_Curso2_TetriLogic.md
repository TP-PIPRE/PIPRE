# GDD Curso 2 - TetriLogic (Razonamiento Espacial y Patrones)

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
- **Derrota:** Se acaba el tiempo (con opción a reintentar)[cite: 15].
- **Registro en BD por intento:** `tiempo`, `movimientos`, `reinicios`, `pistas utilizadas` y `resultado final`[cite: 15].
