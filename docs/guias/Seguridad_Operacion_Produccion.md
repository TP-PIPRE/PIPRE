# Seguridad y operación de producción

Continuidad del lote del 06/11/2026. No acredita un despliegue remoto ni modifica secretos o cuentas de la aplicación local.

## Peticiones del navegador

El navegador obtiene un token en `GET /api/v1/auth/csrf` y lo devuelve en `X-XSRF-TOKEN` al escribir. La respuesta no se almacena en caché; el token se entrega enmascarado y la cookie de respaldo es HttpOnly, con Secure/SameSite coherentes con la cookie JWT. El cliente obtiene un token por lote concurrente de escrituras. No lo envía al cliente separado de IA. Si el filtro rechaza la operación antes de escribir con `CSRF_INVALID`, el cliente obtiene un token nuevo y reintenta una sola vez el mismo envío; no repite rechazos de permisos ni cualquier 403.

Las operaciones inseguras con cookie JWT, Origin o metadatos de navegación exigen CSRF. CORS sólo acepta los orígenes exactos configurados, incluidos PATCH y credenciales. Un cliente que use únicamente Bearer sin cookies ni contexto de navegador conserva su compatibilidad. No registrar ni copiar cookies, tokens o contraseñas en incidencias. Referencia: [protección CSRF de Spring Security](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).

## Intentos de acceso y proxy

El límite es de cinco intentos por dirección en una ventana móvil de 60 segundos. Cada comprobación y registro se serializan en PostgreSQL, compartido entre réplicas. Devuelve 429 y `Retry-After`; la tarea de limpieza retira claves expiradas. Las direcciones se guardan como HMAC con el secreto de la instalación, no como IP en texto ni en un mapa sin límite de vida.

`PIPRE_TRUSTED_PROXIES` está vacío por defecto: se ignora `X-Forwarded-For`. Si hay un proxy inverso, el operador debe definir sus direcciones/CIDR exactos y hacer que elimine/sobrescriba cabeceras recibidas del exterior. Se recorre la cadena desde el proxy hasta el primer salto no confiable. No se aceptan hostnames ni se hacen consultas DNS a partir de la cabecera. `server.forward-headers-strategy=none` evita una confianza adicional implícita. No configurar rangos generales por conveniencia.

## Perfil de producción y aprovisionamiento

Activar `SPRING_PROFILES_ACTIVE=production` y proporcionar explícitamente:

- `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- `JWT_SECRET` de al menos 32 caracteres, gestionado como secreto de operación.
- `PIPRE_ALLOWED_ORIGINS` con los orígenes HTTPS exactos.
- SameSite según la topología; `None` requiere HTTPS/Secure. No cambiarlo sin probar acceso, escrituras y salida desde el dominio real.

El perfil rechaza secretos locales, credenciales vacías, bootstrap/demo habilitados, cookies inseguras u orígenes HTTP. No crea cuentas de acceso conocidas ni estudiantes ficticios. En desarrollo, `pipre.seed.access-users=true` conserva las tres cuentas locales cuando la base está vacía. Los diez estudiantes Faker sólo se crean con `pipre.seed.demo-data=true`; nunca se convierten datos previos en observaciones reales.

Una base de producción nueva requiere aprovisionar al primer administrador por el operador autorizado. Registrar primero su cuenta con una contraseña propia y asignar ADMIN en una sesión SQL controlada, sobre el correo exacto verificado. No usar las cuentas o contraseñas de desarrollo. Ejemplo de transacción, **no ejecutada por este trabajo**, con `bootstrap_email` definido por el operador en psql:

```sql
BEGIN;
SELECT id_user,email,is_active FROM users WHERE email=:'bootstrap_email' FOR UPDATE;
INSERT INTO user_role(id_user,id_role)
SELECT u.id_user,r.id_role FROM users u CROSS JOIN roles r
WHERE u.email=:'bootstrap_email' AND u.is_active=TRUE AND r.name='ADMIN'
ON CONFLICT DO NOTHING;
COMMIT;
```

Comprobar una única cuenta destino antes de confirmar. El resto de las asignaciones se realiza desde administración. Antes de V25 ejecutar [el preflight](../../scripts/preflight-integrity.sql); respaldar y conciliar duplicados sin borrarlos automáticamente.

## Diagnóstico y límites pendientes

Las respuestas incorporan `X-Request-ID`; los errores del servidor incluyen su correlación en el contexto de logs. No se aceptan identificadores arbitrarios que puedan inyectar texto en logs. Las colecciones paginadas tienen un máximo de 100 elementos por página, manteniendo el recorrido de páginas del cliente.

Las reglas legales/funcionales de retención, anonimización, acceso de soporte, copias de seguridad, monitorización, presupuesto de carga y topología de producción requieren una decisión y validación del operador. No se aplica una purga automática de estudiantes, trazas o resultados. El entorno QA de este lote es efímero y está separado de la aplicación.
