# Presentación de PIPRE con datos ficticios

El archivo [seed_simulador_demo.json](seed_simulador_demo.json) adapta una muestra del grado Tercero del JSON entregado. Define un aula, 12 estudiantes ficticios de tres perfiles, un docente, un administrador y acciones de ambos juegos. Los totales, la matriz de respuestas y los resultados estadísticos del archivo de origen permanecen como antecedentes del conjunto sintético. El archivo de presentación usa acciones compatibles con el servidor para que este calcule los resultados del panel.

## Abrir y cargar

Desde la raíz de PIPRE, con Docker Desktop en ejecución, inicia el entorno desechable.

```powershell
./scripts/demo-presentacion.ps1 -Action Start
```

Abre `http://127.0.0.1:15183`. El entorno usa una red propia y PostgreSQL en memoria, sin puertos de base de datos publicados. El importador verifica los identificadores del proyecto y de la red antes de conectarse. La fecha de referencia se fija al crear el entorno. Las partidas simuladas caen dentro del filtro habitual de los últimos 30 días.

| Rol | Cuenta ficticia |
|---|---|
| Administrador | `admin.demo@pipre.test` |
| Docente de 3.º A | `docente.demo@pipre.test` |
| Estudiante con mayor avance | `alumno01@pipre.test` |
| Estudiante de avance intermedio | `alumno06@pipre.test` |
| Estudiante en niveles iniciales | `alumno12@pipre.test` |

La contraseña de estas cuentas de demostración es `Pipre-Demo-2026!`. Los demás estudiantes usan `alumno02@pipre.test` a `alumno11@pipre.test` y la misma contraseña. Las cuentas y el aula llevan la marca `[DEMO]`.

Usa **Métricas** y selecciona **[DEMO] 3.º de secundaria · Sección A**. En **Pensamiento lógico**, TetriLogic aporta datos de las tres dimensiones. En **Participación**, compara ambos cursos y abre los valores de la serie. En **Uso del tutor** verás consejos predeterminados y entregas simuladas de IA. Cada texto simulado lleva la marca `[Simulación de IA]`. El generador de prueba se ejecuta únicamente durante la carga.

El docente puede abrir **Estudiantes** y elegir su aula. En **Métricas → Resumen**, aplica el filtro de un estudiante para ver su historial verificado. Luego entra con esa cuenta y abre **Mi Perfil** para contrastar el avance.

## Repetir, verificar y cerrar

```powershell
./scripts/demo-presentacion.ps1 -Action Import
Push-Location frontend
pnpm run test:e2e:run --browser electron --spec tests/e2e/demo-presentacion.cy.ts
Pop-Location
```

`Import` recupera cuentas por correo, el aula por nombre y los intentos y consejos por identificadores deterministas. La prueba reproduce acciones ordenadas sobre las plantillas oficiales y exige que el servidor valide las soluciones. También compara las estrellas, puntos y logros con cálculos hechos a partir de las acciones y coteja los informes de docente y administrador con los perfiles estudiantiles. Los intentos incompletos aportan participación y quedan fuera de las victorias. Si ya jugaste con las cuentas de demostración, sus registros adicionales pueden cambiar los totales previstos del guion.

Cuando termines la demostración, puedes retirar su base y contenedores con el comando siguiente.

```powershell
./scripts/demo-presentacion.ps1 -Action Stop
```

Este escenario cubre los cuatro apartados activos del panel. Los datos de pretest, postest, confiabilidad y pruebas inferenciales del archivo de origen pertenecen al conjunto sintético de investigación. La aplicación carece de un módulo digitalizado para importar esas evaluaciones. Los datos de presentación quedan separados de los registros de campo y de la instalación principal.

## Totales verificados al cargar

| Indicador | Resultado del aula |
|---|---:|
| Estudiantes activos | 12 |
| Sesiones iniciadas | 108 |
| Retos distintos por estudiante | 88 iniciados, 80 resueltos |
| Tasa de finalización | 90,91 % |
| Intentos hasta la primera resolución | 1,25 de media |
| Días activos por estudiante | 7,25 de media |
| Duración media de sesiones cerradas | 220,38 s |
| Estrellas y logros | 196 estrellas y 37 logros |
| Niveles por curso | 38 de Neon Flow y 42 de TetriLogic, sumados entre los estudiantes |
| Consejos | 181 predeterminados y 35 entregas simuladas de IA |

PostgreSQL conservó los mismos totales al repetir la carga. El importador verificó el acceso de las 14 cuentas de presentación, el aislamiento de permisos docentes y la coincidencia del panel con el progreso y el puntaje de los 12 perfiles.

Cypress aprobó el recorrido con administrador, docente y dos estudiantes. Comprobó el historial individual, las tres dimensiones, la serie de participación, las entregas del tutor y la vista previa bloqueada para el perfil inicial. También pasaron ESLint, la comprobación de tipos de Cypress y 24 pruebas unitarias seleccionadas del panel y el perfil.
