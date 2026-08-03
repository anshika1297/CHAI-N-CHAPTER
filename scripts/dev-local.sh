#!/usr/bin/env bash
# Start API + Next for local development with fixes for common macOS issues:
# - Stale process on :3000 / :5001 → 404 or EADDRINUSE
# - EMFILE / broken file watchers → clear .next + polling
#
# Usage (from repo root):  npm run dev:local   or   npm run dev:both
set -euo pipefail

SDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-ports.sh
. "${SDIR}/lib-ports.sh"

ROOT="$(cd "${SDIR}/.." && pwd)"
cd "$ROOT"

echo ""
echo "▶ Freeing ports 3000 and 5001 (safe to ignore \"no such process\")"
free_tcp_port 3000 || true
free_tcp_port 5001 || true

echo "▶ Removing apps/web/.next"
rm -rf apps/web/.next

export WATCHPACK_POLLING=true

cleanup() {
  echo ""
  echo "▶ Stopping background dev servers (Ctrl+C)…"
  kill 0 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "▶ Starting API on :5001 and Next on :3000 (polling watchers)"
npm run dev:api &
API_PID=$!
npm run dev:poll -w apps/web &
WEB_PID=$!

# Wait for either process to exit; don't let `set -e` kill the shell if one crashes.
wait "${API_PID}" "${WEB_PID}" || true
