#!/bin/bash
# Femantic VPS Deploy Script
set -e
echo "=== Femantic Deploy ==="
git pull origin main
cd backend
python3 -m venv venv || true
source venv/bin/activate
pip install -r requirements.txt
cd ..
cd frontend
npm install
npm run build
cd ..
if command -v docker-compose &> /dev/null; then
  docker-compose up -d --build
  echo "Docker services restarted"
else
  echo "Restart systemd services manually"
fi
echo "=== Deploy complete ==="
