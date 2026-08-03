#!/usr/bin/env bash
# Fix API EADDRINUSE / crashed PM2 on Bluehost — run in cPanel Terminal from ~/public_html
#
# Reads PORT from apps/api/.env (defaults 5002). Frees that port, starts dist/server.js via PM2.

set -euo pipefail

cd ~/public_html/apps/api

PORT="$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r"' | tr -d ' ' || true)"
PORT="${PORT:-5002}"

echo "▶ Using API port ${PORT} (from apps/api/.env)"

echo "▶ Stopping PM2 API process…"
pm2 delete chai-n-chapter-api 2>/dev/null || true
pm2 save 2>/dev/null || true

echo "▶ Processes listening on :${PORT} (before cleanup):"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || true) | grep "${PORT}" || true
if command -v lsof >/dev/null 2>&1; then
  lsof -iTCP:"${PORT}" -sTCP:LISTEN -Pn 2>/dev/null || true
fi

echo "▶ Freeing port ${PORT}…"
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
fi
if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -iTCP:"${PORT}" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "${PIDS}" ]]; then
    kill -9 ${PIDS} 2>/dev/null || true
  fi
fi
sleep 2

if [[ ! -f dist/server.js ]]; then
  echo "✗ dist/server.js missing. Extract api-deploy.tar.gz or run: npm run build"
  exit 1
fi

echo "▶ Starting API (fork, single instance, dist/server.js)…"
pm2 start ecosystem.config.js --env production
pm2 save

sleep 2
echo ""
echo "▶ PM2 status"
pm2 list
echo ""
echo "▶ Health (loopback)"
curl -sI "http://127.0.0.1:${PORT}/health" | head -1
echo ""
echo "▶ Sample API route"
curl -sI "http://127.0.0.1:${PORT}/api/site/stats" | head -1
