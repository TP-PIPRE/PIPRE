# Inventario de correcciones pendientes del proyecto PIPRE

Fecha de revisión: 22 de julio de 2026  
Rama revisada: `feature/ml-ia`  
Commit base de la revisión: `ab561f0` (`Merge origin/develop into feature/ml-ia`)

## Objetivo y alcance

Este documento organiza las correcciones pendientes o preexistentes detectadas en frontend, backend, data-science, Docker y flujo de entrega. El inventario se basa en ejecución de checks locales, inspección de contratos y configuración actual. No sustituye pruebas integrales en un entorno desplegado.

Escala de prioridad:

- **P0 - Bloqueante:** impide una función principal, expone un riesgo alto de seguridad o invalida la integración.
- **P1 - Alta:** afecta calidad, confiabilidad o mantenimiento y debe resolverse antes de una entrega estable.
- **P2 - Media:** deuda técnica o de observabilidad que no bloquea el flujo principal.
- **P3 - Baja:** optimización, limpieza o mejora de experiencia de desarrollo.

## Estado verificado

| Área | Check ejecutado | Resultado actual |
|---|---|---|
| Git | Estado y marcadores de conflicto | Árbol limpio al iniciar esta revisión; merge finalizado en `ab561f0`. |
| Frontend | `pnpm build` | Correcto. Genera el bundle de producción. |
| Frontend | `pnpm test:run` | 16/16 pruebas unitarias aprobadas. |
| Frontend | ESLint | Falla: 52 errores y 9 advertencias en 29 archivos. |
| Frontend | `pnpm audit --prod` | Falla: 44 vulnerabilidades, 21 altas, 18 moderadas y 5 bajas. |
| Frontend | Cypress E2E | No ejecutado; requiere aplicación y APIs disponibles. |
| Backend | Lectura de `pom.xml` | XML válido, Java 21, 32 archivos de pruebas. |
| Backend | Compilación/pruebas Maven | No ejecutadas: no hay JDK/`JAVA_HOME` disponible y `mvnw.cmd` falla antes de iniciar Maven. |
| Data-science | `pytest` | 104/104 pruebas aprobadas, con 5 advertencias controladas de validación RIA01. |
| Data-science | `pip check` | Correcto, sin requisitos rotos. |
| Data-science | Auditoría CVE | No disponible: `pip-audit` no está instalado. |
| Docker Compose | Configuración base, local y base+override | Las tres combinaciones pasan `docker compose config --quiet`. |
| Docker runtime | Daemon, imágenes y contenedores | No verificado: Docker Desktop está detenido. |
| CI | `.github/workflows` | No existe ningún workflow automatizado. |

## Resumen ejecutivo de bloqueantes

| ID | Prioridad | Área | Problema | Impacto |
|---|---|---|---|---|
| IA-INT-01 | P0 | Frontend / RIA04 | El frontend llama `/ria04/difficulty`, pero data-science expone `/ria04/generate`. | RIA04 responde 404 y la tarjeta conserva la función anterior. |
| IA-INT-02 | P0 | Frontend / RIA08 | El frontend no envía `completed_activities` ni `help_requested`, ambos obligatorios. | RIA08 responde 422 y no presenta la alerta temprana completa. |
| SEC-01 | P0 | Backend / Auth | JWT en cookie con `SameSite=None` y CSRF deshabilitado. | Riesgo de solicitudes cross-site autenticadas si la API está expuesta. |
| SEC-02 | P0 | APIs | Backend admite cualquier origen con credenciales y ML admite CORS `*` sin autenticación. | Superficie pública excesiva y acceso directo al servicio de IA. |
| DEP-01 | P0 | Frontend | Auditoría con 21 vulnerabilidades altas. | Riesgo conocido en Vite, Axios, React Router y dependencias transitivas. |
| QA-BE-01 | P1 | Backend | No existe una compilación/prueba reproducible en el equipo actual ni en CI. | No puede demostrarse que los 32 archivos de pruebas estén aprobados. |
| QA-CI-01 | P1 | Proyecto | No hay pipeline de integración continua. | Los errores de lint, contratos y seguridad pueden llegar a `develop`. |
| ML-11-01 | P1 | Data-science / RIA11 | Precisión y exactitud reportadas alrededor de 30%, sin suite dedicada. | El resultado no es confiable para decisiones pedagógicas. |

## 1. Integración frontend y data-science

### IA-INT-01 - Reemplazar por completo el cliente anterior de RIA04

**Prioridad:** P0  
**Archivos principales:**

- `../frontend/src/infrastructure/api/aiEndpoints.ts`
- `../frontend/src/infrastructure/api/aiService.ts`
- `../frontend/src/infrastructure/api/models/aiModels.ts`
- `../frontend/src/ui/components/ria-bento-grid/cards/Ria04Card.tsx`
- `app/adapters/api/schemas.py`
- `app/adapters/api/main.py`

**Estado actual:**

- Frontend: `RIA04_DIFFICULTY = "/ria04/difficulty"`.
- Data-science: `POST /ria04/generate`.
- Frontend todavía envía métricas del estudiante para ajustar dificultad.
- El nuevo RIA04 requiere tema, objetivo, dificultad, bloques permitidos, restricciones, cantidad y semilla.

**Corrección propuesta:**

1. Renombrar tipos y métodos a `Ria04GenerateRequest`, `Ria04GenerateResponse` y `generateChallengesRia04`.
2. Cambiar el endpoint a `/ria04/generate`.
3. Sustituir la tarjeta de dificultad por el flujo docente del generador.
4. Construir el formulario indicado en `GUIA_FRONTEND_RIA04_GENERADOR.md`.
5. Mostrar los retos generados, restricciones, técnica y métricas operativas.
6. Añadir pruebas de contrato para respuesta exitosa y errores 422.

**Criterio de cierre:** el docente puede generar entre 1 y 5 borradores, revisarlos y enviarlos al flujo normal de creación sin recibir 404.

### IA-INT-02 - Actualizar RIA08 a riesgo y anomalías

**Prioridad:** P0  
**Archivos principales:**

- `../frontend/src/infrastructure/api/models/aiModels.ts`
- `../frontend/src/infrastructure/api/aiService.ts`
- `../frontend/src/ui/components/ria-bento-grid/cards/Ria08Card.tsx`
- `RIA08_RIESGO_ANOMALIAS_GUIA.md`

**Estado actual:**

- La tarjeta solo envía `attempts`, `errors`, `score` e `inactive_days`.
- La API exige además `completed_activities` y `help_requested`; `success_rate` es opcional.
- La vista sigue rotulada únicamente como “Anomalías”.
- No consume `/ria08/early-warning/batch` ni presenta la tabla docente completa.

**Corrección propuesta:**

1. Hacer coincidir el DTO TypeScript con `RIA08Input` de Pydantic.
2. Enviar los siete campos disponibles de `RiaStudentData` y los identificadores opcionales.
3. Tipar la respuesta real: `risk_level`, `risk_label`, `risk_score`, `anomaly`, `anomaly_score`, `reasons` y `teacher_recommendation`.
4. Renombrar la tarjeta a “Riesgo y anomalías”.
5. Implementar la consulta por lote y presentar la tabla docente definida en la guía.
6. Diferenciar claramente “rareza estadística” de “riesgo educativo”.

**Criterio de cierre:** las llamadas individual y por lote responden 200 y la UI muestra nivel, puntajes, razones y recomendación docente.

### IA-INT-03 - Completar la presentación de RIA10

**Prioridad:** P1  
**Archivo principal:** `../frontend/src/ui/components/ria-bento-grid/cards/Ria10Card.tsx`

**Estado actual:**

- La API ya devuelve comparación por grado y sugerencia docente.
- La tarjeta solo presenta perfil, riesgo y razones.
- Intenta leer `details.recall` y `details.f1`, campos que no forman parte de `RIA10Response`.
- El tipo `Ria10PedagogicalResponse` es genérico y no protege el contrato.

**Corrección propuesta:**

1. Crear tipos exactos para `grade_comparison` y `teacher_suggestion`.
2. Mostrar métricas del estudiante frente al promedio del grado.
3. Mostrar título, prioridad, resumen, acciones y periodo de revisión sugerido.
4. Usar `accuracy` y `precision` de la raíz o ampliar explícitamente la respuesta si se necesitan recall/F1.
5. Añadir pruebas de renderizado con grado sin cohorte, cohorte válida y sugerencia crítica.

### IA-INT-04 - Alinear tipos de RIA11 y validar el modelo

**Prioridad:** P1

**Estado actual:**

- La API devuelve `result`, `accuracy` y `precision`.
- El tipo TypeScript declara `clasificacion` y `tiempo_estimado`.
- La tarjeta usa el campo real `result`, por lo que el tipo y la ejecución se contradicen.
- No existe `test_ria11.py` y se ha reportado precisión/exactitud cercana al 30%.

**Corrección propuesta:**

1. Corregir `Ria11TimeResponse` para reflejar la respuesta real.
2. Crear una suite dedicada para preprocesamiento, clases, valores límite y API.
3. Separar train/test de forma estratificada y reportar matriz de confusión, macro-F1 y métricas por clase.
4. Revisar desbalance, etiquetas, variables redundantes y calidad del dataset.
5. No presentar porcentajes de calidad en producción hasta superar el umbral acordado con el docente experto.

### IA-INT-05 - Integrar RIA02 y consolidar contratos

**Prioridad:** P1

- Data-science expone `POST /ria02/feedback`, pero el cliente central del frontend no contiene endpoint ni método RIA02.
- Los contratos usan varios `Record<string, unknown>` y firmas abiertas que ocultan incompatibilidades.

**Corrección propuesta:** generar o validar los DTO desde OpenAPI y añadir pruebas de contrato frontend-FastAPI para todos los RIA.

### IA-INT-06 - Definir una única ruta de acceso a IA

**Prioridad:** P0

El frontend de producción llama directamente a `https://pipre-ml-ia.yoshua-cloud.dedyn.io/`. Debe decidirse una arquitectura:

- **Recomendada:** frontend → backend autenticado → servicio ML interno.
- **Alternativa:** API ML pública con autenticación propia, rate limiting, orígenes explícitos y trazabilidad por usuario.

No se debe mantener una API ML pública sin control de acceso.

## 2. Frontend

### FE-LINT-01 - Corregir los 61 hallazgos de ESLint

**Prioridad:** P1

Resumen por regla:

| Regla | Cantidad | Corrección esperada |
|---|---:|---|
| `react-hooks/set-state-in-effect` | 18 | Evitar inicializaciones síncronas encadenadas en efectos; derivar estado o mover la actualización al flujo asíncrono/evento. |
| `@typescript-eslint/no-explicit-any` | 17 | Definir DTO, interfaces y uniones discriminadas. |
| `no-case-declarations` | 6 | Encerrar cada `case` que declare variables entre llaves. |
| `no-empty` | 5 | Registrar el error, documentar el fallback o eliminar el `catch` vacío. |
| `react-hooks/exhaustive-deps` | 5 | Estabilizar callbacks con `useCallback` y declarar dependencias reales. |
| Directivas ESLint sin uso | 4 | Eliminar comentarios `eslint-disable` obsoletos. |
| `react-refresh/only-export-components` | 2 | Separar variantes/constantes de los archivos de componentes. |
| `react-hooks/refs` | 2 | No leer `ref.current` durante render; medir en layout/effect o recibir el valor como estado. |
| `@typescript-eslint/no-unused-vars` | 1 | Eliminar o utilizar la variable. |
| `react-hooks/purity` | 1 | Eliminar operaciones no deterministas del render. |

Archivos con mayor concentración:

| Archivo | Errores | Advertencias | Foco |
|---|---:|---:|---|
| `DocenteRetosPage.tsx` | 10 | 0 | Tipos `any` y callback no usado. |
| `RankingPage.tsx` | 8 | 1 | Efectos, dependencias y bloques vacíos. |
| `MissionMapView.tsx` | 4 | 0 | Estado en efectos y declaraciones en `case`. |
| `MissionCanvas.tsx` | 3 | 0 | Estado en efectos y declaraciones en `case`. |
| `DocenteDashboard.tsx` | 3 | 2 | `catch` vacíos y dependencias de hooks. |
| `RankingPage.test.tsx` | 3 | 0 | Mocks tipados con `any`. |
| `FloatingWorkspace.tsx` | 2 | 0 | Lectura de refs durante render. |
| `MathAnimationEngine.ts` | 2 | 0 | Tipos `any`. |
| `DocenteEstudiantesPage.tsx` | 2 | 0 | Tipo `any` y carga desde efecto. |
| `PerfilPage.tsx` | 2 | 0 | Tipo `any` y estado en efecto. |

También deben corregirse los efectos de las tarjetas RIA01, RIA03, RIA04, RIA08, RIA10 y RIA11, que repiten el mismo patrón de actualización síncrona.

### FE-TEST-01 - Ampliar pruebas y activar E2E

**Prioridad:** P1

- Las 16 pruebas unitarias actuales pasan, pero solo cubren tres archivos.
- Existen ocho especificaciones Cypress sin ejecución verificada.
- Faltan pruebas para cards RIA, autenticación con cookie real, dashboard docente, formularios y estados 401/403/422/500.

**Criterio de cierre:** unitarias y E2E ejecutadas automáticamente en CI con servicios efímeros o mocks contractuales.

### FE-DEP-01 - Corregir vulnerabilidades npm/pnpm

**Prioridad:** P0

Auditoría actual: 44 vulnerabilidades, sin críticas, pero con 21 altas.

| Paquete | Severidad máxima | Avisos | Objetivo mínimo global observado |
|---|---:|---:|---|
| `axios` | Alta | 18 | `>=1.18.0` |
| `undici` | Alta | 7 | `>=7.28.0` |
| `vite` | Alta | 5 | `>=8.0.16` para cubrir todos los avisos reportados |
| `react-router` | Alta | 3 | `>=7.15.1` |
| `brace-expansion` | Alta | 2 | `>=5.0.7` |
| `fast-uri` | Alta | 2 | `>=3.1.4` |
| `js-yaml` | Alta | 2 | `>=4.3.0` |
| `form-data` | Alta | 1 | `>=4.0.6` |
| `postcss` | Moderada | 1 | `>=8.5.10` |
| `@hono/node-server` | Moderada | 1 | `>=2.0.5` |

**Corrección propuesta:** actualizar primero dependencias directas, regenerar `pnpm-lock.yaml`, ejecutar build, pruebas, E2E y repetir `pnpm audit --prod`. Revisar cada dependencia transitiva restante antes de usar overrides.

### FE-PERF-01 - Reducir el bundle

**Prioridad:** P2

El build genera un bundle principal aproximado de 1.5 MB minificado y advierte chunks superiores a 500 kB. Mermaid se importa de forma dinámica y estática, anulando parte del code splitting.

Acciones:

1. Lazy-load de páginas, simulador 3D, Blockly, Mermaid y biblioteca.
2. Unificar la importación diferida de Mermaid.
3. Analizar bundle y separar vendor chunks.
4. Definir presupuesto de tamaño en CI.

### FE-MAINT-01 - Mantener un solo lockfile

**Prioridad:** P2

Existen `package-lock.json` y `pnpm-lock.yaml`, mientras Docker y `packageManager` usan pnpm. Eliminar el lockfile de npm si no existe un consumidor formal y documentar pnpm como gestor único.

### FE-AUTH-01 - Eliminar inferencia de rol por correo

**Prioridad:** P1

`AuthAdapter.ts` asigna `admin` o `docente` cuando el correo contiene esas palabras si el backend no devuelve rol. El frontend debe fallar de forma segura y aceptar únicamente el rol normalizado del backend. La autorización real debe seguir en backend.

También debe eliminarse la lógica que intenta leer o persistir el JWT `HttpOnly` desde JavaScript; el estado de sesión debe restaurarse mediante un endpoint autenticado como `/auth/me`.

## 3. Backend

### BE-BUILD-01 - Restaurar toolchain reproducible

**Prioridad:** P1

- El proyecto exige Java 21.
- El equipo actual no tiene `java` ni `JAVA_HOME` disponibles.
- `mvnw.cmd` falla en Windows al indexar `Target[0]` cuando `.m2` no es un enlace simbólico.

Acciones:

1. Instalar/documentar JDK 21.
2. Regenerar Maven Wrapper con una versión estable en lugar de mantener el script defectuoso.
3. Ejecutar `mvnw.cmd test` en Windows y `./mvnw test` en Linux.
4. Añadir el check a CI.

### BE-SEC-01 - Corregir CORS, cookies y CSRF

**Prioridad:** P0

Problemas actuales:

- `CorsConfig` acepta cualquier origen y habilita credenciales.
- La cookie de login usa `SameSite=None` y `Secure=true`.
- Spring Security deshabilita CSRF.
- Login y logout usan políticas `SameSite` distintas.

Acciones:

1. Cargar una lista explícita de orígenes por ambiente.
2. Si se conserva autenticación por cookie cross-site, implementar protección CSRF.
3. Usar políticas de cookie consistentes para login y logout.
4. Parametrizar `Secure`, dominio, duración y `SameSite` por ambiente.
5. Añadir pruebas de CORS, preflight, CSRF, expiración y logout.

### BE-HEALTH-01 - Añadir healthcheck real

**Prioridad:** P1

Security permite `/actuator/health`, pero `pom.xml` no declara Spring Boot Actuator y Compose no tiene healthcheck para backend.

Acciones:

1. Añadir Actuator o un endpoint de salud propio.
2. Separar liveness de readiness; readiness debe verificar base de datos y, si es requisito de arranque, conectividad ML.
3. Añadir healthcheck de backend en Compose.

### BE-TEST-01 - Ejecutar y endurecer pruebas

**Prioridad:** P1

Hay 32 archivos de prueba, pero no pudieron ejecutarse. Además, el Dockerfile compila con `-DskipTests`.

Acciones:

1. Hacer que CI ejecute todos los tests antes del build de imagen.
2. Evitar que la imagen sea el primer lugar donde se descubre un error de compilación.
3. Incorporar cobertura JaCoCo y umbral inicial acordado.
4. Añadir análisis estático, por ejemplo Checkstyle, SpotBugs o Sonar.
5. Añadir tests de integración con PostgreSQL/Testcontainers y migraciones Flyway.

### BE-DEP-01 - Auditar dependencias Maven

**Prioridad:** P1

No se ejecutó una auditoría de CVE para Maven. Incorporar OWASP Dependency-Check, Dependabot u otra herramienta equivalente y registrar excepciones con fecha de expiración.

## 4. Data-science

### DS-TEST-01 - Completar cobertura de RIA11 y RIA12

**Prioridad:** P1

La suite actual ya incluye 8 pruebas dedicadas a RIA02 para validación,
calibración, recurrencia, explicabilidad y contrato del servicio. Aún no
existen suites dedicadas para:

- RIA11 clasificación de tiempo.
- RIA12 evaluación/generación de código.

Cada suite debe cubrir preprocesamiento, valores límite, entrenamiento, persistencia, compatibilidad del modelo y endpoint HTTP.

### DS-QUALITY-01 - Gestionar advertencias de calidad RIA01

**Prioridad:** P2

Las pruebas generan advertencias por niveles lógicos desconocidos, escalas mixtas de `success_rate` y valores inválidos. Son casos probados, pero en producción deben convertirse en métricas observables y umbrales de rechazo o cuarentena de datos.

### DS-SEC-01 - Proteger FastAPI

**Prioridad:** P0

FastAPI permite `allow_origins=["*"]` y no se observa autenticación para endpoints RIA. Restringir orígenes y mantener el servicio en red privada detrás del backend o implementar autenticación/rate limiting propios.

### DS-DEP-01 - Añadir auditoría y calidad Python

**Prioridad:** P1

- `pip check` pasa.
- `pip-audit` no está instalado.
- No se observa configuración de Ruff, mypy ni cobertura.

Acciones:

1. Añadir `pip-audit` al flujo de CI.
2. Incorporar Ruff y un formateador.
3. Añadir mypy gradualmente en contratos y servicios.
4. Medir cobertura con `pytest-cov`.

### DS-MODEL-01 - Formalizar evaluación y ciclo de vida

**Prioridad:** P1

1. Versionar dataset, configuración, semilla y artefacto de cada RIA.
2. Separar métricas del modelo de métricas operativas.
3. Evitar presentar `anomaly_ratio` como calidad del modelo RIA08.
4. Mantener registro de cohorte de referencia y drift.
5. Establecer umbral de aceptación por RIA antes del despliegue.
6. Separar, cuando sea viable, entrenamiento y arranque de la API para reducir readiness prolongado.

## 5. Docker y despliegue

### DOCKER-01 - Validar imágenes y runtime real

**Prioridad:** P1

La sintaxis Compose es válida, pero Docker Desktop está detenido. Quedan pendientes:

1. Construir las tres imágenes desde cero.
2. Levantar PostgreSQL, ML, backend y frontend.
3. Confirmar healthchecks y orden de arranque.
4. Ejecutar smoke tests desde host y entre redes.
5. Revisar logs y reinicios.

### DOCKER-02 - Gestionar la red externa

**Prioridad:** P1

La configuración base exige `pipre-cloud-network` como red externa. El despliegue debe crearla previamente o gestionarla desde infraestructura. El override local la reemplaza correctamente por una red no externa.

### DOCKER-03 - No omitir pruebas en la imagen backend

**Prioridad:** P1

El Dockerfile ejecuta `mvn package -DskipTests`. Mantener el build rápido puede ser válido si CI ya aprobó las pruebas, pero actualmente no existe CI. Primero debe implementarse el gate de pruebas.

### DOCKER-04 - Añadir healthchecks faltantes

**Prioridad:** P2

PostgreSQL y ML tienen healthcheck. Backend y frontend no. Añadir:

- Backend: readiness HTTP.
- Frontend: respuesta HTTP del servidor estático.

### DOCKER-05 - Endurecer imágenes

**Prioridad:** P2

1. Ejecutar procesos con usuario no root.
2. Fijar la versión de `serve` o usar un servidor estático dedicado.
3. Revisar si `build-essential` puede quedar solo en una etapa de construcción para ML.
4. Añadir `.dockerignore` consistente en cada módulo.
5. Escanear imágenes con Trivy/Grype y generar SBOM.
6. No usar credenciales PostgreSQL predeterminadas en producción.

## 6. CI/CD, repositorio y observabilidad

### CI-01 - Crear pipeline mínimo

**Prioridad:** P1

No existe `.github/workflows`. El pipeline mínimo debe ejecutar:

1. Frontend: instalación con lockfile, lint, unit tests y build.
2. Backend: Java 21, tests y package.
3. Data-science: pytest, lint, tipos y auditoría.
4. Validación de los tres Compose.
5. Auditorías de dependencias e imágenes.
6. Pruebas de contrato/OpenAPI.

Las ramas protegidas no deberían aceptar merge si falla un check P0/P1.

### CI-02 - Añadir observabilidad

**Prioridad:** P2

- Logs estructurados con correlación frontend-backend-ML.
- Métricas de latencia, errores 4xx/5xx, readiness, predicciones y drift.
- No registrar JWT, contraseñas ni datos sensibles de estudiantes.
- Alertas para fallos reiterados de RIA y tasas anormales de 422/500.

### REPO-01 - Documentar flujo Git y entornos

**Prioridad:** P2

1. Definir estrategia de merge/rebase para evitar historiales duplicados.
2. Documentar variables requeridas y comandos local/producción.
3. Mantener `.env.example` sin secretos y validar variables al arrancar.
4. Añadir responsables por módulo y checklist de pull request.

## Orden recomendado de ejecución

### Fase 1 - Bloqueantes de integración y seguridad

- IA-INT-01, IA-INT-02 e IA-INT-06.
- SEC-01, SEC-02, BE-SEC-01 y DS-SEC-01.
- FE-DEP-01.

### Fase 2 - Baseline automatizado

- BE-BUILD-01 y BE-TEST-01.
- CI-01.
- DS-TEST-01, especialmente RIA11.
- Pruebas de contrato RIA.

### Fase 3 - Calidad funcional

- IA-INT-03, IA-INT-04 e IA-INT-05.
- FE-LINT-01 y FE-TEST-01.
- BE-HEALTH-01 y DOCKER-01.

### Fase 4 - Rendimiento y mantenimiento

- FE-PERF-01 y FE-MAINT-01.
- DOCKER-04 y DOCKER-05.
- Observabilidad, cobertura y ciclo de vida de modelos.

## Criterio global de “proyecto corregido”

El backlog puede considerarse cerrado cuando se cumpla todo lo siguiente:

- `pnpm lint`, `pnpm test:run` y `pnpm build` finalizan con código 0.
- Cypress E2E principal finaliza con código 0.
- Backend compila y sus pruebas finalizan con código 0 en Java 21.
- Las pruebas data-science, incluida cobertura de RIA02/RIA11/RIA12, finalizan con código 0.
- Los clientes RIA coinciden con OpenAPI y no producen 404/422 por contrato.
- No quedan vulnerabilidades altas conocidas sin excepción documentada.
- CORS, cookies, CSRF y acceso ML cumplen la arquitectura definida.
- Las imágenes se construyen, ejecutan sin root y alcanzan estado saludable.
- CI aplica estos checks antes de permitir merge.

## Comandos de verificación sugeridos

```powershell
# Frontend
cd frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm test:run
pnpm build
pnpm audit --prod

# Backend, con JDK 21 disponible
cd ../backend
.\mvnw.cmd test

# Data-science
cd ../data-science
.\venv\Scripts\python.exe -m pytest -p no:cacheprovider tests
.\venv\Scripts\python.exe -m pip check

# Docker
cd ..
docker compose -f docker-compose.yaml config --quiet
docker compose -f docker-compose.local.yaml config --quiet
docker compose -f docker-compose.yaml -f docker-compose.override.yaml config --quiet
docker compose -f docker-compose.yaml -f docker-compose.override.yaml build
docker compose -f docker-compose.yaml -f docker-compose.override.yaml up -d
docker compose -f docker-compose.yaml -f docker-compose.override.yaml ps
```
