# Estado de pendientes de implementación del backend

**Actualizado el 07/11/2026.** Continuidad de las auditorías del [05/11](../informes/Auditoria_Backend_2026_11_05.md) y [06/11](../informes/Auditoria_Integral_2026_11_06.md). Las cifras de esos informes son históricas. El [informe de implementación](../informes/Implementacion_Pendientes_2026_11_06.md) contiene la aceptación nueva y los límites pendientes.

## Resolución por identificador

| ID | Estado | Implementación o acción restante |
|---|---|---|
| B01 | Implementado; preflight operativo obligatorio | V25 añade únicos de membresía y progreso por estudiante/módulo. La prueba con una copia duplicada comprueba que la migración se niega sin borrar ni elegir datos. Ejecutar [preflight](../../scripts/preflight-integrity.sql) antes de actualizar una instalación existente; si aparecen duplicados, su conciliación requiere una decisión explícita. No se migró la aplicación local. |
| B02 | Regla definida e implementada | El usuario descartó nota académica y aprobó puntos verificados, mejor puntaje, incrementos por mejora y 50 XP al completar los cinco diarios. Ranking/perfil usan esa fuente. Los contratos declarativos e históricos se conservan sin conceder puntos/XP ni recalificarlos. [Contrato](Puntaje_Ranking_Acceso.md). |
| B03 | Implementado | POST de resultados y simulaciones admite `Idempotency-Key` opcional, de 1–128 caracteres alfanuméricos o `._:-`. La misma clave/contenido por actor y operación conserva un único registro; otro contenido devuelve 400. Otra clave conserva otro intento. Sin clave se mantiene el POST anterior. V26 persiste recibos transaccionales. |
| B04 | Implementado | Asignaciones explícitas docente–aula/curso y aula–curso; política de acceso en backend y administración en frontend. Docentes consultan sólo sus aulas y estudiantes; los cursos no amplían acceso a progreso privado. Roles vigentes y estado activo se comprueban también al usar JWT. |
| B05 | Implementado para la partida activa | Recuperación autorizada por contexto, reconstrucción de ambos tableros y continuación de la secuencia del servidor. La práctica libre conserva el nivel seleccionado en la URL. Recarga y salida conservan movimientos confirmados; una interrupción puede perder los aún no enviados. Sólo se conserva una partida activa por estudiante, conforme al modelo existente. |
| B06 | Implementado | PATCH explícito compatible con PUT y asignación paginada/idempotente de actividades a aulas. [Contrato vigente](Pendientes_Endpoints_Backend.md). |
| B07 | Implementado; validar dominio real al desplegar | CSRF en operaciones de navegador/cookie, token enmascarado, cookie HttpOnly, CORS exacto y cliente compatible. Pruebas de token real, origen no permitido, escrituras y salida. [Operación](Seguridad_Operacion_Produccion.md). |
| B08 | Implementado; configurar proxy real al desplegar | Ventana móvil atómica en PostgreSQL compartida entre réplicas, expiración, HMAC y Retry-After. X-Forwarded-For se ignora por defecto; CIDR fiables explícitos. Pruebas concurrentes, límite temporal y cabecera manipulada. |
| B09 | Implementado; aprovisionamiento operativo pendiente | Perfil production sin cuentas demo, secretos predeterminados ni HTTP. Rechaza configuración insegura. Faker sólo se habilita explícitamente en desarrollo. El operador debe configurar secretos, dominio, proxy y primer administrador; no se cambiaron cuentas reales. |
| B10 | Parcial | Correlación X-Request-ID, contexto de logs y máximo de 100 por página implementados. La política de retención/privacidad, backups, monitorización y presupuesto de carga real requieren definición y validación operativa; no se inventa ni ejecuta una purga de historial. |
| B11 | Implementado con procedencia explícita | Piezas presentes en victorias y eficiencia de movimientos calculadas de recibos nuevos del servidor. Ausencia de recibos se representa con null. La interfaz los distingue de una nota o medida pedagógica. |
| B12 | Implementado | PageResponse explícito conserva el esquema consumido por TypeScript, con pruebas de compatibilidad; no se serializa PageImpl en las respuestas paginadas. |

## Pendientes que siguen abiertos

- Ejecutar por primera vez el workflow remoto después de una publicación autorizada. La configuración de CI se valida localmente; no se hicieron commits ni pushes.
- Ampliar cobertura global y combinaciones de error según JaCoCo. El informe diferencia cobertura global, líneas críticas y ramas; no acredita cobertura total.
- Resolver los avisos Spring MVC y las vulnerabilidades de imágenes reportadas, evaluando compatibilidad. No se ocultan ni se aplica una migración mayor de framework en este lote.
- Validar producción, carga sostenida, interrupciones reales, dominio/proxy, política de datos y aprovisionamiento. Las bases y contenedores de aceptación son desechables.
- Los avisos históricos de mapeo/compilación y los adaptadores de perfiles/logros antiguos requieren revisión específica; no se borran sus desbloqueos ni se reactivan como fuente actual.
- `data-science/`, modelos, proxy y contenedor permanecen excluidos. SSD integral, evaluación pedagógica y entrenamiento ML requieren otro alcance.

V1–V21 permanecen intactas; las migraciones nuevas son V22–V26. No se atribuyen asignaciones, puntuación ni contexto nuevo a datos antiguos.
