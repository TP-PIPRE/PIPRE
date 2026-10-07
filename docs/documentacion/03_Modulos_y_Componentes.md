# 3. Módulos y Componentes Principales

## 3.1 Módulo de Autenticación y Cursos

- **Autenticación:** inicio de sesión por credenciales con emisión de JWT (almacenado en
  cookie y soportado también por cabecera `Authorization: Bearer`). Roles: `STUDENT`,
  `TEACHER`, `ADMIN`; protección de rutas por `@PreAuthorize`.
- **Catálogo dinámico de cursos:** el wrapper `Simulador.tsx` resuelve el parámetro de ruta
  `/simulador/:courseId?` y determina el entorno:

| `courseId` (normalizado) | Entorno renderizado |
|--------------------------|---------------------|
| `1`, `neonflow`, `logica`, `c001` | `<NeonFlowStage />` |
| `2`, `tetrilogic`, `patrones`, `c002` | `<TetriLogicStage />` |
| cualquier otro valor o vacío | Estado vacío con enlace de retorno |

- Los identificadores oficiales `c001` y `c002` provienen del seedeo del backend
  (`CourseSeederService`) y coinciden con los conjuntos del frontend.

## 3.2 Módulo de Simulación 1 — Neon Flow (Lógica Proposicional)

- **Motor de trazado de rayos (`raycast`):** función pura en TypeScript que recorre la
  cuadrícula discreta celda a celda, con guardias de límites y tope anti-bucle
  (`width × height × 4` iteraciones).
- **Componentes ópticos:** `MIRROR_90` (desviación de 90° según rotación), `FILTER`
  (paso condicionado por color), `BLOCK` (muro que detiene el haz) y `RECEPTOR` (objetivo
  que se ilumina al recibir el color correcto).
- **Validación de victoria:** el botón *Comprobar* ejecuta el raycasting y verifica que
  todos los receptores del nivel queden iluminados.
- **Retroalimentación de IA:** el botón *Pista* incrementa la métrica `pistasIa` y muestra
  un toast inferior no bloqueante con la sugerencia del asistente IA (el consumo de la API
  de IA se conecta en una fase posterior del proyecto).

## 3.3 Módulo de Simulación 2 — TetriLogic (Razonamiento Espacial)

- **Tablero de Tetriminos:** grilla dinámica (4×4, 5×5 o 6×6 según nivel) con celdas
  bloqueadas y restricciones de conteo por fila/columna.
- **Validación de colocación (`validatePlacement`):** función pura que verifica las tres
  condiciones del GDD — dentro del tablero, sin ocupar celdas bloqueadas y sin
  superposiciones.
- **Interacción:** Drag & Drop nativo HTML5 para mover piezas y click derecho (o tecla R)
  para rotar en incrementos de 90°.
- **Niveles progresivos:** selector de niveles, botón *Siguiente Nivel* al completar y
  banner *¡Curso Completado!* al finalizar el último nivel.
- **Retroalimentación de IA:** pista contextual orientada a la rotación y ubicación de
  piezas.

## 3.4 Módulo de Docentes y Analítica

- **Métricas por intento (`telemetry_attempts`):**

| Campo | Significado |
|-------|-------------|
| `studentId` | Identificador del estudiante autenticado |
| `game` | `neonflow` o `tetrilogic` |
| `result` | `SUCCESS` o `FAILED` |
| `tiempoResolucion` | Segundos empleados (cronómetro) |
| `movimientos` | Colocaciones y rotaciones válidas registradas |
| `reinicios` | Veces que se reinició el tablero |
| `pistasIa` | Solicitudes de ayuda al asistente IA |
| `completedAt` | Marca de tiempo ISO-8601 |

- **Panel docente:** dashboard, métricas, retos y ranking se mantienen poblados mediante el
  seedeo de simulaciones y resultados de prueba alineados a los nuevos entornos.
- **Destino analítico:** los registros constituyen el insumo para el análisis estadístico
  de la tesis (correlación entre uso de pistas IA, tiempo y éxito).
