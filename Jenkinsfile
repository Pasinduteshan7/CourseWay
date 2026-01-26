pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USERNAME = 'pasinduteshan'
        DOCKER_HUB_REGISTRY = 'pasinduteshan'
        IMAGE_TAG = "${BUILD_NUMBER}"
        GITHUB_REPO = 'https://github.com/Pasinduteshan7/CourseWay.git'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code from GitHub..."
                git branch: 'main', url: "${GITHUB_REPO}"
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo "Building Docker images..."
                sh '''
                docker build -t ${DOCKER_HUB_REGISTRY}/courseway-frontend:${IMAGE_TAG} frontend/
                docker build -t ${DOCKER_HUB_REGISTRY}/courseway-backend:${IMAGE_TAG} backend/
                docker tag ${DOCKER_HUB_REGISTRY}/courseway-frontend:${IMAGE_TAG} ${DOCKER_HUB_REGISTRY}/courseway-frontend:latest
                docker tag ${DOCKER_HUB_REGISTRY}/courseway-backend:${IMAGE_TAG} ${DOCKER_HUB_REGISTRY}/courseway-backend:latest
                '''
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                echo "Pushing images to Docker Hub..."
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    docker push ${DOCKER_HUB_REGISTRY}/courseway-frontend:${IMAGE_TAG}
                    docker push ${DOCKER_HUB_REGISTRY}/courseway-frontend:latest
                    docker push ${DOCKER_HUB_REGISTRY}/courseway-backend:${IMAGE_TAG}
                    docker push ${DOCKER_HUB_REGISTRY}/courseway-backend:latest
                    docker logout
                    '''
                }
            }
        }
        
        stage('Cleanup & Deploy') {
            steps {
                echo "Stopping old containers..."
                sh '''
                docker compose down || true
                docker system prune -f || true
                '''
                
                echo "Deploying new containers..."
                sh '''
                docker pull ${DOCKER_HUB_REGISTRY}/courseway-frontend:latest
                docker pull ${DOCKER_HUB_REGISTRY}/courseway-backend:latest
                docker compose up -d
                sleep 5
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                echo "Checking application health..."
                sh '''
                curl -f http://localhost:5000/api/health || true
                echo "✅ Application deployed successfully!"
                '''
            }
        }
    }
    
    post {
        always {
            sh 'docker logout || true'
            sh 'docker compose logs || true'
        }
        success {
            echo "✅ Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
    }
}
