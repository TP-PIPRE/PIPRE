# Guías funcionales RIA01-RIA10

Este directorio documenta cada requerimiento de IA implementado en
`data-science`. Las guías están orientadas a desarrolladores de frontend,
backend e integraciones con IA generativa.

## Índice

| RIA | Funcionalidad | Endpoints canónicos | Guía |
| --- | --- | --- | --- |
| RIA01 | Clasificación de desempeño. | `/ria01/predict`, `/ria01/info` | [RIA01](RIA01_DESEMPENO.md) |
| RIA02 | Retroalimentación automática. | `/ria02/feedback`, `/ria02/info` | [RIA02](RIA02_RETROALIMENTACION.md) |
| RIA03 | Recomendación de actividades. | `/ria03/recommend`, `/ria03/info` | [RIA03](RIA03_RECOMENDACION_ACTIVIDADES.md) |
| RIA04 | Generación de retos. | `/ria04/generate`, `/ria04/info` | [RIA04](RIA04_GENERADOR_RETOS.md) |
| RIA05 | Clasificación de errores lógicos. | `/ria05/errors`, `/ria05/errors/batch`, `/ria05/info` | [RIA05](RIA05_CLASIFICADOR_ERRORES.md) |
| RIA06 | Análisis de patrones. | `/ria06/patterns`, `/ria06/patterns/batch`, `/ria06/info` | [RIA06](RIA06_PATRONES.md) |
| RIA07 | Riesgo y anomalías. | `/ria07/anomaly`, `/ria07/early-warning`, `/ria07/early-warning/batch`, `/ria07/info` | [RIA07](RIA07_RIESGO_ANOMALIAS.md) |
| RIA08 | Recomendación pedagógica. | `/ria08/pedagogical`, `/ria08/info` | [RIA08](RIA08_RECOMENDACION_PEDAGOGICA.md) |
| RIA09 | Clasificación de tiempo. | `/ria09/time`, `/ria09/info` | [RIA09](RIA09_TIEMPO.md) |
| RIA10 | Evaluación automática de código. | `/ria10/code`, `/ria10/code/batch`, `/ria10/info` | [RIA10](RIA10_CODIGO.md) |

## Regla común para construir contexto de IA

El contexto para una IA generativa debe ser mínimo, explicable y derivado de
la respuesta del RIA:

```json
{
  "ria": "RIAxx",
  "purpose": "Objetivo concreto del mensaje",
  "result": "Resultado principal del RIA",
  "reasons": ["Razones explicables disponibles"],
  "evidence": {},
  "recommended_action": "Acción sugerida y revisable",
  "limitations": ["Qué no puede concluirse"],
  "instruction": "Tarea y tono para la IA generativa"
}
```

## Datos que normalmente no deben enviarse

- Dataset de entrenamiento completo.
- Información de otros estudiantes.
- Nombres o identificadores cuando un pseudónimo sea suficiente.
- Métricas internas, centroides, pesos o hiperparámetros sin utilidad para el
  mensaje.
- Soluciones esperadas cuando la IA interactúa directamente con el estudiante.
- Edad, emoción u otros datos sensibles si no son indispensables.

## Interpretación de métricas

- `accuracy` y `precision` son métricas globales; no representan confianza
  individual.
- `confidence` solo se interpreta como confianza del modelo que la produce.
- `risk_score` de RIA07 no es probabilidad de abandono.
- `anomaly_score` de RIA07 es rareza relativa.
- Tipicidad de RIA06 no es probabilidad.
- Las etiquetas de RIA09 y RIA10 son heurísticas y necesitan validación externa.

## Uso recomendado

1. Validar la entrada con el schema del endpoint.
2. Ejecutar el RIA correspondiente.
3. Seleccionar únicamente resultado, razones, evidencia y acción necesarios.
4. Agregar límites explícitos al prompt.
5. Solicitar una respuesta corta, pedagógica y revisable.
6. Conservar al docente como responsable de la decisión final.

