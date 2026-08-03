# Author Spotlight — Technical Specification (aligned with CHAI-N-CHAPTER)

This document merges the product intent with **this repository’s actual stack** and calls out **decisions, naming, and phase splits** so implementation does not drift.

---

## 1. Stack alignment (this repo)

| Your spec | This codebase |
|-----------|----------------|
| Node backend | **Express** (`apps/api`), not NestJS |
| Database | **MongoDB + Mongoose** |
| Blog / recommendations today | Stored as **`Page` documents** with `slug` + large `content` blobs (e.g. `blog` → `content.posts[]`) |
| Admin auth | **`requireAuth`** JWT middleware (same pattern as `PUT /api/settings/pages/:slug`) |
| Public page fetch | Typically **`GET /api/settings/pages/:slug`** or dedicated routers like **`GET /api/blog/posts`** |
| Frontend | **Next.js 14 App Router** (`apps/web`), existing patterns: `generateStaticParams`, `dynamicParams`, `revalidate`, `getPageSettings` / `safeFetch` |

**Implication:** Author Spotlight should **not** overload a single `Page` document with an unbounded array of full spotlight payloads (SEO payloads, many images). Prefer a **dedicated Mongoose model** `AuthorSpotlight` (collection `authorspotlights` or `author_spotlights`) with **one document per author**, indexed by `slug`. Admin + public routes live in a **new router** (e.g. `apps/api/src/routes/author-spotlight.ts`) mounted at **`/api/author-spotlight`** (or plural below—pick one and stick to it).

---

## 2. Routes & URLs (frontend)

| Route | Purpose |
|-------|---------|
| `/author-spotlight` | Listing (published only, sort order TBD) |
| `/author-spotlight/[slug]` | Detail |

**ISR / SSG (match existing site patterns):**

- Use `generateStaticParams` for **known slugs at build time** (optional `SKIP_BUILD_API_FETCH` already exists for low-RAM builds).
- Set `dynamicParams = true` so **new** spotlights work after deploy without rebuild.
- Set `revalidate` to **`604800` (7 days)** for this module if you want weekly freshness; or keep **`60`** for faster editorial turnaround (configurable via env later).

---

## 3. Data model (`AuthorSpotlight`)

### 3.1 Core document

```ts
// Conceptual — final Mongoose schema in implementation
{
  slug: string;              // unique, URL-safe, required
  name: string;              // display name, required
  tagline: string;           // short hook, required (can allow "" only if we relax—see validation)
  profileImage: string;      // URL (uploaded via existing /api/upload flow), required
  bio: string;               // HTML from admin editor (stored sanitized) OR markdown—pick one in impl.
  genres: string[];          // optional tags for future filtering

  // Prefer ARRAY of { label, url } over fixed keys so BookTok / Bluesky / etc. don’t require schema migration
  socialLinks: { label: string; url: string }[];

  featuredBooks: {
    title: string;
    coverImage?: string;
    description?: string;
    buyLink?: string;
    goodreadsLink?: string;
    blogReviewLink?: string;   // internal path e.g. /blog/my-review-slug
  }[];

  // Manual links to existing site content (curated)
  blogLinks: { title: string; url: string }[];

  // “If you liked X → you’ll like Y” — editorial pairings (NOT the same as DB “recommendation” posts unless you link them)
  readingPairings: {
    ifYouLiked: string;       // reference book / author / mood
    recommendedTitle: string;
    reason: string;
    internalUrl?: string;     // optional: /recommendations/some-slug
  }[];

  faq: { question: string; answer: string }[];

  // Merge with FAQ in UI OR drop one: having both `faq` and `interview` as identical shape is redundant.
  // Recommendation: single array `faq` OR rename `interview` → `extendedQa` with section title in admin.
  // v1 decision: **single `faq` array**; optional `interviewSectionTitle` string defaulting to "Interview".
  interviewSectionTitle?: string;
  interview?: { question: string; answer: string }[];  // optional second block; render after FAQ if present

  isPublished: boolean;
  publishDate?: Date;        // for display + future scheduling (see §7)
  displayOrder?: number;     // listing sort

  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;            // fallback: profileImage

  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Clarifications vs your original JSON

| Topic | Decision |
|-------|----------|
| `socialLinks` object vs array | Use **array of `{ label, url }`** for extensibility unless you strongly want fixed keys. |
| `blogLinks` vs auto-discovery | **v1: manual `blogLinks`** + optional internal URLs on books; auto-match from blog `author` field = **phase 2**. |
| `recommendations` naming | Rename to **`readingPairings`** in code to avoid confusion with **`/recommendations`** pages and `GET /api/recommendations`. |
| `faq` + `interview` | Both are Q&A shaped. **Either** merge into one array with a `section` field **or** keep two arrays but **different section titles** in UI only. |

---

## 4. API design (Express)

### 4.1 Naming

Pick **one** public prefix (recommend plural for REST consistency with `/api/blog`, `/api/musings`):

- **Option A:** `/api/author-spotlights` … `GET /api/author-spotlights/:slug`
- **Option B:** `/api/author-spotlight` … `GET /api/author-spotlight/:slug` (your draft)

Document the choice in `app.ts` when mounted.

### 4.2 Public

| Method | Path | Behaviour |
|--------|------|-------------|
| GET | `/api/author-spotlight` (or plural) | List **published** only; query: `page`, `limit` (cap e.g. 50), optional `sort=order\|newest` |
| GET | `/api/author-spotlight/:slug` | Full document if **published**; else **404** |

Responses should run through existing **`rewriteImageUrlsInObject`** where applicable (same as settings/blog).

### 4.3 Admin (all behind `requireAuth`)

Align with existing patterns (`PUT /api/settings/pages/...`) **or** use dedicated admin paths—either is fine if consistent:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/author-spotlight/admin` or `/api/admin/author-spotlight` | List all (draft + published) with pagination |
| GET | `/api/author-spotlight/admin/:id` | Get one by Mongo `_id` for editor |
| POST | `...` | Create |
| PUT | `.../:id` | Replace / update |
| DELETE | `.../:id` | Hard delete or `isDeleted` soft flag (pick one; soft delete safer) |
| PATCH | `.../:id/publish` | Toggle `isPublished` + set `publishDate` when first published |

**Note:** Your spec used `/api/admin/...` — this repo does **not** currently mount under `/api/admin`; adding a sub-router is fine, but **JWT + rate limits** must match other protected routes.

### 4.4 Validation (adjusted)

| Field | Rule |
|-------|------|
| `name`, `slug`, `profileImage` | Required |
| `bio` | Required **or** allow short spotlights: require **`bio` OR `tagline` min length`** (choose in impl.) |
| `slug` | Unique; regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `featuredBooks` | **Minimum 0 or 1?** — For debut authors with no title yet, allow **0** in v1; show empty state in UI. If you insist on ≥1, enforce only when `isPublished === true`. |
| URLs | Validate `http(s)://` for external links; internal links must start with `/` |

---

## 5. Frontend (`apps/web`)

### 5.1 Files

- `src/app/author-spotlight/page.tsx` — listing
- `src/app/author-spotlight/[slug]/page.tsx` — detail + `generateMetadata` + `generateStaticParams` + `revalidate`
- `src/lib/api.ts` — `getAuthorSpotlights`, `getAuthorSpotlightBySlug` (follow `safeFetch` / base URL rules)
- Components (as you listed): `AuthorHero`, `AuthorBio`, `SocialLinks`, `FeaturedBooks`, `ReadingPairings`, `FaqAccordion`, `InterviewSection` (optional wrapper around same accordion)

### 5.2 Images

- Use **`next/image`** with `remotePatterns` already including `chaptersaurchai.com`.
- For **same-origin `/api/img/...`** tokens, use **`unoptimized`** or match the Header fix pattern if optimizer causes issues on Bluehost.

### 5.3 SEO

- **H1:** author `name`
- **H2:** major sections (Bio, Books, On this site, Pairings, FAQ)
- **Open Graph:** `seoTitle` / `seoDescription` / `ogImage || profileImage`
- **Schema.org:** Prefer **`Person`** (+ `sameAs` from social URLs) + optional **`ProfilePage`**. Using **`Article` / `BlogPosting`** for an author profile is **misleading**—avoid unless the page is literally a blog article.

---

## 6. Admin UI (`apps/web/src/app/admin/...`)

- New page: **`/admin/author-spotlight`** (list + link to edit) or nested routes—match existing admin IA (`/admin/blog`, etc.).
- **Rich text:** Today most admin pages use **structured fields / HTML strings**. For v1, **textarea + light sanitization on save** or reuse whatever the blog admin uses for HTML `content`. **TipTap** = phase 2 unless already bundled.
- **Repeatable arrays:** same UX pattern as blog/recommendations admin (add row, reorder optional phase 2).
- **Image upload:** reuse **`/api/upload`** + paste URL field like other pages.
- **Preview (VERY important per your spec):** True preview needs **draft token** or **admin-only query** `?preview=1&token=...` + API that returns unpublished when authorized. Mark as **phase 1.5** if v1 ships with “save draft → open staging domain” only.

---

## 7. Scheduling & weekly workflow

| Feature | v1 | Later |
|---------|----|-------|
| `publishDate` stored | Yes | — |
| Future `publishDate` hidden on public GET | **Yes** (filter `publishDate <= now` when `isPublished`) | — |
| Cron job to auto-flip `isPublished` | **No** (unless you add a worker) | Use Bluehost cron calling a secured endpoint |
| Duplicate spotlight (template) | **No** | Admin “Duplicate” button copies JSON |

---

## 8. Performance

- Lazy-load below-fold sections (`dynamic` import or `loading="lazy"` on images).
- ISR `revalidate: 604800` as you requested, or shorter for editorial cadence.
- CDN: images already served via your API/upload mechanism; no S3 requirement in v1.

---

## 9. Phase map (implementation order)

| Phase | Deliverable |
|-------|-------------|
| **1a** | Mongoose model + public GET list + GET by slug + admin CRUD + Next listing + detail pages + nav link (optional) |
| **1b** | All UI sections + validation + SEO metadata + `Person` JSON-LD |
| **2** | Homepage “featured spotlight” module; duplicate template; preview mode |
| **3** | Auto-suggest blog/recommendation links by author name; genre filters on listing |

---

## 10. Open decisions (lock before coding)

1. **API path:** singular `/api/author-spotlight` vs plural `/api/author-spotlights`.
2. **Bio format:** HTML (sanitized) vs Markdown.
3. **`faq` vs `interview`:** one array vs two (recommend **one Q&A array + optional section title** for v1).
4. **`revalidate`:** `604800` vs `60` vs env-driven.
5. **Minimum `featuredBooks`:** 0 vs 1 when publishing.

---

## 11. Developer note (summary)

This module is a **structured, first-class Mongo collection** (not a `Page` blob) so each author can be indexed, queried, and cached independently. It reuses **existing auth, upload, image rewrite, and Next.js ISR patterns**, adds **clear public/admin route separation**, and reserves **preview + automation** for later phases.
