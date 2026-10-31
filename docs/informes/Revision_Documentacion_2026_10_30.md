# Reorganización y revisión documental

**Fecha: 30/10/2026. Alcance: documentación Markdown.** Se revisaron los veinte documentos originales de `docs/`, sus referencias y las afirmaciones operativas frente al código de la integración existente. Esta intervención no implementa nuevas funciones ni vuelve a ejecutar las suites de aplicación citadas en informes anteriores.

## Estructura aplicada

Se añade un [índice único](../README.md) y una referencia de [estado actual](../ESTADO_ACTUAL.md). El manual se mantiene por capítulos; guías, simuladores, informes fechados e historial tienen ubicaciones separadas. Se conserva el documento consolidado original como histórico, sin otra copia activa del manual. La carpeta `guías` se normaliza a `guias`.

| Documento o grupo original | Ubicación actual |
|---|---|
| `documentacion/01`…`06` | `sistema/`, conservando los nombres de los capítulos |
| `documentacion/Documentacion_Sistema.md` | [Índice del manual](../sistema/README.md) |
| `documentacion/Master_Documentacion_Completa.md` | [Consolidado histórico](../historial/Master_Documentacion_Completa.md) |
| `guías/Guia_Migracion_Autenticacion.md` | [Guía implementada de autenticación](../guias/Guia_Migracion_Autenticacion.md) |
| `guías/Clasificacion_Endpoints_Roles.md` | [Matriz de roles](../guias/Clasificacion_Endpoints_Roles.md) |
| `Guia_Implementacion_30_Retos.md` | [Guía de retos](../guias/Guia_Implementacion_30_Retos.md) |
| `TetriLogic_Filas_Columnas.md`, `Pendientes_TetriLogic_SSD.md` | [Reglas](../simuladores/TetriLogic_Filas_Columnas.md) y [continuidad](../simuladores/Pendientes_TetriLogic_SSD.md) |
| `Integracion_TetriLogic_NeonFlow_ML.md`, `Archivos_Integracion_2026_10_30.md` | [Informe](Integracion_TetriLogic_NeonFlow_ML.md) y [manifiesto fechado](Archivos_Integracion_2026_10_30.md) en `informes/` |
| Informes UI/UX, contratos, TetriLogic inicial y revisión del simulador | `historial/`, con fecha y advertencia de alcance anterior |
| `TetriLogic_Exploracion_Libre.md` | [Modo libre histórico](../historial/TetriLogic_Exploracion_Libre.md) |

Se incorporan además [contratos vigentes](../guias/Contratos_Frontend_Backend.md), [guía Neon Flow](../simuladores/NeonFlow.md) y [contexto de los diagramas](../diagramas/README.md). El SQL de inspección y los SVG mantienen sus archivos y contenido. No se elimina una evidencia histórica para ocultar una contradicción: se identifica su fecha y se enlaza la regla vigente.

## Inconsistencias corregidas

| Hallazgo | Corrección documental |
|---|---|
| Estado de 32 retos y 28 Neon Flow faltantes mezclado con la integración posterior | Referencia vigente: 30 por juego, 60 oficiales; 62 filas locales al conservar dos prototipos. Cifras anteriores quedan fechadas como historial. |
| Guías que exigían orden/contacto/giros finales o prohibían toda victoria en TetriLogic | Se documentan sólo conteos, límites y colisiones del modo activo, con exploración directa y excesos intermedios permitidos. |
| Prohibición histórica de telemetría aún presentada como vigente | Autorización del 30/10 para intentos/acciones en ambos juegos; sin puntos ni progreso automático. |
| Pista estática presentada como IA, y `pistasIa` incrementado por cualquier ayuda | Se diferencia `source=STATIC` del servicio IA; no se presenta tutor adaptativo como entregado. |
| Métricas descritas como prueba de aprendizaje o impacto causal | Se distinguen observaciones declaradas por cliente de evaluación pedagógica, etiquetas y modelos futuros. |
| Arquitectura anclada en V12 y telemetría sin FK/contexto | Se reflejan V1…V17, catálogos JSONB, propiedad, actividad opcional y FK con compatibilidad histórica. |
| Seeder descrito como borrado/recreación de cursos en cada arranque | Se describe creación de cursos ausentes y actualización aditiva mediante migraciones congeladas. |
| `demo-data=false` interpretado como ausencia total de datos ficticios | Se aclara que desactiva resultados/analítica aleatorios, pero el bootstrap todavía crea cuentas ficticias. |
| Curso `c001/c002` usado como sustituto de la actividad elegida; ruta vacía como error | Se documenta la selección por `idActivity`, pertenencia al curso y práctica TetriLogic en `/simulador`. |
| JWT manual, login como mensaje genérico y endpoint hipotético `/users/me` | Se documentan cookie HttpOnly, respuesta estructurada real, metadatos locales y logout implementado. |
| Cookies siempre Secure/Strict, logout sólo autenticado y permisos sin propiedad | Se documentan valores configurables, logout público, identidad propia y matriz contrastada con clase/método/filtro. |
| `up` general con IA, puertos universales y override supuestamente autocontenido | Guía con archivo local explícito y tres servicios; puertos por entorno y red externa que conserva la combinación principal/override. |
| Supuesta persistencia garantizada al recrear contenedores | Se identifica ausencia de volumen PostgreSQL nombrado y se conserva el procedimiento de parada sin eliminar contenedores. |
| Documento maestro duplicado con varios títulos principales | Se archiva el consolidado y se normaliza su jerarquía; el manual vigente conserva capítulos enlazados. |
| Enlaces relativos afectados por movimientos y diagrama backend con ruta inexistente | Se recalculan destinos y se actualizan referencias en README, AGENTS, SDD, sistema de diseño y README backend. |

## Límites que permanecen abiertos

- No se cambian Compose, persistencia PostgreSQL, permisos o seeder para corregir una afirmación del manual. Los límites detectados se registran para una intervención técnica separada.
- Los SVG se conservan como referencia que puede omitir V13…V17; falta actualizar el modelo gráfico.
- CSRF está desactivado; no se certifican seguridad de producción, dominios externos ni comportamiento de modelos IA.
- No se restaura progreso, puntuación ni mecánicas excluidas. La preparación ML no implica anonimización ya implementada ni aprendizaje demostrado.
- Los resultados de pruebas citados pertenecen a sus entregas originales. Una reorganización documental no los convierte en ejecuciones nuevas.
- Se conserva la fusión Git anterior sin commit ni push y sin reescribir migraciones ni modificar `data-science`.

## Validación de esta intervención

Resultados ejecutados sobre el resultado reorganizado:

- **20 documentos originales reubicados, 26 Markdown finales**: se añaden índice, estado actual, contratos vigentes, guía Neon Flow, contexto de diagramas y este informe.
- **176 enlaces locales** comprobados entre los 26 documentos y las cinco referencias externas modificadas; cero destinos o anclas rotos. Los enlaces web externos no se visitaron.
- Un título principal por documento, sin saltos de jerarquía ni bloques de código sin cerrar.
- **602 archivos no Markdown** comparados por SHA-256 con la instantánea previa: cero cambios. Incluye código, migraciones, SVG y SQL; no se modifica `data-science`.
- `verify_source_integrity.py`: **617 archivos de texto** revisados, sin anomalías de codificación ni caracteres nulos.
- `docker compose config --format json`, para el archivo local y para la combinación principal/override: analizados sin iniciar servicios. Confirma ausencia de volumen PostgreSQL declarado y la red externa que conserva la segunda combinación.
- Rutas y referencias actualizadas en README raíz, AGENTS, GDD de TetriLogic, sistema de diseño y README backend. El manifiesto antiguo sigue identificado como histórico.

No se ejecutaron build, suites frontend/backend ni escrituras de base de datos: esta intervención sólo cambia Markdown. No fue necesario reiniciar servicios. Las pruebas de aplicación citadas en otros informes permanecen como evidencias de sus entregas, no como validaciones nuevas de esta revisión.
