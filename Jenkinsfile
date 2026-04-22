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
                    // 1. Obtener SHAs actuales
                    def oldBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def oldFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    // 2. Construir
                    sh 'DOCKER_BUILDKIT=1 docker build -t pipre-backend ./backend'
                    sh 'DOCKER_BUILDKIT=1 docker build -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'

                    // 3. Obtener nuevos SHAs
                    def newBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def newFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    // 4. Actualizar variables lógicas
                    // Si el SHA cambió O si la imagen no existía antes, marcamos como true
                    backendChanged = (oldBackendSha != newBackendSha)
                    frontendChanged = (oldFrontendSha != newFrontendSha)

                    echo "Backend cambió: ${backendChanged} (Prev: ${oldBackendSha} -> New: ${newBackendSha})"
                    echo "Frontend cambió: ${frontendChanged} (Prev: ${oldFrontendSha} -> New: ${newFrontendSha})"
                }
            }
        }

        stage('Smart Deploy') {
            when {
                // Usamos la expresión de Groovy directamente sobre las variables definidas arriba
                expression { return backendChanged || frontendChanged }
            }
            steps {
                script {
                    echo 'Iniciando actualización selectiva...'

                    if (backendChanged) {
                        echo "Recreando contenedor Backend..."
                        sh 'docker compose up --detach --force-recreate backend'
                    }

                    if (frontendChanged) {
                        echo "Recreando contenedor Frontend..."
                        sh 'docker compose up --detach --force-recreate frontend'
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
            echo 'Pipeline finalizado con éxito.'
        }
    }
}
