# 2. Arquitectura del sistema

**Actualizado: 02/11/2026.** [Manual](README.md) · [Contratos](../guias/Contratos_Frontend_Backend.md).

## Estructura y comunicación

```text
Frontend React / TypeScript
  ui → application/usecases → infrastructure/api y store
                     ↓ REST con cookie jwt
Backend Spring Boot / Java
  adapters/in/web → application/ports/input → application/useCases
                  → domain y application/ports/output
                  → adapters/out/persistence (JPA, MapStruct y JDBC)
                     ↓ PostgreSQL / Flyway
  currículo, catálogos JSONB, resultados y telemetría
```

El backend se organiza mediante puertos y adaptadores. La descripción se refiere a sus paquetes reales, sin afirmar una auditoría de independencia estricta entre todas las dependencias.

## Frontend

| Capa | Responsabilidad |
|---|---|
| `shared` | Tipos, tokens y configuraciones revisadas. |
| `application/usecases` | Resolución de actividad, geometría, conteos y raycast. |
| `infrastructure/api` | Axios, DTO, cookies y tratamiento de errores. |
| `infrastructure/store` | Estado de sesión/partida y cola de trazabilidad. |
| `ui` | Pantallas, componentes, cargadores persistidos y rutas. |

Tecnologías declaradas: React 19, TypeScript 5.9, Vite 8, Tailwind 4, Zustand, React Router 7 y Axios. Ver versiones exactas en [package.json](../../frontend/package.json).

Neon Flow usa su estado de tablero y `gameStore` para controles/métricas locales. TetriLogic activo usa `freePlayReducer`, interacción por puntero y `lineGoalsMet`. Ambos observan acciones mediante `useAttemptTrace`/`AttemptTrace`; no atribuir toda la telemetría nueva al store histórico.

## Backend y datos

Los controladores reciben DTO, aplican permisos y delegan en casos de uso. Los puertos aíslan la persistencia; JPA/MapStruct se reutilizan y la inserción de trazas nuevas usa JDBC con `ON CONFLICT` para reintentos concurrentes.

| Recurso | Fuente y función |
|---|---|
| Cursos, módulos, lecciones, actividades y misiones | Currículo y selección de la actividad. |
| `tetrilogic_templates`, `neonflow_templates` | Identidad, versión y configuración JSONB de los catálogos. |
| `telemetry_attempts` | Episodios observados y contexto de acciones; no es una tabla de calificaciones. |
| `simulations`, `activity_results`, `module_progress` | Recursos académicos existentes, sin actualización automática por una nueva traza. |
| `game_sessions`, `game_session_actions` | Estado, acciones tipadas, tiempos de servidor y recibos idempotentes; una sesión activa por estudiante. |
| `verified_game_victories`, `game_level_progress` | Victorias comprobadas y mejor estrella de cada nivel oficial. |
| `achievements`, `player_achievements`, `achievement_xp_ledger`, `gamification_accounts` | 35 logros activos, historial anterior, recompensas únicas y saldo global. |
| `daily_challenges`, `daily_challenge_completions` | Asignación por fecha de Lima y una finalización por estudiante/fecha. |

## Plantillas y migraciones

Flyway contiene **V1…V19**, aplicadas localmente. V13 amplía metadatos de actividad; V14/V15 incorporan TetriLogic y compatibilidad; V16 incorpora Neon Flow, V17 amplía telemetría, V18 añade gamificación y V19 sesiones verificadas. Las migraciones aplicadas son inmutables.

Las plantillas oficiales v2 se consultan por API y el frontend verifica su correspondencia completa. Las soluciones se mantienen en fixtures/scripts de pruebas, fuera de las respuestas y del catálogo de producción. Una configuración no disponible muestra error/reintento; no se sustituye silenciosamente por la primera.

V17 agrega FK de actividad opcional con `ON DELETE SET NULL` y FK de estudiante con `ON DELETE CASCADE`. La segunda se crea `NOT VALID` en PostgreSQL para conservar posibles huérfanos históricos y exigir integridad en escrituras nuevas. Los registros anteriores mantienen contexto nulo. [Detalle y límites](../informes/Integracion_TetriLogic_NeonFlow_ML.md).

## Arranque y límites

`GameSessionsService` reproduce reglas activas mediante `BoardRules`; `GamificationService` evalúa los 35 logros tras una victoria. Puertos y adaptadores JDBC persisten estado y recibos; cada mutación bloquea primero al estudiante y después la sesión. Restricciones únicas y transacciones evitan doble sesión activa, recompensa o finalización diaria. Un `Clock` de servidor permite probar límites temporales sin cambiar el reloj del entorno. [Contrato de logros](../guias/Sistema_35_Logros.md).

`CourseSeederService` crea cursos oficiales ausentes; no borra/recrea todos los cursos. Las migraciones aditivas actualizan instalaciones existentes preservando personalizaciones. `pipre.seed.demo-data=false` evita resultados y analítica aleatorios; el bootstrap de usuarios conserva cuentas ficticias, descritas en [estado actual](../ESTADO_ACTUAL.md).

La integración no modifica ni presupone el funcionamiento del servicio `data-science`. Los [diagramas conservados](../diagramas/README.md) pueden omitir ampliaciones posteriores.
