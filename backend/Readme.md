# BACKEND.
## Guía de ejecución
1. Se requiere la instalación de las siguientes herramientas:
    - JAVA 21
    - MAVEN 3.9+
    - PostgreSQL 16
2. Crear la base de datos "pipre_database" dentro de
   PostgreSQL
3. Clonar el proyecto
4. Copiar el archivo ".env.example" en un archivo llamado ".env" en la raiz del proyecto.
5. Dentro del ".env" cambiar las credenciales de usuario y contraseña de postgres según tu instalación.
6. Ingresar el siguiente comando en la consola dentro de la carpeta /backend
    ```bash
    mvn spring-boot:run
    ```
7. Para detener el backend, hacer ctrl+c un par de veces en la consola.
8. En caso de errores al ejecutar, borrar y volver a crear la base de datos en PostgreSQl.

## Uso del backend
Por defecto se ejecutará en el puerto 8080, en el navegador se accede por el link:

> http://localhost:8080/

Dentro encontrarás un json con información del proyecto, además:
- Un link para ver los endpoints "/swagger-ui/index.html".
- Un link para ver la salud del backend "/actuator/health".

# Ejecución de la aplicación completa con Docker
1. Descargar docker
2. Clonar el proyecto
3. Copiar el archivo ".env.example" en un archivo llamado ".env" en la raiz del proyecto, no es necesario modificar nada.
4. Ingresar el siguiente comando en la consola en la raiz del proyecto:
    ```bash
    docker-compose up --build
    ```
5. Esperar de 3 a 5 minutos la primera vez, los arranques posteriores tardan menos de 10 segundos.
6. Para detener la aplicación, hacer ctrl+c un par de veces en la consola.