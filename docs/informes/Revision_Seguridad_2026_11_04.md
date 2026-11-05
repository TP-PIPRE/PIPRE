# Revisión de seguridad — 04/11/2026

Informe de esta ejecución sobre `554cf0f`, rama local `Feature/niveles`. No incluye commit, push, despliegue ni cambios de datos de producción.

## Diagnóstico y trazabilidad

El frontend usa React 19, Vite 8, TypeScript 5 y pnpm; el backend usa Java 21, Maven, Spring Boot 3.5, Spring Security 6.5, Tomcat 10.1 y PostgreSQL. Se revisaron los manifiestos, lockfile, workspace pnpm, Dockerfiles frontend/backend, Compose, Jenkinsfile y las instrucciones vigentes. `data-science`, su imagen, modelos y endpoints permanecen excluidos por `AGENTS.md`.

Las **26 alertas históricas** (0 críticas, 13 altas, 11 moderadas, 2 bajas) están registradas en el [informe del 02/11](Actualizacion_Dependencias_Pnpm_2026_11_02.md). Su corrección ya forma parte del commit `3ca68d4` y de la rama predeterminada remota `develop`, cuyo HEAD consultado en GitHub fue `554cf0f3adae84be77f13b61caa9b03803a6d31d`, merge del [PR #72](https://github.com/TP-PIPRE/PIPRE/pull/72). El informe anterior describía correctamente su estado al redactarse, pero ya no representa el estado de publicación actual.

El conector GitHub disponible permite consultar ramas y archivos, pero no expone el endpoint privado de alertas Dependabot. No se certifica el contador remoto actual ni se inventa una correspondencia entre 26 números de alerta y GHSA. La auditoría pnpm actual verifica el lockfile integrado y devuelve **cero avisos en todas las gravedades**, sin exclusiones.

Para conservar trazabilidad se volvió a auditar una copia aislada del lockfile de `9384639`, anterior a la corrección, sin instalar sus paquetes: **159 entradas**, 152 GHSA distintos, 1 crítica, 69 altas, 76 moderadas y 13 bajas. Este inventario de auditoría completa tiene otra unidad de conteo y **no equivale a las 26 alertas de GitHub**. El [CSV histórico frontend](Seguridad_Frontend_Historico_2026_11_04.csv) incluye cada entrada, gravedad, paquete, versión, rango corregido, rutas transitivas y fuente. El árbol vigente no requiere otra actualización frontend.

La revisión adicional del árbol Maven resuelto contrastó **122 coordenadas/versiones** con la API OSV, incluidos los paquetes de prueba. Encontró **68 GHSA distintos: 10 críticos, 23 altos, 28 moderados y 7 bajos**. Son hallazgos adicionales del backend, no las alertas originales del lockfile. La gravedad corresponde a `database_specific.severity` de OSV; no acredita explotabilidad de todas las funciones en PIPRE. El [CSV Maven](Seguridad_Maven_2026_11_04.csv) registra cada GHSA, gravedad de esa fuente, dependencia, versión anterior/final y resultado de la segunda consulta.

## Corrección controlada e impacto

Se conservan las líneas mayores y menores actuales de los componentes afectados. El POM utiliza el parche Spring Boot **3.5.16**, último 3.5 publicado en Maven Central, y sus versiones coordinadas de Spring Framework **6.2.19**, Spring Security **6.5.11**, Spring Data Commons **3.5.13** y Logback **1.5.34**. No se fuerza Spring Framework 7 sobre Boot 3.

El BOM 3.5.16 aún incorpora algunas versiones afectadas. Se fijan únicamente estas propiedades de seguridad, manteniendo alineadas las familias mediante sus BOM:

| Propiedad | Antes de esta revisión | Versión corregida | Impacto a validar |
|---|---|---|---|
| `jackson-bom.version` | 2.21.2 | 2.21.7 | Serialización JSON, contratos HTTP, JWT y replay de partidas |
| `tomcat.version` | 10.1.53 | 10.1.59 | HTTP embebido, rutas y controles de acceso |
| `postgresql.version` | 42.7.10 | 42.7.12 | Driver JDBC; conserva protocolo y configuración |
| `log4j2.version` | 2.24.3 | 2.25.5 | Minor compatible de la API/puente de logging, necesario para el aviso detectado |
| `commons-lang3.version` | 3.17.0 | 3.18.0 | Minor compatible para la dependencia transitiva de Datafaker |

No se elimina ninguna dependencia directa, no se cambian rutas, controladores, autenticación, reglas de juegos, entidades, SQL, configuración CSRF/CORS ni lógica de negocio. Las migraciones V1–V19 y `data-science` se conservan. No se añadieron reglas para ignorar avisos ni se alteraron umbrales.

La segunda consulta OSV revisó **121 coordenadas/versiones y devolvió sólo los dos avisos residuales** descritos abajo: **66 de los 68 GHSA iniciales dejan de afectar al árbol** (8 críticos, 23 altos, 28 moderados y 7 bajos). La diferencia de tamaño del árbol se debe a que el driver PostgreSQL corregido ya no arrastra `checker-qual`; no se añadió ninguna exclusión Maven ni se retiraron dependencias directas.

## Avisos pendientes y condiciones de exposición

Dos avisos de Spring MVC necesitan una decisión de mantenimiento fuera de los parches abiertos compatibles de Boot 3.5. No se ocultan ni se consideran corregidos:

| GHSA / CVE | Gravedad OSV / fabricante | Condición requerida | Evidencia del código actual |
|---|---|---|---|
| `GHSA-j9f9-w8pj-32f8` / CVE-2026-47890 | CRITICAL / LOW | Vistas fragmentadas enviadas por SSE, con datos del atacante | Sin referencias a `SseEmitter`, `ServerSentEvent`, `FragmentsRendering` ni `text/event-stream` en `backend/src` |
| `GHSA-pc63-qcmh-9cmg` / CVE-2026-47884 | CRITICAL / MEDIUM | `XsltView`, mapping `/**` que renderiza vistas y nombre de vista implícito | Sin `XsltView`, resolutores de vistas XSLT ni plantillas `.xsl` en `backend/src`; controladores REST |

La revisión estática no identifica las condiciones de exposición de esos dos avisos en el proyecto actual. Esto **no elimina los avisos de la dependencia** ni garantiza que futuras funciones no las incorporen. No se incluyeron en una lista de ignorados.

El fabricante publica [6.2.20 sólo mediante soporte empresarial y 7.0.9 como OSS para SSE](https://spring.io/security/cve-2026-47890/) y las [mismas opciones para XsltView](https://spring.io/security/cve-2026-47884/). Para eliminarlos del árbol hay que disponer del repositorio/licencia del parche empresarial o planificar y validar Boot 4 / Framework 7. Adoptar Framework 7 aisladamente rompería la alineación de Boot 3.5. No se realizó ese salto mayor en esta corrección orientada a estabilidad.

## Validación

| Comprobación de esta ejecución | Resultado |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | Correcto, lockfile intacto; no se descargó el navegador Cypress |
| `pnpm audit --json`, antes y después de la revisión | 0 críticas/altas/moderadas/bajas/info, sin exclusiones |
| `pnpm test:run` | 335/335, 29 archivos |
| `pnpm build` | TypeScript y Vite correctos; conserva aviso de chunk mayor de 500 kB |
| `pnpm lint` | 25 errores y 2 advertencias previos, mismo resultado documentado el 02/11; no se desactivaron reglas |
| Maven `test` antes del cambio del POM | 246/246, 48 suites XML, sin fallos, errores ni omisiones |
| Maven `test dependency:tree` después del cambio | 246/246, 48 suites XML, sin fallos, errores ni omisiones; BUILD SUCCESS |
| Maven `package -DskipTests`, tras aprobar la suite completa | JAR ejecutable empaquetado con Spring Boot 3.5.16; BUILD SUCCESS |
| API OSV sobre árbol Maven antes/después | 122 coordenadas/68 GHSA → 121 coordenadas/2 GHSA pendientes |
| Conservación de archivos protegidos | `git diff --quiet -- data-science backend/src/main/resources/db/migration frontend/pnpm-lock.yaml` devuelve 0 |
| Integridad del diff | `git diff --check` correcto |

Frontend se ejecutó con Node **24.22.1** y pnpm **11.25.0** disponibles en este equipo; no se cambió la versión **11.7.0** fijada en `packageManager`, ni el lockfile. La instalación fue congelada. La suite frontend verifica el árbol ya corregido por el lote anterior; en esta revisión no hubo cambios frontend que requirieran otra ejecución posterior idéntica.

Maven se ejecutó con Java 21 y Maven 3.9.12 mediante `maven:3.9.12-eclipse-temurin-21-alpine`, igual al builder del Dockerfile, con un volumen de caché separado `pipre-security-m2`. El comando base, desde la carpeta backend en PowerShell, fue:

```powershell
docker run --rm --mount type=bind,source=C:\PIPRE,target=/workspace --mount type=volume,source=pipre-security-m2,target=/root/.m2 -w /workspace/backend maven:3.9.12-eclipse-temurin-21-alpine mvn -B -ntp test dependency:tree '-DoutputType=json' '-DoutputFile=target/security-dependency-tree.json'
```

El primer intento de la línea base montó únicamente `backend` y devolvió un error al buscar `frontend/tests/fixtures/neonFlowSolutions.json`. Se corrigió el montaje, sin editar pruebas ni aplicación, y se repitió la suite completa antes del cambio del POM. Los dos resultados completos de 246 pruebas corresponden al montaje correcto. Incluyen las 60 soluciones oficiales, sesiones verificadas, progreso/logros, permisos, contratos HTTP y migraciones en H2.

La consulta OSV usa `POST https://api.osv.dev/v1/querybatch`, con una entrada `{ "package": { "ecosystem": "Maven", "name": "groupId:artifactId" }, "version": "version-resuelta" }` por coordenada única del JSON de `dependency:tree`, recorriendo todos sus hijos. Se verificó que la respuesta tuviera la misma cantidad de entradas y se descargó cada detalle con `GET /v1/vulns/{GHSA}`. No se filtraron avisos por gravedad ni se excluyeron los pendientes.

## Alcance de la evidencia

La auditoría comprueba paquetes y versiones conocidos por los registros consultados en esta fecha. No incluye un análisis de las imágenes base, del `serve` global instalado por el Dockerfile frontend, un pentest ni una certificación integral de seguridad. La configuración CSRF/CORS y las cuentas de demostración requieren su propio análisis antes de exposición pública; no se modificaron para intentar cerrar avisos de dependencias.

No se ejecutaron pruebas de navegador/Cypress, PostgreSQL real ni un despliegue. Los tests backend usan las bases H2 aisladas definidas por la suite; no se conecta la base de la aplicación en ejecución. Los artefactos de trabajo y logs quedan en `backend/target/`, ignorado por Git. Los CSV versionables conservan el inventario sin credenciales ni datos personales.
