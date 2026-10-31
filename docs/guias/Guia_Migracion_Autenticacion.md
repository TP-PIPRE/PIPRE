# Autenticación por cookies HttpOnly

**Estado: implementado; revisado el 30/10/2026.** La guía de migración del 17/06 contenía ejemplos propuestos; esta versión describe el contrato actual. [Índice](../README.md) · [Permisos](Clasificacion_Endpoints_Roles.md).

## Inicio de sesión

`POST /api/v1/auth/login` recibe `email` y `password`. Establece la cookie `jwt` y responde un objeto estructurado:

```json
{
  "message": "Sesión iniciada correctamente",
  "user": {
    "idUser": "ID_DEL_USUARIO",
    "email": "correo@ejemplo.test",
    "firstName": "Nombre",
    "lastName": "Apellido",
    "role": "student"
  }
}
```

El rol de navegación es `admin`, `docente` o `student`, con prioridad administrador → docente → estudiante. No se devuelve ni decodifica un JWT en JavaScript. No se requiere un endpoint hipotético `/users/me` para completar el login.

[AuthAdapter](../../frontend/src/infrastructure/adapters/http/AuthAdapter.ts) valida la respuesta y mapea `idUser` al ID local. [authStore](../../frontend/src/infrastructure/store/authStore.ts) conserva metadatos en `pipre_user`; son información de navegación, no autoridad de seguridad. El servidor comprueba JWT, rol e identidad en cada operación protegida.

## Transporte y configuración

[axiosInstance](../../frontend/src/infrastructure/api/axiosInstance.ts) utiliza `withCredentials: true`. Con `VITE_USE_LOCAL_BACKEND=true` usa la URL local configurada; en desarrollo sin esa opción usa `/api/v1/` mediante el proxy y en producción usa la dirección configurada por el código. Los valores VITE se incorporan al compilar.

| Atributo | Implementación |
|---|---|
| HttpOnly | Siempre activo para `jwt`; JavaScript no puede leer el token. |
| Secure | `PIPRE_COOKIE_SECURE`, false por defecto para HTTP local. |
| SameSite | `PIPRE_COOKIE_SAME_SITE`, Lax por defecto; None requiere Secure. |
| Path / duración | `/`, 3600 segundos en login; expiración en logout. |
| CORS | Orígenes exactos en `PIPRE_ALLOWED_ORIGINS`, con credenciales. |

No afirmar que todas las cookies actuales son Secure/Strict. [BrowserSecurityProperties](../../backend/src/main/java/com/pipre/backend/infrastructure/configuration/BrowserSecurityProperties.java) valida esta configuración. El filtro backend acepta Bearer por compatibilidad, aunque el frontend normal no lo construye.

## Registro, errores y salida

`POST /api/v1/users` permite registro. El servidor aplica las reglas de asignación de rol; el cliente público no puede concederse privilegios. El adaptador actual envía `passwordHash` como nombre del campo del contrato y a continuación inicia sesión; no significa que el navegador deba calcular un hash.

Un **401** limpia metadatos y redirige al acceso, salvo peticiones explícitamente no bloqueantes de fondo. Un **403** muestra falta de permiso y conserva la sesión. No interpretar ambos como contraseña incorrecta.

`POST /api/v1/auth/logout` expira la cookie con los mismos atributos; la interfaz espera esa respuesta antes de limpiar su estado de navegación. La ruta es pública en `SecurityConfig`, por lo que también permite limpiar una cookie caducada. Un fallo de red no acredita que la cookie HttpOnly haya sido invalidada.

## Verificación recomendada

Comprobar respuesta estructurada, cookie HttpOnly, acceso permitido, rechazo 401/403 y expiración al salir. En HTTP local Secure=false es esperado; en HTTPS se revisa la configuración real. La imposibilidad de leer `jwt` desde JavaScript no es una prueba completa de XSS ni CSRF: CSRF está desactivado actualmente en `SecurityConfig` y requiere una revisión específica de despliegue.

Las pruebas de autenticación ejecutadas en la integración se registran en el [informe fechado](../informes/Integracion_TetriLogic_NeonFlow_ML.md); esta actualización documental no volvió a ejecutarlas.
