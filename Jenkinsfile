pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = "pasinduteshan"
        DOCKER_HUB_REPO_BACKEND = "${DOCKER_REGISTRY}/courseway-backend"
        DOCKER_HUB_REPO_FRONTEND = "${DOCKER_REGISTRY}/courseway-frontend"
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
        EC2_HOST = "52.86.2.215"
        EC2_USER = "ubuntu"
        SSH_KEY_ID = "ec2-ssh-key"
        COMPOSE_PROJECT_NAME = "courseway"
        // Environment variables for deployment
        MONGODB_URI = "mongodb://mongo_db:27017/courseway_db"
        VITE_API_URL = "http://52.86.2.215:5000"
        CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://52.86.2.215:5173"
    }
    
    triggers {
        // Trigger build on GitHub push
        githubPush()
    }
    
    stages {
        stage(' Checkout') {
            steps {
                echo ' Checking out code from GitHub...'
                git branch: 'main', url: 'https://github.com/Pasinduteshan7/CourseWay.git'
            }
        }
        
        stage('🔧 Build Docker Images') {
            parallel {
                stage('🏗️ Build Frontend') {
                    steps {
                        echo ' Building frontend Docker image...'
                        script {
                            sh '''
                                cd frontend
                                docker build --no-cache -t ${DOCKER_HUB_REPO_FRONTEND}:${BUILD_NUMBER} .
                                docker tag ${DOCKER_HUB_REPO_FRONTEND}:${BUILD_NUMBER} ${DOCKER_HUB_REPO_FRONTEND}:latest
                                echo " Frontend image built successfully"
                            '''
                        }
                    }
                }
                stage('🛠️ Build Backend') {
                    steps {
                        echo ' Building backend Docker image...'
                        script {
                            sh '''
                                cd backend
                                docker build --no-cache -t ${DOCKER_HUB_REPO_BACKEND}:${BUILD_NUMBER} .
                                docker tag ${DOCKER_HUB_REPO_BACKEND}:${BUILD_NUMBER} ${DOCKER_HUB_REPO_BACKEND}:latest
                                echo " Backend image built successfully"
                            '''
                        }
                    }
                }
            }
        }
        
        stage(' Push to Docker Hub') {
            steps {
                echo ' Pushing images to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        
                        echo " Pushing versioned images..."
                        docker push ${DOCKER_HUB_REPO_FRONTEND}:${BUILD_NUMBER}
                        docker push ${DOCKER_HUB_REPO_BACKEND}:${BUILD_NUMBER}
                        
                        echo " Pushing latest images..."
                        docker push ${DOCKER_HUB_REPO_FRONTEND}:latest
                        docker push ${DOCKER_HUB_REPO_BACKEND}:latest
                        
                        docker logout
                        echo " All images pushed to Docker Hub successfully"
                    '''
                }
            }
        }
        
        stage(' Deploy to AWS EC2') {
            steps {
                echo ' Deploying application to AWS EC2...'
                withCredentials([sshUserPrivateKey(credentialsId: "${SSH_KEY_ID}", keyFileVariable: 'SSH_KEY_FILE', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        cat > deploy_to_ec2.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo " Starting deployment on AWS EC2..."

if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

mkdir -p /home/ubuntu/courseway-app
cd /home/ubuntu/courseway-app

cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  mongo_db:
    image: mongo:8.2
    container_name: mongo_db
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    command: mongod --bind_ip_all --auth
    networks:
      - courseway

  courseway_backend:
    image: pasinduteshan/courseway-backend:latest
    container_name: courseway_backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://admin:password@mongo_db:27017/courseway_db?authSource=admin
      - PORT=5000
      - JWT_SECRET=your-secret-key
      - CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://52.86.2.215:5173
    depends_on:
      - mongo_db
    networks:
      - courseway

  courseway_frontend:
    image: pasinduteshan/courseway-frontend:latest
    container_name: courseway_frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://52.86.2.215:5000
    depends_on:
      - courseway_backend
    networks:
      - courseway

volumes:
  mongodb_data:

networks:
  courseway:
    driver: bridge
COMPOSE_EOF

echo " Stopping existing containers..."
docker-compose down || true

echo " Removing any existing containers with our names..."
docker rm -f mongo_db courseway_backend courseway_frontend 2>/dev/null || true

echo "🧹 Cleaning up old resources..."
docker container prune -f
docker image prune -af

# Pull latest images
echo " Pulling latest images from Docker Hub..."
docker pull pasinduteshan/courseway-frontend:latest
docker pull pasinduteshan/courseway-backend:latest
docker pull mongo:8.2

# Start new containers
echo " Starting application services..."
docker-compose up -d

# Wait for services to be ready
echo " Waiting for services to start..."
sleep 30

# Check MongoDB status and wait for it to be ready
echo " Waiting for MongoDB to be ready..."
for i in {1..30}; do
    if docker-compose exec -T mongo_db mongosh --eval "print('MongoDB is ready')" > /dev/null 2>&1; then
        echo " MongoDB is ready"
        break
    fi
    echo " Waiting for MongoDB... ($i/30)"
    sleep 2
done

echo " Checking MongoDB authentication setup..."
# The MongoDB container is configured with MONGO_INITDB_ROOT_USERNAME and MONGO_INITDB_ROOT_PASSWORD
# These environment variables automatically create the admin user on first startup
# No additional user creation needed

echo " Deployment completed successfully!"

# Show service status
echo " Service Status:"
docker-compose ps
DEPLOY_EOF

chmod +x deploy_to_ec2.sh
                        
                        scp -i $SSH_KEY_FILE -o StrictHostKeyChecking=no deploy_to_ec2.sh ${EC2_USER}@${EC2_HOST}:/tmp/
                        
                        ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'bash /tmp/deploy_to_ec2.sh'
                        
                        echo " Application deployed successfully to EC2!"
                    '''
                }
            }
        }
        
        stage(' Health Check & Verification') {
            steps {
                echo ' Performing comprehensive health checks...'
                withCredentials([sshUserPrivateKey(credentialsId: "${SSH_KEY_ID}", keyFileVariable: 'SSH_KEY_FILE', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        cat > health_check.sh << 'HEALTH_EOF'
#!/bin/bash

echo " Performing health checks..."

cd /home/ubuntu/courseway-app

# Check container status
echo "=== Container Status ==="
docker-compose ps

echo ""
echo "=== Service Health Checks ==="

# Check MongoDB
echo "Checking MongoDB connection..."
max_attempts=5
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T mongo_db mongosh admin --eval "db.runCommand({ping: 1})" > /dev/null 2>&1; then
        echo " MongoDB is healthy"
        break
    else
        echo " MongoDB not ready, attempt $attempt/$max_attempts"
        if [ $attempt -eq $max_attempts ]; then
            echo " MongoDB health check failed"
        fi
    fi
    attempt=$((attempt + 1))
    sleep 5
done

# Check Backend API with retry
echo "Checking Backend API..."
max_attempts=10
attempt=1
backend_healthy=false
while [ $attempt -le $max_attempts ]; do
    if curl -f --connect-timeout 5 --max-time 10 http://localhost:5000 > /dev/null 2>&1; then
        echo " Backend API is healthy"
        backend_healthy=true
        break
    else
        echo " Backend not ready, attempt $attempt/$max_attempts"
        if [ $attempt -eq $max_attempts ]; then
            echo " Backend API health check failed"
            echo "Backend logs:"
            docker-compose logs --tail=10 courseway_backend
        fi
    fi
    attempt=$((attempt + 1))
    sleep 5
done

# Check Frontend with retry
echo "Checking Frontend..."
max_attempts=5
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f --connect-timeout 5 --max-time 10 http://localhost:5173 > /dev/null 2>&1; then
        echo " Frontend is healthy"
        break
    else
        echo " Frontend not ready, attempt $attempt/$max_attempts"
        if [ $attempt -eq $max_attempts ]; then
            echo " Frontend health check failed"
            echo "Frontend logs:"
            docker-compose logs --tail=10 courseway_frontend
        fi
    fi
    attempt=$((attempt + 1))
    sleep 5
done

echo ""
echo "=== Network Connectivity ==="
echo "Testing external access..."
curl -I http://52.86.2.215:5173 2>/dev/null | head -1 || echo " External frontend access check failed"
curl -I http://52.86.2.215:5000 2>/dev/null | head -1 || echo " External backend access check failed"

echo ""
echo "=== Application URLs ==="
echo " Frontend: http://52.86.2.215:5173"
echo " Backend API: http://52.86.2.215:5000"
echo " Database: MongoDB on localhost:27017"

echo ""
echo "=== Deployment Summary ==="
echo " Build Number: ${BUILD_NUMBER:-unknown}"
echo " Frontend Image: pasinduteshan/courseway-frontend:latest"
echo " Backend Image: pasinduteshan/courseway-backend:latest"
echo " Deployment Time: $(date)"
echo " Status: DEPLOYED"

echo ""
echo "=== Container Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"
HEALTH_EOF

ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'bash -s' < health_check.sh
                        
                        echo ""
                        echo " Health checks completed!"
                        echo " Your application should be accessible at: http://52.86.2.215:5173"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo '🧹 Cleaning up local resources...'
            sh '''
                docker logout || true
                docker system prune -f || true
                rm -f deploy_to_ec2.sh health_check.sh
            '''
        }
        
        success {
            echo '''
             ========================================
               DEPLOYMENT SUCCESSFUL! 
            ========================================
            
             Docker images built and pushed to Docker Hub
             Application deployed to AWS EC2 (52.86.2.215)
             Health checks completed
            
             Your CourseWay application is now live at:
             Frontend: http://52.86.2.215:5173
             Backend API: http://52.86.2.215:5000
            
             What happens next:
            1. Test your application functionality
            2. Make code changes and push to GitHub
            3. Jenkins will automatically build and deploy
            4. Monitor logs if any issues occur
            
             Happy 
            '''
        }
        
        failure {
            echo '''
             
               DEPLOYMENT FAILED! 
            
            
            Please check the console output above for detailed error information.
            
            Common troubleshooting steps:
             Docker Hub credentials: Manage Jenkins → Credentials → dockerhub-credentials
             SSH key configuration: Manage Jenkins → Credentials → ec2-ssh-key
             Application logs: SSH to EC2 and run docker-compose logs
        
             Need help? Check the Jenkins logs and container output above.
            '''
        }
        
        unstable {
            echo ' Pipeline completed with warnings. Some health checks may have failed.'
        }
    }
}