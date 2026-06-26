# PIPRE

Plataforma Inteligente de Programación y Robótica Escolar con feedback de IA.

## Inicio local con Docker

1. Copia `.env.example` como `.env`.
2. Desde la raíz del repositorio ejecuta:

   ```powershell
   docker compose up --build
   ```

3. Espera a que los cuatro servicios estén activos:

   ```powershell
   docker compose ps
   ```

4. Abre:

   - Frontend: http://localhost:5173
   - Backend: http://localhost:8080
   - Salud del backend: http://localhost:8080/actuator/health

Para detener la aplicación:

```powershell
docker compose down
```

El archivo `docker-compose.override.yaml` convierte automáticamente la
configuración principal en un entorno local autocontenido; no requiere crear
una red externa.
