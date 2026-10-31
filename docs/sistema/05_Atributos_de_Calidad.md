# 5. Calidad y límites de verificación

**Actualizado: 30/10/2026.** [Manual](README.md) · [Evidencias de integración](../informes/Integracion_TetriLogic_NeonFlow_ML.md).

## Rendimiento y mantenibilidad

El raycast tiene un límite de `width × height × 4` iteraciones. Esto limita ciclos ópticos; no constituye una medición de rendimiento de toda la aplicación. No todas las búsquedas son O(1): algunos cálculos recorren arrays o el inventario.

Neon Flow detiene su temporizador de `gameStore` al desmontar. TetriLogic activo no presenta cronómetro; los tiempos relativos de telemetría se observan sin ese indicador visual. Los cargadores de plantillas cancelan solicitudes y descartan respuestas obsoletas.

Se reutilizan capas, tokens, componentes y tipos existentes. El build mantiene un aviso de bundle mayor de 500 kB; la división por rutas y el lint global continúan pendientes. No se declara escalabilidad ni concurrencia ilimitadas a partir de pruebas unitarias.

## Seguridad implementada

- JWT firmado aceptado por cookie `jwt` y, por compatibilidad del filtro, por cabecera Bearer. El frontend normal usa cookies con `withCredentials`, sin leer el JWT.
- HttpOnly en login/logout; Secure, SameSite y orígenes CORS exactos son configurables. En localhost HTTP se usa Secure=false y SameSite=Lax.
- Permisos por método y controles de propiedad para recursos personales; un estudiante no se autoriza modificando la cookie de metadatos.
- Validación de DTO, compatibilidad de plantilla/entorno y campos acotados de trazabilidad.

CSRF está desactivado en `SecurityConfig`. HttpOnly, CORS y SameSite no acreditan por sí solos una protección completa; la configuración del despliegue real necesita revisión antes de exposición pública. Esta documentación no cambia seguridad ni declara una auditoría completa.

## Integridad y tolerancia a fallos

El seeder sólo crea cursos oficiales ausentes. Las incorporaciones del catálogo se realizan mediante migraciones aditivas; no se borran cursos al arrancar. V1…V17 quedan congeladas tras publicarse.

Las trazas nuevas usan identidad, huella e inserción idempotente incluso ante reintentos simultáneos. Las FK y sus límites históricos se explican en la [arquitectura](02_Arquitectura_del_Sistema.md). No se inventa contexto para observaciones antiguas ni se considera que toda escritura del sistema tiene la misma estrategia transaccional.

La telemetría no bloquea la manipulación, pero su entrega es de mejor esfuerzo. Los registros truncados se identifican con `droppedEvents`; no deben analizarse como secuencias completas. Datos declarados por cliente no equivalen a evidencia antifraude ni a aprendizaje demostrado.

## Accesibilidad y validaciones

Hay foco visible, etiquetas, alternativas por selección/teclado, mensajes anunciados y adaptación responsive. Las celdas de una cuadrícula densa pueden medir menos de 44 px; no confundir el objetivo de tamaño de botones con una certificación de todos los elementos.

Los resultados de 291 pruebas frontend, 86 backend, 91 comprobaciones HTTP, PostgreSQL aislado y revisión visual son evidencias fechadas de la integración del 30/10. La reorganización de documentos sólo verifica contenido, rutas, enlaces y conservación del código. Quedan pendientes lector de pantalla, dispositivo táctil físico, piloto y auditorías completas de seguridad/accesibilidad.
