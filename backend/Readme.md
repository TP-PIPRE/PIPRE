# BACKEND
## Estructura de carpetas
```
backend/src/main/java/com.pipre.backend/
├── application/                   # Orquestación de casos de uso (capa de aplicación)
│   ├── dto/                       # Modelos de entrada/salida de la aplicación
│   │   ├── request/               # Requests internos del sistema
│   │   └── response/              # Responses internos del sistema
│   ├── mapper/                    # Conversión entre dominio ↔ DTO
│   └── usecase/                   # Implementación de casos de uso
│
├── domain/                        # Núcleo del negocio puro (sin Spring, sin BD, sin HTTP)
│   ├── exception/                 # Excepciones de negocio
│   ├── model/                     # Entidades y agregados del dominio
│   ├── port/
│   │   ├── in/                    # Contratos de entrada (casos de uso del sistema)
│   │   └── out/                   # Contratos de salida (repositorios, servicios externos)
│   ├── service/                   # Lógica de dominio compleja (reglas de negocio puras)
│   └── valueobject/               # Objetos de valor (Email, UserId, etc.)
│
├── infrastructure/                # Implementaciones técnicas (frameworks, IO, APIs, BD)
│   ├── adapter/
│   │   ├── in/                    # Adaptadores de entrada (HTTP, messaging)
│   │   │   └── rest/              # API REST
│   │   │       ├── controller/    # Controladores HTTP
│   │   │       ├── dto/           # DTOs de API REST (externos)
│   │   │       │   ├── request/
│   │   │       │   └── response/
│   │   │       ├── mapper/        # Mapeo REST ↔ aplicación
│   │   │       └── security/      # Componentes que interceptan requests HTTP
│   │   │
│   │   └── out/                   # Adaptadores de salida (persistencia, APIs externas)
│   │       ├── ml/                # Integración con servicios externos (ej: ML API)
│   │       │   ├── client/        # Cliente HTTP o SDK externo
│   │       │   └── mapper/        # Mapeo dominio ↔ API externa
│   │       │   
│   │       └── persistence/       # Implementación de base de datos
│   │           ├── entity/        # Entidades JPA (modelo persistente)
│   │           ├── mapper/        # Mapeo dominio ↔ persistencia
│   │           └── repository/    # Repositorios Spring Data
│   │       
│   └── config/                    # Configuración de Spring (wiring de dependencias)
│
└── shared/                        # Utilidades transversales (sin lógica de negocio)
    ├── util/                      # Helpers genéricos (fechas, strings, etc.)
    └── exception/                 # Excepciones técnicas reutilizables

backend/src/main/resources/
├── application.yml                # Configuración base (DB, JWT, APIs externas)
├── application-dev.yml            # Configuración entorno desarrollo
└── application-prod.yml           # Configuración entorno producción

backend/src/test/java/com.pipre.backend/
├── domain/                        # Tests unitarios del dominio (sin Spring)
├── application/                   # Tests de casos de uso (Mockito)
├── infrastructure/                # Tests de adapters (REST, DB mocks)
└── integration/                   # Tests end-to-end con Spring context

backend/
├── pom.xml                        # Gestión de dependencias
└── Dockerfile                     # Contenerización de la aplicación
```
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