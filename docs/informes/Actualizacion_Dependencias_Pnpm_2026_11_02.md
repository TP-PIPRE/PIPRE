# Corrección de dependencias con pnpm — 02/11/2026

**Validada localmente y preparada para revisión.** Rama `codex/seguridad-dependencias-pnpm`, creada desde `9384639`; sin commit, push ni integración en `develop`. [Preparación del PR](PR_Dependencias_Pnpm.md) · [Estado del proyecto](../ESTADO_ACTUAL.md).

## Problema y alcance

El push de los logros terminó correctamente. GitHub informó 26 alertas abiertas en la rama predeterminada `develop`: 13 altas, 11 moderadas y 2 bajas, todas sobre `frontend/pnpm-lock.yaml`. Eran anteriores al avance de logros. La auditoría completa del árbol pnpm encontró además 159 entradas de advisory, correspondientes a 152 GHSA distintos; esas cantidades no equivalen al número de paquetes ni se suman al contador de GitHub.

También había dos lockfiles con versiones distintas. Docker instalaba con pnpm, mientras que una instalación npm podía producir otro árbol. El objetivo de este lote es corregir las dependencias, mantener las funciones actuales y hacer reproducible la instalación del frontend. No es una auditoría del backend o de las imágenes base.

## Cambios

| Recurso | Antes | Después |
|---|---|---|
| Gestor | pnpm declarado, con lockfile npm alternativo | pnpm 11.7.0 mediante Corepack y sólo `pnpm-lock.yaml` |
| Vite | 8.0.3 | 8.3.5 |
| Axios | 1.15.1 | 1.21.0 |
| React Router DOM | 7.14.1 | 7.18.5 |
| React / React DOM | 19.2.4 | 19.3.1 |
| Tailwind / plugin Vite | 4.2.2 | 4.3.3 |
| Vitest | 4.1.8 | 4.1.12 |
| ESLint / @eslint/js | 9.39.4 | 10.14.0 / 10.0.1 |
| CLI shadcn | Dependencia permanente sólo para importar CSS | Retirada; variantes y utilidades CSS conservadas localmente |
| minimatch | Versiones 3/10 vulnerables en herramientas | ESLint actualizado y override acotado de v10 a `^11.0.1` |
| Jest DOM | 6.9.1 | `~6.9.1`, evitando el minor 6.10.0 retirado por cambios incompatibles |

Las demás actualizaciones ordinarias respetan sus versiones mayores. El salto de ESLint elimina la cadena antigua que consumía la API invocable de minimatch 3. El override sólo alcanza minimatch 10, cuya API con exportaciones nombradas usan las herramientas actuales; no fuerza consumidores antiguos a una API incompatible. Se ejercitó ejecutando el análisis sobre los 151 archivos del frontend. Retirarlo cuando los padres admitan directamente la versión corregida.

No se añadió ninguna exclusión de advisories ni se elevó el umbral de auditoría. No se ejecutó `audit fix --force`. La versión corregida de deepmerge indicada por el aviso aún no estaba publicada en npm: retirar la CLI que lo arrastraba evitó conservar ese riesgo o fijar una versión inexistente.

La aplicación usaba los estilos de estado de shadcn, no su generador en ejecución. Se conservaron las variantes `data-open`, `data-closed`, `data-disabled` y las restantes, los keyframes de acordeón y `no-scrollbar` en `src/styles/component-variants.css`, con su [licencia MIT](../../frontend/THIRD_PARTY_NOTICES.md). Los componentes existentes permanecen en el proyecto. No se copiaron efectos nuevos del generador ni se alteró la mecánica de los juegos.

`preinstall` comprueba que el gestor sea pnpm; los lockfiles alternativos se ignoran y se retiró el `package-lock.json` versionado. Docker copia el guard antes de instalar y no descarga el navegador de Cypress para compilar producción. El Node admitido queda documentado como `^22.13.0 || >=24.0.0`. El alias de Vitest usa `import.meta.url`, evitando la advertencia nueva de Vite sobre `__dirname`.

Los cuatro relanzamientos de errores de autenticación conservan ahora su `cause`, conforme a ESLint 10, sin cambiar mensajes, roles, rutas ni contrato HTTP.

## Archivos

- [package.json](../../frontend/package.json), [pnpm-lock.yaml](../../frontend/pnpm-lock.yaml) y [pnpm-workspace.yaml](../../frontend/pnpm-workspace.yaml): versiones y override de seguridad.
- `frontend/package-lock.json`: eliminado por ser el lockfile alternativo; recuperable desde Git si se necesita consultar su historia.
- [.gitignore del frontend](../../frontend/.gitignore), [guard del gestor](../../frontend/scripts/require-pnpm.mjs) y [Dockerfile](../../frontend/Dockerfile): instalación coherente.
- [globals.css](../../frontend/src/globals.css), [variantes locales](../../frontend/src/styles/component-variants.css) y [avisos de licencia](../../frontend/THIRD_PARTY_NOTICES.md): conservación de estilos sin instalar la CLI.
- [vitest.config.ts](../../frontend/vitest.config.ts), [useAuth.ts](../../frontend/src/application/hooks/useAuth.ts) y [AuthAdapter.ts](../../frontend/src/infrastructure/adapters/http/AuthAdapter.ts): compatibilidad de herramientas y causas de errores.
- [Readme frontend](../../frontend/Readme.md), [README principal](../../README.md), [índice documental](../README.md), [estado](../ESTADO_ACTUAL.md), [ejecución local](../sistema/06_Guia_Despliegue_Ejecucion_Local.md), este informe y [texto del PR](PR_Dependencias_Pnpm.md).

## Validaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `corepack pnpm --version` | 11.7.0, igual al manifiesto y Docker |
| `corepack pnpm install --frozen-lockfile --ignore-scripts` | Correcta; lockfile coherente y sin resolución nueva |
| `corepack pnpm run preinstall` | Correcto; la misma comprobación se ejecutó en Docker |
| Guard invocado con user-agent npm | Rechazado con código 1 y mensaje para usar pnpm |
| `corepack pnpm audit --json` | **0** info/bajas/moderadas/altas/críticas; sin exclusiones |
| Suite Vitest completa | **335/335**, 29 archivos, con el árbol corregido y las variantes locales |
| AuthAdapter tras conservar causas de error | **6/6** pruebas existentes |
| `corepack pnpm build` | TypeScript y Vite correctos |
| Build Docker del frontend | Correcto con instalación congelada y guard; frontend local actualizado |
| ESLint sobre archivos modificados | Correcto, sin errores |
| ESLint global | **25 errores y 2 advertencias**, sin errores fatales; deuda anterior detallada abajo |
| Navegador | Login, modal de catálogo, navegación, dos victorias guardadas y L01/perfil correctos |
| Responsive del perfil | 320/390/768/1440 px sin desbordamiento horizontal; captura móvil revisada |
| Consola de la pestaña de QA | Sin errores/advertencias registrados al completar el flujo |
| Conservación | 71 archivos protegidos intactos: `data-science` y las 19 migraciones; contenedor IA idéntico y detenido |
| Limpieza | Cuenta, sesiones, progreso, logros, XP y trazas propios de QA retirados |
| Integridad final | 681 archivos de texto sin problemas, 99 enlaces locales válidos y `git diff --check` correcto |

La suite completa se ejecutó después de resolver las dependencias finales. El ajuste posterior de `cause` se comprobó con las seis pruebas específicas, lint de los archivos afectados, nuevo build y reconstrucción Docker. No se suman esas seis pruebas al total de la suite como si fueran casos nuevos.

En navegador se completó Neon Flow oficial 1, se giraron/colocaron las tres piezas de TetriLogic 1 y se confirmó el logro conjunto L01: perfil 1/35, seis estrellas, 100 XP y fecha de desbloqueo. Se revisaron los menús y el modal que dependen de las variantes de estado conservadas. No se afirma haber recorrido manualmente los sesenta niveles durante este lote; su cobertura se mantiene en las pruebas existentes.

Los artefactos JSON, logs y capturas se conservan fuera de Git en `deps-20261102`. No contienen credenciales de producción; la identidad de QA fue temporal y ya se retiró. No se ejecutaron suites backend porque no se modificaron sus archivos, contratos ni migraciones.

## Límites

- El lint global conserva problemas en tarjetas RIA, páginas docentes/ranking, un test de ranking y exportaciones de componentes UI. Incluyen `set-state-in-effect`, `no-empty`, `no-explicit-any`, dependencias de efectos y exportaciones para React Refresh. No se ocultaron desactivando reglas. Los cuatro diagnósticos nuevos de preservación de errores sí se corrigieron para adaptar la actualización.
- El bundle JS es 795,97 kB (gzip 226,37 kB), CSS 111,99 kB. Sigue la advertencia de chunk mayor de 500 kB; no se declaró corregida la división del bundle.
- Una auditoría sin avisos es un resultado fechado de los paquetes revisados; no certifica ausencia de vulnerabilidades futuras o seguridad integral del despliegue. No se auditó el servidor global `serve` ni la imagen base.
- No se modificaron backend, datos ajenos al fixture, `data-science`, su proxy, endpoints, modelos o contenedor. No se ejecutaron migraciones nuevas.
- Las alertas de GitHub sobre `develop` seguirán reflejando esa rama hasta que el usuario publique e integre el PR. Esta entrega no cierra alertas remotamente.

## Continuidad del PR

La rama local contiene los cambios sin commit. El [documento de PR](PR_Dependencias_Pnpm.md) incluye el título, texto, comprobaciones y pasos para publicarlo sin hacer push directo a `develop`. Revisar el alcance completo del diff: la base local incluye el avance de logros `9384639`, que debe estar integrado en `develop` o reconocerse en el PR si aún está pendiente.
