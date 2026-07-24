# RIA07 - Riesgo y anomalías

## Propósito

RIA07 prioriza estudiantes que pueden requerir atención y detecta estados
atípicos respecto de una cohorte de referencia. Combina señales educativas con
Isolation Forest para generar una alerta explicable para el docente.

No usa una secuencia histórica individual. Sí necesita una cohorte para
escalado, percentiles, umbrales y detección de rareza.

## Funcionamiento

- Versión: `ria07-risk-anomaly-v3.0`.
- Técnica: índice heurístico de riesgo más Isolation Forest.
- `risk_score` es un índice de atención de 0 a 100.
- `anomaly_score` es un percentil de rareza respecto a la cohorte.
- Una anomalía positiva no se convierte automáticamente en riesgo.
- Los niveles son `low`, `medium` y `high`.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria07/anomaly` | Evaluar un estudiante. |
| `POST` | `/ria07/early-warning` | Contrato individual orientado a alertas. |
| `POST` | `/ria07/early-warning/batch` | Priorizar hasta 500 estudiantes. |
| `GET` | `/ria07/info` | Consultar configuración, umbrales y cohorte. |

Aliases temporales bajo `/ria08/anomaly` y `/ria08/early-warning`.

### Entrada

```json
{
  "student_id": "student-1",
  "student_name": "Estudiante 1",
  "attempts": 6,
  "errors": 3,
  "score": 72,
  "inactive_days": 2,
  "completed_activities": 8,
  "success_rate": 0.72,
  "help_requested": 1
}
```

`success_rate` es opcional; si falta, se deriva explícitamente de `score`.

### Salida relevante

- `risk_level`, `risk_label` y `risk_score`.
- `anomaly` y `anomaly_score`.
- `reasons` y `evidence`.
- `teacher_recommendation`.
- Banderas de procedencia:
  `student_history_used=false` y `reference_cohort_used=true`.
- El lote incluye resumen normal/atención/crítico y filas priorizadas.

## Contexto recomendado para una IA generativa

```json
{
  "ria": "RIA07",
  "risk_level": "medium",
  "risk_label": "Requiere atención",
  "risk_score": 67.5,
  "anomaly": true,
  "anomaly_score": 88.0,
  "reasons": ["Inactividad alta respecto de la cohorte."],
  "evidence": {
    "inactive_days": 14,
    "attempts": 6,
    "errors": 3,
    "score": 72,
    "completed_activities": 8,
    "help_requested": 1
  },
  "teacher_recommendation": "Revisar continuidad y contactar al estudiante.",
  "student_history_used": false,
  "reference_cohort_used": true,
  "instruction": "Redactar una alerta prudente basada solo en la evidencia."
}
```

Enviar nivel, puntajes, razones, evidencia y recomendación. No es necesario
enviar pesos internos, percentiles de toda la cohorte ni datos de otros
estudiantes.

## Restricciones

- `risk_score` no es probabilidad de abandono.
- `anomaly_score` no es probabilidad ni métrica de calidad.
- Rareza no implica necesariamente dificultad.
- No generar diagnósticos psicológicos, médicos o disciplinarios.
- La decisión y el contacto final corresponden al docente.

## Implementación

- Modelo: [`ria07_riesgo_anomalias.py`](../../app/adapters/ml_models/ria07_riesgo_anomalias.py)
- Servicio: [`ria07_service.py`](../../app/application/services/ria07_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)
- Guía ampliada: [`RIA07_RIESGO_ANOMALIAS_GUIA.md`](../../RIA07_RIESGO_ANOMALIAS_GUIA.md)

