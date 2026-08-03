# Import editorial enrichment into Library OS

## Suggested order (what we implemented)

1. **Pass 1–2 enrichment** on the sheet (done locally)
2. **Deploy API + web** (upsert import UI)
3. **Upsert CSV** into production Library OS
4. Use Recommend / Hook Studio — collections + tropes now drive lists
5. Ongoing Pass 3 polish (human review of flags) — not a blocker for import

Phases 3–4 (recommendation engine + universe wiring) mostly **activate from data** once collections/tropes/pitches are in Mongo. Signature series become content calendars on top of that.

## Files ready to import

| File | Use |
|---|---|
| `docs/library-books-editorial-v2-import.csv` | **Use this** — template-shaped, 718 rows (gaps filled) |
| `docs/library-books-editorial-v2.csv` | Full working copy |
| `docs/library-books-editorial-v1-import.csv` | Older pass (superseded) |
| `docs/editorial/collections-master.csv` | Vocabulary reference |
| `docs/editorial/ROADMAP.md` | Long-term editorial plan |

## Import steps (after deploy)

1. Admin → **Library → Import Books**
2. Choose **Excel / CSV template**
3. Upload `library-books-editorial-v1-import.csv`
4. Keep checked:
   - Auto-create author records
   - **Update existing books (upsert enrichment)**
5. Preview → Import

Matching order: ISBN → slug → title+author (case-insensitive).  
Non-empty CSV fields overwrite; empty cells leave existing DB values.

## What upsert writes

Country, language, genres, themes, moods, tropes, tags, seasonal, **collections**, one-line pitch, confidence, notes, status/rating/pages when present.

Taxonomy Master Data syncs collection/theme/mood names from imported rows automatically.

## Honest remaining gaps (Pass 3+)

- ~81 books still thin on tropes (no genre signal)
- ~14 still missing genres / ~15 missing one-liners
- Some moods/collections are heuristic — worth spot-checking India / Epic / States shelves
- Signature series depth (every state, every epic character) grows as you tag more books over time

## Women shelves (Ask / Recommend)

After upsert, these phrases map to tags + collections:

| Ask… | Filters |
|---|---|
| written by women / female authors / women writers | `written-by-women` + **Women Writers** |
| about women / women-centric | `about-women` + **Women-Centric Reads** |
| for women / women's fiction | `for-women-readers` + **For Women Readers** |
| Indian women writers | **Indian Women Writers** |

Seed taxonomy: Admin → Library → Collections → Seed (or import syncs names from CSV).

Author list for re-tagging: `docs/editorial/women-authors.txt` + `python3 docs/tag_women_shelves.py`.

