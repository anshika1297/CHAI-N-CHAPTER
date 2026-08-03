#!/usr/bin/env bash
# Stop whatever is listening on :5001, then start the API dev server.
# Use when `npm run dev:api` fails with EADDRINUSE (stale tsx watch / node).
#
# Usage (repo root): npm run restart:api
set -euo pipefail

SDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-ports.sh
. "${SDIR}/lib-ports.sh"

ROOT="$(cd "${SDIR}/.." && pwd)"
cd "$ROOT"

echo "▶ Stopping listeners on TCP :5001"
free_tcp_port 5001 || exit 1
sleep 0.5

echo "▶ Starting API (tsx watch) on http://127.0.0.1:5001"
exec npm run dev:api
