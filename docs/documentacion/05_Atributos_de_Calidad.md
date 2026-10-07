# 5. Atributos de Calidad y No Funcionales

## 5.1 Rendimiento y Concurrencia

- **Cronómetro fuera del renderizado:** el temporizador de la partida se gestiona a nivel de
  módulo del store (Zustand), sin provocar re-renderizados por segundo salvo en los
  componentes suscritos a la métrica.
- **Prevención de fugas de memoria:** los componentes `Stage` detienen el temporizador al
  desmontarse (`stopGame()` en el cleanup del `useEffect`), eliminando intervalos huérfanos.
- **Operaciones O(1):** búsqueda de celdas en la grilla mediante índice plano
  (`y * width + x`), mapas de ocupación por clave `"x,y"` y conjuntos (`Set`) para la
  resolución de identificadores de curso.
- **Anti-bucles:** el raycasting limita su ejecución a `width × height × 4` iteraciones,
  garantizando terminación incluso ante configuraciones cíclicas de espejos.
- **Idempotencia:** el seedeo de cursos elimina y recrea los registros oficiales en cada
  arranque, garantizando consistencia sin duplicados.

## 5.2 Mantenibilidad y Escalabilidad

- **Arquitectura Hexagonal estricta (backend):** el dominio no depende de marcos de
  infraestructura; controladores, casos de uso, puertos y adaptadores pueden evolucionar
  de forma independiente.
- **Capas limpias en el frontend:** tipos compartidos (`shared`), casos de uso puros
  (`application/usecases`) y componentes presentacionales (`ui`) con contratos explícitos
  de props.
- **Tipado estricto:** TypeScript con uniones discriminadas (`TetriminoType`,
  `CellType`, `GameStatus`) y Java con records y validaciones de dominio, reduciendo
  errores en tiempo de compilación.
- **Modularidad controlada:** archivos acotados y responsabilidades atómicas, facilitando
  pruebas unitarias y la incorporación de nuevos niveles o juegos.

## 5.3 Seguridad

- **Autenticación JWT:** tokens firmados, aceptados por cabecera `Authorization: Bearer` y
  por cookie `jwt` (compatibilidad con el proxy de desarrollo).
- **Control de acceso por roles:** `@PreAuthorize` en los endpoints (estudiantes, docentes
  y administradores) y filtro de tokens en la cadena de seguridad de Spring.
- **Validación estricta de entradas:** `jakarta.validation` (`@NotBlank`, `@NotNull`,
  `@Min(0)`) en los DTOs, con manejo centralizado de errores de validación (HTTP 400).
- **Guards defensivos:** verificaciones de celdas inexistentes, límites de tablero y
  parseo seguro de fechas, impidiendo excepciones no controladas (`NullPointerException`).
- **Telemetría tolerante a fallos:** el envío de métricas es fire-and-forget; un fallo del
  servidor nunca bloquea la experiencia de juego ni genera promesas rechazadas sin manejo.

## 5.4 Fiabilidad de Datos

- **Persistencia transaccional:** las operaciones de seedeo y persistencia se ejecutan en
  transacciones (`@Transactional`), con integridad referencial en cascada.
- **Migraciones versionadas:** Flyway garantiza la evolución reproducible del esquema
  (`V1`–`V12`), incluida la tabla de telemetría de la tesis.
