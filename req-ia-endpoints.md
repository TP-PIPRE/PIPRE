# Endpoints faltantes en la API de IA

La API desplegada en `https://pipre-ml-ia.yoshua-cloud.dedyn.io` **no tiene** los siguientes endpoints que el frontend necesita para las features FE-07, FE-08 y agregación de features.

## 1. POST /ria12/pseint

Genera pseudocódigo PSeInt y un diagrama de flujo Mermaid a partir de código Blockly.

**Request:**
```json
{
  "blockly_code": "mover_adelante(10)\ngirar(90)\nmover_adelante(20)"
}
```

**Response:**
```json
{
  "pseudocode": "Proceso principal\n  mover_adelante(10)\n  girar(90)\n  mover_adelante(20)\nFinProceso",
  "pseint_diagram": "graph TD\n  A[Inicio] --> B[mover_adelante(10)]\n  B --> C[girar(90)]\n  C --> D[mover_adelante(20)]\n  D --> E[Fin]"
}
```

**Usado por:** FE-07 PSeIntViewer + CodeViewTabs

---

## 2. POST /code-feedback/analyze

Analiza el código Blockly y el pseudocódigo del estudiante, devolviendo feedback pedagógico y un puntaje predecido.

**Request:**
```json
{
  "id_student": "uuid-del-estudiante",
  "id_activity": "uuid-de-la-actividad",
  "blockly_code": "...",
  "pseudocode": "...",
  "pseint_diagram": "...",
  "ml_features": {
    "attempts": 3,
    "errors": 1,
    "help_requested": 2,
    "ai_interactions": 5
  },
  "challenge_context": {
    "title": "Misión: Cruzar el puente",
    "description": "Usa los bloques de movimiento para...",
    "max_blocks": 10,
    "environment": "obstacle",
    "difficulty": "MEDIUM",
    "missions": [{"id": "m1", "title": "Llegar al otro lado"}],
    "starting_position": {"x": 0, "z": 0},
    "target_position": {"x": 30, "z": 0}
  }
}
```

**Response:**
```json
{
  "hints": ["Intenta usar el bloque 'avanzar' con distancia 10", "Revisa la orientación del robot después del giro"],
  "predicted_score": 75,
  "detected_patterns": ["movimiento_lineal", "giro_simple"],
  "mission_feedback": {
    "m1": "Completaste la primera misión correctamente"
  },
  "environment_feedback": {
    "obstacle_avoidance": "Buena detección de obstáculos"
  }
}
```

**Usado por:** FE-08 CodeAwareFeedbackPanel

---

## 3. GET /features/aggregate/student/{idStudent}

Devuelve las features agregadas de un estudiante para los modelos de IA.

**Response:**
```json
{
  "id_student": "uuid",
  "attempts": 15,
  "errors": 3,
  "logical_level": "intermedio",
  "ai_interactions": 8,
  "help_requested": 5,
  "completed_activities": 7,
  "inactive_days": 2,
  "success_rate": 0.8,
  "score": 85
}
```

## 4. GET /features/aggregate/group/{idGroup}

Devuelve las features agregadas de todos los estudiantes de un grupo.

**Response:**
```json
[
  {
    "id_student": "uuid-1",
    "attempts": 15,
    "errors": 3,
    "logical_level": "intermedio",
    "ai_interactions": 8,
    "help_requested": 5,
    "completed_activities": 7,
    "inactive_days": 2,
    "success_rate": 0.8,
    "score": 85
  }
]
```

---

## Endpoints existentes (no tocar)

| Endpoint | Método | Estado |
|----------|--------|--------|
| `/health` | GET | ✅ |
| `/ria01/predict` | POST | ✅ |
| `/ria01/info` | GET | ✅ |
| `/ria03/recommend` | POST | ✅ |
| `/ria03/info` | GET | ✅ |
| `/ria04/difficulty` | POST | ✅ |
| `/ria04/info` | GET | ✅ |
| `/ria08/anomaly` | POST | ✅ |
| `/ria08/info` | GET | ✅ |
| `/ria10/pedagogical` | POST | ✅ |
| `/ria10/info` | GET | ✅ |
| `/ria11/time` | POST | ✅ |
| `/ria11/info` | GET | ✅ |
