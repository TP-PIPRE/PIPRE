# Documentación Técnica y Funcional del Sistema

## Uso de Simulador web gamificado con retroalimentación basada en IA para fortalecer pensamiento lógico en estudiantes de educación secundaria de Jauja, 2026

**Proyecto:** PIPRE — Plataforma Inteligente Para Robótica Educativa (módulo de simuladores gamificados Neon Flow y TetriLogic).

**Documento:** Documentación del Software (Frontend + Backend + Persistencia + Telemetría).

**Versión:** 1.0 — 2026

---

## Índice Detallado

| N.º | Sección | Archivo |
|-----|---------|---------|
| 1 | Introducción y Resumen Ejecutivo | [01_Introduccion_Resumen_Ejecutivo.md](./01_Introduccion_Resumen_Ejecutivo.md) |
| 2 | Arquitectura del Sistema | [02_Arquitectura_del_Sistema.md](./02_Arquitectura_del_Sistema.md) |
| 3 | Módulos y Componentes Principales | [03_Modulos_y_Componentes.md](./03_Modulos_y_Componentes.md) |
| 4 | Flujo de Navegación del Usuario (User Journey) | [04_Flujo_de_Navegacion_Usuario.md](./04_Flujo_de_Navegacion_Usuario.md) |
| 5 | Atributos de Calidad y No Funcionales | [05_Atributos_de_Calidad.md](./05_Atributos_de_Calidad.md) |
| 6 | Guía de Despliegue y Ejecución Local | [06_Guia_Despliegue_Ejecucion_Local.md](./06_Guia_Despliegue_Ejecucion_Local.md) |

### Resumen de la Estructura del Documento

1. **Introducción y Resumen Ejecutivo:** propósito del software, alineación con la tesis, público objetivo, alcance y resultados esperados.
2. **Arquitectura del Sistema:** descripción de la SPA React/Zustand, el backend hexagonal en Spring Boot y la base de datos PostgreSQL con telemetría fire-and-forget.
3. **Módulos y Componentes:** autenticación y catálogo de cursos, motores de simulación (raycasting y Tetriminos), retroalimentación de IA y analítica docente.
4. **Flujo de Navegación:** recorrido paso a paso del estudiante desde el inicio de sesión hasta la sincronización de métricas.
5. **Atributos de Calidad:** rendimiento, mantenibilidad, escalabilidad y seguridad.
6. **Despliegue:** instrucciones de ejecución local y mediante contenedores Docker.
