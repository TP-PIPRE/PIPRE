# RIA06 - Análisis de patrones estudiantiles

## Propósito

RIA06 agrupa estudiantes con patrones similares de participación. Describe
frecuencia, duración y continuidad para ayudar al docente a observar la
cohorte; no asigna una nota ni determina capacidad.

## Funcionamiento

- Versión: `ria06-v5-reliable`.
- Técnica: K-means con escalado robusto, selección de cantidad de grupos,
  estabilidad y controles de calidad.
- Variables de predicción: frecuencia de actividad, duración promedio de sesión
  y días de inactividad.
- Los bloques son el medio normal del simulador y no se usan para formar grupos.
- El uso de código puede auditar el entrenamiento, pero no asigna segmentos.
- La calidad se evalúa con métricas de clustering, no con accuracy.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria06/patterns` | Analizar un estudiante. |
| `POST` | `/ria06/patterns/batch` | Analizar una cohorte de hasta 500 estudiantes. |
| `GET` | `/ria06/info` | Consultar calidad, segmentos y diagnóstico. |

Aliases temporales: `/ria07/patterns` y `/ria07/patterns/batch`.

### Entrada

```json
{
  "student_id": "student-1",
  "student_name": "Estudiante 1",
  "activity_frequency": 10,
  "average_session_minutes": 30,
  "inactive_days": 2
}
```

### Salida relevante

- Identidad del segmento: `segment_id`, `segment_name` y descripción.
- `teacher_summary` y `reasons`.
- `feature_values` y `segment_comparison`.
- `teacher_suggestion`.
- `assignment_interpretation`, tipicidad, margen y ambigüedad.
- `requires_review`, `review_reasons` y `out_of_distribution`.
- `model_quality`.

## Contexto recomendado para una IA generativa

```json
{
  "ria": "RIA06",
  "segment_name": "Participación continua",
  "segment_description": "Patrón relativo a la cohorte de referencia.",
  "teacher_summary": "Resumen generado por el modelo.",
  "reasons": ["Frecuencia superior al centro del segmento."],
  "feature_values": {
    "frecuencia_actividad": 10,
    "duracion_promedio_min": 30,
    "dias_inactivo": 2
  },
  "teacher_suggestion": {
    "priority": "low",
    "title": "Mantener seguimiento",
    "actions": ["Revisar continuidad en las próximas actividades."]
  },
  "requires_review": false,
  "review_reasons": [],
  "model_quality": {
    "quality_label": "calidad interpretable",
    "recommended_use": "apoyo para observación docente"
  }
}
```

No enviar a la IA generativa:

- centroides completos;
- identificadores técnicos de cluster;
- reportes de todos los candidatos;
- datos de otros estudiantes;
- el dataset completo.

## Restricciones

- Un segmento describe similitud, no rendimiento.
- `assignment_typicality` no es probabilidad.
- Si `requires_review=true`, evitar recomendaciones firmes.
- Las comparaciones solo son válidas si la cohorte usa la misma ventana temporal.
- Usar pseudónimos o eliminar `student_name` cuando no sea necesario.

## Implementación

- Modelo: [`ria06_patrones.py`](../../app/adapters/ml_models/ria06_patrones.py)
- Servicio: [`ria06_service.py`](../../app/application/services/ria06_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)
- Guía ampliada: [`RIA06_ANALISIS_PATRONES_GUIA.md`](../../RIA06_ANALISIS_PATRONES_GUIA.md)

