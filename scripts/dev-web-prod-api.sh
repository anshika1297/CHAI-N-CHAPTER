#!/usr/bin/env bash
# Frontend on :3000, data from the LIVE API (no local Express needed).
#
# Browser calls http://localhost:3000/api/... → Next rewrites → https://chaptersaurchai.com/api/...
# Avoids CORS; do NOT set NEXT_PUBLIC_API_URL to the public host in .env.local for this mode.
#
# Usage (repo root):  npm run dev:web:prod

set -euo pipefail

SDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-ports.sh
. "${SDIR}/lib-ports.sh"

ROOT="$(cd "${SDIR}/.." && pwd)"
cd "$ROOT"

echo "▶ Stopping listeners on TCP :3000 (if any)"
free_tcp_port 3000 || true
sleep 0.3

export WATCHPACK_POLLING=true
export NEXT_PUBLIC_SITE_URL=http://localhost:3000
export NEXT_PUBLIC_API_URL=
export API_INTERNAL_URL=https://chaptersaurchai.com
export NEXT_PUBLIC_IMAGE_API_URL=https://chaptersaurchai.com

echo ""
echo "▶ Next dev → http://localhost:3000"
echo "▶ API proxy → https://chaptersaurchai.com/api/..."
echo "   (Ctrl+C to stop)"
echo ""

exec npm run dev:poll -w apps/web
