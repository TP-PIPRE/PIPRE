# Implementación de pendientes de PIPRE

Lote iniciado el 06/11/2026 y validado durante el 07/11, en la rama `Feature/niveles`. No se hicieron commits, pushes ni migraciones sobre la base de la aplicación. Los informes de las auditorías previas conservan sus resultados históricos.

## Decisiones y comportamiento implementado

El usuario descartó nota académica y aprobó hasta 100 puntos por ejercicio validado: 50 por solución, hasta 30 por movimientos y hasta 20 por tiempo con referencia de 180 segundos, sin temporizador visible añadido. Sólo suma el mejor puntaje por ejercicio; una mejora incorpora su diferencia positiva. Completar los cinco diarios concede 50 XP una vez por estudiante/fecha Lima, conservando el XP de logros y sus desbloqueos históricos. [Fórmula, identidades y límites](../guias/Puntaje_Ranking_Acceso.md).

Se implementaron:

- Recibos transaccionales, mejores puntajes oficiales por plantilla canónica y diarios por UUID; ranking/perfil/historial usan procedencia verificada. No se recalifican scores antiguos. Fechas, XP y métricas desconocidos conservan ausencia de datos.
- Asignaciones persistidas docente–aula/curso y aula–curso/actividad. El administrador gestiona cursos, aulas, membresías, roles, estado de cuentas y ranking; el docente sólo su contenido y estudiantes asignados. Los usuarios con roles de gestión permanecen en vista previa. Promover a un estudiante retira su exposición como estudiante en rankings y consultas docentes sin borrar su historial.
- Ranking estudiantil por aula de forma predeterminada, configurable como oculto o global. El global no abre otras aulas ni perfiles privados. Sus metadatos se cargan por lotes.
- Recuperación autorizada de la partida activa y reconstrucción de ambos tableros, sin reenviar movimientos aceptados. Continúa desde la revisión del servidor y conserva puntos/XP al recargar. La práctica libre conserva su tablero elegido en la URL.
- PATCH explícito, compatible con PUT; consulta/asignación/retirada paginada e idempotente de actividades por aula. Mover una actividad no expone otro curso a un docente sin asignación. [Contrato](../guias/Pendientes_Endpoints_Backend.md).
- CSRF con token enmascarado y cookie HttpOnly. El código `CSRF_INVALID` sólo procede del filtro previo a la escritura: el cliente obtiene otro token y reintenta una vez el mismo envío. Un 403 de permisos no se reintenta. La copia automática de cookies de Axios no sustituye el token enmascarado; no se desactiva la protección del servidor.
- Límite de acceso compartido/atómico, claves HMAC, expiración y proxies fiables explícitos. El tiempo de la ventana se toma después de adquirir el bloqueo. Producción rechaza bootstrap/secretos locales, cookies inseguras y orígenes HTTP. [Operación y primer administrador](../guias/Seguridad_Operacion_Produccion.md).
- Idempotency-Key opcional para resultados/simulaciones declarados, únicos de pertenencia/progreso, correlación de solicitudes y paginación estable con máximo de 100 elementos.
- Errores y reintentos visibles, descarte de respuestas tardías y eliminación real mediante API. Se retiraron datos ficticios deducidos del XP. Las métricas activas presentan puntos y progreso verificados; los contratos declarativos anteriores se conservan por compatibilidad.
- División de carga por rutas, lint sin supresiones y workflow con Java 21/pnpm fijado, cobertura, PostgreSQL/E2E desechables, reportes y limpieza por etiquetas. actionlint 1.7.12 validó el workflow; falta su primera ejecución remota tras una publicación autorizada.

La prueba de conservación detectó y corrigió un defecto anterior de JPA: editar un curso podía eliminar sus módulos por orphanRemoval. La actualización de detalles conserva la colección administrada; editar una actividad conserva sus simulaciones históricas. La retirada de asignaciones no elimina actividades ni resultados.

## Catálogo, alcance y persistencia

Se mantienen **30 TetriLogic + 30 Neon Flow = 60 retos oficiales**. No se añadieron plantillas, tipos o niveles ni se modificaron los generadores o catálogos publicados. Las soluciones de los 60 tableros se verifican también al reconstruir el estado. Los prototipos/alias siguen siendo compatibilidad, sin contarlos otra vez. La generación diaria mantiene cinco ejercicios persistidos, ambos juegos, renovación Lima y finalización sólo con 5/5.

V1–V21 permanecen intactas. V22–V26 incorporan asignaciones/visibilidad, puntos/XP, límite compartido, únicos y recibos de reintento. Sólo se aplicaron a bases desechables. V25 falla ante duplicados sin elegir ni borrar historial: ejecutar [preflight](../../scripts/preflight-integrity.sql), respaldar y conciliar explícitamente si aparecen antes de actualizar una instalación existente. Después, configurar las asignaciones docentes en administración; no se infieren desde datos antiguos.

`data-science/`, modelos, endpoints/proxy y contenedor siguen excluidos. Las tarjetas existentes sólo cambian su manejo de carga/error/reintento, conservando solicitudes y sin llamar modelos durante las pruebas. No se entrega SSD integral ni evaluación pedagógica.

## Validación final

| Verificación | Resultado |
|---|---|
| Backend, Maven verify con Java 21 | **337 pruebas aprobadas**, sin fallos, errores ni omisiones. JaCoCo superó el mínimo de líneas en sus 21 clases críticas. |
| Integración repetida en PostgreSQL 16.15 desechable | **19 pruebas aprobadas**, incluidas migraciones y persistencia transaccional. Este subconjunto se repite con el motor real. |
| Frontend, Vitest con cobertura | **481 pruebas aprobadas** en 44 archivos. Lint sin avisos ni errores, compilación de producción y tipos de Cypress aprobados. |
| Cypress 15.21.1, Edge 157.0.4341.42 | **34/34**: 11 pruebas con frontend/backend/PostgreSQL reales y 23 con respuestas HTTP controladas. |
| Docker de pruebas | Imágenes de backend/frontend reconstruidas, backend y PostgreSQL sanos, frontend servido y recorrido por Cypress. Se confirmó la retirada de todos los recursos del proyecto de pruebas. |

JaCoCo: 75,97 % de líneas y 64,91 % de ramas globales; 97,07 % y 77,50 % en el conjunto crítico. Frontend: 72,57 % de líneas y 70,85 % de ramas globales; 95,84 % y 83,93 % en 31 archivos críticos, por encima del mínimo agregado del 80 %. El bloque inicial de JavaScript de producción pesa 454,18 kB.

La prueba real de los diarios conserva 2/5 tras volver a entrar y acredita la fecha y los 50 XP al quinto ejercicio. Otra reanuda TetriLogic en el segundo tablero de práctica y Neon Flow en una actividad oficial; recargar no duplica victorias, puntos ni XP. Una prueba provoca un rechazo CSRF antes de guardar y comprueba que, tras renovar el token, sólo se registra una victoria. Las suites comprueban las soluciones y restauración de los 60 tableros publicados. El [inventario de la auditoría](Inventario_Auditoria_Integral_2026_11_06.md) describe los módulos, contratos y comprobaciones cubiertas.

[Evidencia final (JSON)](evidencias/Implementacion_Pendientes_2026_11_06.json). Los reportes completos se generan en las rutas descritas en la [guía de pruebas](../guias/Pruebas_Integrales.md). No se aumentaron los tiempos de espera ni se deshabilitaron casos para pasar la regresión.

## Pendientes externos u operativos

Consultar [A01–A12](../guias/Pendientes_Auditoria_Integral.md) y [B01–B12](../guias/Pendientes_Implementacion_Backend.md). Quedan la primera ejecución remota de CI, configuración/aprovisionamiento y comprobación de producción, retención/privacidad, monitorización/backups, carga sostenida, lectores de pantalla y dispositivos físicos. La recuperación avanzada de más de una partida activa requiere otro contrato; los movimientos aún sin confirmar siguen siendo de mejor esfuerzo.

Los avisos de Spring MVC permanecen sin suprimir. Docker Scout 1.27.0 detectó 8 avisos en la imagen backend (3 críticos, 2 altos, 2 moderados, 1 bajo) y 68 en frontend (4 críticos, 39 altos, 20 moderados, 5 bajos), incluidos sistema/runtime y paquetes globales. No equivalen al contador privado de Dependabot ni a pnpm audit del proyecto. Resolverlos requiere evaluar y probar los parches/imágenes; este lote no impone una actualización mayor de Spring ni declara seguro el despliegue remoto. El JSON de evidencia referencia los SARIF locales y sus recuentos por severidad.
