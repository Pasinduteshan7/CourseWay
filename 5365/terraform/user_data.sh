#!/bin/bash
set -e

echo "=== Starting CourseWay Deployment ==="
sleep 10

# Get instance IP
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Instance IP: $INSTANCE_IP"

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y docker.io docker-compose

# Start Docker
usermod -aG docker ubuntu
systemctl start docker
systemctl enable docker

# Create app directory
mkdir -p /opt/courseway
cd /opt/courseway

# Create docker-compose.yml
cat > docker-compose.yml <<'EOFCOMPOSE'
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
      VITE_API_URL: http://INSTANCE_IP_PLACEHOLDER:5000
    restart: unless-stopped

volumes:
  mongo_data:

networks:
  mern-network:
    driver: bridge
EOFCOMPOSE

# Replace placeholder with actual IP
sed -i "s/INSTANCE_IP_PLACEHOLDER/$INSTANCE_IP/g" docker-compose.yml

# Wait for Docker daemon
sleep 10

# Pull and start containers
echo "=== Pulling Docker images ==="
docker-compose pull

echo "=== Starting containers ==="
docker-compose up -d

echo "=== Waiting for services to be ready ==="
sleep 15

# Check status
docker ps

echo "=== Deployment Complete ==="
echo "Frontend: http://$INSTANCE_IP:5173"
echo "Backend: http://$INSTANCE_IP:5000"
