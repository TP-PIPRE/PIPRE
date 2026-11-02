# Revisión de integración de los simuladores

**Informe de ejecución: 30/10/2026, America/Bogota.** Revisión sobre `Feature/Tetrilogic-avances`, partiendo del commit de integración `8fc2936` y un árbol limpio. Los cambios de esta revisión quedan sin commit ni push. No sustituye las evidencias del [informe anterior](Integracion_TetriLogic_NeonFlow_ML.md).

[Estado actual](../ESTADO_ACTUAL.md) · [Contratos](../guias/Contratos_Frontend_Backend.md) · [Plan de implementación ML](../guias/Plan_Implementacion_ML.md).

## Resultado

Se comprobaron **30 TetriLogic v2 + 30 Neon Flow v2 = 60 retos oficiales**, desde currículo y API hasta tablero. Se corrigieron tres problemas de uso o integración y se añadieron 28 regresiones: 16 frontend y 12 backend. Las suites finales y la verificación HTTP terminaron sin fallos. Esto acredita los escenarios ejecutados, no una ausencia absoluta de errores en cualquier dispositivo o entorno.

No se añadieron retos ni migraciones. Los dos prototipos Neon Flow conservados explican las **62 actividades físicas** de la base local; no cuentan como otros retos oficiales. Los catálogos publicados y V1…V17 permanecen intactos. No se modificaron reglas de victoria, puntuación, progreso ni `data-science`.

## Problemas encontrados y correcciones

| Problema reproducido | Comportamiento corregido | Evidencia |
|---|---|---|
| Neon Flow deshabilitaba Reiniciar al completar la única actividad abierta. | Permite reiniciar después del éxito, limpia tablero, feedback y pista, vuelve a PLAYING y registra otro episodio sin duplicar la telemetría heredada. | Regresiones de interacción/traza y secuencia real completar → reiniciar → completar. |
| Un HTTP 400 permanente de una traza detenía la cola y bloqueaba observaciones válidas posteriores. Podía ocurrir si un docente cambiaba la plantilla antes de aceptar el primer envío. | Conserva cuerpo y UUID rechazados, pero continúa con otros episodios ante 400/404/409/422. Red, servidor y sesión siguen deteniendo el envío para reintentar. No elimina silenciosamente la observación rechazada. | Cuatro regresiones de cola comprueban entrega del sucesor y conservación del request original. |
| Enteros JSON muy grandes se truncaban al convertirlos a int/long y podían terminar dentro de un rango permitido. | Verifica representabilidad antes de convertir versión, secuencia, tiempo, coordenadas, giro y contador de omisiones. | Diez regresiones que fallaban antes; casos extremos rechazados por HTTP sobre PostgreSQL real. |

También se normalizaron dos casos extremos de fecha/duración a errores de negocio claros. El manejador HTTP anterior ya devolvía 400: **no se atribuye un fallo 500 a esos casos**. El cálculo del máximo tiempo de evento evita una suma desbordada.

La revisión documental reparó enlaces que seguían apuntando a `req-ia-endpoints.md` en la raíz después de moverlo a `docs/`. Se enlazó el nuevo plan ML desde los índices y el estado vigente.

## Matriz de integración comprobada

| Área | Comprobación realizada |
|---|---|
| Catálogo persistido | Los 60 GET de plantillas devuelven identidad, versión y configuración iguales al catálogo revisado; no entregan soluciones. Autenticación y plantilla inexistente verificadas. |
| Currículo | Recorrido curso → módulos → lecciones → actividades; los 60 IDs oficiales apuntan al juego, lección y plantilla esperados. Copias docentes no se cuentan como retos oficiales. |
| Navegador y selección | Se abrieron las 30 actividades de cada juego mediante el selector; cada una presentó su tablero de 4×4, 5×5 o 6×6. Se verificó acceso desde Mis cursos, no sólo enlaces directos. |
| Resolución | Pruebas de componentes resuelven los 30 tableros activos de cada juego. En navegador real se resolvieron Neon Flow 1 y 30, y TetriLogic 30. La compatibilidad histórica TetriLogic se prueba por separado. |
| TetriLogic | Selección, giro por teclado, colocación, movimiento posterior al éxito, devolución, cancelación del modal y restablecimiento confirmado. Conteos exactos de ambos ejes, incluidos ceros; límites/colisiones y exceso intermedio cubiertos por pruebas. |
| Neon Flow | Comprobación fallida con feedback recuperable, colocación/giro de espejos, filtro, receptor correcto y reinicio después de resolver. Raycast, colores y detención en receptores cubiertos por pruebas. |
| Edición docente real | En curso QA con módulo/lección: crear actividades de ambos juegos, guardar, editar descripción/orden, recargar y comprobar plantilla, lección y misión conservadas. Creación acepta 201 sin cuerpo. |
| Curso mixto con UUID | Estudiante abre los retos creados por el docente y cambia Neon → TetriLogic → Neon dentro del mismo curso. La URL conserva la actividad elegida; no conserva componentes del tablero anterior. |
| Carga y errores | Pruebas de 403/404, actividad ajena, plantilla desconocida, versión/configuración incompatibles, fallo/reintento, petición abortada y respuesta tardía. No hay sustitución silenciosa por otro tablero. Se ejercitó Reintentar del catálogo ante el arranque del backend. |
| Permisos | HTTP con estudiante/docente/administrador: edición docente permitida, estudiante sin permiso de editar, telemetría de otra identidad rechazada y lectores de plantillas autenticados. |
| Alias y práctica | Alias Neon conserva la identidad de la actividad/traza y carga geometría canónica. Práctica independiente admite actividad nula. |
| Trazabilidad | Reintento idéntico y ocho envíos concurrentes producen una observación por UUID. Conflicto de contenido, campos personales, orden/tiempo inválido y asociación incorrecta se rechazan. Un reintento aceptado sobrevive a la edición docente. |
| Compatibilidad de datos | Cliente sin trace conserva contexto nulo. No se crean notas ni progreso desde los nuevos episodios. |

## Pruebas ejecutadas en esta revisión

| Validación final | Resultado |
|---|---|
| Vitest frontend | **307/307 pruebas, 26 archivos**, cero fallos. Incluye soluciones de ambos catálogos activos y compatibilidad histórica. |
| Maven backend | **98 pruebas**, cero fallos, errores u omisiones. Compilación release 21 con runtime local Java 25. |
| HTTP + SQL local | **167 comprobaciones** del script ampliado, contra backend reconstruido y PostgreSQL real. |
| PostgreSQL aislado | **20 comprobaciones**: instalación nueva, actualización existente, datos personalizados, idempotencia, FK, conservación y rollback por colisión. |
| Catálogos congelados | Ambos generadores con `--check`, sin regenerar JSON ni SQL. |
| Compilación | TypeScript/Vite y Docker backend/frontend correctos. La compilación Docker del backend usa skipTests y no se cuenta como otra ejecución de tests. |
| ESLint | Correcto en los archivos frontend modificados. No se declara limpio el lint global histórico. |
| Responsive | Ambos juegos a **320, 390, 768 y 1440 px**, recarga y geometría DOM sin desbordamiento horizontal de documento. Capturas de escritorio y móvil inspeccionadas. |
| Conservación | Tras limpiar los fixtures propios, **172 filas previas de 12 tablas conservan sus huellas**, sin filas QA residuales en esas tablas. |
| Documentación e integridad | **38 Markdown, 240 enlaces locales/anclas y 4 ejemplos JSON** válidos; verificador de integridad sobre **621 archivos de texto**, sin incidencias. `git diff --check` correcto. |

Comandos de frontend desde `frontend/`:

```powershell
node node_modules/vitest/vitest.mjs run --maxWorkers=2 --pool=threads --testTimeout=20000 --reporter=default --reporter=json --outputFile.json=<artefacto-privado.json>
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
```

Se ejecutó Maven 3.9.16 ya cacheado con `-B -e test` y repositorio local explícito. `mvnw.cmd` falló antes de iniciar Maven al indexar un Target nulo en PowerShell; ese intento no cuenta como suite aprobada. Tampoco se cuentan los procesos frontend interrumpidos ni la ejecución iniciada mientras se editaban archivos: la cifra 307 pertenece al último run completo con fuentes finales inmóviles.

Desde la raíz, con el runtime Python del entorno:

```powershell
python -B scripts/verify_integration_postgres.py
python -B scripts/verify_integration_http.py
node scripts/generate_neonflow_catalog.mjs --check
python -B scripts/generate_tetrilogic_catalog.py --check
python -B scripts/verify_source_integrity.py
git diff --check
```

La batería HTTP crea y limpia únicamente fixtures con ID y marcador/correo verificados. Las dos limpiezas son independientes: un fallo al borrar el curso no omite la limpieza del estudiante. La verificación PostgreSQL usa un contenedor temporal aislado y no abre la base de aplicación.

## Trazas de navegador y conservación

La cuenta QA de navegador generó **10 observaciones** recibidas con huella: Neon Flow 4 SUCCESS + 2 ABANDONED; TetriLogic 3 SUCCESS + 1 ABANDONED. Tenía cero resultados académicos. Son evidencia técnica de prueba, no observaciones reales para entrenar. El curso QA, su estudiante y sus trazas se eliminaron después de contrastar su identidad; se volvieron a comparar las huellas previas.

Los logs JSON/compilación, huellas y capturas se guardaron fuera de Git en los artefactos de la sesión: `simulator-audit-frontend-final.json`, `backend-simulator-audit-after.log`, `audit-simulators-http-final.json`, `audit-simulators-postgres.json`, `audit-simulators-browser.json`, `audit-simulators-browser-traces.json`, `audit-simulators-preservation-final.json` y `ml-plan-doc-validation-final-with-report.json`. No incorporar credenciales, cookies, backups o fixtures personales al repositorio.

La captura móvil con el navegador oculto no representaba el repintado observado por DOM. Se contrastó con el navegador visible antes de aceptar la revisión visual. No se cambió CSS para corregir un artefacto de captura.

## Preparación de ML

El [plan en guías](../guias/Plan_Implementacion_ML.md) separa definición del objetivo, auditoría/procedencia, contratos y extracción Spring, validación técnica de desenlace, autorización de cambios IA, experimento offline, integración en sombra y piloto supervisado. Cada etapa tiene criterios de salida y pruebas futuras sin marcar como ejecutadas.

Incluye features por juego, nulos y calidad, separación QA/demo/legacy, seudonimización, prevención de fugas por estudiante y tiempo, baselines, calibración y versionado. Los eventos actuales llegan al cierre del episodio; un análisis temprano posterior no demuestra disponibilidad en tiempo real. No existe evidencia suficiente para declarar una cohorte real etiquetada ni rendimiento ML.

Se verificaron sin cambios **52 archivos de `data-science` por SHA-256**. Su contenedor mantuvo identidad, estado detenido y fecha de arranque anterior. No se inició, importó, entrenó ni reconstruyó IA; tampoco se modificó su proxy o contrato.

## Archivos de este lote

- Backend: `SaveAttemptService.java` y `TraceAttemptContractTest.java`.
- Frontend producción: `attemptTrace.ts`, `NeonFlowStage.tsx` y `ControlPanel.tsx`.
- Pruebas frontend: `ActivitySimulator.test.tsx`, `AttemptTrace.test.tsx`, `SimulatorAccessibility.test.tsx` y nuevo `PersistedNeonFlow.test.tsx`.
- Verificación reutilizable: `scripts/verify_integration_http.py`.
- Documentación: nuevo plan ML y este informe; índices raíz/docs, estado actual, pendientes backend, documento IA y banner histórico con enlaces corregidos.

## Límites y próximos pasos

- No se ejecutó toda Cypress, una matriz completa de navegadores, lector de pantalla ni dispositivo táctil físico. Los gestos mouse/touch cuentan con pruebas de eventos; las interacciones reales verificadas usaron clic/teclado en el navegador disponible.
- Permanece el aviso de bundle frontend de aproximadamente 724,64 kB. No se incorporaron dependencias ni se amplió esta tarea a optimización del paquete.
- La cola conserva solicitudes rechazadas para un reintento posterior, sin pantalla de reparación/manual ni revisión de actividad histórica. Sigue siendo best effort: no garantiza entrega tras un corte eléctrico ni reanuda el tablero.
- SUCCESS sigue declarado por cliente; verificar soluciones en servidor, rúbrica, privacidad/retención y ML son trabajo posterior. No inferir progreso académico o capacidad cognitiva a partir de estas pruebas.
- Neon Flow conserva su interacción existente de colocación/giro y reinicio; no se añadió mover/retirar individualmente un componente. TetriLogic conserva sus reglas activas sin reintroducir restricciones históricas.
- Un despliegue remoto requiere sus propias verificaciones. Esta revisión se realizó en el entorno local y no modificó producción.
