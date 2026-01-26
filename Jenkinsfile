pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USERNAME = 'pasinduteshan'
        DOCKER_HUB_REGISTRY = 'pasinduteshan'
        IMAGE_TAG = "${BUILD_NUMBER}"
        GITHUB_REPO = 'https://github.com/Pasinduteshan7/CourseWay.git'
        AWS_REGION = 'us-east-1'
        TERRAFORM_VERSION = '1.5.0'
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
        
        stage('Terraform Plan') {
            steps {
                echo "Planning Terraform deployment..."
                withCredentials([
                    string(credentialsId: 'aws_access_key_id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws_secret_access_key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    cd terraform
                    terraform init
                    terraform plan -out=tfplan \
                        -var="docker_hub_username=${DOCKER_HUB_USERNAME}" \
                        -var="docker_hub_password=${DOCKER_HUB_PASSWORD}"
                    '''
                }
            }
        }
        
        stage('Terraform Apply') {
            steps {
                echo "Applying Terraform configuration to AWS..."
                withCredentials([
                    string(credentialsId: 'aws_access_key_id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws_secret_access_key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    cd terraform
                    terraform apply -auto-approve tfplan
                    terraform output > ../terraform_outputs.txt
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo "Checking application health..."
                sh '''
                curl -f http://localhost:5000/api/health || true
                echo "✅ Application deployed successfully!"
                
                # Check if AWS deployment happened
                if [ -f terraform_outputs.txt ]; then
                    echo ""
                    echo "=== AWS Deployment Info ==="
                    cat terraform_outputs.txt
                fi
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
