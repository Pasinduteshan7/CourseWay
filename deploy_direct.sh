#!/bin/bash

# Configuration
INSTANCE_IP="52.204.151.3"
SSH_KEY="$HOME/.ssh/courseway-key-jenkins.pem"
DOCKER_HUB_USER="pasinduteshan"
DOCKER_HUB_PASS=""  # Will be prompted
SSH_RETRIES=30
RETRY_DELAY=10

echo "=== Direct Deployment to EC2 Instance ==="
echo "Instance IP: $INSTANCE_IP"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at: $SSH_KEY"
    exit 1
fi

# Wait for instance to be ready (SSH accessible)
echo "Waiting for instance to be SSH-ready (timeout: ${SSH_RETRIES}x${RETRY_DELAY}s)..."
RETRY=1
while [ $RETRY -le $SSH_RETRIES ]; do
    if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes ubuntu@$INSTANCE_IP "echo 'Instance is ready!'" 2>/dev/null; then
        echo "✅ Instance is SSH-ready!"
        break
    else
        echo "Attempt $RETRY/$SSH_RETRIES: Waiting for SSH... (${RETRY}/${SSH_RETRIES})"
        sleep $RETRY_DELAY
        RETRY=$((RETRY + 1))
    fi
done

if [ $RETRY -gt $SSH_RETRIES ]; then
    echo "❌ Instance did not become SSH-ready after $(($SSH_RETRIES * $RETRY_DELAY)) seconds"
    exit 1
fi

# Prompt for Docker Hub password
echo ""
echo "Enter Docker Hub password:"
read -s DOCKER_HUB_PASS

# Deploy via SSH
echo ""
echo "Deploying application..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "Checking Docker..."
docker ps

echo ""
echo "Pulling latest Docker images..."
docker login -u pasinduteshan --password-stdin << EOF
$DOCKER_HUB_PASS
EOF

cd /opt/courseway
docker-compose pull
docker-compose up -d

echo ""
echo "✅ Deployment complete!"
echo "Frontend: http://52.204.151.3:5173"
echo "Backend: http://52.204.151.3:5000"

docker ps

DEPLOY_SCRIPT

echo ""
echo "✅ Direct deployment successful!"
