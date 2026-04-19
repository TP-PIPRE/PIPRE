# BACKEND
## Estructura de ejemplo
```
backend/
│
├── src/
│   ├── main/
│   │   ├── java/com/tuapp/
│   │   │   │
│   │   │   ├── domain/                         # Núcleo puro — CERO dependencias de Spring
│   │   │   │   ├── model/                      # Entidades y Value Objects del negocio
│   │   │   │   │   ├── User.java               #   Entidad raíz del agregado usuario
│   │   │   │   │   ├── Prediction.java         #   Resultado de una predicción ML
│   │   │   │   │   └── valueobjects/
│   │   │   │   │       ├── Email.java          #   Value Object con validación propia
│   │   │   │   │       └── PredictionScore.java
│   │   │   │   │
│   │   │   │   ├── ports/
│   │   │   │   │   ├── in/                     # Lo que el exterior puede pedirle al dominio
│   │   │   │   │   │   ├── CreateUserUseCase.java       # Interface del caso de uso
│   │   │   │   │   │   └── RequestPredictionUseCase.java
│   │   │   │   │   │
│   │   │   │   │   └── out/                    # Lo que el dominio necesita del exterior
│   │   │   │   │       ├── UserRepository.java         # Interface de persistencia
│   │   │   │   │       └── MLServicePort.java          # Interface para llamar al módulo ML
│   │   │   │   │
│   │   │   │   ├── events/                     # Domain Events (DDD)
│   │   │   │   │   └── PredictionRequestedEvent.java
│   │   │   │   │
│   │   │   │   └── exceptions/                 # Excepciones del dominio
│   │   │   │       ├── UserNotFoundException.java
│   │   │   │       └── PredictionFailedException.java
│   │   │   │
│   │   │   ├── application/                    # Casos de uso: orquesta domain + ports
│   │   │   │   ├── service/
│   │   │   │   │   ├── CreateUserService.java          # Implementa CreateUserUseCase
│   │   │   │   │   └── RequestPredictionService.java   # Implementa RequestPredictionUseCase
│   │   │   │   │                                       # Llama a MLServicePort (port out)
│   │   │   │   └── dto/                        # DTOs internos entre capas
│   │   │   │       ├── CreateUserCommand.java
│   │   │   │       └── PredictionRequest.java
│   │   │   │
│   │   │   ├── adapters/                       # Implementaciones concretas de los ports
│   │   │   │   │
│   │   │   │   ├── in/                         # Adapters de entrada (driving adapters)
│   │   │   │   │   └── rest/
│   │   │   │   │       ├── UserController.java         # @RestController → llama al port in
│   │   │   │   │       ├── PredictionController.java   # Recibe petición del Frontend
│   │   │   │   │       ├── dto/                        # Request/Response bodies (Jackson)
│   │   │   │   │       │   ├── UserRequest.java
│   │   │   │   │       │   ├── UserResponse.java
│   │   │   │   │       │   └── PredictionResponse.java
│   │   │   │   │       └── mapper/
│   │   │   │   │           └── UserMapper.java         # DTO ↔ Domain model
│   │   │   │   │
│   │   │   │   └── out/                        # Adapters de salida (driven adapters)
│   │   │   │       ├── persistence/
│   │   │   │       │   ├── JpaUserRepository.java      # Implementa UserRepository (port out)
│   │   │   │       │   ├── entity/
│   │   │   │       │   │   └── UserEntity.java         # @Entity JPA (no es domain model)
│   │   │   │       │   └── mapper/
│   │   │   │       │       └── UserEntityMapper.java   # Domain ↔ JPA Entity
│   │   │   │       │
│   │   │   │       └── ml/
│   │   │   │           ├── MLServiceAdapter.java       # Implementa MLServicePort
│   │   │   │           │                               # Hace HTTP call al módulo Python
│   │   │   │           └── dto/
│   │   │   │               ├── MLRequest.java          # Payload enviado al módulo ML
│   │   │   │               └── MLResponse.java         # Respuesta recibida del módulo ML
│   │   │   │
│   │   │   └── infrastructure/                 # Configuración e integración con frameworks
│   │   │       ├── config/
│   │   │       │   ├── BeanConfig.java         # @Configuration: registra servicios como beans
│   │   │       │   ├── SecurityConfig.java     # Spring Security: JWT, CORS, rutas públicas
│   │   │       │   ├── OpenApiConfig.java      # Swagger / OpenAPI docs
│   │   │       │   └── MLClientConfig.java     # RestTemplate/WebClient para el módulo ML
│   │   │       │
│   │   │       ├── persistence/
│   │   │       │   └── DatabaseConfig.java     # DataSource, JPA properties
│   │   │       │
│   │   │       ├── security/
│   │   │       │   ├── JwtProvider.java        # Generación y validación de tokens JWT
│   │   │       │   └── JwtFilter.java          # Filtro que intercepta requests
│   │   │       │
│   │   │       └── exception/
│   │   │           └── GlobalExceptionHandler.java  # @ControllerAdvice: errores → HTTP status
│   │   │
│   │   └── resources/
│   │       ├── application.yml                 # DB URL, ML_SERVICE_URL, JWT secret
│   │       ├── application-dev.yml
│   │       └── application-prod.yml
│   │
│   └── test/
│       └── java/com/tuapp/
│           ├── domain/                         # Tests unitarios de dominio puro
│           ├── application/                    # Tests de casos de uso (Mockito)
│           ├── adapters/                       # Tests de controllers (@WebMvcTest)
│           └── integration/                   # Tests de integración (@SpringBootTest)
│
├── pom.xml                                     # o build.gradle
└── Dockerfile
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