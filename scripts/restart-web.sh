#!/usr/bin/env bash
# Stop whatever is listening on :3000, wipe Next cache, start this workspace’s Next dev server.
# Use when `check:local` shows Next (RSC headers) but HTTP 404 on / — usually a stale `next dev`.
#
# Usage (repo root): npm run restart:web
set -euo pipefail

SDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-ports.sh
. "${SDIR}/lib-ports.sh"

ROOT="$(cd "${SDIR}/.." && pwd)"
cd "$ROOT"

echo "▶ Stopping listeners on TCP :3000"
free_tcp_port 3000 || true
sleep 0.5

export WATCHPACK_POLLING=true
echo "▶ Starting Next on http://localhost:3000 (dev:prepare wipes .next first)"
echo "   After it boots: hard-refresh the browser (Cmd+Shift+R). Run: npm run check:local"
exec npm run dev:poll -w apps/web
