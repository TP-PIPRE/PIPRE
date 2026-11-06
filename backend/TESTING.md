# Pruebas del backend

Java 21, Maven 3.9 y Docker para la comprobación adicional con PostgreSQL. Las pruebas normales usan H2 en memoria con Flyway y datos controlados; no requieren la base de la aplicación. No establecer URLs ni credenciales de una base real para ejecutar pruebas.

## Organización

```text
src/test/java/com/pipre/backend/
├── unit/                 Regresiones aisladas: errores HTTP, cálculos, idempotencia
├── integration/          HTTP + servicios + repositorios + transacciones reales
├── application/useCases/ Pruebas previas de servicios y generador
├── domain/entities/      Reglas de tableros y logros
├── adapters/in/web/      Contratos web previos
└── infrastructure/       Configuración y compatibilidad de migraciones/catálogo
```

Se conserva la ubicación de las pruebas anteriores. Las que arrancan un contexto Spring con persistencia llevan `@Tag("integration")`; las demás se ejecutan como pruebas unitarias o de contrato aislado, incluidas las que usan MockMvc con dobles. La integración nueva crea sus propios estudiantes/cursos/grupos y los elimina sólo dentro de la base desechable. Las pruebas históricas siguen utilizando sus fixtures en sus respectivas bases H2.

## Ejecución con Java y Maven locales

Desde `backend/`:

```powershell
mvn -B -ntp -Punit test
mvn -B -ntp -Pintegration test
mvn -B -ntp clean verify
python scripts/coverage-summary.py
```

`test` ejecuta la categoría elegida; sin perfil se ejecutan ambas. `verify` genera el informe completo de cobertura JaCoCo y exige al menos 80 % de líneas en cada una de las 12 clases críticas enumeradas en el POM y en el resumen. Ejecutar la cobertura de aceptación con toda la suite, sin `-Dtest`, sin perfil y sin saltar pruebas. `clean` elimina sólo los artefactos Maven de `target/`.

## Ejecución sin instalar Java/Maven en Windows

Desde la raíz del repositorio, en PowerShell:

```powershell
$repoPath = (Resolve-Path '.').Path
docker run --rm --mount "type=bind,source=$repoPath,target=/workspace" --mount type=volume,source=pipre-security-m2,target=/root/.m2 -w /workspace/backend maven:3.9.12-eclipse-temurin-21-alpine mvn -B -ntp clean verify
```

Para una categoría sustituir `clean verify` por `-Punit test` o `-Pintegration test`. El volumen `pipre-security-m2` sólo almacena dependencias Maven. No se monta un volumen PostgreSQL ni se conecta a la red de la aplicación.

## PostgreSQL desechable

Desde la raíz:

```powershell
./backend/scripts/test-postgres.ps1 *> backend/target/backend-audit-postgres.log
if ($LASTEXITCODE -ne 0) { throw 'Revisar el resultado de PostgreSQL' }
```

El script termina con error si falla Docker/Maven. PowerShell también muestra la excepción al invocarlo directamente. Ejecutar después de la suite completa para conservar sus reportes; no ejecutar dos Maven simultáneos sobre el mismo `target/`.

El script crea una red y un PostgreSQL 16 nuevos con identificadores aleatorios y etiquetas propias, sin puerto publicado ni volumen de datos existente. Sólo la integración `BackendPersistenceIntegrationTest` usa el alias fijo `audit-db` y la base `pipre_audit`; no acepta una URL arbitraria por variable de entorno. Las credenciales constantes del script son exclusivamente del contenedor desechable. Flyway aplica las migraciones intactas en esa base vacía.

Un `finally` comprueba las etiquetas antes de retirar los contenedores y la red de esa ejecución. No detiene ni reinicia los servicios locales, no limpia otras bases y no usa `docker compose down`. Si se interrumpe forzosamente el proceso, identificar los recursos huérfanos por `pipre.audit.run` antes de retirarlos; nunca hacer limpieza global de Docker.

## Reportes y alcance

| Archivo generado | Contenido |
|---|---|
| `target/surefire-reports/` | Resultado JUnit XML/texto de la suite normal |
| `target/surefire-postgres/` | Resultado separado de la integración PostgreSQL |
| `target/site/jacoco/index.html` | Reporte navegable de todas las clases de producción |
| `target/site/jacoco/jacoco.xml` | Cobertura para herramientas de CI |
| `target/coverage-summary.json` | Resumen global, por paquete y por clase crítica |
| `target/api-contract-inventory.json` | Rutas/métodos y expresiones de autorización registradas realmente por Spring |
| `target/jacoco-postgres.exec` | Cobertura de la integración PostgreSQL, separada del reporte general |

El reporte JaCoCo no excluye DTO, entidades, infraestructura ni clases con baja cobertura. El resumen crítico enumera explícitamente reglas de tableros/logros, sesiones, gamificación, generación/selección diaria, progreso, resultados, cálculo de simulaciones y asignación/retirada de grupos. El filtro de clases sólo se aplica al umbral de aceptación, no al reporte completo. El porcentaje crítico no debe presentarse como cobertura global ni como prueba de todas las ramas.

Si se necesita conservar reportes separados de ejecuciones seleccionadas, usar `-Dtest.reportsDirectory=target/surefire-unit` y `-Djacoco.destFile=target/jacoco-unit.exec` (o nombres equivalentes para integración). Una ejecución parcial no sustituye la cobertura de la suite completa.

Las pruebas de medianoche usan un reloj controlado en `America/Lima`; no modifican el reloj del host. Los catálogos y soluciones se comprueban con las reglas reales. Las pruebas no invocan servicios externos de IA, no arrancan `data-science` y no calculan progreso académico a partir de telemetría.

No hay Checkstyle/PMD/SpotBugs configurados actualmente en Maven. `verify` comprueba compilación Java, procesamiento de anotaciones, pruebas y empaquetado; no debe describirse como una ejecución de esos analizadores. Las advertencias existentes y la cobertura insuficiente se registran en el [informe](../docs/informes/Auditoria_Backend_2026_11_05.md) y los [pendientes](../docs/guias/Pendientes_Implementacion_Backend.md).
