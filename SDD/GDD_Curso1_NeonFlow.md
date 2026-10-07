# GDD Curso 1 - Neon Flow (Lógica Proposicional y Condicional)

## 1. Objetivo Cognitivo

Evaluar y fortalecer Análisis Lógico, Reconocimiento de Patrones y Resolución de Problemas en estudiantes de secundaria.

## 2. Mecánica Principal

El jugador manipula componentes ópticos en una cuadrícula discreta para guiar un haz de luz láser desde un Emisor hasta un Receptor.

## 3. Tablero y Progresión

- Niveles 1 al 10: Tablero de 4x4.
- Niveles 11 al 20: Tablero de 5x5.
- Niveles 21 al 30: Tablero de 6x6.
- El tablero contiene celdas libres y celdas bloqueadas (muros).

## 4. Componentes (Piezas)

- **Emisor Láser:** Dispara un haz de luz recta.
- **Receptor:** Objetivo que se enciende al recibir el color correcto.
- **Espejo 90°:** Rota en ángulos rectos y desvía la luz.
- **Filtro de Color (Condicional):** Solo permite el paso de un color específico de luz.
- **Prisma Divisor:** Divide el haz en dos direcciones.

## 5. Controles e Input

- **Arrastrar (Drag & Drop):** Mover pieza del inventario a la celda.
- **Rotar (Click derecho):** Rotar pieza en incrementos de 90°.
- **Botón Emitir:** Dispara el láser para validar la solución.

## 6. Condiciones de Victoria y Registro (Telemetría)

- **Victoria:** El haz de luz llega a todos los receptores con el color exigido.
- **Registro en BD por intento:** `tiempo_resolucion`, `cantidad_movimientos`, `piezas_utilizadas`, `reinicios`, `pistas_ia_solicitadas`.
