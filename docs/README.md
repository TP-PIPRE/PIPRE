# Documentación de PIPRE

Reorganizada y revisada el **30/10/2026**. Este índice distingue documentación vigente, evidencias de una entrega y antecedentes históricos.

## Por dónde empezar

| Necesidad | Documento |
|---|---|
| Conocer el alcance implementado y sus límites | [Estado actual](ESTADO_ACTUAL.md) |
| Ejecutar el proyecto localmente | [Despliegue y ejecución](sistema/06_Guia_Despliegue_Ejecucion_Local.md) |
| Entender arquitectura, módulos y navegación | [Manual del sistema](sistema/README.md) |
| Revisar autenticación y permisos | [Autenticación](guias/Guia_Migracion_Autenticacion.md) · [Roles y endpoints](guias/Clasificacion_Endpoints_Roles.md) |
| Integrar una actividad con su tablero | [Guía de retos](guias/Guia_Implementacion_30_Retos.md) · [Contratos vigentes](guias/Contratos_Frontend_Backend.md) |
| Entender cada simulador | [TetriLogic](simuladores/TetriLogic_Filas_Columnas.md) · [Neon Flow](simuladores/NeonFlow.md) |
| Continuar el trabajo pendiente | [Pendientes del SSD](simuladores/Pendientes_TetriLogic_SSD.md) |
| Revisar los dos bloques pendientes de endpoints backend | [PATCH y asignación de actividades a grupos](guias/Pendientes_Endpoints_Backend.md) |
| Contrastar endpoints IA con sus datos y consumidores | [Requisitos IA y agregación](../req-ia-endpoints.md) |
| Consultar las pruebas de integración del 30/10 | [Informe de integración y preparación ML](informes/Integracion_TetriLogic_NeonFlow_ML.md) |
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
└── Consultas_Analitica_Intentos.sql  Inspección SQL de sólo lectura
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
- Separar funcionalidades implementadas, propuestas y autorizaciones. Puntuación, progreso y ML no se deducen de guardar telemetría.
- Registrar comandos ejecutados y resultados reales por entrega. No reemplazar cifras históricas por otras nuevas sin explicar la fecha.
- Antes de documentar otra migración o catálogo, consultar la rama y el código. No editar SQL ya aplicado para hacerlo coincidir con un texto.
