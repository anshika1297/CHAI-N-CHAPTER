# Images & Media Without App Cloud Storage

You don’t need to build or use “cloud storage” in the app. Use one of these approaches instead.

## 1. Public image URLs (easiest)

Paste any **public** image URL into the admin fields (Featured image, Cover image, Highlight image, Book cover, etc.):

- **Imgur** – Upload at [imgur.com](https://imgur.com), copy “Direct link”.
- **imgbb** – [imgbb.com](https://imgbb.com), upload, copy direct link.
- **Google Drive** – Share image → “Anyone with the link” → use link (sometimes needs tweaks for embedding).
- **Goodreads / retailers** – Right‑click book cover → “Copy image address” (use only if their terms allow hotlinking).

The app will load images from those URLs. No upload feature or backend storage required.

## 2. Local files in `public/` (no external host)

Put image files in the project and reference them by path:

1. Add files under **`apps/web/public/`**, e.g.:
   - `apps/web/public/images/blog/art-of-slow-living.jpg`
   - `apps/web/public/images/books/seven-husbands.jpg`
2. In admin, use **paths** (not full URLs), e.g.:
   - `/images/blog/art-of-slow-living.jpg`
   - `/images/books/seven-husbands.jpg`

Next.js serves everything in `public/` from the site root, so `/images/...` works. No cloud, no CDN; files ship with the app. Suits a small–medium number of images.

## 3. Optional later: dedicated image host

When you want one place for all media (and maybe resizing/optimization), you can add:

- **Cloudinary** – Free tier, upload via their dashboard or API, paste “Delivery URL” into admin.
- **Vercel Blob / Supabase Storage** – If you adopt one of these backends, use their storage and store only the final URL in your DB.

Until then, **1** or **2** is enough and keeps “giving URL to book blogs” simple: you either paste a link you already have, or use a path for a file in `public/`.

## Summary

| Use case           | What to do                                                                 |
|--------------------|----------------------------------------------------------------------------|
| Book cover / photo | Paste public URL (Imgur, imgbb, Goodreads, etc.) or use `/images/…` path  |
| Blog featured img  | Same: URL or `/images/blog/…`                                             |
| Highlight / quote  | Optional image URL or path per highlight                                  |
| Recommendation list| One cover for the list + one image URL per “Featured book” in the repeater|

No app-level “upload to cloud” is required; the admin only needs a place to paste a **URL or path**.
