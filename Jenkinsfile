def backendChanged = false
def frontendChanged = false

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
                    // 1. SHAs actuales (Identidad matemática de la imagen)
                    def oldBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def oldFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    // 2. Construcción (Desactivamos provenance para evitar SHAs variables por metadatos)
                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-backend ./backend'
                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'

                    // 3. Nuevos SHAs
                    def newBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def newFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    // 4. Lógica de cambio
                    backendChanged = (oldBackendSha != newBackendSha && oldBackendSha != "")
                    frontendChanged = (oldFrontendSha != newFrontendSha && oldFrontendSha != "")

                    echo "Resumen de cambios - Backend: ${backendChanged}, Frontend: ${frontendChanged}"
                }
            }
        }

        stage('Smart Deploy') {
            when {
                expression { return backendChanged || frontendChanged }
            }
            steps {
                script {
                    echo 'Iniciando despliegue optimizado...'

                    if (backendChanged) {
                        echo "Actualizando Backend"
                        sh 'docker compose -p pipre-application up -d --force-recreate backend'
                    }

                    if (frontendChanged) {
                        echo "Actualizando Frontend"
                        sh 'docker compose -p pipre-application up -d --force-recreate frontend'
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
        success {
            echo '¡Pipeline completado con éxito!'
        }
    }
}