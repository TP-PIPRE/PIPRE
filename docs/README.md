# Documentación de PIPRE

Reorganizada el 30/10 y actualizada el **05/11/2026** para diario 5/5 y auditoría del backend. Este índice distingue documentación vigente, evidencias de una entrega y antecedentes históricos.

## Por dónde empezar

| Necesidad | Documento |
|---|---|
| Conocer el alcance implementado y sus límites | [Estado actual](ESTADO_ACTUAL.md) |
| Ejecutar el proyecto localmente | [Despliegue y ejecución](sistema/06_Guia_Despliegue_Ejecucion_Local.md) |
| Entender arquitectura, módulos y navegación | [Manual del sistema](sistema/README.md) |
| Revisar autenticación y permisos | [Autenticación](guias/Guia_Migracion_Autenticacion.md) · [Roles y endpoints](guias/Clasificacion_Endpoints_Roles.md) |
| Integrar una actividad con su tablero | [Guía de retos](guias/Guia_Implementacion_30_Retos.md) · [Contratos vigentes](guias/Contratos_Frontend_Backend.md) |
| Entender cada simulador | [TetriLogic](simuladores/TetriLogic_Filas_Columnas.md) · [Neon Flow](simuladores/NeonFlow.md) |
| Entender los 35 logros, estrellas y reto diario | [Sistema de logros](guias/Sistema_35_Logros.md) · [Informe del 02/11](informes/Implementacion_35_Logros_2026_11_02.md) |
| Revisar las dependencias corregidas y preparar su PR | [Actualización pnpm del 02/11](informes/Actualizacion_Dependencias_Pnpm_2026_11_02.md) · [PR preparado](informes/PR_Dependencias_Pnpm.md) |
| Consultar la revisión de seguridad actual y los avisos pendientes | [Auditoría frontend y corrección Maven del 04/11](informes/Revision_Seguridad_2026_11_04.md) |
| Generar y jugar los cinco retos diarios sin IA | [Contrato procedural del diario](guias/Retos_Diarios_Procedurales.md) |
| Revisar correcciones, pruebas y cobertura del backend | [Auditoría del 05/11](informes/Auditoria_Backend_2026_11_05.md) · [Ejecución de pruebas](../backend/TESTING.md) |
| Continuar los pendientes concretos de implementación backend | [Pendientes del backend](guias/Pendientes_Implementacion_Backend.md) |
| Consultar logros actuales y nuevos dentro de la intervención | [Contrato y exportación](guias/Sistema_35_Logros.md#consulta-para-la-investigación) · [SQL de sólo lectura](Consultas_35_Logros.sql) |
| Continuar el trabajo pendiente | [Pendientes del SSD](simuladores/Pendientes_TetriLogic_SSD.md) |
| Revisar los dos bloques pendientes de endpoints backend | [PATCH y asignación de actividades a grupos](guias/Pendientes_Endpoints_Backend.md) |
| Contrastar endpoints IA con sus datos y consumidores | [Requisitos IA y agregación](req-ia-endpoints.md) |
| Preparar ML antes de modificar el servicio de IA | [Plan gradual de implementación ML](guias/Plan_Implementacion_ML.md) |
| Consultar las pruebas de integración del 30/10 | [Informe de integración y preparación ML](informes/Integracion_TetriLogic_NeonFlow_ML.md) |
| Consultar la revisión posterior de uso e integración | [Revisión exhaustiva de simuladores](informes/Revision_Exhaustiva_Simuladores_2026_10_30.md) |
| Revisar esta reorganización e inconsistencias corregidas | [Revisión documental](informes/Revision_Documentacion_2026_10_30.md) |

## Organización

```text
docs/
├── README.md                    Índice de lectura
├── ESTADO_ACTUAL.md              Alcance y límites consolidados
├── sistema/                     Manual técnico y funcional vigente
├── guias/                       Contratos, permisos, autenticación y retos
├── simuladores/                 Mecánicas activas y pendientes
├── informes/                    Entregas y validaciones fechadas
├── historial/                   Diseños y diagnósticos anteriores
├── diagramas/                   Diagramas y advertencia de cobertura
├── Consultas_Analitica_Intentos.sql  Inspección de observaciones
└── Consultas_35_Logros.sql        Exportación por periodo, sólo lectura
```

## Estado, evidencias e historial

Las instrucciones del usuario y [AGENTS.md](../AGENTS.md) delimitan el trabajo. [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md) resume el alcance; las guías detallan cómo funciona. Los informes describen lo comprobado en una fecha concreta: no acreditan una nueva ejecución de pruebas ni el estado de producción.

En [historial](historial/Master_Documentacion_Completa.md) se conservan el documento consolidado original y las revisiones de [UI/UX](historial/Informe_UI_UX.md), [contratos](historial/Informe_Contratos_Frontend_Backend.md), [TetriLogic v2](historial/Informe_TetriLogic_30_Retos.md), [claridad del simulador](historial/Revision_Simulador_Contratos_UX.md) y [exploración libre](historial/TetriLogic_Exploracion_Libre.md). Sus cifras, propuestas y restricciones corresponden a esos checkpoints. No reintroducirlas como requisitos actuales.

La antigua lista raíz `req-backend-mejoras.md` se conserva como [antecedente histórico](historial/req-backend-mejoras.md). Sus pendientes vigentes se revisan en el documento específico de endpoints, sin repetir como faltantes los controladores y DTO ya implementados.

El [manifiesto de integración](informes/Archivos_Integracion_2026_10_30.md) conserva las rutas existentes al entregar aquel lote; el [informe documental](informes/Revision_Documentacion_2026_10_30.md) registra sus nuevas ubicaciones. Los [diagramas](diagramas/README.md) no sustituyen a las migraciones publicadas.

## Convenciones de mantenimiento

- Indicar fecha y si el documento es vigente, un informe de entrega o histórico.
- Mantener una sola referencia del alcance y enlazarla; evitar otro documento maestro que copie el manual completo.
- Actualizar los enlaces al mover archivos y usar rutas relativas al documento, sin rutas personales `file:///`.
- Separar funcionalidades implementadas, propuestas y autorizaciones. Los logros/progreso verificados del 02/11 no se deducen de guardar telemetría ni autorizan ML.
- Registrar comandos ejecutados y resultados reales por entrega. No reemplazar cifras históricas por otras nuevas sin explicar la fecha.
- Antes de documentar otra migración o catálogo, consultar la rama y el código. No editar SQL ya aplicado para hacerlo coincidir con un texto.
