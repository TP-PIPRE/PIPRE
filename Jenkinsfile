
pipeline {
    agent any

    environment {
        // 1. Aquí pegas la URL exacta que sacaste de Portainer (Stack Webhook)
        PORTAINER_WEBHOOK = "https://portainer.yoshua-cloud.dedyn.io/api/webhooks/tu-token-aqui"
    }

    stages {
        stage('Checkout') {
            steps {
                // Descarga el código usando la credencial SSH que configuramos
                checkout scmGit(branches: [[name: 'refs/heads/backend/scheme']], extensions: [], userRemoteConfigs: [[credentialsId: 'github-ssh-key', url: 'https://github.com/TP-PIPRE/PIPRE']])
            }
        }

        stage('Build Backend') {
            steps {
                echo 'Iniciando construcción del Backend con BuildKit...'
                // Añadimos DOCKER_BUILDKIT=1 antes del comando
                sh 'DOCKER_BUILDKIT=1 docker build -t pipre-backend ./backend'
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Iniciando construcción del Frontend (React)...'
                // Construye el frontend pasando la URL de la API como argumento
                sh 'docker build -t pipre-frontend --build-arg REACT_APP_API_URL=https://api.yoshua-cloud.dedyn.io ./frontend'
            }
        }

        stage('Deploy to Production') {
            steps {
                echo 'Notificando a Portainer para refrescar los contenedores...'
                // Portainer recibirá esto, hará un "docker pull" (o recreará con las nuevas imágenes locales)
                sh "curl -X POST '${PORTAINER_WEBHOOK}'"
            }
        }
    }

    post {
        success {
            echo '¡Despliegue exitoso! Tu app ya está actualizada en Oracle Cloud.'
        }
        failure {
            echo 'Hubo un error en el Pipeline. Revisa los logs de arriba.'
        }
    }
}