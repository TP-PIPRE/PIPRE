# Guía para implementar y conectar 30 retos por juego (60 en total)

Esta guía está dirigida al compañero y a la IA que continúen el desarrollo de PIPRE. Su lectura se exige desde `AGENTS.md` en la raíz para que la conexión entre reto y tablero forme parte del trabajo desde el inicio.

## Objetivo y estado de partida

La meta indicada es **30 retos de Neon Flow y 30 retos de TetriLogic: 60 en total**. Cada juego debe alcanzar sus propios 30 retos; no basta con sumar 60 con un reparto distinto. Si el equipo cambia la meta, actualizar esta guía y `AGENTS.md` en el mismo cambio.

En esta planificación, “ambos módulos” se refiere a los dos juegos. En el modelo del backend se conserva la jerarquía curso → módulo académico → lección → actividad; no reemplazarla por una lista independiente de niveles.

Estado del código al documentar esta guía:

| Juego | Curso oficial | Actividades oficiales conectadas | Plantillas | Avance |
|---|---|---|---|---|
| Neon Flow | `c001` | `act-c001-1`, `act-c001-2` | `neonflow-1`, `neonflow-2` | **2 de 30; faltan 28** |
| TetriLogic | `c002` | `act-c002-1`, `act-c002-2` | `tetrilogic-1`, `tetrilogic-2` | **2 de 30; faltan 28** |
| Total | Dos juegos | Cuatro actividades actuales | Cuatro plantillas actuales | **4 de 60; faltan 56** |

Este documento no crea los 56 restantes ni establece sus objetivos pedagógicos. Antes de cada lote, inventariar los retos ya incorporados para evitar duplicar trabajo y actualizar el conteo por juego y total al entregar.

## Asignar un tablero desde la interfaz

Para vincular una actividad existente con una de las plantillas ya implementadas:

1. Iniciar sesión como **docente o administrador**. La cuenta de estudiante puede jugar, pero no configurar tableros.
2. Entrar en **Retos** y pulsar **Retos** en el curso correspondiente.
3. Buscar la actividad y pulsar **Editar**.
4. En **Configuración del Simulador**, seleccionar el **Entorno** y después **Tablero del reto**.
5. Pulsar **Guardar cambios**. El módulo y la lección deben estar seleccionados; si faltan, crearlos primero en **Módulos y lecciones del curso**.
6. Comprobar desde **Mis cursos → curso → reto → Iniciar** que se abre el tablero elegido.

Entrar desde el enlace general **Simulador** sin haber elegido un curso no significa que falte un tablero. Esa pantalla debe invitar a seleccionar un reto desde **Mis cursos**. Si una actividad concreta sigue pendiente, su docente debe completar los pasos anteriores.

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
| Validación backend | `backend/src/main/java/com/pipre/backend/domain/entities/activity/Activity.java` | La plantilla nueva está admitida para su `environment`; se rechaza una combinación de otro juego. **La lista actual sólo admite los niveles 1 y 2: hay que ampliarla al añadir plantillas.** |
| Contrato y persistencia | `CreateActivityCommand`, `ActivityDTO`, `ActivityDtoMapper`, `ActivityJpaEntity`, `CreateActivityService`, `UpdateActivityService` y `apiModels.ts` | Los datos nuevos atraviesan todas las capas y sobreviven a crear, editar y volver a consultar. No añadir campos sólo en TypeScript. |
| Catálogo inicial y actualización | `CourseSeederService` y migraciones nuevas en `backend/src/main/resources/db/migration/` | Tanto una instalación nueva como una existente reciben los retos sin perder modificaciones del docente. |
| Editor docente | `frontend/src/ui/pages/DocenteRetosPage.tsx` | La plantilla se puede elegir; cambiar de entorno no conserva una plantilla incompatible; la lección seleccionada pertenece al módulo. |
| Lectura del currículo | `frontend/src/application/usecases/loadCourseActivities.ts` | Se cargan todas las actividades a través de módulos y lecciones, respetando paginación y orden. |
| Inicio de una actividad | `frontend/src/ui/pages/PaginaInicio.tsx` | **Iniciar** navega a `/simulador/:courseId?activity=:idActivity`, no sólo al curso. |
| Resolución del tablero | `frontend/src/ui/pages/Simulador.tsx` | Se comprueba que el ID pertenezca al curso y se resuelve su plantilla; no se reemplaza por otro reto cuando falta. |
| Ejecución | `NeonFlowStage.tsx`, `TetriLogicStage.tsx`, `NeonBoard.tsx`, `Board.tsx` y bandejas | Se consume la configuración elegida, se reinicia el estado al cambiar de actividad y se preservan los controles por teclado/toque/arrastre. |

Las cuatro entradas actuales de `LEVEL_TEMPLATES` no son un límite funcional del producto. Ampliar el registro y su validación de manera coordinada; no añadir comparaciones de nombres de curso o condiciones independientes para cada tarjeta.

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

**TetriLogic:** configurar dimensiones, celdas bloqueadas y objetivos por fila/columna. Revisar el inventario real de `TetriLogicStage`: actualmente se crea en `createInventory`. Una cuadrícula nueva no genera automáticamente las piezas necesarias. Si el reto necesita otro inventario, incorporarlo a la configuración tipada y a su consumo/reinicio, conservando los tableros existentes. Comprobar una colocación completa con `validatePlacement` y con las condiciones reales de victoria; el número total de celdas por sí solo no garantiza una solución.

Mantener los algoritmos existentes al crear contenido. Si un objetivo requiere nuevas mecánicas, tratarlo como un cambio funcional explícito y documentar su compatibilidad; no alterar silenciosamente las reglas para que un tablero imposible pase una prueba.

### 3. Conectar frontend y backend

Registrar la plantilla en `activityLevels.ts` y ampliar la validación de `Activity.java` en el mismo lote. Las familias de ID actuales son `neonflow-N` y `tetrilogic-N`; el ID es una clave del contrato, no un texto decorativo.

Ejemplo de los campos que ya soporta una actividad (el ID de lección debe existir):

```json
{
  "idLesson": "ID_REAL_DE_LA_LECCION",
  "name": "Nombre del reto",
  "description": "Objetivo e instrucciones coherentes con el tablero",
  "displayOrder": 2,
  "environment": "neonflow",
  "levelTemplate": "neonflow-2",
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

No modificar V1–V13 ya aplicadas. Consultar el último número de migración antes de crear la siguiente, porque otro compañero puede haber añadido una en paralelo. Conservar los IDs y claves foráneas existentes; un reto nuevo debe tener una lección real antes de insertarse. No asignar una plantilla por defecto a actividades personalizadas antiguas sin conocer su objetivo.

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
- `NeonLevelTemplates.test.ts`, `TetriLevelSolvability.test.tsx` y `SimulatorAccessibility.test.tsx`: solución de cada plantilla nueva con los motores reales, reinicio y controles alternativos.
- `ActivityMetadataContractTest.java`: plantilla/entorno compatibles, orden y conservación del contrato.
- Comprobación del catálogo completo: IDs únicos, total oficial por juego y conjunto, relaciones válidas, cada plantilla del backend resoluble en frontend y cada configuración referenciada existente. Al completar la meta, verificar **30 actividades oficiales jugables de Neon Flow y 30 de TetriLogic, 60 en conjunto**, sin contar duplicados ni actividades personales.
- Comprobación de actualización: los nuevos retos aparecen en una base que ya contiene los dos cursos y no se pierden cambios tras reiniciar.

Comandos de referencia desde la raíz, con los runtimes del proyecto disponibles:

```powershell
pnpm --dir frontend test:run
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

Consultar el [informe de contratos](Informe_Contratos_Frontend_Backend.md) para compatibilidad, migraciones y validaciones previas. Las cifras históricas de pruebas allí registradas no equivalen a haber ejecutado las pruebas de un lote nuevo.
