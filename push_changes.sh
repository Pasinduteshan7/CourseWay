#!/bin/bash
cd /mnt/d/PROJECTS/personal/devops/react_doker
git add Jenkinsfile backend/Dockerfile frontend/Dockerfile
git commit -m "Fix: Add network resilience for Docker builds with retry logic and timeout settings"
git push origin main
echo "Changes pushed successfully!"
