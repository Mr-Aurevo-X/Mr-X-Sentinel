#!/usr/bin/env bash
set -euo pipefail
REPO_URL="${REPO_URL:-https://github.com/Mr-Aurevo-X/Mr-X-Sentinel.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/Mr-X-Sentinel}"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi
[ -d "$INSTALL_DIR/.git" ] || git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"
[ -f .env ] || cp .env.production.example .env
echo "Edit .env then run: docker compose -f docker-compose.prod.yml --env-file .env up -d --build"
