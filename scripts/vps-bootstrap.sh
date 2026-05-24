#!/usr/bin/env bash
set -euo pipefail
REPO_URL="${REPO_URL:-https://github.com/Mr-Aurevo-X/Mr-X-Sentinel.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/Mr-X-Sentinel}"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" 2>/dev/null || true
  echo "Reconnect SSH pour le groupe docker."
fi
[ -d "$INSTALL_DIR/.git" ] || git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"
[ -f .env ] || cp .env.production.example .env
echo "Éditez .env puis : docker compose -f docker-compose.prod.yml --env-file .env up -d --build"
echo "Health: curl -s http://localhost:3000/api/health"
