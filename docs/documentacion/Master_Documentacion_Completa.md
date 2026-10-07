# Documentación Técnica y Funcional del Sistema

## Uso de Simulador web gamificado con retroalimentación basada en IA para fortalecer pensamiento lógico en estudiantes de educación secundaria de Jauja, 2026

**Proyecto:** PIPRE — Plataforma Inteligente Para Robótica Educativa (módulo de simuladores gamificados Neon Flow y TetriLogic).

**Documento:** Documentación del Software (Frontend + Backend + Persistencia + Telemetría).

**Versión:** 1.0 — 2026

---

## Índice General

1. **Introducción y Resumen Ejecutivo**
   - 1.1 Propósito del Software
   - 1.2 Alineación con la Tesis
   - 1.3 Público Objetivo
   - 1.4 Alcance del Documento
   - 1.5 Resultados Esperados
2. **Arquitectura del Sistema**
   - 2.1 Visión General
   - 2.2 Frontend — SPA React
   - 2.3 Backend — Arquitectura Hexagonal Estricta
   - 2.4 Flujo de la Telemetría (Hexágono aplicado)
   - 2.5 Base de Datos — PostgreSQL
3. **Módulos y Componentes Principales**
   - 3.1 Módulo de Autenticación y Cursos
   - 3.2 Módulo de Simulación 1 — Neon Flow (Lógica Proposicional)
   - 3.3 Módulo de Simulación 2 — TetriLogic (Razonamiento Espacial)
   - 3.4 Módulo de Docentes y Analítica
4. **Flujo de Navegación del Usuario (User Journey)**
   - 4.1 Recorrido Principal del Estudiante
   - 4.2 Ciclo de Vida de un Intento (Telemetría)
   - 4.3 Procesamiento en el Backend
   - 4.4 Flujo del Docente
5. **Atributos de Calidad y No Funcionales**
   - 5.1 Rendimiento y Concurrencia
   - 5.2 Mantenibilidad y Escalabilidad
   - 5.3 Seguridad
   - 5.4 Fiabilidad de Datos
6. **Guía de Despliegue y Ejecución Local**
   - 6.1 Requisitos Previos
   - 6.2 Ejecución Local del Backend
   - 6.3 Ejecución Local del Frontend
   - 6.4 Credenciales de Prueba (Seedeo)
   - 6.5 Despliegue con Docker Compose
   - 6.6 Verificación de Sanidad

---

# 1. Introducción y Resumen Ejecutivo

## 1.1 Propósito del Software

El presente módulo de software constituye la base operativa de la investigación titulada
**"Uso de Simulador web gamificado con retroalimentación basada en IA para fortalecer
pensamiento lógico en estudiantes de educación secundaria de Jauja, 2026"**.

El sistema materializa dos simuladores web gamificados que ejercitan habilidades cognitivas
específicas, medibles mediante telemetría automática:

- **Neon Flow** (Curso 1, `c001`): fortalece la **lógica proposicional y condicional**
  mediante la manipulación de componentes ópticos (espejos y filtros de color) para guiar
  un haz láser desde un emisor hasta receptores codificados por color.
- **TetriLogic** (Curso 2, `c002`): fortalece el **razonamiento espacial, el reconocimiento
  de patrones y la planificación** mediante la colocación y rotación de Tetriminos en
  tableros sujetos a restricciones de conteo por filas y columnas.

La retroalimentación basada en IA se materializa en un asistente contextual que sugiere
correcciones durante la resolución de retos, registrando además cada solicitud de ayuda
como métrica de análisis (`pistasIa`).

## 1.2 Alineación con la Tesis

| Elemento de la tesis | Implementación en el software |
|----------------------|-------------------------------|
| Pensamiento lógico | Motores de reglas: raycasting óptico (Neon Flow) y validación espacial (TetriLogic) |
| Simulador web gamificado | Progresión de niveles, victoria/derrota, selector de niveles y estado de curso completado |
| Retroalimentación basada en IA | Toast de asistente IA en pista y endpoint de métricas preparado para modelos de IA |
| Medición del impacto | Telemetría por intento: tiempo de resolución, movimientos, reinicios y pistas utilizadas |

## 1.3 Público Objetivo

- **Estudiantes de educación secundaria (Jauja):** usuarios principales que resuelven retos
  progresivos y reciben retroalimentación inmediata.
- **Docentes administradores:** gestionan cursos y retos, consultan analítica de desempeño,
  rankings y señales de riesgo académico derivadas de las métricas recolectadas.

## 1.4 Alcance del Documento

Este documento describe de manera técnica y funcional:

1. La arquitectura de capas del frontend (React/Zustand) y del backend (Arquitectura Hexagonal en Spring Boot).
2. Los módulos funcionales que componen cada simulador.
3. El flujo de navegación completo del usuario y el ciclo de vida de un intento.
4. Los atributos de calidad no funcionales y los mecanismos de seguridad.
5. Las instrucciones de despliegue y ejecución local del sistema completo.

## 1.5 Resultados Esperados

- Recolección íntegra y confiable de métricas por intento (telemetría).
- Disponibilidad de datos poblados para el panel docente, el ranking y los modelos de IA.
- Experiencia de usuario fluida, sin bloqueos, con retroalimentación pedagógica inmediata.

---

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

---

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

---

# 4. Flujo de Navegación del Usuario (User Journey)

## 4.1 Recorrido Principal del Estudiante

```
┌───────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│   Login   │───▶│  Selección de Curso  │───▶│  /simulador/:courseId │
└───────────┘    │  (PaginaInicio)      │    └──────────┬───────────┘
                 └──────────────────────┘               │
                 ┌──────────────────────────────────────▼──────────────────────────────────────┐
                 │                     Stage (NeonFlow | TetriLogic)                            │
                 │  startGame() → cronómetro + contadores en cero (estado PLAYING)             │
                 │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                        │
                 │  │ Arrastrar/  │   │  Rotar      │   │  Pista IA   │                        │
                 │  │ colocar     │   │  (click der)│   │ (toast +    │                        │
                 │  │ → register  │   │  → register │   │  pistasIa++)│                        │
                 │  │  Move()     │   │  Move()     │   └─────────────┘                        │
                 │  └─────────────┘   └─────────────┘                                          │
                 │  ┌─────────────────────────────────────────────┐                            │
                 │  │ Comprobar → validación del reto             │                            │
                 │  │  (raycast | restricciones fila/columna)     │                            │
                 │  └────────────────────────┬────────────────────┘                            │
                 └───────────────────────────┼─────────────────────────────────────────────────┘
                                             │
                        ┌────────────────────┴────────────────────┐
                        │            ¿Reto resuelto?              │
                        └───┬─────────────────────────────┬───────┘
                            │ Sí                          │ No
                 ┌──────────▼──────────┐                 │ (continúa jugando)
                 │ completeGame(SUCCESS)│                 │
                 │  → snapshot intento  │                 │
                 │  → syncTelemetry()   │                 │
                 └──────────┬──────────┘                 │
                            │
              ┌─────────────┴──────────────┐
              │ ¿Último nivel del curso?    │
              └──┬───────────────────────┬─┘
                 │ No                    │ Sí
        ┌────────▼─────────┐   ┌─────────▼──────────────┐
        │ Banner "Nivel    │   │ Banner "¡Curso         │
        │ completado" +    │   │ Completado!" +         │
        │ "Siguiente Nivel"│   │ "Volver a mis cursos"  │
        │ → startGame()    │   └────────────────────────┘
        └──────────────────┘
```

## 4.2 Ciclo de Vida de un Intento (Telemetría)

1. **Inicio:** al montar el Stage se ejecuta `startGame(game)`; el store reinicia contadores
   y arranca el cronómetro de 1 s fuera del ciclo de renderizado.
2. **Interacción:** cada colocación válida o rotación invoca `registerMove()`; cada pista
   invoca `requestHint()`; cada reinicio invoca `resetGame()` (incrementa `reinicios`).
3. **Cierre:** `completeGame(result)` detiene el cronómetro, construye el objeto
   `AttemptMetrics` con `studentId` obtenido del estado de autenticación y lo agrega al
   historial local (`attempts[]`).
4. **Sincronización:** `syncTelemetry(attempt)` realiza un `fetch POST /api/v1/telemetry`
   con el JWT (cabecera `Authorization: Bearer` y cookie). Cualquier fallo de red o HTTP
   se captura y registra sin interrumpir la interfaz (fire-and-forget).

## 4.3 Procesamiento en el Backend

1. `TelemetryController` valida el payload (`jakarta.validation`) y responde `201 Created`.
2. `SaveAttemptService` aplica reglas de dominio (no negativos, formato de fecha ISO-8601)
   y delega en el puerto de salida.
3. `TelemetryPersistenceAdapter` persiste el registro en `telemetry_attempts`.
4. Los datos quedan disponibles para el panel docente, el ranking y los modelos de IA.

## 4.4 Flujo del Docente

- Inicia sesión con rol `TEACHER` y accede al dashboard (`/docente/*`).
- Consulta métricas, retos, estudiantes y ranking poblados por el seedeo oficial.
- Crea retos seleccionando el entorno `neonflow` o `tetrilogic` en el formulario de retos.

---

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

---

# 6. Guía de Despliegue y Ejecución Local

## 6.1 Requisitos Previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js + pnpm | Node 20+, pnpm 11 |
| JDK | 21 |
| Maven (wrapper incluido) | 3.9+ |
| PostgreSQL | 16 |
| Docker (opcional) | 24+ |

## 6.2 Ejecución Local del Backend

```powershell
# 1. Base de datos PostgreSQL disponible (local o vía Docker):
docker compose up -d postgres

# 2. Variables de entorno requeridas (application.yaml):
#    DATABASE_URL=jdbc:postgresql://localhost:5432/pipre_database
#    POSTGRES_USER=pipre_user
#    POSTGRES_PASSWORD=pipre_password
#    JWT_SECRET=clave_secreta_segura_desarrollo_muy_larga_para_pipre

# 3. Compilar y ejecutar:
cd backend
.\mvnw.cmd spring-boot:run
```

- El backend queda disponible en `http://localhost:8080`.
- Flyway aplica automáticamente las migraciones `V1`–`V12` y el seedeo oficial crea los
  cursos `c001` (Neon Flow) y `c002` (TetriLogic).
- Documentación OpenAPI/Scalar: `http://localhost:8080/scalar`.

## 6.3 Ejecución Local del Frontend

```powershell
cd frontend
pnpm install
pnpm dev
```

- La aplicación queda disponible en `http://localhost:5173`.
- El proxy de Vite redirige `/api/v1` al backend local (`VITE_USE_LOCAL_BACKEND=true` →
  `http://localhost:8080`, sin doble prefijo) o al backend remoto según configuración.

## 6.4 Credenciales de Prueba (Seedeo)

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | `admin@pipre.com` | `123` |
| Docente | `docente@pipre.com` | `123` |
| Estudiante | `alumno@pipre.com` | `123` |

## 6.5 Despliegue con Docker Compose

```powershell
# En la raíz del repositorio:
docker compose up -d --build
```

Servicios levantados:

| Servicio | Contenedor | Puerto |
|----------|------------|--------|
| PostgreSQL 16 | `pipre-database` | 5432 |
| API de IA (FastAPI) | `pipre-ml-ia` | 8000 |
| Backend Spring Boot | `pipre-backend` | 8080 |
| Frontend (Vite) | `pipre-frontend` | 5173 |

## 6.6 Verificación de Sanidad

```powershell
# Frontend
cd frontend
pnpm tsc -b

# Backend
cd backend
.\mvnw.cmd compile
```

Flujo de validación manual sugerido: iniciar sesión como estudiante → seleccionar
`Neon Flow` (c001) o `TetriLogic` (c002) → resolver el reto usando pistas y reinicios →
verificar el banner de éxito y el registro en la tabla `telemetry_attempts`.
