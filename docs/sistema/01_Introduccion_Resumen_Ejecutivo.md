# 1. Introducción y alcance

**Actualizado: 30/10/2026.** [Manual](README.md) · [Estado actual](../ESTADO_ACTUAL.md).

## Propósito

PIPRE proporciona simuladores educativos para explorar lógica y razonamiento espacial. Forma parte de la investigación «Uso de simulador web gamificado con retroalimentación basada en IA para fortalecer pensamiento lógico en estudiantes de educación secundaria de Jauja, 2026».

Ese título expresa un objetivo de investigación. La implementación no demuestra por sí misma mejora cognitiva, eficacia educativa ni una relación causal entre uso y aprendizaje.

## Usuarios y funciones

| Usuario | Funciones implementadas |
|---|---|
| Estudiante | Acceder a cursos/actividades, manipular tableros y consultar sus recursos académicos disponibles. |
| Docente | Gestionar cursos, módulos, lecciones y actividades; consultar estudiantes, resultados y métricas existentes. |
| Administrador | Acceso de gestión y administración de roles conforme a la API. |

El backend usa `STUDENT`, `TEACHER`, `ADMIN`; la interfaz usa `student`, `docente`, `admin`. No son nombres de tres modelos de usuario diferentes.

## Alcance entregado

- Treinta retos oficiales de **Neon Flow**, con emisor, espejos, filtros y receptores por color.
- Treinta de **TetriLogic**, con manipulación directa y objetivos de ocupación por fila/columna.
- Conexión persistida curso → módulo → lección → actividad → plantilla → simulador.
- Autenticación por cookie HttpOnly, permisos de gestión y controles de propiedad de datos personales.
- Observación de intentos y acciones autorizada para ambos juegos, con contexto y reintentos idempotentes.

Los prototipos y alias se conservan por compatibilidad, fuera del conteo de 60 retos. Las trazas no conceden automáticamente calificaciones, XP, estrellas, logros o progreso.

## Alcance pendiente

La puntuación, reanudación, validación de soluciones por servidor, tutor adaptativo, retos diarios y evaluación pedagógica requieren trabajo adicional. La pista de Neon Flow es estática; el modo TetriLogic activo no presenta pistas condicionadas. No deben describirse como retroalimentación IA implementada.

`data-science`, sus modelos, endpoints, proxy y contenedor permanecen excluidos de las intervenciones actuales. El registro de eventos permite preparar análisis futuros, pero todavía requiere un protocolo, etiquetas y exportación seudonimizada antes de entrenar o evaluar modelos.

Ver [pendientes](../simuladores/Pendientes_TetriLogic_SSD.md) y [evidencias de integración](../informes/Integracion_TetriLogic_NeonFlow_ML.md).
