#!/bin/bash
set -e

# Wait for instance to be fully ready
sleep 10

# Get the instance's public IP
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Instance IP: $INSTANCE_IP" | tee /var/log/courseway-deploy.log

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y docker.io docker-compose

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Start Docker service
systemctl start docker
systemctl enable docker

# Create app directory
mkdir -p /opt/courseway
cd /opt/courseway

# Login to Docker Hub and pull images
echo "${docker_hub_password}" | docker login -u "${docker_hub_username}" --password-stdin

# Create docker-compose.yml
# Use backend service name as hostname instead of IP
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  mongo:
    image: mongo:latest
    container_name: mongo_db
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - mern-network
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    restart: unless-stopped

  backend:
    image: pasinduteshan/courseway-backend:latest
    container_name: courseway_backend
    ports:
      - "5000:5000"
    depends_on:
      - mongo
    networks:
      - mern-network
    environment:
      MONGO_URI: mongodb://root:password@mongo:27017/courseway?authSource=admin
      JWT_SECRET: your_jwt_secret_key_prod_change_this
    restart: unless-stopped

  frontend:
    image: pasinduteshan/courseway-frontend:latest
    container_name: courseway_frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - mern-network
    environment:
      VITE_API_URL: http://courseway_backend:5000
    restart: unless-stopped

volumes:
  mongo_data:

networks:
  mern-network:
    driver: bridge
COMPOSE_EOF

# Log the docker-compose content
echo "=== Docker Compose Configuration ===" >> /var/log/courseway-deploy.log
cat docker-compose.yml >> /var/log/courseway-deploy.log

# Wait for Docker daemon to be fully ready
sleep 10

# Start containers with retry logic
MAX_RETRIES=3
RETRY=1
until [ $RETRY -gt $MAX_RETRIES ]; do
  echo "Starting containers (attempt $RETRY/$MAX_RETRIES)..." | tee -a /var/log/courseway-deploy.log
  if docker-compose pull && docker-compose up -d; then
    echo "✅ Containers started successfully" | tee -a /var/log/courseway-deploy.log
    break
  else
    echo "❌ Attempt $RETRY failed, retrying in 10 seconds..." | tee -a /var/log/courseway-deploy.log
    sleep 10
    RETRY=$((RETRY + 1))
  fi
done

# Wait a bit more for containers to stabilize
sleep 5

# Log container status
echo "=== Container Status ===" >> /var/log/courseway-deploy.log
docker ps -a >> /var/log/courseway-deploy.log 2>&1

echo "=== Docker Compose Logs ===" >> /var/log/courseway-deploy.log
docker-compose logs >> /var/log/courseway-deploy.log 2>&1

# Create a script to update the application
cat > /opt/courseway/update.sh <<'UPDATESCRIPT'
#!/bin/bash
cd /opt/courseway
docker-compose pull
docker-compose up -d
UPDATESCRIPT

chmod +x /opt/courseway/update.sh

# Logout from Docker Hub
docker logout

# Log instance URLs
echo "=== Deployment Complete ===" | tee -a /var/log/courseway-deploy.log
echo "Instance is running at: http://${INSTANCE_IP}:5173" | tee -a /var/log/courseway-deploy.log
echo "Backend API at: http://${INSTANCE_IP}:5000" | tee -a /var/log/courseway-deploy.log
echo "Deployment finished at $(date)" | tee -a /var/log/courseway-deploy.log
