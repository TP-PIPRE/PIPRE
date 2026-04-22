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
                    def oldBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def oldFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-backend ./backend'
                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'

                    def newBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def newFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    backendChanged = (oldBackendSha != newBackendSha && oldBackendSha != "")
                    frontendChanged = (oldFrontendSha != newFrontendSha && oldFrontendSha != "")

                    echo "Backend cambió: ${backendChanged}"
                    echo "Frontend cambió: ${frontendChanged}"
                }
            }
        }
        stage('Smart Deploy') {
            when { expression { return backendChanged || frontendChanged } }
            steps {
                script {
                    echo 'Iniciando actualización...'
                    if (backendChanged) {
                        // Sintaxis directa. Si falla, prueba: sh 'docker compose up -d backend'
                        sh 'docker compose up -d --force-recreate backend'
                    }
                    if (frontendChanged) {
                        sh 'docker compose up -d --force-recreate frontend'
                    }
                    sh 'curl -X POST "${PORTAINER_BASE_URL}/${PORTAINER_TOKEN}"'
                }
            }
        }
    }
    post {
        always { sh 'docker image prune -f' }
    }
}