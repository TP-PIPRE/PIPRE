# 1. Introducción y Resumen Ejecutivo

## 1.1 Propósito del Software

El presente módulo de software constituye la base operativa de la investigación titulada
**"Uso de Simulador web gamificado con retroalimentación basada en IA para fortalecer
pensamiento lógico en estudiantes de educación secundaria de Jauja, 2026"**.

El sistema materializa dos simuladores web gamificados que ejercitan habilidades cognitivas
específicas, medibles mediante telemetría automática:

- **Neon Flow** (Curso 1, `c001`): fortalece la **lógica proposicional y condicional**
  mediante la manipulación de componentes ópticos (espejos y filtros de color) para guiar
  un haz láser desde un emisor hasta receptores codificados por color.
- **TetriLogic** (Curso 2, `c002`): fortalece el **razonamiento espacial, el reconocimiento
  de patrones y la planificación** mediante la colocación y rotación de Tetriminos en
  tableros sujetos a restricciones de conteo por filas y columnas.

La retroalimentación basada en IA se materializa en un asistente contextual que sugiere
correcciones durante la resolución de retos, registrando además cada solicitud de ayuda
como métrica de análisis (`pistasIa`).

## 1.2 Alineación con la Tesis

| Elemento de la tesis | Implementación en el software |
|----------------------|-------------------------------|
| Pensamiento lógico | Motores de reglas: raycasting óptico (Neon Flow) y validación espacial (TetriLogic) |
| Simulador web gamificado | Progresión de niveles, victoria/derrota, selector de niveles y estado de curso completado |
| Retroalimentación basada en IA | Toast de asistente IA en pista y endpoint de métricas preparado para modelos de IA |
| Medición del impacto | Telemetría por intento: tiempo de resolución, movimientos, reinicios y pistas utilizadas |

## 1.3 Público Objetivo

- **Estudiantes de educación secundaria (Jauja):** usuarios principales que resuelven retos
  progresivos y reciben retroalimentación inmediata.
- **Docentes administradores:** gestionan cursos y retos, consultan analítica de desempeño,
  rankings y señales de riesgo académico derivadas de las métricas recolectadas.

## 1.4 Alcance del Documento

Este documento describe de manera técnica y funcional:

1. La arquitectura de capas del frontend (React/Zustand) y del backend (Arquitectura Hexagonal en Spring Boot).
2. Los módulos funcionales que componen cada simulador.
3. El flujo de navegación completo del usuario y el ciclo de vida de un intento.
4. Los atributos de calidad no funcionales y los mecanismos de seguridad.
5. Las instrucciones de despliegue y ejecución local del sistema completo.

## 1.5 Resultados Esperados

- Recolección íntegra y confiable de métricas por intento (telemetría).
- Disponibilidad de datos poblados para el panel docente, el ranking y los modelos de IA.
- Experiencia de usuario fluida, sin bloqueos, con retroalimentación pedagógica inmediata.
