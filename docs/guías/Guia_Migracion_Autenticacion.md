# Guía de Migración: Autenticación por Cookies HttpOnly

**Para:** Encargado de Integración Front-Back (PIPRE)  
**Fecha:** 17/06/2026  
**Objetivo:** Adaptar el cliente Frontend a la nueva infraestructura de seguridad basada en cookies seguras e `HttpOnly`, eliminando la necesidad de leer y enviar tokens JWT manualmente a través de JavaScript.

---

## 🔒 Contexto del Cambio

El backend ha migrado su esquema de autenticación. En lugar de devolver un string JWT plano en el cuerpo de la respuesta del login, el backend ahora establece una cookie segura `jwt` directamente en las cabeceras HTTP (`Set-Cookie`). 

Esta cookie tiene las siguientes características de seguridad:
* **`HttpOnly`**: JavaScript no tiene acceso a leerla (mitiga robo de tokens por XSS).
* **`Secure`**: Solo se transmite a través de HTTPS (en producción).
* **`SameSite=Strict`**: Previene ataques de falsificación de petición en sitios cruzados (CSRF).

---

## 🛠️ Pasos para la Migración en el Frontend

### Paso 1: Configurar Axios para enviar Cookies Automáticamente
Dado que el token ahora viaja como una cookie, debemos indicar a Axios que incluya las cookies en cada solicitud HTTP de origen cruzado (CORS).

Modificar [axiosInstance.ts](file:///z:/REPOSITORIOS/PIPRE/frontend/src/infrastructure/api/axiosInstance.ts):
```typescript
import axios from "axios";

const isDev = import.meta.env.DEV;

const axiosInstance = axios.create({
  baseURL: isDev 
    ? "/api/v1/" 
    : "https://pipre-backend.yoshua-cloud.dedyn.io/api/v1/",
  withCredentials: true, // <-- CRÍTICO: Permite que el navegador envíe la cookie HttpOnly
  headers: {
    "Content-Type": "application/json",
    "Accept": "*/*",
  },
});

// El interceptor ya no necesita leer "pipre_token" de document.cookie ni setear la cabecera Authorization.
// El navegador adjuntará la cookie "jwt" automáticamente.
axiosInstance.interceptors.request.use(
  (config) => {
    // Ya no se requiere config.headers.set("Authorization", ...)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

### Paso 2: Modificar el Flujo de Login (`AuthAdapter`)
Dado que el backend ya no retorna el JWT en el cuerpo del JSON, el cuerpo de la respuesta de `/login` contendrá un mensaje genérico (ej. `"Sesión iniciada correctamente"`). El frontend no debe procesar ni decodificar el token JWT manualmente.

Modificar [AuthAdapter.ts](file:///z:/REPOSITORIOS/PIPRE/frontend/src/infrastructure/adapters/http/AuthAdapter.ts):
1. **Remover** la decodificación del token con `atob(token.split(".")[1])`.
2. **Alternativa temporal/definitiva:** Obtener el perfil del usuario (roles y metadatos) realizando un request adicional al endpoint del perfil (ej. `/api/v1/users/me` o `/api/v1/profile`) o solicitando al backend que retorne el objeto `User` en la respuesta JSON del `/login` mientras el token se establece por cookie.

Ejemplo si el backend retorna los datos del usuario en la respuesta del login:
```typescript
async login(email: string, password: string): Promise<{ user: User }> {
  try {
    const response = await axiosInstance.post("auth/login", { email, password });
    
    // Si el backend retorna el objeto user directamente:
    const user = response.data.user; 
    
    return { user };
  } catch (error) {
    throw new Error("Error de inicio de sesión");
  }
}
```

---

### Paso 3: Ajustar el Store de Autenticación (`authStore`)
JavaScript ya no puede ni debe gestionar la cookie de autenticación del token.

Modificar [authStore.ts](file:///z:/REPOSITORIOS/PIPRE/frontend/src/infrastructure/store/authStore.ts):
1. Mantener en las cookies del navegador únicamente información no sensitiva (ej. los metadatos del perfil del usuario, `pipre_user`).
2. Remover la manipulación manual de `pipre_token`.
3. Determinar si el usuario está autenticado basándose en la presencia de la sesión del usuario o realizando una consulta de verificación de sesión al backend al inicializar la aplicación.

---

### Paso 4: Implementar Cierre de Sesión (Logout) por API
Dado que JavaScript no puede borrar cookies `HttpOnly`, el cierre de sesión debe ser notificado al backend para que este invalide y destruya la cookie.

1. **Backend:** Proveer un endpoint de salida (ej. `/api/v1/auth/logout`) que responda limpiando la cookie `jwt`.
2. **Frontend:** Invocar este endpoint al hacer logout.

En [useAuth.ts](file:///z:/REPOSITORIOS/PIPRE/frontend/src/application/hooks/useAuth.ts):
```typescript
const logout = async () => {
  try {
    await axiosInstance.post("auth/logout");
  } catch (e) {
    console.error("Error al invalidar sesión en servidor", e);
  } finally {
    clearAuthState(); // Limpia cookies de estado local (usuario, etc.)
    navigate("/login");
  }
};
```

---

## 🧪 Plan de Pruebas de Integración

1. **Verificación de Cookies en el Navegador:**
   - Inicia sesión y abre la pestaña de *Herramientas de Desarrollador (F12) > Aplicación > Cookies*.
   - Confirma que existe la cookie `jwt` con las casillas **HttpOnly** y **Secure** activas.
2. **Consumo de Rutas Protegidas:**
   - Realiza una petición GET a un endpoint que requiera autenticación y rol específico.
   - Valida en la pestaña *Red (Network)* de F12 que las cabeceras de la solicitud contienen automáticamente la cookie en el header `Cookie: jwt=...`.
3. **Prueba de XSS:**
   - Escribe en la consola del navegador: `console.log(document.cookie)`.
   - Verifica que el valor del token JWT **no aparezca** en la salida de la consola.
