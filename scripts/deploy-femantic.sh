#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="/var/www/html/femantic"
BRANCH="${FEMANTIC_BRANCH:-main}"
PYTHON="${HOME}/.pyenv/versions/3.11.9/bin/python"
VENV="${REPO_DIR}/backend/venv"
FRONTEND_URL="${FEMANTIC_URL:-http://127.0.0.1/}"

log() {
    printf '[deploy-femantic] %s\n' "$*"
}

echo "========================================"
echo " Femantic production deployment"
echo "========================================"

cd "$REPO_DIR"

if [[ "$(git status --porcelain)" != "" ]]; then
    echo "ERROR: uncommitted changes found; deployment stopped."
    printf 'Refusing to deploy with uncommitted changes in %s\n' "$REPO_DIR" >&2
    exit 1
fi

log "Pulling origin/${BRANCH}"
git pull --ff-only origin "$BRANCH"

if [[ ! -x "$PYTHON" ]]; then
    echo "ERROR: Python 3.11.9 is not installed."
    printf 'Python 3.11.9 not found at %s\n' "$PYTHON" >&2
    exit 1
fi

if [[ ! -x "${VENV}/bin/python" ]] || [[ "$("${VENV}/bin/python" -c 'import sys; print(sys.version_info[:2])')" != "(3, 11)" ]]; then
    log "Creating Python 3.11 virtual environment"
    rm -rf "$VENV"
    "$PYTHON" -m venv "$VENV"
fi

log "Installing backend requirements"
"${VENV}/bin/python" -m pip install --quiet --upgrade pip
"${VENV}/bin/python" -m pip install --quiet -r backend/requirements.txt
"${VENV}/bin/python" -m pip check

log "Installing frontend requirements"
npm --prefix frontend ci --no-audit --no-fund

log "Applying database schema"
sudo -n -u postgres psql -d femantic -v ON_ERROR_STOP=1 -f database/schema.sql >/dev/null

log "Starting Redis"
sudo -n systemctl enable --now redis-server

log "Building frontend"
rm -rf frontend/.next
NEXT_PUBLIC_API_URL= npm --prefix frontend run build

log "Installing service definitions"
sudo -n install -m 0644 deploy/femantic-backend.service /etc/systemd/system/femantic-backend.service
sudo -n install -m 0644 deploy/femantic-frontend.service /etc/systemd/system/femantic-frontend.service
sudo -n install -m 0644 nginx-femantic.conf /etc/nginx/sites-available/femantic
sudo -n ln -sfn /etc/nginx/sites-available/femantic /etc/nginx/sites-enabled/femantic
sudo -n systemctl daemon-reload

log "Restarting Femantic services"
sudo -n systemctl enable --now femantic-backend.service femantic-frontend.service
sudo -n systemctl restart femantic-backend.service femantic-frontend.service
sudo -n nginx -t
sudo -n systemctl reload nginx

log "Running health checks"
for attempt in {1..15}; do
    if curl --fail --silent http://127.0.0.1:8100/health >/dev/null && curl --fail --silent "$FRONTEND_URL" >/dev/null; then
        echo ""
        echo "========================================"
        echo " Deployment successful"
        echo " Frontend: http://136.244.78.245/"
        echo " Admin:    http://136.244.78.245/admin"
        echo " Backend:  http://127.0.0.1:8100/health"
        echo "========================================"
        log "Deployment complete: ${FRONTEND_URL}"
        exit 0
    fi
    sleep 1
done

printf 'Health checks failed. Inspect: sudo journalctl -u femantic-backend -u femantic-frontend -n 100\n' >&2
echo "ERROR: deployment health checks failed."
exit 1