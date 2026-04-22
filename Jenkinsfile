
pipeline {
    agent any

    environment {
        // Esto asocia el secreto de Jenkins a una variable de entorno del script
        PORTAINER_TOKEN = credentials('PORTAINER_STACK_WEBHOOK_TOKEN')
        // URL base sin el token
        PORTAINER_BASE_URL = "https://portainer.yoshua-cloud.dedyn.io/api/stacks/webhooks"
    }

stages {
        stage('Build & Check SHA') {
            steps {
                script {
                    // 1. Capturar SHA actual antes del build (si no existe, devolverá vacío)
                    def oldBackendSha = sh(script: "docker images -q pipre-backend:latest", returnStdout: true).trim()
                    def oldFrontendSha = sh(script: "docker images -q pipre-frontend:latest", returnStdout: true).trim()

                    echo "SHA previo Backend: ${oldBackendSha ?: 'Ninguno'}"
                    echo "SHA previo Frontend: ${oldFrontendSha ?: 'Ninguno'}"

                    // 2. Ejecutar las construcciones
                    sh 'DOCKER_BUILDKIT=1 docker build -t pipre-backend ./backend'
                    sh 'DOCKER_BUILDKIT=1 docker build -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'

                    // 3. Capturar nuevo SHA post-build
                    def newBackendSha = sh(script: "docker images -q pipre-backend:latest", returnStdout: true).trim()
                    def newFrontendSha = sh(script: "docker images -q pipre-frontend:latest", returnStdout: true).trim()

                    // 4. Comparar
                    if (oldBackendSha != newBackendSha) {
                        echo "¡Cambio detectado en Backend!"
                        BACKEND_CHANGED = "true"
                    }
                    if (oldFrontendSha != newFrontendSha) {
                        echo "¡Cambio detectado en Frontend!"
                        FRONTEND_CHANGED = "true"
                    }
                }
            }
        }

        stage('Smart Deploy') {
            when {
                expression { BACKEND_CHANGED == "true" || FRONTEND_CHANGED == "true" }
            }
            steps {
                script {
                    echo 'Iniciando actualización selectiva...'

                    // Si el backend cambió, lo recreamos
                    if (BACKEND_CHANGED == "true") {
                        sh 'docker compose up -d --force-recreate backend'
                    }

                    // Si el frontend cambió, lo recreamos
                    if (FRONTEND_CHANGED == "true") {
                        sh 'docker compose up -d --force-recreate frontend'
                    }

                    // Notificar a Portainer para sincronizar el estado del Stack
                    sh 'curl -X POST "${PORTAINER_BASE_URL}/${PORTAINER_TOKEN}"'
                }
            }
        }
    }

    post {
        always {
            // Limpieza de imágenes intermedias para no saturar el disco de la instancia Ampere
            sh 'docker image prune -f'
        }
        success {
            echo 'Pipeline finalizado con éxito.'
        }
    }
}
