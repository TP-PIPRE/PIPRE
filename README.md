# PIPRE

Plataforma Inteligente de Programación y Robótica Escolar con feedback de IA.

## Desarrollo de retos

Antes de añadir retos, el compañero o la IA deben leer [AGENTS.md](AGENTS.md) y la [guía para implementar los 30 retos por juego](docs/Guia_Implementacion_30_Retos.md). La meta es 30 retos de Neon Flow y 30 de TetriLogic, 60 en total; cada actividad debe quedar conectada con su tablero jugable y tener una solución comprobada. La guía explica cómo actualizar instalaciones existentes sin depender sólo del seeder.

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
