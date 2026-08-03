#!/usr/bin/env bash
# Start Next dev with a clean .next (fixes unstyled UI / HTTP 500 from corrupt cache).
# Usage (repo root): npm run dev:web
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
echo "▶ Starting Next dev (clears .next automatically via dev:prepare)"
exec npm run dev:poll -w apps/web
