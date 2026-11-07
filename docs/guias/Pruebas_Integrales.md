# Pruebas integrales de PIPRE

**Vigente: 06/11/2026.** Complementa [las pruebas del backend](../../backend/TESTING.md). Resultados y límites: [auditoría inicial](../informes/Auditoria_Integral_2026_11_06.md) y [resolución posterior](../informes/Implementacion_Pendientes_2026_11_06.md). Los comandos siguientes no requieren ni aceptan una base de datos de la aplicación.

## Prerrequisitos y suites

Docker Desktop en ejecución, PowerShell, Node compatible con el proyecto y pnpm. Instalar desde `frontend/` con `pnpm install --frozen-lockfile`; si Cypress no tiene binario, ejecutar `pnpm exec cypress install`. El runner Cypress ya era una dependencia del proyecto. `@vitest/coverage-v8` 4.1.12 es la única dependencia añadida en esta auditoría: permite medir el código con la misma versión de Vitest, sólo en desarrollo.

| Suite | Ubicación | Dependencias reales |
|---|---|---|
| Backend unitario/contrato | `backend/src/test/java/` | Java 21/Maven; dobles donde corresponda |
| Backend integración | Mismo árbol, etiqueta `integration` | Spring, repositorios y H2/Flyway |
| Backend PostgreSQL | `BackendPersistenceIntegrationTest` | PostgreSQL 16 desechable creado por su script |
| Frontend unitario/componentes | `frontend/tests/unit/` | Vitest, Testing Library, jsdom; adaptadores HTTP controlados |
| E2E de aplicación | `frontend/tests/e2e/application.cy.ts` | Navegador, frontend y backend reales, PostgreSQL desechable |
| E2E de contratos UI | Otros siete `*.cy.ts` y `ui-fixtures.ts` | Navegador real, respuestas HTTP explícitamente interceptadas |

Las pruebas de UI con fixtures comprueban estados y contratos; no sustituyen la integración real. No se arrancan modelos, proxy ni contenedor `data-science`, ni se llaman servicios externos de IA. Los testigos de solución de los tableros son datos locales del catálogo: el navegador coloca las piezas y el servidor valida las acciones.

## Verificación frontend

Desde `frontend/`:

```powershell
pnpm run test:run
pnpm run test:coverage
pnpm run build
pnpm run test:e2e:types
pnpm run lint
```

La cobertura incluye **todo `src/`**, también archivos sin ejecutar. `coverage/critical-summary.json` separa el total del conjunto crítico de 31 archivos: toda la capa `application/` y los adaptadores/estados de autenticación, autorización, API, sesiones, diario, colocación TetriLogic, ranking y rutas enumerados en `scripts/check-coverage.mjs`. El comando falla por debajo de 80 % de líneas **o ramas** agregadas de ese conjunto. No exige ni afirma 80 % global o individual en cada archivo. Los reportes HTML/LCOV completos permiten revisar las zonas con menor cobertura.

Se usan dos workers para cobertura y hasta cuatro para la suite normal. En un equipo con pocos recursos se puede ejecutar la suite completa con `pnpm exec vitest run --coverage --maxWorkers=1` y luego `node scripts/check-coverage.mjs`. No se aumenta el timeout de una prueba ni se deshabilitan casos. Una ejecución parcial con `--run archivo` sirve para diagnosticar, pero no sustituye la regresión completa.

## Aplicación completa aislada

Desde la raíz `C:\PIPRE`:

```powershell
./scripts/audit-environment.ps1 -Action Start
Push-Location frontend
try {
    pnpm run test:e2e:types
    if ($LASTEXITCODE -ne 0) { throw 'Tipos E2E incorrectos' }
    pnpm run test:e2e:run
    if ($LASTEXITCODE -ne 0) { throw 'Revisar los resultados E2E' }
} finally {
    Pop-Location
    ./scripts/audit-environment.ps1 -Action Stop
}
```

`Start` construye los Dockerfiles actuales, crea un proyecto Compose con UUID y publica exclusivamente `127.0.0.1:15183` (frontend) y `127.0.0.1:18183` (backend). PostgreSQL no tiene puerto del host ni volumen existente: usa tmpfs y credenciales de pruebas. El script rechaza puertos ocupados y un manifiesto previo. Si falla `Start`, ejecutar `Stop` para retirar sus recursos antes de reintentarlo.

El manifiesto privado `frontend/node_modules/.cache/pipre-audit/environment.json` registra la ejecución. Cypress exige sus URLs de prueba y comprueba la etiqueta de propiedad antes de consultar SQL o crear el único fixture de grupo. Los IDs que llegan a SQL se validan; no existe una tarea pública de SQL arbitrario. Los estudiantes y la actividad CRUD se crean mediante la API/UI real. Las cuentas docentes de arranque pertenecen sólo a esa base nueva.

`Stop` verifica UUID/etiquetas antes de retirar los contenedores y la red propios. No usar limpieza global de Docker. Si se cierra forzosamente el proceso, conservar el manifiesto y ejecutar `Stop`. La base de pruebas se pierde al retirar ese contenedor; nunca contiene datos de producción. Para repetir la suite se genera un estudiante nuevo; para garantizar independencia completa entre ejecuciones se recomienda `Stop` y `Start`.

Tras corregir código de frontend durante un diagnóstico, usar `./scripts/audit-environment.ps1 -Action RebuildFrontend` y esperar a que termine antes de relanzar Cypress. No editar los specs mientras se ejecutan. No lanzar dos Maven o dos Cypress sobre el mismo directorio de reportes a la vez.

## Evidencias

| Ruta generada | Contenido |
|---|---|
| `frontend/coverage/index.html` | Cobertura V8 completa |
| `frontend/coverage/critical-summary.json` | Cobertura total y crítica, archivos y denominadores |
| `frontend/test-results/e2e/latest-run.json` | Resultado completo de la última ejecución Cypress |
| `frontend/test-results/e2e/<UUID>/<timestamp>/results-*.xml` | JUnit por spec, sin sobrescribir ejecuciones anteriores |
| Mismo directorio, `browser-console.jsonl` | `console.warn/error` por prueba, conservando su salida original |
| `frontend/test-results/e2e/screenshots/` | Capturas responsivas y fallos; Cypress renueva esta carpeta al ejecutar |
| `backend/target/` | JUnit, JaCoCo, inventario API y resultados PostgreSQL descritos en `backend/TESTING.md` |

Los artefactos regenerables se ignoran en Git y ESLint; **el código de producción y las pruebas siguen incluidos en lint**. No usar excepciones globales, `.skip`, ocultación de errores de navegador ni supresión de vulnerabilidades para pasar la suite. El resultado vigente del lint está en el [informe de implementación](../informes/Implementacion_Pendientes_2026_11_06.md).

## Auditoría de dependencias

```powershell
# Desde frontend/; código 1 indica avisos, no una herramienta averiada.
pnpm audit --json
```

Desde la raíz, generar primero el inventario Maven resuelto (puede utilizarse Java/Maven local o el contenedor explicado en `backend/TESTING.md`):

```powershell
Push-Location backend
try {
    mvn -B -ntp dependency:list '-DoutputFile=target/full-audit-dependencies.txt'
    if ($LASTEXITCODE -ne 0) { throw 'Inventario Maven incompleto' }
} finally { Pop-Location }
python scripts/audit-dependencies.py
```

El script consulta OSV para coordenadas resueltas de todos los scopes y conserva los dos avisos encontrados, con su detalle. Una respuesta incompleta falla en lugar de declarar cero avisos. El script genera un informe; el número de avisos no modifica el código de salida y debe revisarse en el JSON. Requiere conexión a Internet, no acceso a GitHub ni credenciales. Este inventario no certifica el contador de Dependabot de la rama predeterminada ni analiza imágenes del sistema operativo.

Los scripts `verify_*` de checkpoints anteriores conservan sus expectativas históricas y no sustituyen estas suites vigentes. En particular, no reactivar desde ellos gestión docente global, scores declarados como autoridad o escrituras con cookie sin token CSRF.
