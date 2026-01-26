#!/bin/bash
set -e

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
cat > docker-compose.yml <<'EOF'
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
      - VITE_API_URL=http://localhost:5000
    restart: unless-stopped

volumes:
  mongo_data:

networks:
  mern-network:
    driver: bridge
EOF

# Start containers
docker-compose pull
docker-compose up -d

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
