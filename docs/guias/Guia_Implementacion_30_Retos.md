# Guía para implementar y conectar 30 retos por juego (60 en total)

**Guía vigente, revisada el 30/10/2026.** [Estado actual](../ESTADO_ACTUAL.md) · [Contratos](Contratos_Frontend_Backend.md) · [Instrucciones de agentes](../../AGENTS.md).

## Objetivo y catálogo actual

La meta de contenido es **30 retos por juego, 60 en total**. Está implementada en el catálogo integrado: Neon Flow `neonflow-v2-1`…`30` y TetriLogic `tetrilogic-v2-1`…`30`. El [informe de integración](../informes/Integracion_TetriLogic_NeonFlow_ML.md) recoge las verificaciones por tablero y su conexión persistida.

Neon Flow usa actividades `act-c001-v2-1/2` y `act-c001-3`…`30`; TetriLogic usa `act-c002-1`…`30`. Los prototipos Neon Flow conservados y las plantillas/alias compatibles no se cuentan otra vez. Una base local existente puede tener 62 actividades, de las cuales 60 son oficiales del catálogo integrado.

«Ambos módulos» se refiere a los dos juegos; el modelo mantiene curso → módulo académico → lección → actividad. Antes de otro lote contrastar código y base del entorno, preservar personalizaciones y no duplicar niveles existentes. Cumplir la cantidad no equivale a entregar el SSD integral, puntuación, progreso ni validación pedagógica.

TetriLogic activo verifica sólo límites, colisiones y conteos exactos de filas/columnas; permite excesos intermedios. Las condiciones históricas de los JSON v2 se conservan pero no se reactivan. La trazabilidad de ambos juegos está autorizada; `data-science` continúa excluido.

## Asignar un tablero desde la interfaz

Para vincular una actividad existente con una de las plantillas ya implementadas:

1. Iniciar sesión como **docente o administrador**. La cuenta de estudiante puede jugar, pero no configurar tableros.
2. Entrar en **Retos** y pulsar **Retos** en el curso correspondiente.
3. Buscar la actividad y pulsar **Editar**.
4. En **Configuración del Simulador**, seleccionar el **Entorno** y después **Tablero del reto**.
5. Pulsar **Guardar cambios**. El módulo y la lección deben estar seleccionados; si faltan, crearlos primero en **Módulos y lecciones del curso**.
6. Comprobar desde **Mis cursos → curso → reto → Iniciar** que se abre el tablero elegido.

El enlace general **Simulador** abre práctica TetriLogic independiente. Para jugar una actividad concreta, elegirla desde **Mis cursos**; una actividad pendiente necesita la configuración docente descrita arriba.

El selector sólo ofrece tableros implementados. Añadir un reto nuevo con una geometría distinta requiere seguir las instrucciones de desarrollo de esta guía; editar el nombre o las misiones no crea un tablero nuevo.

## Cuándo se considera terminado un reto

Un reto debe cumplir este recorrido completo:

1. Existe en el backend como actividad de una lección real, dentro del módulo y curso correctos.
2. Conserva tras recargar su nombre, descripción, orden, entorno, plantilla y misiones.
3. Su `levelTemplate` está reconocido tanto por la API como por el registro del frontend.
4. Aparece en el catálogo y en el selector del simulador; al pulsar **Iniciar** se envía su `idActivity`.
5. Se abre **el tablero de esa actividad**, con geometría, piezas/componentes, restricciones e instrucciones coherentes con su objetivo.
6. Tiene al menos una solución verificada con las mismas funciones de colocación, recorrido y victoria que utiliza la aplicación.

Crear 60 filas, títulos o tarjetas sin esos vínculos no completa la meta. Tampoco sirve apuntar por omisión todos los retos al primer tablero. Si se reutiliza intencionalmente una plantilla, documentar la diferencia pedagógica y comprobar que el objetivo de cada actividad se puede cumplir en ella.

## Archivos que deben mantenerse conectados

| Responsabilidad | Archivo o componente | Comprobación necesaria |
|---|---|---|
| Configuración jugable | `frontend/src/shared/constants/levelConfigs.ts` y tipos de `NeonFlow`/`TetriLogic` | El tablero está definido con sus dimensiones, obstáculos, emisor/receptores o restricciones. |
| Registro de plantillas | `frontend/src/application/usecases/activityLevels.ts` | Hay una entrada con ID estable, juego correcto y configuración existente. No usar un índice de array fuera de rango. |
| Validación backend | `backend/src/main/java/com/pipre/backend/domain/entities/activity/Activity.java` | La plantilla nueva está admitida para su `environment`; se rechaza una combinación de otro juego. Reconoce treinta v2 por juego, prototipos y alias compatibles, sin contarlos como retos nuevos. |
| Contrato y persistencia | `CreateActivityCommand`, `ActivityDTO`, `ActivityDtoMapper`, `ActivityJpaEntity`, `CreateActivityService`, `UpdateActivityService` y `apiModels.ts` | Los datos nuevos atraviesan todas las capas y sobreviven a crear, editar y volver a consultar. No añadir campos sólo en TypeScript. |
| Catálogo inicial y actualización | `CourseSeederService` y migraciones nuevas en `backend/src/main/resources/db/migration/` | Tanto una instalación nueva como una existente reciben los retos sin perder modificaciones del docente. |
| Editor docente | `frontend/src/ui/pages/DocenteRetosPage.tsx` | La plantilla se puede elegir; cambiar de entorno no conserva una plantilla incompatible; la lección seleccionada pertenece al módulo. |
| Lectura del currículo | `frontend/src/application/usecases/loadCourseActivities.ts` | Se cargan todas las actividades a través de módulos y lecciones, respetando paginación y orden. |
| Inicio de una actividad | `frontend/src/ui/pages/PaginaInicio.tsx` | **Iniciar** navega a `/simulador/:courseId?activity=:idActivity`, no sólo al curso. |
| Resolución del tablero | `frontend/src/ui/pages/Simulador.tsx` | Se comprueba que el ID pertenezca al curso y se resuelve su plantilla; no se reemplaza por otro reto cuando falta. |
| Ejecución | `NeonFlowStage.tsx`, `TetriLogicStage.tsx`, `NeonBoard.tsx`, `Board.tsx` y bandejas | Se consume la configuración elegida, se reinicia el estado al cambiar de actividad y se preservan los controles por teclado/toque/arrastre. |

El registro `LEVEL_TEMPLATES` debe evolucionar junto con las configuraciones y la validación backend. Ambos juegos exportan sus treinta configuraciones desde `levelConfigs.ts`; sus v2 se leen desde `GET /api/v1/{neonflow|tetrilogic}/templates/{templateId}`, persistidas por V14/V16. Ampliar registro, API y versión de contenido de manera coordinada; no añadir comparaciones de nombres de curso o condiciones independientes para cada tarjeta.

## Procedimiento para añadir un lote

### 1. Definir cada reto antes de programarlo

Registrar, al menos:

- Juego, curso/módulo/lección y objetivo pedagógico.
- ID estable de la actividad y de su plantilla; no reutilizar el ID de otra actividad ni cambiar el significado de una plantilla publicada.
- `displayOrder` positivo, dificultad y descripción.
- Geometría, restricciones, componentes/piezas disponibles y una solución reproducible.
- Misiones e instrucciones acordes con el tablero. No presentar una regla sólo escrita en una misión como si estuviera validada por el motor.

El orden se presenta por curso. Los empates actuales tienen desempate estable, pero el catálogo oficial debería mantener un orden claro y deliberado. Las actividades personalizadas de docentes no cuentan como nuevas actividades oficiales para completar los 30 de cada juego.

### 2. Implementar el tablero y verificar su solución

**Neon Flow:** configurar dimensiones, obstáculos, emisor, dirección, color y receptores. Verificar recorrido y solución con `raycast`. No colocar obstáculos sobre el emisor/receptor ni crear objetivos incompatibles con el comportamiento real del motor.

**TetriLogic:** el inventario v2 forma parte de la configuración tipada y persistida. El catálogo publicado mantiene tres o cuatro piezas y sus datos históricos. El modo activo usa `freePlay.ts` y `lineGoals.ts`: tamaño, inventario y objetivos de ambos ejes, incluidos ceros, sin reactivar celdas obligatorias, precedencias, contactos ni giros finales exigidos. Una cuadrícula no crea por sí sola piezas. Verificar soluciones con las reglas activas; el solver histórico comprueba compatibilidad adicional del contenido, no define la experiencia actual.

Mantener los algoritmos existentes al crear contenido. Si un objetivo requiere nuevas mecánicas, tratarlo como un cambio funcional explícito y documentar su compatibilidad; no alterar silenciosamente las reglas para que un tablero imposible pase una prueba.

### 3. Conectar frontend y backend

Registrar la plantilla en `activityLevels.ts` y ampliar la validación de `Activity.java` en el mismo lote. Las familias oficiales actuales son `neonflow-v2-N` y `tetrilogic-v2-N`; los alias/prototipos anteriores conservan su significado; el ID es una clave del contrato, no un texto decorativo.

Ejemplo de los campos que ya soporta una actividad (el ID de lección debe existir):

```json
{
  "idLesson": "ID_REAL_DE_LA_LECCION",
  "name": "Nombre del reto",
  "description": "Objetivo e instrucciones coherentes con el tablero",
  "displayOrder": 2,
  "environment": "neonflow",
  "levelTemplate": "neonflow-v2-2",
  "difficulty": "MEDIUM",
  "logicLevel": 2,
  "missions": []
}
```

El ejemplo utiliza una plantilla existente; sustituirla por una nueva únicamente después de implementarla y registrarla en ambas capas. `logicLevel` admite los niveles 1–3 del contrato actual. No confundirlo con el número del reto.

`startingPosition`, `targetPosition` y el texto de las misiones no sustituyen a `levelTemplate`: el motor usa la configuración del tablero registrado. No aparentar que esos campos cambian la geometría si el simulador no los consume.

### 4. Incorporar datos sin perder los existentes

**Atención al seeder:** `seedCourses()` sólo llama a la creación de Neon Flow o TetriLogic si no existe `c001` o `c002`. Añadir actividades dentro de esos métodos no actualiza un curso que ya esté en PostgreSQL.

Por tanto, un lote debe cubrir:

1. Instalaciones nuevas: datos iniciales coherentes con el catálogo actualizado.
2. Instalaciones existentes: nueva migración aditiva o mecanismo de inicialización idempotente, conforme a las convenciones del repositorio, que añada exclusivamente las actividades oficiales faltantes y sus relaciones necesarias.
3. Reinicios y reintentos: sin duplicados ni sobrescritura de retos editados. Nunca borrar un curso para obligar al seeder a ejecutarse.

No modificar migraciones ya aplicadas, incluidas V1–V17. Consultar el último número antes de crear la siguiente, porque otro compañero puede haber añadido una en paralelo. Conservar los IDs y claves foráneas; un reto nuevo debe tener una lección real. No asignar plantillas a actividades personalizadas antiguas sin conocer su objetivo. El generador del catálogo v2 queda congelado tras publicar V14/V16: usar `--check`; nuevas geometrías requieren nueva versión y migración.

### 5. Comprobar el recorrido del usuario

- Docente/administrador: crear o editar, guardar, cerrar, recargar y comprobar que conserva plantilla, descripción, misiones, orden y lección.
- Estudiante: abrir el curso, elegir ese reto y comprobar el `idActivity` de la URL, el título, las instrucciones y el tablero concreto.
- Cambiar entre dos retos del mismo juego y entre juegos, si el curso los combina. No conservar piezas, estado de victoria o cronómetro de la actividad anterior.
- Verificar enlaces directos y retorno al catálogo. Mantener explícitos los estados de carga, error, actividad ajena al curso y plantilla pendiente.
- Revisar móvil, tablet, teclado, controles táctiles y desplazamiento dentro de tablas/formularios donde corresponda.

## Pruebas y aceptación del lote

Extender las pruebas existentes; no limitar la cobertura a los dos primeros niveles:

- `ActivitySimulator.test.tsx`: resuelve actividad y tablero correctos desde un curso de UUID, rechaza otra actividad/plantilla desconocida.
- `ChallengeEditorContract.test.tsx`: guarda y conserva metadatos, respeta lección/módulo y acepta 201 vacío.
- `NeonFlowCatalogInteraction.test.tsx`, `NeonFlowLevelSolvability.test.ts`, `TetriFreeInteraction.test.tsx`, `TetriLineGoals.test.tsx` y `SimulatorAccessibility.test.tsx`: soluciones con reglas activas y controles alternativos. Las pruebas del motor histórico se distinguen como compatibilidad.
- `ActivityMetadataContractTest.java`: plantilla/entorno compatibles, orden y conservación del contrato.
- Comprobación del catálogo completo: IDs únicos, total oficial por juego y conjunto, relaciones válidas, cada plantilla del backend resoluble en frontend y cada configuración referenciada existente. Al completar la meta, verificar **30 actividades oficiales jugables de Neon Flow y 30 de TetriLogic, 60 en conjunto**, sin contar duplicados ni actividades personales.
- Comprobación de actualización: los nuevos retos aparecen en una base que ya contiene los dos cursos y no se pierden cambios tras reiniciar.

Comandos de referencia desde la raíz, con los runtimes del proyecto disponibles:

```powershell
pnpm --dir frontend test:run --maxWorkers=2 --testTimeout=20000
pnpm --dir frontend build
pnpm --dir frontend lint
```

Para el backend, ejecutar Maven con Java 21 desde `backend/` (`mvn test` o el wrapper del repositorio). Un build de Docker con `-DskipTests` no cuenta como ejecución de pruebas. Si se actualizan los contenedores locales, limitar la operación a los servicios necesarios y conservar la exclusión de `data-science`.

En el PR o entrega de cada lote incluir:

```markdown
- [ ] Actividades oficiales añadidas: IDs y juego.
- [ ] Plantillas nuevas definidas, registradas en frontend y admitidas por backend.
- [ ] Cada reto abre el tablero elegido desde el catálogo y por enlace directo.
- [ ] Solución comprobada para cada tablero nuevo con reglas reales.
- [ ] Crear/editar/recargar conserva metadatos y selección de lección.
- [ ] Instalaciones nuevas y existentes incorporan el lote sin duplicar ni sobrescribir.
- [ ] Conteo actualizado: Neon Flow __ de 30 + TetriLogic __ de 30 = __ de 60 oficiales jugables.
- [ ] Pruebas ejecutadas y resultados reales; fallos o limitaciones indicados.
```

## Límites vigentes

`data-science`, modelos, proxy y endpoints de IA continúan fuera del alcance, salvo que el usuario cambie expresamente esa indicación. Las instrucciones anteriores no autorizan modificar esas partes.

Puntuación, XP, estrellas, recompensas y progreso automático siguen pendientes de una rúbrica. Guardar telemetría no acredita que se haya actualizado la calificación o el perfil del estudiante. No prometer esas funciones como parte de un reto conectado hasta que su contrato y reglas estén definidos e implementados.

Consultar los [contratos vigentes](Contratos_Frontend_Backend.md) y el [informe histórico de contratos](../historial/Informe_Contratos_Frontend_Backend.md) para distinguir funcionamiento y evidencias previas. Las cifras históricas de pruebas allí registradas no equivalen a haber ejecutado las pruebas de un lote nuevo.
