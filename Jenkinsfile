def backendChanged = false
def frontendChanged = false
def composeChanged = false

pipeline {
    agent any

    environment {
        PORTAINER_TOKEN = credentials('PORTAINER_STACK_WEBHOOK_TOKEN')
        PORTAINER_BASE_URL = "https://portainer.yoshua-cloud.dedyn.io/api/stacks/webhooks"
    }

    stages {
        stage('Build & Check SHA') {
            steps {
                script {
                    // 1. Detectar si el docker-compose.yml ha cambiado en este commit
                    composeChanged = sh(script: "git diff --name-only HEAD^ HEAD | grep 'docker-compose.yml' || true", returnStdout: true).trim() != ""

                    // 2. SHAs actuales
                    def oldBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def oldFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    // 3. Construcción
                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-backend ./backend'
                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'

                    // 4. Nuevos SHAs
                    def newBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def newFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    // 5. Lógica de cambio
                    backendChanged = (oldBackendSha != newBackendSha && oldBackendSha != "")
                    frontendChanged = (oldFrontendSha != newFrontendSha && oldFrontendSha != "")

                    echo "Resumen: Compose: ${composeChanged}, Backend: ${backendChanged}, Frontend: ${frontendChanged}"
                }
            }
        }

        stage('Smart Deploy') {
            when {
                expression { return backendChanged || frontendChanged || composeChanged }
            }
            steps {
                script {
                    echo 'Iniciando despliegue...'

                    // PRIORIDAD 1: Si cambió el compose, sincronizamos el stack entero primero
                    if (composeChanged) {
                        echo "Cambio en docker-compose.yml detectado. Sincronizando infraestructura completa..."
                        sh 'docker compose -p pipre-application up -d --remove-orphans'
                    }

                    // PRIORIDAD 2: Actualización de imágenes
                    if (backendChanged) {
                        echo "Recreando contenedor Backend con nueva imagen..."
                        sh 'docker compose -p pipre-application up -d --no-deps --force-recreate backend'
                    }

                    if (frontendChanged) {
                        echo "Recreando contenedor Frontend con nueva imagen..."
                        sh 'docker compose -p pipre-application up -d --no-deps --force-recreate frontend'
                    }

                    sh 'curl -X POST "${PORTAINER_BASE_URL}/${PORTAINER_TOKEN}"'
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f'
        }
    }
}