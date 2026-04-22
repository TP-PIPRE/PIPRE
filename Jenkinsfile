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
        stage('Build & Check Changes') {
            steps {
                script {
                    // 1. DETECCIÓN POR HUELLA DIGITAL (MD5)
                    // Calculamos el hash actual del archivo
                    def currentHash = sh(script: "md5sum docker-compose.yml | cut -d ' ' -f 1", returnStdout: true).trim()

                    // Leemos el hash de la última vez que el pipeline tuvo éxito
                    def lastHash = ""
                    if (fileExists('last_compose_hash.txt')) {
                        lastHash = readFile('last_compose_hash.txt').trim()
                    }

                    if (currentHash != lastHash) {
                        composeChanged = true
                        echo "¡Cambio detectado en docker-compose.yml! (Hash: ${currentHash})"
                        // Guardamos el nuevo hash para la próxima vez
                        writeFile file: 'last_compose_hash.txt', text: currentHash
                    }

                    // 2. SHAs de IMÁGENES (Igual que antes)
                    def oldBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest || echo ''", returnStdout: true).trim()
                    def oldFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest || echo ''", returnStdout: true).trim()

                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-backend ./backend'
                    sh 'DOCKER_BUILDKIT=1 docker build --provenance=false -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'

                    def newBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def newFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    backendChanged = (oldBackendSha != newBackendSha && oldBackendSha != "")
                    frontendChanged = (oldFrontendSha != newFrontendSha && oldFrontendSha != "")

                    echo "Resumen - Compose: ${composeChanged}, Backend: ${backendChanged}, Frontend: ${frontendChanged}"
                }
            }
        }

        stage('Smart Deploy') {
            when {
                expression { return backendChanged || frontendChanged || composeChanged }
            }
            steps {
                script {
                    // Si el compose cambió, actualizamos TODO el stack primero para sincronizar redes/logs
                    if (composeChanged) {
                        echo "Sincronizando stack completo por cambios en YAML..."
                        sh 'docker compose -p pipre-application up -d --remove-orphans'
                    }
                    // Si el compose NO cambió, pero sí las imágenes, hacemos el up quirúrgico
                    else {
                        if (backendChanged) {
                            echo "Actualizando solo Backend..."
                            sh 'docker compose -p pipre-application up -d --no-deps --force-recreate backend'
                        }

                        if (frontendChanged) {
                            echo "Actualizando solo Frontend..."
                            sh 'docker compose -p pipre-application up -d --no-deps --force-recreate frontend'
                        }
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