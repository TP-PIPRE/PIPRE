# Pendientes y continuidad de TetriLogic según el SSD

> **Prioridad vigente tras la última petición del 28/10/2026:** [manipulación directa con objetivos por filas y columnas](TetriLogic_Filas_Columnas.md). Se restaura únicamente esa condición de completar el reto; las demás restricciones siguen excluidas. Intentos, puntuación, pistas y progresión de este archivo son planificación histórica, **no una autorización para incorporarlos**. JSON/migraciones v2 permanecen intactos y la confirmación de éxito es local, sin progreso persistido.

Checkpoint del 26 de octubre de 2026. Leer primero `AGENTS.md`, el [informe de implementación](Informe_TetriLogic_30_Retos.md) y la [guía de retos](Guia_Implementacion_30_Retos.md). Este archivo permite continuar sin volver a generar ni duplicar los treinta tableros implementados.

## Trabajo ya incorporado al código

Treinta plantillas `tetrilogic-v2-1`…`tetrilogic-v2-30`, inventarios específicos, reglas, pistas estáticas, solución verificada de cada tablero, conexión con editor/catálogo/simulador y persistencia JSONB. V14 incorpora el catálogo y V15 contempla los dos prototipos originales con descripción nula. Ambas están aplicadas en PostgreSQL local, con treinta actividades vinculadas a sus treinta configuraciones. Permanecen las dos plantillas anteriores por compatibilidad.

Neon Flow conserva dos retos; faltan 28 de ese juego para llegar a 60 oficiales. No modificar `data-science`, modelos, endpoints, proxy ni contenedor sin nueva autorización expresa. El SSD adjunto no levanta esa restricción.

## 1 PostgreSQL y despliegue local: validación cerrada

- [x] Consultar la migración de la rama destino: V13 en la revisión remota de esta entrega; no había colisión con V14/V15. Una migración aplicada no se edita ni se regenera.
- [x] Iniciar Docker con autorización expresa posterior del usuario. En esta continuación se iniciaron exclusivamente PostgreSQL, backend y frontend de PIPRE; el contenedor de `data-science` quedó detenido y con la misma identidad/estado antes y después.
- [x] Guardar respaldo antes de V14: `pipre-before-tetrilogic-20261026.sql`, 35 541 bytes, en los artefactos de la sesión. No se borraron cursos ni volúmenes para migrar.
- [x] Ejecutar V14/V15 en PostgreSQL 16.15: 46 comprobaciones sobre seis bases aisladas, instalación nueva, V13 con prototipos originales/editados, descripciones nulas y rollback/reintento transaccional. Verificados JSONB, claves foráneas, configuraciones e historial de resultados/simulaciones.
- [x] Aplicar V14/V15 mediante Flyway en la base local existente y verificar treinta actividades oficiales enlazadas a sus treinta plantillas v2. La comparación con el respaldo aprobó seis comprobaciones de conservación; se añadieron sólo 28 actividades y 28 misiones. Los prototipos editados siguen protegidos por las condiciones de las migraciones.
- [x] Reconstruir y actualizar sólo backend/frontend usando `docker compose -f docker-compose.local.yaml up --build -d --no-deps backend frontend`. PostgreSQL conserva su volumen. No se incluyó `ml-ia` ni se ejecutó un `up` general.
- [x] Verificar 47 comprobaciones HTTP sobre Docker/PostgreSQL, permisos y ciclo crear/editar/guardar/recargar. En navegador se creó curso/módulo/lección/reto temporal, se cambió plantilla 1 → 30 con metadatos/misión y se recargó; el estudiante abrió el tablero 6×6 correcto. Se completaron los retos oficiales 1 y 30, se continuó del 1 al 2 con estado nuevo y se reintentó el 30 con inventario/métricas restaurados. Los demás controles también tienen cobertura de interfaz automatizada. Los dos cursos temporales de las verificaciones HTTP/navegador fueron limpiados comprobando su identidad.

La aplicación local queda en `http://localhost:5173`, con backend en `http://localhost:8081`. El arranque posterior confirmó las quince migraciones válidas y ninguna nueva pendiente. La respuesta HTTP 405 se corrigió y verificó con servidor real; antes podía ocultarse tras un 401.

- [ ] Para **otro entorno**: volver a consultar la rama destino, guardar su propio respaldo y aplicar las migraciones sin reescribir V14/V15. Revisar desde Retos cualquier prototipo que un docente haya editado; no sobrescribirlo para forzar un conteo. Esta validación local no constituye un despliegue en producción.

Consultas orientativas tras migrar:

```sql
SELECT count(*) FROM tetrilogic_templates; -- 30
SELECT id_activity, level_template, display_order
FROM activities
WHERE id_lesson = 'les-c002-r1'
ORDER BY display_order, id_activity;
```

Una plantilla desconocida, una configuración incompatible o un fallo de red deben seguir mostrando un estado explícito. No introducir un tablero local alternativo silencioso para hacer pasar una prueba.

## 2 Intentos persistentes y validación autorizada

- [ ] Auditar y decidir la mínima ampliación de `telemetry_attempts`, `simulations` y `activity_results`; evitar tres entidades que representen el mismo intento.
- [ ] Añadir vínculo a actividad y versión/configuración, inicio/fin, duración, movimientos, comprobaciones, reinicios, estado final, ayudas estáticas y consultas IA diferenciadas.
- [ ] Desambiguar `pistas_ia` con compatibilidad. Hoy las pistas estáticas v2 son contadores locales y no incrementan ese campo. No inferir su historial a partir de datos antiguos ambiguos.
- [ ] Registrar abandono/interrupción y definir reanudación. Hoy salir detiene el temporizador; no existe una sesión de resolución persistida y reanudable.
- [ ] Implementar validación del servidor del historial legal, inventario y solución antes de otorgar resultados, puntos o desbloqueos. El cliente actual valida el puzzle y envía la telemetría cruda existente; eso no constituye una verificación antifraude.
- [ ] Asegurar propiedad del intento, transacciones, índices, idempotencia y pruebas de concurrencia. No confiar en identidad, reloj, puntuación o solución declarados por el cliente.

## 3 Puntuación progreso y gamificación

- [ ] Confirmar con el equipo/piloto si se adopta la propuesta 60+25+15, umbrales 75/90 y penalización de guía. El documento fuente las califica como propuestas, no política definitiva.
- [ ] Definir qué acciones cuentan y calibrar los movimientos de referencia; actualmente son una solución comprobada, no el mínimo demostrado.
- [ ] Sincronizar las columnas de V11 (`stars`, `xp_earned`, `efficiency`) con entidades/DTO/mappers y la política global. No confundir puntuación, estrellas y XP.
- [ ] Calcular en servidor, conservar el mejor resultado por actividad y otorgar sólo mejoras mediante una única operación transaccional e idempotente.
- [ ] Conectar progreso entre sesiones, desbloqueo progresivo, logros y rankings por grado con alias. El catálogo actual permite elegir cualquiera de los treinta retos; no finge progreso guardado ni bloqueos basados en un estado local.
- [ ] Separar ranking oficial (máximo propuesto 3000) de puntos diarios. No sumar intentos repetidos ni duplicar estudiantes entre grupos.

## 4 Ayudas y validación pedagógica

- [ ] Acordar si orden, contacto y giro final deben introducirse gradualmente. Hoy los treinta retos exigen orden/contacto y desde el 11 hay giro restringido. La [revisión de UX y reglas](Revision_Simulador_Contratos_UX.md) explica su funcionamiento y una propuesta todavía no implementada. No modificar v2 ni sus migraciones mientras se decide.
- [ ] Revisar con estudiantes objetivos, orden de dificultad y las diez mecánicas en cada nivel. Los niveles están resueltos matemáticamente; no se ha probado una progresión cognitiva estricta.
- [ ] Validar los umbrales de pista específica tras tres comprobaciones y guía tras cinco o dos intentos fallidos. El umbral local de tres sirve como implementación inicial del SSD, sin adjudicar puntos.
- [ ] Implementar la guía completa con acceso autorizado, registro y confirmación de su coste cuando exista la puntuación. No publicar los archivos de soluciones de pruebas en respuestas de producción.
- [ ] Validar la política de autonomía y la variante equivalente tras ver una solución completa.
- [ ] Probar lector de pantalla, navegación por teclado, arrastre y dispositivos táctiles reales. La revisión de escritorio/móvil y los tests no sustituyen un piloto de accesibilidad/usabilidad.

## 5 Funciones IA y reto diario excluidas del lote

- [ ] Tras autorización expresa, acordar el contrato del tutor IA como explicación contextual independiente de pistas estáticas. Fallar sin bloquear el juego.
- [ ] Diseñar agregación de métricas entre simuladores y evaluar el modelo; no prometer personalización con datos insuficientes.
- [ ] Diseñar cinco instancias diarias inmutables por usuario/fecha America/Lima, semillas, versiones, solver, alternativa sin ML y renovación a medianoche.
- [ ] Definir libro de puntos, premios por diferencia, máximo propuesto 20 por reto/100 diarios, claves únicas y pruebas de reintento/concurrencia/cambio de día.
- [ ] El generador incluido en `scripts/` es una herramienta offline para congelar el catálogo oficial. **No es un generador de retos diarios ni un servicio ML.**

## 6 Comandos y pruebas de continuación

```powershell
python scripts/generate_tetrilogic_catalog.py --check
python scripts/verify_tetrilogic_catalog.py
python scripts/verify_tetrilogic_postgres.py
pnpm --dir frontend test:run
pnpm --dir frontend build
pnpm --dir frontend lint
```

Backend: Maven con release Java 21, `mvn test` desde `backend/`. El wrapper de esta copia apunta a una distribución distinta de la cacheada; en esta sesión se usó Maven 3.9.16 instalado y un repositorio local dentro de `backend/target/m2`. No cambiar versiones del proyecto sólo para resolver el entorno de una máquina.

La suite backend final aprobó **78 pruebas**, incluidas migraciones Flyway/H2 y HTTP/JPA, con un caso HTTP real sobre Tomcat. También se ejecutaron las **46 comprobaciones de PostgreSQL aislado**, las **47 HTTP contra Docker/PostgreSQL**, seis de conservación y la revisión de los dos roles en el navegador. El script PostgreSQL requiere Docker disponible y la imagen `postgres:16-alpine` ya instalada; crea un contenedor temporal sin red, sin puertos publicados ni volúmenes persistentes, y sólo elimina su propio contenedor tras verificar ID/etiqueta. No se conecta a la base de PIPRE. El frontend aprobó 131 pruebas en 17 archivos y build; el lint general mantiene errores anteriores, detallados en el informe. No presentar estas cifras como pruebas ejecutadas de un cambio futuro.

## 7 Congelación del catálogo y mantenimiento

Las copias del catálogo, V14 y las soluciones de prueba se generan de forma determinista. Usar `--check` para detectar diferencias. V14 y V15 ya están aplicadas y no deben editarse. Cualquier cambio de geometría o reglas requiere nueva versión de plantilla y nueva migración; no volver a ejecutar el modo de generación para reescribir una migración publicada. La próxima migración debe tomar el número libre de la rama destino, sin asumir que será V16.

Conservar los puertos/capas existentes y las respuestas 201 vacías. No tocar las actividades del docente para hacer coincidir catálogos, ni usar los títulos de los cursos para decidir el tablero.
