# PIPRE
Plataforma Inteligente de Programación y Robótica Escolar con feedback de IA. Proyecto para taller de proyectos NRC: 28601.

## Instalación de la aplicación en local
1. Descargar docker
2. Clonar el proyecto:
    ```bash
    git clone https://github.com/TP-PIPRE/PIPRE
    ```
3. Ingresar el siguiente comando en la consola en la raiz del proyecto:
    ```bash
    docker-compose up -d
    ```
4. Ingresar a los puertos en:
    ```bash
    Frontend: http://localhost:3000/
    Backend: http://localhost:8080/
    ```
   
## Instalación de la aplicación en producción
1. Descargar docker
2. Clonar el proyecto:
    ```bash
    git clone https://github.com/TP-PIPRE/PIPRE
    ```
3. Ingresar el siguiente comando en la consola en la raiz del proyecto:
    ```bash
    docker-compose up -f docker-compose.yaml -d
    ```
4. Ingresar a las url traducidas por DNS en:
    ```bash
    Frontend: https://pipre-frontend.yoshua-cloud.dedyn.io/
    Backend: https://pipre-backend.yoshua-cloud.dedyn.io/
    ```