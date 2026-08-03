# Chapters.Aur.Chai — Editorial System Roadmap

This is the long-term curatorial project for Library OS + content (Instagram, site, newsletters, book clubs).
Source shelf export: `docs/library-books-20260728.csv` (718 books).

## How it maps to Library OS (already built)

| Editorial idea | Library OS field | Notes |
|---|---|---|
| Country (author / setting) | `country` + Author `country` | Prefer author nationality on Author; setting tags when needed |
| Genre / Subgenre | `genres` + `subgenres` | Keep short controlled lists |
| Themes / Mood / Tropes | `themes` / `moods` / `tropes` | Soft-matched by Recommend + Hook Studio |
| Historical period / mythology | `tags` + `themes` | e.g. `Partition`, `Mahabharata`, `Gupta period` |
| Recommendation buckets | `collections` | India / World / Roots / Mood / Signature |
| Beginner → Advanced | `tags` | `level:beginner` · `level:intermediate` · `level:advanced` |
| Hidden gem / Popular / Classic | `tags` | `gem:hidden` · `gem:popular` · `gem:classic` |
| Seasonal / festival | `seasonalRecommendation` | Diwali, Monsoon, Independence Day, etc. |
| Cooldown / “don’t repeat” | `recommendationHistory` | Recommend Builder already sorts by this |
| One-line pitch | `oneLineRecommendation` | Critical for AI fit when tags are thin |
| Confidence | `recommendationConfidence` | low / medium / high / must-recommend |

**Collections = Phase 2–4 engine.** Today the sheet has **0/718** collections filled — that is the main gap.

---

## Phase 1 — Complete audit (this sheet)

For every book, aim for:

1. Correct title + author (casing, spelling)
2. Country + language
3. Genres (+ subgenre in genres or tags)
4. Themes, moods, tropes
5. Seasonal where it fits
6. Level + gem tags
7. At least **2–5 collections** (pillars + signature where relevant)
8. One-line recommendation + confidence (esp. for `read` books)

**Pass 1 (automated):** normalize country/language/title casing, fix known wrong titles, rule-assign collections from existing signals, flag suspects.  
**Pass 2+ (editorial):** human/AI cross-check of facts, fill empties, refine collections.

---

## Phase 2 — Editorial collections (controlled vocabulary)

### Pillars (store in `collections`)

- **India Bookshelf** — Indian authors and/or India-set literary culture
- **World Bookshelf** — global fiction beyond India-primary
- **Roots of Bharat** — mythology, epics, dharma, civilizational memory
- **Mood Reads** — emotional / atmospheric buckets
- **Seasonal & Festival** — also mirrored in `seasonalRecommendation`

### Signature Collections (brand series)

These become recurring Instagram / blog / newsletter pillars:

1. **Around the World in 52 Books** — one country/week
2. **States Through Stories** — Kerala, Bengal, Kashmir, Rajasthan, Tamil Nadu, Gujarat, Assam, Maharashtra, …
3. **The Epic Project** — Ramayana / Mahabharata characters (Karna, Kunti, Gandhari, Mandodari, …)
4. **Civilizations Through Books** — Greece, Rome, Egypt, Persia, China, Japan, Indus, …

Master list: `docs/editorial/collections-master.csv`

---

## Phase 3 — Recommendation engine

Every book should answer: *where does it belong?*

Example — *The Book of Everlasting Things*:

- India Bookshelf
- Historical Fiction / Literary Fiction / Women’s Fiction
- Themes: Partition, family saga
- Mood: emotional
- Seasonal: Independence Day
- Signature: States Through Stories — Punjab / Kashmir (as applicable)

Recommend Builder + Hook Studio + cooldown already support this once `collections` / tags are filled.

**Shipped in product:** collection filter + Signature presets on Recommend; Collections admin page with content calendar; insights deep-links; Master Data seed.

---

## Phase 4 — Universe wiring

Same taxonomy powers:

- Site recommendations / reading paths
- Author spotlights
- Newsletters & book-club picks
- Instagram calendars
- Future AI recommend (AI fit already uses pitch + tags)

**Shipped (admin ops):** Signature Collections hub → Recommend / Hook Studio / books; weekly never-recommended calendar for Signature series. Public Signature pages can follow after import proves data quality.

---

## Working agreement

When you ask for a list, calendar, or hooks, we will:

1. Prefer books that match the pillar / signature series
2. Respect recommendation cooldown
3. Prefer enriched `read` books with pitches
4. Strengthen brand pillars over one-off random lists

Enrichment outputs land in `docs/` as versioned CSVs for review → then **bulk import / bulk edit** into Library OS.
