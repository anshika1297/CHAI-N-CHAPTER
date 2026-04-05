# Fix: "Unexpected token '<'" on production

## Root Cause

The frontend calls `https://chaptersaurchai.com/api/settings/pages/home`, but Apache
needs to forward `/api/*` requests to the Node.js backend (port 3000).
Without proper proxying, the server returns the HTML page instead of JSON.

## Fix (3 steps on your server)

### Step 1 — Update the API `.env` on the server

On your server, edit the API `.env` file and set:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://chaptersaurchai.com,https://www.chaptersaurchai.com
PUBLIC_SITE_URL=https://chaptersaurchai.com
```

`FRONTEND_URL` controls CORS. Without the production domain, the API will
reject browser requests with a CORS error.

Then restart the API:

```bash
pm2 restart chai-n-chapter-api
# or however you run it
```

### Step 2 — Ensure `.htaccess` is correct

Your `.htaccess` should proxy requests correctly:

```apache
RewriteEngine On

# Forward API requests to Node.js backend running on port 3000
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Forward all other requests to Node.js frontend running on port 5000
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]

# Optional: prevent folder indexing
Options -Indexes
```

Make sure `mod_proxy` and `mod_rewrite` are enabled:

```bash
sudo a2enmod proxy proxy_http rewrite
sudo systemctl restart apache2
```

### Step 3 — Verify

```bash
# Should return JSON (not HTML)
curl https://chaptersaurchai.com/api/settings/pages/home

# Should return {"status":"healthy",...}
curl https://chaptersaurchai.com/health
```

If you see JSON, it's fixed. Refresh the website.

## Quick Diagram

```
Browser  ──►  Apache (.htaccess)
                │
                ├── /api/*    ──►  Node.js API (port 3000)  ──►  MongoDB
                │
                └── /*        ──►  Next.js frontend (port 5000)
```

## Port Summary

| Service       | Port | Description                  |
|---------------|------|------------------------------|
| API (Express) | 3000 | Backend API server           |
| Web (Next.js) | 5000 | Frontend Next.js server      |
| Apache        | 443  | Reverse proxy (SSL termination) |
