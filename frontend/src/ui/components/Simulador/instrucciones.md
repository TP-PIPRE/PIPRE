# **Prompt para Desarrollo Frontend - Proyecto PIPRE**

---

## **Contexto General**

El proyecto **PIPRE** está dirigido a **niños de primaria y jóvenes de secundaria (10-14 años)**. El enfoque es desarrollar un **simulador interactivo** con temáticas llamativas (batalla de robots, exploración espacial, laberinto mágico, carrera de obstáculos). El simulador debe:

- Permitir **dificultad adaptativa**.
- Ofrecer **feedback visual claro**.
- Soportar **retos personalizados** creados por docentes (categorizados por tema).
- Permitir a los niños **descargar sus retos personalizados** (no subirlos al sistema).
- Incluir un **header específico para docentes**, con el mismo diseño que el header para estudiantes pero adaptado a sus necesidades.

**El equipo de OpenCode se enfocará EXCLUSIVAMENTE en el desarrollo frontend**. Las APIs ya están definidas y documentadas en este prompt. **No es necesario implementar el backend ni las bases de datos**, solo consumir los endpoints proporcionados. Una vez que el backend esté listo (desarrollado por otro compañero), se hará el merge de las branches y el frontend debería conectarse sin problemas.

---

## **1. Matriz de Requerimientos por Capa (Frontend)**

### **Requerimientos Frontend (FE-01 a FE-11)**

El frontend debe implementar los siguientes componentes, cada uno con su dependencia correspondiente:

| **ID** | **Requerimiento**               | **Componente**           | **Dependencia**      |
| ------ | ------------------------------- | ------------------------ | -------------------- |
| FE-01  | Seleccionar grupo               | `GroupSelector`          | Groups API           |
| FE-02  | Mostrar actividades             | `ActivityList`           | Activities API       |
| FE-03  | Configurar entorno              | `SimulatorProvider`      | Activities API       |
| FE-04  | Ejecutar simulación             | `SimulatorProvider`      | Robotics API         |
| FE-05  | Mostrar resultado de simulación | `SimulationResultPanel`  | Robotics API         |
| FE-06  | Mostrar editor Blockly          | `CodeViewTabs`           | Simulador (Blockly)  |
| FE-07  | Mostrar PSeInt                  | `PSeIntViewer`           | RIA12 (API externa)  |
| FE-08  | Mostrar feedback de IA          | `CodeAwareFeedbackPanel` | IA API               |
| FE-09  | Mostrar misiones                | `MissionPanel`           | Activities API       |
| FE-10  | Mostrar posiciones              | `ScenarioMap`            | Activities API       |
| FE-11  | Consultar historial             | `SimulationHistory`      | Activity Results API |

---

## **2. Contratos de Datos entre Capas (Frontend ↔ Backend)**

### **2.1. Frontend → Backend (Request)**

#### **Crear Actividad (`POST /api/v1/activities`)**

```json
{
  "idLesson": "uuid",
  "name": "string",
  "complexity": "EASY | MEDIUM | HARD",
  "difficulty": "EASY | MEDIUM | HARD",
  "logicLevel": number,
  "type": "robotics",
  "environment": "battle | space | maze | obstacle",
  "missions": [
    {
      "id": "string",
      "title": "string",
      "objective": "string",
      "maxBlocks": number
    }
  ],
  "startingPosition": {
    "x": number,
    "z": number
  },
  "targetPosition": {
    "x": number,
    "z": number
  }
}
```

#### **Registrar Simulación (`POST /api/v1/robotics-simulations`)**

```json
{
  "idStudent": "uuid",
  "idActivity": "uuid",
  "blocklyCode": "<xml>...</xml>",
  "pseudocode": "string",
  "pseintDiagram": "string",
  "blocksUsage": number,
  "codeUsage": number,
  "sensorError": number,
  "resolutionTime": number,
  "environment": "battle | space | maze | obstacle",
  "missions": [
    {
      "id": "string",
      "title": "string",
      "objective": "string",
      "maxBlocks": number
    }
  ],
  "startingPosition": {
    "x": number,
    "z": number
  },
  "targetPosition": {
    "x": number,
    "z": number
  },
  "result": "SUCCESS | FAILURE | PARTIAL"
}
```

---

### **2.2. Backend → Frontend (Response)**

#### **Resultado de Simulación (`GET /api/v1/robotics-simulations/{id}`)**

```json
{
  "idSimulation": "uuid",
  "student": {},
  "activity": {},
  "environment": "battle | space | maze | obstacle",
  "missions": [
    {
      "id": "string",
      "title": "string",
      "objective": "string",
      "maxBlocks": number
    }
  ],
  "startingPosition": {
    "x": number,
    "z": number
  },
  "targetPosition": {
    "x": number,
    "z": number
  },
  "result": "SUCCESS | FAILURE | PARTIAL",
  "predictedScore": number
}
```

---

## **3. Tipos de Datos Clave**

### **3.1. Tipos de Entorno (`Environment`)**

```typescript
type Environment = "battle" | "space" | "maze" | "obstacle";
```

### **3.2. Definición de Misión (`Mission`)**

```typescript
interface Mission {
  id: string;
  title: string;
  objective: string;
  maxBlocks: number;
}
```

---

## **4. Matriz de Comunicación entre Servicios (Flujo Frontend)**

### **4.1. Flujo de Creación de Actividad**

- **Frontend** → **Backend**: `POST /api/v1/activities`
- **Backend** → **Base de Datos**: `INSERT activities`

### **4.2. Flujo de Consulta de Actividades**

- **Frontend** → **Backend**: `GET /api/v1/groups/{id}/activities`
- **Backend** → **Base de Datos**: `SELECT activities`

### **4.3. Flujo de Generación PSeInt**

- **Frontend** → **IA**: `POST /ria12/pseint`
- **IA** → **Frontend**: `pseudocode + pseint_diagram`

### **4.4. Flujo de Simulación**

- **Frontend** → **Backend**: `POST /api/v1/robotics-simulations`
- **Backend** → **Base de Datos**: `INSERT robotics_simulations`

### **4.5. Flujo de Registro de Resultados**

- **Frontend** → **Backend**: `POST /api/v1/activity-results`
- **Backend** → **Base de Datos**: `INSERT activity_results`

### **4.6. Flujo de Evaluación IA**

- **Frontend** → **Backend**: `POST /api/v1/performance/rating`
- **Backend** → **IA**: `POST /code-feedback/analyze`
- **IA** → **Backend**: `Feedback JSON`
- **Backend** → **Frontend**: `Feedback JSON`

---

## **5. Matriz de Dependencias Técnicas (Frontend)**

| **Componente**           | **Depende de**             |
| ------------------------ | -------------------------- |
| `GroupSelector`          | Groups API                 |
| `ActivityList`           | Activities API             |
| `SimulatorProvider`      | Activities API + IA API    |
| `CodeViewTabs`           | Simulador (Blockly)        |
| `PSeIntViewer`           | RIA12 (API externa)        |
| `CodeAwareFeedbackPanel` | IA API                     |
| `MissionPanel`           | Activity Context           |
| `ScenarioMap`            | Environment + Positions    |
| `BattleEnvironment`      | `environment = "battle"`   |
| `SpaceEnvironment`       | `environment = "space"`    |
| `MazeEnvironment`        | `environment = "maze"`     |
| `ObstacleEnvironment`    | `environment = "obstacle"` |
| `SimulationHistory`      | Activity Results API       |

---

## **6. Relación de Entidades Involucradas (Contexto)**

- **courses**
  - modules
  - lessons
  - activities
  - robotics_simulations
  - activity_results
- **users**
  - robotics_simulations
  - activity_results
  - help_requests
  - group_students
- **groups**
  - group_students

---

## **7. Endpoints Clave para Consumir (Frontend)**

### **Actividades**

- `POST /api/v1/activities` (Crear)
- `GET /api/v1/activities/{id}` (Obtener)
- `PUT /api/v1/activities/{id}` (Actualizar)
- `DELETE /api/v1/activities/{id}` (Eliminar - Soft Delete)
- `GET /api/v1/groups/{id}/activities` (Actividades por grupo)

### **Simulaciones Robóticas**

- `POST /api/v1/robotics-simulations` (Registrar)
- `GET /api/v1/robotics-simulations/{id}` (Consultar)

### **Resultados de Actividades**

- `POST /api/v1/activity-results` (Registrar)
- `GET /api/v1/activity-results/user/{idStudent}` (Historial por estudiante)

### **Solicitudes de Ayuda**

- `POST /api/v1/help-requests` (Registrar)

### **Grupos**

- `GET /api/v1/groups` (Listar grupos)

### **IA / Feedback**

- `POST /code-feedback/analyze` (Analizar código Blockly, generar score, detectar patrones, evaluar misiones, analizar comportamiento)
- `GET /features/aggregate/student/{id}` (Features por estudiante)
- `GET /features/aggregate/group/{id}` (Features por grupo)
- `POST /ria12/pseint` (Generar pseudocódigo y diagrama Mermaid)

---

## **8. Instrucciones Específicas para OpenCode**

1. **Enfoque**: Desarrollar **solo el frontend** del proyecto PIPRE, consumiendo las APIs definidas.
2. **Tecnologías**: Usar **React/TypeScript** (o el framework acordado) para los componentes.
3. **Estructura de Carpetas**: Seguir la estructura estándar del proyecto (ej: `src/components/`, `src/pages/`, `src/services/`).
4. **Componentes Clave**: Implementar los componentes listados en la **Matriz de Requerimientos (FE-01 a FE-11)**.
5. **Contratos de Datos**: Asegurar que las requests y responses coincidan con los esquemas JSON proporcionados.
6. **Entornos**: Los 4 tipos de entorno (`battle`, `space`, `maze`, `obstacle`) deben renderizarse visualmente de forma distintiva.
7. **Blockly y PSeInt**: Integrar el editor **Blockly** para la programación visual y el visor **PSeInt** para pseudocódigo.
8. **Feedback de IA**: Mostrar el feedback generado por la IA en el componente `CodeAwareFeedbackPanel`.
9. **Header para Docentes**: Crear un header específico para docentes, con el mismo diseño que el header para estudiantes pero adaptado.
10. **Dificultad Adaptativa**: El simulador debe ajustar la dificultad según el rendimiento del estudiante (usar `logicLevel` y `difficulty` de las actividades).
11. **Retos Personalizados**: Permitir a los docentes **crear retos personalizados** (categorizados por tema) y a los niños **descargar sus retos** (no subirlos al sistema).
12. **Historial**: Implementar la visualización del historial de simulaciones y resultados.

---

## **9. Entregables Esperados**

- Código fuente de los componentes frontend.
- Integración con las APIs usando **Axios** o **Fetch**.
- Pruebas básicas de conexión con los endpoints (pueden usarse mocks temporalmente).
- Documentación breve de cómo conectar el frontend con el backend una vez que este esté listo.

---

## **10. Notas Finales**

- **No implementar backend ni base de datos**: Solo consumir los endpoints proporcionados.
- **Asumir que las APIs estarán disponibles**: Una vez que el backend esté listo, el frontend debería conectarse sin modificaciones.
- **Priorizar la experiencia de usuario**: Diseño atractivo para niños de 10-14 años, con feedback visual claro.
- **Validar datos**: Asegurar que los datos enviados a las APIs cumplan con los esquemas definidos.

---

**¿Preguntas?** Si algo no queda claro o necesitas más detalles sobre algún componente o flujo, avísame para ajustar el prompt.
