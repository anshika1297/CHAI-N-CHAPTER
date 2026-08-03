#!/usr/bin/env bash
# Run on Bluehost cPanel Terminal AFTER uploading tarballs to ~/public_html/
#
# Upload from laptop (File Manager or scp):
#   web-deploy.tar.gz
#   api-deploy.tar.gz
#
# Then:
#   cd ~/public_html
#   bash scripts/deploy-on-server.sh

set -euo pipefail

cd ~/public_html

if [[ -f web-deploy.tar.gz ]]; then
  echo "▶ Deploying frontend…"
  tar -xzf web-deploy.tar.gz
  rm -f web-deploy.tar.gz
  find apps/web/.next apps/web/public -name '._*' -delete 2>/dev/null || true
  pm2 restart chai-n-chapter-web --update-env
else
  echo "⚠  web-deploy.tar.gz not found — skip frontend"
fi

if [[ -f api-deploy.tar.gz ]]; then
  echo "▶ Deploying API (dist only — uploads/ and .env preserved)…"
  tar -xzf api-deploy.tar.gz
  rm -f api-deploy.tar.gz
  test -f apps/api/dist/server.js || { echo "✗ apps/api/dist/server.js missing after extract"; exit 1; }
  cd apps/api
  pm2 delete chai-n-chapter-api 2>/dev/null || true
  pm2 start ecosystem.config.js --env production
  cd ~/public_html
else
  echo "⚠  api-deploy.tar.gz not found — skip API"
fi

pm2 save

echo ""
echo "▶ Health checks"
API_PORT="$(grep -E '^PORT=' apps/api/.env 2>/dev/null | cut -d= -f2- | tr -d '\r" ' || true)"
API_PORT="${API_PORT:-5002}"
curl -sI http://127.0.0.1:3000/ | head -1 || true
curl -s "http://127.0.0.1:${API_PORT}/health" | head -c 200 || true
echo ""
curl -sI "http://127.0.0.1:${API_PORT}/api/genres" | head -1 || true
curl -sI "http://127.0.0.1:${API_PORT}/api/books/directory?limit=1" | head -1 || true
curl -sI https://chaptersaurchai.com/ | head -1 || true
curl -sI https://chaptersaurchai.com/books | head -1 || true
pm2 list
