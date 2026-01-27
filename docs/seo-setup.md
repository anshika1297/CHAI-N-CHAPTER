# SEO Setup – Chapters.aur.Chai (chapters.aur.chai)

**Domain:** chaptersaurchai.com  
**Blog name:** Chapters.aur.Chai  
**Brand:** chapters.aur.chai  
**Author:** Anshika Mishra  

This document describes how SEO is configured for **global presence with a major focus on India**. The blog targets book blogger, book critic, fiction/history/mythology reviews, and is open to authors worldwide who write in English (fiction of all kinds, history, mythology).

## 1. Target Keywords

Primary and extended keywords are defined in `apps/web/src/lib/seo.ts`:

- **Primary (global + India):** book blogger, book critic, book reviews, Anshika Mishra, Chapters.aur.Chai, fiction book reviews, literary blogger, reading blog, Indian book blogger, book blog India, book reviewer, mythology book reviews, history book reviews, author interviews, beta reading
- **Extended:** honest book reviews, curated book recommendations, literary fiction, Indian authors, global fiction, English fiction reviews, work with authors, book recommendations, reading wrap ups, monthly book recommendations, South Asian literature, mythology books, historical fiction reviews

Each page uses `buildMetadata()` and can add page-specific keywords. **Per-item keywords** (blog, recommendations, musings) are merged with these: see § “Per-item SEO & meta keywords” below.

## 2. Per-item SEO & meta keywords

**How it works**

- **Site-wide keywords** (`primaryKeywords` + `extendedKeywords` in `seo.ts`) are applied on every page.
- **Per-item keywords** let each post/recommendation/musing add its own terms (e.g. “Marie Kondo”, “slow living”, “Indian literature”) on top of those.
- `buildMetadata()` calls `mergeKeywords(keywords)` so that `keywords` you pass in are **merged** with site-wide ones and de-duplicated. The result is used in the `<meta name="keywords">` and related meta for that page.

**Where per-item data comes from**

- **Content layer** (`apps/web/src/lib/content.ts`): `getBlogMeta(slug)`, `getRecommendationMeta(slug)`, and `getMusingMeta(slug)` each return `title`, `description`, `image`, `publishedTime`, `author`, and **`keywords`** for known slugs. That’s what `generateMetadata` in `/blog/[slug]`, `/recommendations/[slug]`, and `/musings/[slug]` uses today.
- **Admin** (Book Reviews, Book Recommendations, Her Musings Verse): each item has an **“SEO / Meta keywords”** field (textarea). You enter one keyword per line or comma-separated. Those are stored as `seoKeywords`. Until you have an API, the live page does **not** read from admin; it only reads from `content.ts`. So to see custom keywords on the live site today, add the same slug and keywords to `BLOG_META`, `RECO_META`, or `MUSING_META` in `lib/content.ts`. When you add an API, the page (or `generateMetadata`) can load the item by slug and use its `seoKeywords` instead.

**Admin UI**

- **Admin → Book Reviews**: “SEO / Meta keywords” per post; “SEO” column shows count or “—”.
- **Admin → Book Recommendations**: “SEO / Meta keywords” per list; “SEO” column shows count or “—”.
- **Admin → Her Musings Verse**: “SEO / Meta keywords” per musing; “SEO” column shows count or “—”.
- Help text in each form explains that keywords are merged with site-wide ones and that, until an API exists, you add the slug and keywords to the right map in `lib/content.ts` for the published page to use them.

**Feasibility**

Yes. Each blog, recommendation, and musing can have a different set of keywords; the merge is already built. Keep `content.ts` in sync with admin until the API exists, or move to fetching meta (including keywords) by slug from your backend.

## 3. Metadata (Title, Description, Open Graph, Twitter)

- **Root layout** (`apps/web/src/app/layout.tsx`) uses `buildMetadata()` for the default title and description (Anshika Mishra, global + India, fiction/history/mythology).
- **All pages** use `buildMetadata()` from `@/lib/metadata` so every route has:
  - Unique `title` and `description`
  - `keywords` (primary + extended + page-specific)
  - Canonical URL via `path` (default base: https://chaptersaurchai.com)
  - Open Graph (title, description, image, url, type)
  - Twitter Card (summary_large_image, creator: @chaptersaurchai)
  - `robots` (index/follow unless `noIndex: true`)

## 4. Structured Data (JSON-LD)

- **Person** and **WebSite** schema are rendered in the root layout via `PersonSchema` and `WebSiteSchema` from `@/components/JsonLd`.
- Person schema: name **Anshika Mishra**, jobTitle “Book Blogger & Book Critic”, url to /about, sameAs from `siteConfig.social` (Instagram, Twitter, YouTube).
- WebSite schema: name **Chapters.aur.Chai**, url chaptersaurchai.com, description, publisher (Anshika Mishra), inLanguage en-IN, SearchAction for /blog.
- For **article** pages, when you have real CMS data, add `ArticleSchema` with headline, datePublished, dateModified, author (Anshika Mishra), image.

## 5. Sitemap & robots.txt

- **Sitemap:** `apps/web/src/app/sitemap.ts` uses `siteConfig.url` (chaptersaurchai.com) and publishes static routes. Extend with `/blog/[slug]`, `/recommendations/[slug]`, `/musings/[slug]` when you have an API.
- **Robots:** `apps/web/src/app/robots.ts` allows `/`, disallows `/admin/` and `/api/`, and points to `https://chaptersaurchai.com/sitemap.xml`.

## 6. Environment

Set your live URL (required for canonicals, sitemap, OG, JSON-LD):

```bash
# apps/web/.env.local (or your hosting env)
NEXT_PUBLIC_SITE_URL=https://chaptersaurchai.com
```

See `apps/web/.env.example`.

## 7. How to Improve Rankings

1. **Content:** Use target phrases naturally (e.g. “book blogger”, “book critic”, “fiction reviews”, “Anshika Mishra”) in headings and the first paragraph.
2. **Speed & Core Web Vitals:** Keep images optimized (Next.js `<Image>`) and avoid blocking scripts.
3. **Links:** Internal links from homepage and listing pages to each post; aim for backlinks from other book/literary sites globally and in India.
4. **Google Search Console:** Add the property for chaptersaurchai.com, verify (HTML tag or DNS), and submit `https://chaptersaurchai.com/sitemap.xml`.
5. **OG Image:** Use `/public/og-image.jpg` (1200×630) as default; override per post when you have featured images.

## 8. Admin: SEO fields (current)

The admin supports per-item SEO keywords in all three content sections:

- **Book Reviews**: “SEO / Meta keywords” per post (`seoKeywords`); SEO column in the list. Merged with site-wide keywords when the blog page meta is built (from API or `content.ts`).
- **Book Recommendations**: “SEO / Meta keywords” per list (`seoKeywords`); SEO column. Same merge for `/recommendations/[slug]` meta.
- **Her Musings Verse**: “SEO / Meta keywords” per musing (`seoKeywords`); SEO column. Same merge for `/musings/[slug]` meta.

Title, excerpt, and other fields drive `generateMetadata` via the content layer (or future API).

To drive live meta from admin data without code changes, add an API that returns the item by slug and use its `title`, `description`, `image`, `publishedTime`, `author`, and `seoKeywords` in `generateMetadata`. Optionally add explicit `metaTitle` / `metaDescription` / `ogImage` overrides later if you want them editable separately.
