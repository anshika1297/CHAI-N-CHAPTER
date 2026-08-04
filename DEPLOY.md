# Deployment Guide — Chapters.aur.Chai

Production environment: **Bluehost shared hosting**, Apache in front, Node.js + PM2 running the
Next.js frontend on `:3000` and the Express API on `:5001`.

This is the playbook we use whenever the frontend changes. Skim **Quick Update** if you've done
this before; read the rest only when something breaks.

---

## 0. One-time setup (already done — for reference)

If you ever need to set this up on a fresh server, here is the state we ended up with.

### Server layout

```
/home/chaptersaurchai/public_html/
├── .htaccess              # Apache → proxies to Node (frontend) and API
├── package.json           # monorepo root
├── package-lock.json
├── apps/
│   ├── api/               # Express API (PM2 → :5001, separately managed)
│   └── web/               # Next.js frontend
│       ├── .env           # production env (must include NEXT_PUBLIC_*)
│       ├── .next/         # build output (uploaded from local)
│       ├── ecosystem.config.js  # PM2 config (cwd: ./apps/web, args: start, port 3000)
│       ├── next.config.js
│       ├── package.json
│       └── public/        # static assets
└── node_modules/          # workspace deps installed via `npm ci --omit=dev`
```

### `~/public_html/.htaccess`

The exact contents that work — DO NOT remove the `DirectoryIndex disabled` line, it's what
prevents Apache from rewriting `/` to `/index.php` and breaking the homepage.

```apache
# Don't let Apache try /index.html or /index.php for "/" — Next handles all routing.
DirectoryIndex disabled

RewriteEngine On

# Forward /api/* to the API server on :5001
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^(.*)$ http://127.0.0.1:5001/$1 [P,L]

# Forward /health to :5001
RewriteCond %{REQUEST_URI} ^/health$
RewriteRule ^(.*)$ http://127.0.0.1:5001/$1 [P,L]

# Everything else to Next.js on :3000
RewriteCond %{REQUEST_URI} !^/api
RewriteCond %{REQUEST_URI} !^/health$
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

### `~/public_html/apps/web/.env`

```bash
NEXT_PUBLIC_SITE_URL=https://chaptersaurchai.com
NEXT_PUBLIC_API_URL=https://chaptersaurchai.com
NEXT_PUBLIC_IMAGE_API_URL=https://chaptersaurchai.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-7NGVGV4QW8
# Optional but recommended: SSR fetches stay inside the box instead of round-tripping Apache
API_INTERNAL_URL=http://127.0.0.1:5001
```

`NEXT_PUBLIC_*` values are **baked into the client bundle at build time**, so changing them on
the server has no effect until you rebuild and redeploy.

### PM2 process

```
chai-n-chapter-web   →   npm start (= next start -p 3000)   in   apps/web
```

Configured in `apps/web/ecosystem.config.js`. The `chai-n-chapter-web` process should always be
`online`.

---

## 1. Quick Update — the every-day workflow

Whenever you change frontend code, this is the sequence. **Total time: ~2 minutes.**

### On your laptop

```bash
cd /Users/akashtiwari/Documents/websites/chaptersaurchai/CHAI-N-CHAPTER

# Build and package in one shot
./scripts/build-deploy.sh
```

This produces `web-deploy.tar.gz` (~1.6 MB) at the repo root.

### On the server (cPanel)

1. cPanel → **File Manager** → navigate to `/home/chaptersaurchai/public_html/`.
2. **Upload** → drag in `web-deploy.tar.gz`.
3. Open cPanel → **Terminal** (Advanced section) and run:

   ```bash
   cd ~/public_html

   # Extract over existing files (overwrites .next, public, configs)
   tar -xzf web-deploy.tar.gz && rm web-deploy.tar.gz

   # Clean macOS metadata files (harmless, but ugly)
   find apps/web/.next apps/web/public -name '._*' -delete 2>/dev/null

   # Install only production deps if package.json changed (skip if you only edited components)
   NODE_OPTIONS="--max-old-space-size=1024" \
     npm ci --omit=dev --workspace=apps/web --include-workspace-root

   # Restart Next so it picks up the new build
   pm2 restart chai-n-chapter-web --update-env
   pm2 save
   ```

4. Verify:

   ```bash
   curl -sI http://127.0.0.1:3000/ | head -1                            # 200
   curl -sI https://chaptersaurchai.com/ | head -1                      # 200
   curl -sI https://chaptersaurchai.com/musings/her-musing-verse | head -1   # 200
   pm2 logs chai-n-chapter-web --lines 30 --nostream
   ```

5. Hard-refresh the site in your browser (`Cmd/Ctrl + Shift + R`).

That's it. Skip step 3's `npm ci` if you ONLY edited React components / styles and `package.json`
is unchanged — the build is self-contained inside `.next/`.

---

## 1b. API update (subscriber emails, announce routes, SMTP helpers)

### On your laptop

```bash
cd /Users/akashtiwari/Documents/websites/chaptersaurchai/CHAI-N-CHAPTER
./scripts/build-deploy-api.sh
```

Produces `api-deploy.tar.gz` at the repo root (`dist/`, `package.json`, `ecosystem.config.js` only).

### On the server

1. Upload `api-deploy.tar.gz` to `~/public_html/`.
2. Terminal:

   ```bash
   cd ~/public_html
   tar -xzf api-deploy.tar.gz && rm api-deploy.tar.gz

   # Confirm new code landed (must exist after extract)
   test -f apps/api/dist/routes/site.js && echo "OK: new API routes present"

   cd apps/api
   # Full restart so Node loads the new dist/ (restart alone can keep an old process on shared hosting)
   pm2 delete chai-n-chapter-api 2>/dev/null || true
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```

3. Confirm production env in `~/public_html/apps/api/.env` (not overwritten by the tarball):

   - `NODE_ENV=production` via PM2: `pm2 start ecosystem.config.js --env production`
   - `PUBLIC_SITE_URL=https://chaptersaurchai.com`
   - `FRONTEND_URL=https://chaptersaurchai.com` (or include `www` if you use it)
   - **Do not** set `ANNOUNCE_TEST_ONLY` on the server (production ignores it anyway, but keep `.env` clean)

4. Verify:

   ```bash
   curl -s http://127.0.0.1:5001/health
   curl -s http://127.0.0.1:5001/api/site/stats
   pm2 logs chai-n-chapter-api --lines 20 --nostream
   ```

   `/health` should include a recent `"build"` timestamp and low `uptime` (seconds, not days).
   `/api/site/stats` must return JSON counts — if you get `{"error":"Not found","path":"/api/site/stats"}`, the old API is still running; re-extract the tarball and `pm2 delete` + `pm2 start` again.

### Send to real subscribers

After deploy, use **production admin** (`https://chaptersaurchai.com/admin/...`), mail icon on a **Live** item. Subjects will **not** have `[TEST]`. Check **Admin → Subscribers** for the count before sending.

---

## 2. When to use `npm ci` on the server

| Change | Need `npm ci` on server? |
|---|---|
| Edited a React component, page, style | **No** — `.next` already contains everything |
| Added a new dependency to `apps/web/package.json` | **Yes** |
| Bumped a dependency version | **Yes** |
| Edited `next.config.js`, `middleware.ts`, env, or routes | **No** (build covers it) |
| Edited `apps/api/*` | This guide is frontend only — see API deploy separately |

If unsure, run it. It's fast (~12 s) and idempotent.

---

## 3. Manual fallback if `./scripts/build-deploy.sh` doesn't exist or you want to do it by hand

```bash
cd /Users/akashtiwari/Documents/websites/chaptersaurchai/CHAI-N-CHAPTER

# 1. Stop any local dev server holding port 3000 / .next
pkill -f "next dev" 2>/dev/null || true

# 2. Clean previous build
rm -rf apps/web/.next

# 3. Production build (skip API at build time so we don't depend on the live API being reachable)
SKIP_BUILD_API_FETCH=1 NODE_OPTIONS="--max-old-space-size=4096" \
  npm run build -w apps/web

# 4. Tarball — exclude .next/cache (~112 MB of webpack cache the server doesn't need)
rm -f web-deploy.tar.gz
tar --exclude='apps/web/.next/cache' -czf web-deploy.tar.gz \
  apps/web/.next \
  apps/web/public \
  apps/web/next.config.js \
  apps/web/package.json \
  apps/web/ecosystem.config.js \
  apps/web/.env \
  package.json \
  package-lock.json

ls -lh web-deploy.tar.gz   # should be ~1–2 MB
```

---

## 4. Smoke-test the build locally before uploading (optional but recommended)

After step 3 above, verify the production build works on your laptop first:

```bash
cd apps/web
NODE_ENV=production npx next start -p 3000
# In another terminal:
curl -sI http://localhost:3000/ | head -1                          # 200
curl -sI http://localhost:3000/musings/her-musing-verse | head -1  # 200
# Stop with Ctrl+C in the start terminal, or:
pkill -f "next start"
```

If anything 404s or 500s here, the build is broken — fix locally before uploading. Once it works
on your laptop in production mode, it will work on the server.

---

## 5. Common operations

### See PM2 status

```bash
pm2 list
pm2 describe chai-n-chapter-web
```

### Tail logs

```bash
pm2 logs chai-n-chapter-web --lines 50
# stop with Ctrl+C
```

Log files (if PM2 isn't responding):

```bash
tail -n 50 ~/public_html/apps/web/logs/pm2-out.log
tail -n 50 ~/public_html/apps/web/logs/pm2-error.log
```

### Restart Next without redeploying (e.g. crash recovery)

```bash
pm2 restart chai-n-chapter-web --update-env
```

### Stop / start

```bash
pm2 stop chai-n-chapter-web
pm2 start chai-n-chapter-web
```

### Rollback to the previous build

If a deploy goes bad and you need the old version back fast:

```bash
ssh chaptersaurchai@chaptersaurchai.com
cd ~/public_html

# If you keep tarballs (recommended), just re-extract the previous one:
tar -xzf web-deploy.PREVIOUS.tar.gz
pm2 restart chai-n-chapter-web --update-env
```

So: **before** uploading, rename the existing tarball on the server to keep one back-up:

```bash
mv web-deploy.tar.gz web-deploy.PREVIOUS.tar.gz   # (optional — only if previous still exists)
```

---

## 6. Troubleshooting

### Site shows 404 at `/` but works at `/blog`, `/about`, etc.

Apache's `DirectoryIndex` is rewriting `/` to `/index.php` before mod_rewrite proxies. Fix:
ensure `DirectoryIndex disabled` is the first non-comment line in `~/public_html/.htaccess`.
See section 0.

### Build OOMs on the server (`WebAssembly.instantiate(): Out of memory: wasm memory`)

This is why we build locally and upload. **Never run `next build` on the Bluehost server.**

If runtime SSR fetches log the same WASM error: that means a server-side fetch (e.g. metadata
fetch in `generateMetadata`) is failing under memory pressure. The page still renders because
the fetch is wrapped in `try/catch` — only SEO metadata for slugs not in `content.ts` is
affected. To eliminate even this:

- Bump `NODE_OPTIONS=--max-old-space-size=512` in `apps/web/ecosystem.config.js`'s `env_production`.
- Or upgrade hosting / add swap.

### `npm ci` fails with OOM on the server

Try without the memory hint:

```bash
npm ci --omit=dev --workspace=apps/web --include-workspace-root
```

If that still fails, build a tarball that includes `node_modules`:

```bash
# On laptop
cd /Users/akashtiwari/Documents/websites/chaptersaurchai/CHAI-N-CHAPTER
rm -rf node_modules
npm ci --omit=dev --workspace=apps/web --include-workspace-root
tar --exclude='apps/web/.next/cache' -czf web-deploy-full.tar.gz \
  apps/web/.next apps/web/public apps/web/next.config.js \
  apps/web/package.json apps/web/ecosystem.config.js apps/web/.env \
  package.json package-lock.json node_modules
# After uploading, restore your local dev deps:
npm install
```

(Only works if your laptop is Linux x86_64 OR if no native modules require platform-specific binaries. For macOS/Apple-Silicon laptops this is risky — try the previous fix first.)

### Port 3000 already in use locally during build

```bash
lsof -iTCP:3000 -sTCP:LISTEN -Pn | awk 'NR>1 {print $2}' | xargs -r kill -9
```

### Browser still shows old version after deploy

- Hard refresh: `Cmd/Ctrl + Shift + R`.
- Confirm PM2 actually restarted: `pm2 list` should show low `uptime`.
- Confirm the server got new files: `ls -la ~/public_html/apps/web/.next/BUILD_ID` — the file's
  modified time should be from your latest deploy.

### Dynamic detail page (e.g. brand-new blog post) returns 404

- Confirm post is published in admin and the slug is correct.
- Hit `https://chaptersaurchai.com/api/blog/posts/<slug>` directly — should return JSON, not 404.
- If the API returns 200 but the page returns 404, there's a Next routing issue. Restart Next:
  `pm2 restart chai-n-chapter-web --update-env`.

### API crash loop: `EADDRINUSE` on port 5001

Something else is already bound to `:5001` (orphan `node`, duplicate PM2, or old **cluster** mode).
If logs show `apps/api/src/server.ts`, PM2 is not running `dist/server.js` — reset it:

```bash
cd ~/public_html
bash scripts/fix-api-pm2-on-server.sh
```

Or by hand: `pm2 delete chai-n-chapter-api`, kill listeners on 5001 (`fuser -k 5001/tcp` or `lsof` + `kill -9`),
then `cd apps/api && pm2 start ecosystem.config.js --env production && pm2 save`.

`ecosystem.config.js` must use `script: './dist/server.js'`, `instances: 1`, `exec_mode: 'fork'`.

### Apache returns 500 after editing `.htaccess`

```bash
mv ~/public_html/.htaccess.bak.* ~/public_html/.htaccess   # restore most recent backup
```

Always `cp .htaccess .htaccess.bak.$(date +%s)` before editing it.

---

## 7. Architecture quick reference

### Request flow (production)

```
Browser                                          
   │                                             
   │  GET https://chaptersaurchai.com/blog/foo   
   ▼                                             
Apache (:443)                                    
   │  matches `RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]`
   ▼                                             
Next.js Node server (:3000)                      
   │  pre-rendered HTML for `/blog/foo` if known,
   │  else SSR via dynamicParams=true, revalidate=60
   ▼                                             
Browser hydrates → calls /api/blog/posts/foo     
   │                                             
   ▼                                             
Apache → /api/* → http://127.0.0.1:5001/api/blog/posts/foo
   │                                             
   ▼                                             
Express API (:5001) → MongoDB                    
```

### Why the homepage broke

`Apache DirectoryIndex` (default `index.html index.php …`) **internally rewrites** `/` to
`/index.php` before mod_rewrite runs. The rewrite then proxied `/index.php` to Next, which has
no such route → 404. `DirectoryIndex disabled` makes Apache hand `/` straight to mod_rewrite.

### Why the build is done locally

Bluehost shared hosting throttles process memory below what `next build` and undici (Node
fetch) need to initialize their WebAssembly modules — you'll get
`RangeError: WebAssembly.instantiate(): Out of memory: wasm memory`. Building on your laptop
sidesteps this completely; only `next start` runs on the server, which is lightweight (~40 MB
RSS).

### Why dynamic slugs work without rebuilding

`apps/web/src/app/{blog,recommendations,musings}/[slug]/page.tsx` each export
`dynamicParams = true` (allows on-demand SSR for unknown slugs) and `revalidate = 60` (caches
SSR'd pages for 60 s, then re-renders in the background). `generateMetadata` falls back to a
live API fetch when `content.ts` doesn't know the slug, so SEO metadata for new posts works
without a redeploy.

---

## 8. Files this guide refers to

- `apps/web/ecosystem.config.js` — PM2 config
- `apps/web/next.config.js` — Next config (rewrites for dev only)
- `apps/web/middleware.ts` — security headers + matcher
- `apps/web/.env`, `apps/web/.env.local`, `apps/web/.env.example` — env precedence is
  `.env.local` > `.env` (don't omit a key in `.env.local` expecting it to "unset" — set it to
  empty `KEY=` instead). **Never** put `NEXT_PUBLIC_API_URL=http://127.0.0.1:…` in
  `.env.local` if you might run a production build from that machine — it gets inlined into
  the browser bundle and the live site will call visitors' localhost (no `/api` traffic).
- `scripts/build-deploy.sh` — one-shot local build + tarball (forces production
  `NEXT_PUBLIC_*` / `API_INTERNAL_URL=http://127.0.0.1:5002` via shell env so `.env.local`
  cannot poison the client bundle)
- `apps/web/PRODUCTION.md` — older, more generic deployment reference
