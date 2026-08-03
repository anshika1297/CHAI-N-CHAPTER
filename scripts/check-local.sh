#!/usr/bin/env bash
# Quick sanity check for local API + Next (run after `npm run dev:local` or manual dev).
set -euo pipefail
echo "▶ GET http://127.0.0.1:5001/health"
code="$(curl -s -o /tmp/chai-health.txt -w '%{http_code}' http://127.0.0.1:5001/health || echo '000')"
echo "   HTTP $code"
head -c 300 /tmp/chai-health.txt 2>/dev/null || true
echo ""
if [[ "$code" != "200" ]]; then
  echo "▶ Process listening on TCP :5001"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:5001 -sTCP:LISTEN 2>/dev/null || echo "   (nothing listening — start: npm run dev:api)"
  fi
  echo "   If dev:api failed with EADDRINUSE, free the port and retry:  npm run restart:api"
  echo ""
fi

echo "▶ Process listening on TCP :3000 (should be this repo’s Next.js)"
if command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP:3000 -sTCP:LISTEN 2>/dev/null || echo "   (nothing listening — start the web app: npm run dev:web:poll)"
else
  echo "   (install lsof or use: netstat -an | grep 3000)"
fi
echo ""

echo "▶ HEAD http://127.0.0.1:3000/ (response headers)"
curl -sI http://127.0.0.1:3000/ | head -20 || true
echo ""

echo "▶ Next global CSS (from home page link tag)"
css_path="$(curl -s http://127.0.0.1:3000/ 2>/dev/null | sed -n 's/.*href="\(\/_next\/static\/css\/[^"]*\)".*/\1/p' | head -1)"
if [[ -n "${css_path}" ]]; then
  css_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000${css_path}" 2>/dev/null || echo '000')"
  echo "   ${css_path} → HTTP ${css_code}"
  if [[ "${css_code}" != "200" ]]; then
    echo "   ✗ Stylesheet missing — page will look unstyled. Fix: npm run restart:web"
  fi
else
  echo "   (could not find layout.css link in HTML)"
fi
echo ""

echo "▶ GET http://127.0.0.1:3000/"
code2="$(curl -s -o /tmp/chai-web.txt -w '%{http_code}' http://127.0.0.1:3000/ || echo '000')"
echo "   HTTP $code2"
if [[ "$code2" == "200" ]]; then
  echo "   OK — Next is serving the home page."
elif [[ "$code2" == "500" ]]; then
  echo "   Next returned 500 — almost always a corrupt .next cache (Cannot find module './NNNN.js')."
  echo "   Fix (API can keep running):  npm run restart:web"
  echo "   Then hard-refresh the browser (Cmd+Shift+R)."
else
  hdrs="$(curl -sI http://127.0.0.1:3000/ 2>/dev/null || true)"
  if echo "$hdrs" | grep -qi 'Next-Router-State-Tree\|RSC'; then
    echo "   Next.js is running but returned an error status — usually a stale dev server + bad .next cache."
    echo "   Fix (API can keep running):  npm run restart:web"
  else
    echo "   If this is 404:"
    echo "   • Another app may be on :3000 (see lsof above). Stop it, then: npm run dev:local"
    echo "   • Or Next cache is bad: npm run restart:web"
  fi
fi
