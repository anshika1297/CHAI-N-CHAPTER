#!/usr/bin/env bash
# build-deploy-api.sh — produce api-deploy.tar.gz at repo root for Bluehost API update.
#
# Usage: ./scripts/build-deploy-api.sh
# Server: extract under ~/public_html, then:
#   cd ~/public_html/apps/api && pm2 restart chai-n-chapter-api --update-env && pm2 save
#
# Does NOT include uploads/ or .env (keep those on the server).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

log "Building apps/api…"
npm run build -w apps/api

# Stamp build time — surfaced on GET /health as `build` for deploy verification
date -u +"%Y-%m-%dT%H:%M:%SZ" > apps/api/dist/BUILD_TIMESTAMP.txt

log "Packaging api-deploy.tar.gz…"
rm -f api-deploy.tar.gz
tar --exclude='._*' --exclude='.DS_Store' -czf api-deploy.tar.gz \
  apps/api/dist \
  apps/api/package.json \
  apps/api/ecosystem.config.js

SIZE="$(du -h api-deploy.tar.gz | awk '{print $1}')"
log "Done → $REPO_ROOT/api-deploy.tar.gz ($SIZE)"
