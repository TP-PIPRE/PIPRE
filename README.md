# PIPRE

Plataforma Inteligente de Programación y Robótica Escolar con feedback de IA.

TetriLogic ofrece [retos de filas y columnas con manipulación directa](docs/TetriLogic_Filas_Columnas.md): arrastre, giro y bandeja externa. Se completa el reto al igualar todos los conteos. Las treinta configuraciones persistidas conservan tamaños, inventarios y objetivos; no se restauran orden, contactos ni orientaciones obligatorias.

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
