
pipeline {
    agent any

    environment {
        // Esto asocia el secreto de Jenkins a una variable de entorno del script
        PORTAINER_TOKEN = credentials('PORTAINER_STACK_WEBHOOK_TOKEN')
        // URL base sin el token
        PORTAINER_BASE_URL = "https://portainer.yoshua-cloud.dedyn.io/api/stacks/webhooks"
        BACKEND_CHANGED = 'false'
        FRONTEND_CHANGED = 'false'
    }
stages {
        stage('Build & Check SHA') {
            steps {
                script {
                    // Usamos -q --no-trunc para obtener el ID largo y evitar errores de comparación
                    def oldBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def oldFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    echo "SHA previo Backend: ${oldBackendSha}"

                    sh 'DOCKER_BUILDKIT=1 docker build -t pipre-backend ./backend'
                    sh 'DOCKER_BUILDKIT=1 docker build -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'

                    def newBackendSha = sh(script: "docker images -q --no-trunc pipre-backend:latest", returnStdout: true).trim()
                    def newFrontendSha = sh(script: "docker images -q --no-trunc pipre-frontend:latest", returnStdout: true).trim()

                    // Comparación estricta
                    if (oldBackendSha != newBackendSha && oldBackendSha != "") {
                        env.BACKEND_CHANGED = 'true'
                        echo "Backend ha cambiado."
                    } else {
                        env.BACKEND_CHANGED = 'false'
                        echo "Backend sin cambios."
                    }

                    if (oldFrontendSha != newFrontendSha && oldFrontendSha != "") {
                        env.FRONTEND_CHANGED = 'true'
                        echo "Frontend ha cambiado."
                    } else {
                        env.FRONTEND_CHANGED = 'false'
                        echo "Frontend sin cambios."
                    }
                }
            }
        }

        stage('Smart Deploy') {
            when {
                expression { env.BACKEND_CHANGED == 'true' || env.FRONTEND_CHANGED == 'true' }
            }
            steps {
                script {
                    echo 'Iniciando actualización selectiva...'

                    if (env.BACKEND_CHANGED == 'true') {
                        sh 'docker compose up --detach --force-recreate backend'
                    }

                    if (env.FRONTEND_CHANGED == 'true') {
                        sh 'docker compose up --detach --force-recreate frontend'
                    }

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
