#!/usr/bin/env bash
# build-deploy.sh — produce web-deploy.tar.gz at repo root, ready to upload to the server.
#
# Usage:
#   ./scripts/build-deploy.sh                  # build + package
#   ./scripts/build-deploy.sh --skip-build     # repackage existing apps/web/.next without rebuilding
#   ./scripts/build-deploy.sh --no-skip-api    # let `generateStaticParams` hit the live API at build
#
# Output: ./web-deploy.tar.gz (~1–2 MB)
# See DEPLOY.md for upload + server-side steps.

set -euo pipefail

# Resolve repo root regardless of where the script is invoked from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

SKIP_BUILD=0
SKIP_API=1   # default: skip API fetch during build (faster, doesn't depend on network)

for arg in "$@"; do
  case "$arg" in
    --skip-build)   SKIP_BUILD=1 ;;
    --no-skip-api)  SKIP_API=0 ;;
    -h|--help)
      grep -E '^# ' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

# 1. Pre-flight: is anything holding port 3000 (which would block a local smoke-test later)?
#    `lsof` exits non-zero when nothing matches, so guard against `set -e` killing us.
if command -v lsof >/dev/null 2>&1; then
  STALE_PIDS="$( { lsof -iTCP:3000 -sTCP:LISTEN -Pn 2>/dev/null || true; } | awk 'NR>1 {print $2}')"
  if [[ -n "$STALE_PIDS" ]]; then
    echo "⚠  Port 3000 is in use by PID(s): $STALE_PIDS"
    echo "   This is fine for building, but a local smoke-test will fail until you stop them:"
    echo "   kill -9 $STALE_PIDS"
  fi
fi

# 2. Build (or skip if explicitly requested)
if [[ "$SKIP_BUILD" -eq 0 ]]; then
  log "Cleaning previous .next/"
  rm -rf apps/web/.next

  # NEXT_PUBLIC_* is inlined into the browser bundle at build time.
  # Shell env overrides apps/web/.env.local — without this, a local
  # NEXT_PUBLIC_API_URL=http://127.0.0.1:5001 gets shipped to production and
  # the live site silently calls the visitor's localhost (no /api traffic).
  export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://chaptersaurchai.com}"
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://chaptersaurchai.com}"
  export NEXT_PUBLIC_IMAGE_API_URL="${NEXT_PUBLIC_IMAGE_API_URL:-https://chaptersaurchai.com}"
  export API_INTERNAL_URL="${API_INTERNAL_URL:-http://127.0.0.1:5002}"
  log "Build env: NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL API_INTERNAL_URL=$API_INTERNAL_URL"

  log "Building apps/web (production)…"
  if [[ "$SKIP_API" -eq 1 ]]; then
    SKIP_BUILD_API_FETCH=1 NODE_OPTIONS="--max-old-space-size=4096" \
      npm run build -w apps/web
  else
    NODE_OPTIONS="--max-old-space-size=4096" \
      npm run build -w apps/web
  fi
else
  log "Skipping build (--skip-build) — packaging existing apps/web/.next"
  if [[ ! -d apps/web/.next ]]; then
    echo "✗ apps/web/.next does not exist; cannot package without building first." >&2
    exit 1
  fi
fi

# 3. Package
log "Packaging deployment tarball…"
rm -f web-deploy.tar.gz

TAR_INPUTS=(
  apps/web/.next
  apps/web/public
  apps/web/next.config.js
  apps/web/package.json
  apps/web/ecosystem.config.js
  package.json
  package-lock.json
)

# Only include apps/web/.env if it exists (production .env is sometimes managed only on the server)
if [[ -f apps/web/.env ]]; then
  TAR_INPUTS+=( apps/web/.env )
else
  echo "⚠  apps/web/.env is missing locally — server's existing .env will be left untouched."
fi

tar --exclude='apps/web/.next/cache' \
    --exclude='._*' \
    --exclude='.DS_Store' \
    -czf web-deploy.tar.gz \
    "${TAR_INPUTS[@]}"

SIZE="$(du -h web-deploy.tar.gz | awk '{print $1}')"

log "Done"
echo "  → $REPO_ROOT/web-deploy.tar.gz  ($SIZE)"
echo
echo "Next steps (see DEPLOY.md §1):"
echo "  1. cPanel → File Manager → upload web-deploy.tar.gz to /home/chaptersaurchai/public_html/"
echo "  2. cPanel → Terminal:"
echo "       cd ~/public_html"
echo "       tar -xzf web-deploy.tar.gz && rm web-deploy.tar.gz"
echo "       find apps/web/.next apps/web/public -name '._*' -delete 2>/dev/null"
echo "       npm ci --omit=dev --workspace=apps/web --include-workspace-root   # only if package.json changed"
echo "       pm2 restart chai-n-chapter-web --update-env && pm2 save"
echo "  3. Verify: curl -sI https://chaptersaurchai.com/ | head -1"
