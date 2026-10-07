# 2. Arquitectura del Sistema

## 2.1 Visión General

El sistema sigue una arquitectura cliente–servidor con separación estricta de
responsabilidades:

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (SPA React 19 + Vite + Zustand + Tailwind CSS)         │
│  ui/pages (Simulador wrapper) → ui/components (NeonFlow,        │
│  TetriLogic, common) → application/usecases (raycast,           │
│  validatePlacement) → infrastructure/store (gameStore)          │
│  → fetch POST /api/v1/telemetry (JWT Bearer/cookie)             │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (REST)
┌──────────────────────────────▼──────────────────────────────────┐
│ BACKEND (Spring Boot 3.5, Java 21 — Arquitectura Hexagonal)     │
│  adapters/in/web (controllers + DTOs) → application/ports/input │
│  → application/useCases (servicios) → domain (entidades,        │
│  factories) → application/ports/output → adapters/out/persistence│
│  (JPA + MapStruct + Flyway)                                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ JDBC
┌──────────────────────────────▼──────────────────────────────────┐
│ PostgreSQL 16                                                   │
│  courses, modules, lessons, activities, activity_missions,      │
│  simulations, activity_results, telemetry_attempts (V12)        │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Frontend — SPA React

| Tecnología | Responsabilidad |
|------------|-----------------|
| React 19 + Vite | Renderizado declarativo de las vistas y build optimizado |
| Zustand (`gameStore`) | Estado global de la partida y recolección de telemetría por intento |
| Tailwind CSS 4 | Sistema de diseño por utilidades y temas dinámicos |
| React Router 7 | Navegación con ruta paramétrica `/simulador/:courseId?` |
| API nativa Drag & Drop | Interacción de piezas sin librerías externas pesadas |

El frontend se organiza en capas limpias: `shared` (tipos y constantes), `application`
(casos de uso puros), `infrastructure` (store, API) y `ui` (componentes y páginas).

## 2.3 Backend — Arquitectura Hexagonal Estricta

| Capa | Paquete | Contenido |
|------|---------|-----------|
| Adaptadores de entrada | `adapters.in.web.controller` / `.dto` | Controladores REST, DTOs con `jakarta.validation` |
| Puertos de entrada | `application.ports.input` | Contratos de casos de uso (`SaveAttemptUseCase`) |
| Comandos | `application.commands` | Objetos de transporte de la capa de aplicación |
| Casos de uso | `application.useCases` | Servicios (`@Service`) que orquestan dominio y puertos |
| Dominio puro | `domain.entities.*`, `domain.factories.*`, `domain.exceptions` | Reglas de negocio sin dependencias de infraestructura |
| Puertos de salida | `application.ports.output` | Contratos de persistencia (`SaveTelemetryPort`) |
| Adaptadores de salida | `adapters.out.persistence` | Entidades JPA, repositorios Spring Data, mappers MapStruct |

## 2.4 Flujo de la Telemetría (Hexágono aplicado)

1. `TelemetryController` (`POST /api/v1/telemetry`) recibe `SaveAttemptRequestDTO` validado (`@Valid`).
2. Mapea el DTO a `SaveAttemptCommand` y delega en `SaveAttemptUseCase`.
3. `SaveAttemptService` valida reglas de negocio, construye la entidad de dominio
   `TelemetryAttempt` (factory con UUID) y delega al puerto `SaveTelemetryPort`.
4. `TelemetryPersistenceAdapter` mapea dominio → entidad JPA (MapStruct) y persiste.
5. La tabla `telemetry_attempts` (Flyway V12) recibe el registro con enfoque
   **fire-and-forget** (sin claves foráneas estrictas), garantizando que la escritura de
   métricas jamás bloquee la experiencia del estudiante.

## 2.5 Base de Datos — PostgreSQL

- **Migraciones Flyway:** `V1` a `V12` (creación de usuarios/roles, cursos, progreso,
  analítica, grupos, datos iniciales, extensión de actividades y misiones, enriquecimiento
  de simulaciones, gamificación y la tabla de telemetría).
- **Integridad referencial:** cascadas (`ON DELETE CASCADE`) en el árbol curso → módulo →
  lección → actividad → resultados, permitiendo la limpieza idempotente del seedeo.
- **Telemetría aislada:** `telemetry_attempts` almacena métricas crudas por intento para el
  análisis estadístico posterior de la tesis.
