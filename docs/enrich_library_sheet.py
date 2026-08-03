#!/usr/bin/env python3
"""
Pass 1 enrichment for Library OS export CSV.

- Normalize country / language / title casing
- Fix known wrong titles/authors
- Rule-assign collections from existing signals
- Emit flags for human/AI review

Usage:
  python3 docs/enrich_library_sheet.py \
    --in docs/library-books-20260728.csv \
    --out docs/library-books-enriched-pass1.csv \
    --flags docs/library-books-flags-pass1.csv
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path

COUNTRY_MAP = {
    "usa": "United States",
    "us": "United States",
    "u.s.": "United States",
    "u.s.a.": "United States",
    "united states of america": "United States",
    "uk": "United Kingdom",
    "u.k.": "United Kingdom",
    "england": "United Kingdom",
    "scotland": "United Kingdom",
    "wales": "United Kingdom",
    "great britain": "United Kingdom",
    "korea": "South Korea",
    "republic of korea": "South Korea",
    "s korea": "South Korea",
    "uae": "United Arab Emirates",
    "u.a.e.": "United Arab Emirates",
}

LANGUAGE_MAP = {
    "eng": "English",
    "en": "English",
    "hindi": "Hindi",
    "hin": "Hindi",
    "japanese": "Japanese",
    "korean": "Korean",
    "chinese": "Chinese",
    "arabic": "Arabic",
    "french": "French",
    "german": "German",
    "spanish": "Spanish",
    "italian": "Italian",
    "russian": "Russian",
    "turkish": "Turkish",
    "portuguese": "Portuguese",
    "tamil": "Tamil",
    "bengali": "Bengali",
    "malayalam": "Malayalam",
    "marathi": "Marathi",
    "urdu": "Urdu",
}

# Exact lowercase title → corrected Title, Author (optional)
KNOWN_FIXES = {
    "the chaos of stats": {
        "Title": "The Chaos of Stars",
        "Author": "Kiersten White",
        "flag": "Wrong title (was 'the chaos of stats')",
    },
    "the shadowed sun": {
        "Title": "The Shadowed Sun",
        "Author": "N.K. Jemisin",
    },
    "the killing moon": {
        "Title": "The Killing Moon",
        "Author": "N.K. Jemisin",
    },
}

AUTHOR_FIXES = {
    "n.k jemisin": "N.K. Jemisin",
    "n.k. jemisin": "N.K. Jemisin",
    "kiersten white": "Kiersten White",
    "ashley tropea": "Ashley Tropea",
    "abby jimenez": "Abby Jimenez",
    "sarah adams": "Sarah Adams",
    "emily henry": "Emily Henry",
    "alex aster": "Alex Aster",
    "claire daverley": "Claire Daverley",
    "tj klune": "T.J. Klune",
    "t.j. klune": "T.J. Klune",
    "lynn painter": "Lynn Painter",
    "rebecca ross": "Rebecca Ross",
    "holly jackson": "Holly Jackson",
    "dan brown": "Dan Brown",
    "marjan kamali": "Marjan Kamali",
    "stephanie garber": "Stephanie Garber",
    "jennifer hiller": "Jennifer Hillier",
    "john marrs": "John Marrs",
    "megan lally": "Megan Lally",
    "roshani chokshi": "Roshani Chokshi",
    "rashna imhasly- gandhy": "Rashna Imhasly-Gandhy",
    "rashna imhasly-gandhy": "Rashna Imhasly-Gandhy",
}

# Normalized author (lower, collapsed spaces) → country
AUTHOR_COUNTRY = {
    "ali hazelwood": "United States",
    "dan brown": "United States",
    "matthew reilly": "Australia",
    "lauren roberts": "United States",
    "abby jimenez": "United States",
    "colleen hoover": "United States",
    "rebecca yarros": "United States",
    "sarah j. maas": "United States",
    "sarah j maas": "United States",
    "sarah adams": "United States",
    "freida mcfadden": "United States",
    "pierce brown": "United States",
    "meg shaffer": "United States",
    "matt haig": "United Kingdom",
    "mark lawrence": "United States",
    "nitish bhushan": "India",
    "jacqueline harpman": "Belgium",
    "tami hoag": "United States",
    "melissa de la cruz": "United States",
    "robin sharma": "Canada",
    "holly jackson": "United Kingdom",
    "sarah a. parker": "United Kingdom",
    "b.k. borison": "United States",
    "lynn painter": "United States",
    "emily henry": "United States",
    "alex aster": "United States",
    "claire daverley": "United Kingdom",
    "sonoko machida": "Japan",
    "t.j. klune": "United States",
    "tj klune": "United States",
    "rebecca ross": "United States",
    "n.k. jemisin": "United States",
    "kiersten white": "United States",
    "a.j. finn": "United States",
    "aditi khorana": "United States",
    "alex michaelides": "United Kingdom",
    "alice feeney": "United Kingdom",
    "amari soul": "United States",
    "amish tripathi": "India",
    "amy lloyd": "United Kingdom",
    "aparna verma": "United States",
    "barbara davis": "United States",
    "blake crouch": "United States",
    "bonnie garmus": "United States",
    "carol wyer": "United Kingdom",
    "carsten henn": "Germany",
    "daniel chidiac": "Australia",
    "danielle steel": "United States",
    "debanjana mukherjee": "India",
    "dustin thao": "United States",
    "e.l. james": "United Kingdom",
    "evie woods": "Ireland",
    "fiona valpy": "United Kingdom",
    "franz kafka": "Czech Republic",
    "gabrielle zevin": "United States",
    "gail honeyman": "United Kingdom",
    "genevieve gornichec": "United States",
    "gillian flynn": "United States",
    "hiyoko kurisu": "Japan",
    "holly black": "United States",
    "james clear": "United States",
    "james patterson": "United States",
    "jennifer saint": "United Kingdom",
    "jennifer hiller": "Canada",
    "jennifer hillier": "Canada",
    "john green": "United States",
    "john marrs": "United Kingdom",
    "jojo moyes": "United Kingdom",
    "katy brent": "United Kingdom",
    "kazuo ishiguro": "United Kingdom",
    "kritika h. rao": "Canada",
    "lauren asher": "United States",
    "laurie gilmore": "United States",
    "lori gottlieb": "United States",
    "mai mochizuki": "Japan",
    "marion blackwood": "United States",
    "marjan kamali": "United States",
    "megan lally": "United States",
    "mitch albom": "United States",
    "natalie haynes": "United Kingdom",
    "nikita gill": "United Kingdom",
    "paula hawkins": "United Kingdom",
    "peter swanson": "United States",
    "poppy alexander": "United Kingdom",
    "r.f. kuang": "United States",
    "rajessh m iyer": "India",
    "robert crais": "United States",
    "roshani chokshi": "United States",
    "s.f. williamson": "United Kingdom",
    "sally thorne": "Australia",
    "sammar shabir": "United Kingdom",
    "sanaka hiiragi": "Japan",
    "senlinyu": "United States",
    "shabir ahmad mir": "India",
    "shauna robinson": "United States",
    "shelby van pelt": "United States",
    "shen tao": "China",
    "sidney sheldon": "United States",
    "sohil makwana": "India",
    "sophie kinsella": "United Kingdom",
    "stephanie garber": "United States",
    "susanna clarke": "United Kingdom",
    "swati teerdhala": "United States",
    "taylor adams": "United States",
    "wilbur smith": "South Africa",
    "yuval noah harari": "Israel",
    "rashna imhasly- gandhy": "India",
    "rashna imhasly-gandhy": "India",
}


def split_multi(val: str) -> list[str]:
    if not val or not str(val).strip():
        return []
    parts = re.split(r"[;|,]", str(val))
    out, seen = [], set()
    for p in parts:
        t = re.sub(r"\s+", " ", p).strip()
        if not t:
            continue
        key = t.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(t)
    return out


def join_multi(vals: list[str]) -> str:
    return "; ".join(vals)


def title_case_book(s: str) -> str:
    s = re.sub(r"\s+", " ", (s or "").strip())
    if not s:
        return s
    # Keep all-caps acronyms short
    small = {
        "a",
        "an",
        "the",
        "and",
        "or",
        "of",
        "in",
        "on",
        "to",
        "for",
        "from",
        "with",
        "at",
        "by",
        "vs",
        "via",
    }
    words = s.split(" ")
    out = []
    for i, w in enumerate(words):
        if "'" in w or "’" in w:
            # O'Neill style
            parts = re.split(r"(['’])", w)
            rebuilt = []
            for part in parts:
                if part in {"'", "’"}:
                    rebuilt.append(part)
                elif not part:
                    continue
                else:
                    rebuilt.append(part[:1].upper() + part[1:].lower() if len(part) > 1 else part.upper())
            out.append("".join(rebuilt))
            continue
        low = w.lower()
        if i > 0 and low in small:
            out.append(low)
        elif w.isupper() and len(w) <= 4:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:].lower() if len(w) > 1 else w.upper())
    return " ".join(out)


def normalize_country(c: str) -> str:
    t = re.sub(r"\s+", " ", (c or "").strip())
    if not t:
        return ""
    key = t.lower()
    if key in COUNTRY_MAP:
        return COUNTRY_MAP[key]
    # Title-case multiword
    return " ".join(w[:1].upper() + w[1:].lower() if w.lower() not in {"and", "of"} else w.lower() for w in t.split())


def normalize_language(l: str) -> str:
    t = re.sub(r"\s+", " ", (l or "").strip())
    if not t:
        return ""
    key = t.lower()
    return LANGUAGE_MAP.get(key, t[:1].upper() + t[1:].lower() if t.islower() else t)


def haystack(row: dict) -> str:
    bits = [
        row.get("Title", ""),
        row.get("Author", ""),
        row.get("Country", ""),
        row.get("Genres", ""),
        row.get("Themes", ""),
        row.get("Moods", ""),
        row.get("Tropes", ""),
        row.get("Tags", ""),
        row.get("Seasonal", ""),
        row.get("Series", ""),
        row.get("One-line recommendation", ""),
        row.get("Personal notes", ""),
    ]
    return " ".join(bits).lower()


def has_word(hay: str, word: str) -> bool:
    return re.search(rf"(?<![a-z0-9]){re.escape(word.lower())}(?![a-z0-9])", hay) is not None


def assign_collections(row: dict) -> list[str]:
    h = haystack(row)
    country = (row.get("Country") or "").strip().lower()
    cols: list[str] = []

    def add(name: str) -> None:
        if name not in cols:
            cols.append(name)

    india_words = (
        "india",
        "indian",
        "bharat",
        "partition",
        "mahabharata",
        "ramayana",
        "delhi",
        "mumbai",
        "kolkata",
        "kerala",
        "bengal",
        "kashmir",
        "punjab",
        "rajasthan",
        "tamil",
        "gujarat",
        "assam",
        "hindi",
        "sanskrit",
        "desi",
    )
    india_signals = country == "india" or any(has_word(h, w) for w in india_words)
    india_signals = india_signals or "indian literature" in h or "indian mythology" in h

    if india_signals:
        add("India Bookshelf")
    else:
        add("World Bookshelf")

    if any(
        x in h
        for x in (
            "mahabharata",
            "ramayana",
            "indian mythology",
            "mythology retelling",
            "vedic",
            "purana",
            "hindu myth",
        )
    ) or (india_signals and "mythology" in h):
        add("Roots of Bharat")
        if "mythology" in h or "retelling" in h:
            add("Indian Mythology Retellings")

    if has_word(h, "partition"):
        add("Partition Stories")
    if "historical fiction" in h and india_signals:
        add("Indian Historical Fiction")
    if "literary fiction" in h and india_signals:
        add("Indian Literary Fiction")

    # States Through Stories
    state_map = [
        ("kerala", "Kerala Stories"),
        ("bengal", "Bengal Stories"),
        ("kolkata", "Bengal Stories"),
        ("kashmir", "Kashmir Stories"),
        ("rajasthan", "Rajasthan Stories"),
        ("tamil", "Tamil Nadu Stories"),
        ("chennai", "Tamil Nadu Stories"),
        ("gujarat", "Gujarat Stories"),
        ("assam", "Assam & Northeast Stories"),
        ("northeast", "Assam & Northeast Stories"),
        ("maharashtra", "Maharashtra Stories"),
        ("mumbai", "Maharashtra Stories"),
        ("punjab", "Punjab Stories"),
        ("sikh", "Punjab Stories"),
    ]
    for needle, name in state_map:
        if has_word(h, needle):
            add("States Through Stories")
            add(name)

    # Epic Project characters
    epic_map = [
        ("karna", "Epic · Karna"),
        ("kunti", "Epic · Kunti"),
        ("gandhari", "Epic · Gandhari"),
        ("mandodari", "Epic · Mandodari"),
        ("bhishma", "Epic · Bhishma"),
        ("satyavati", "Epic · Satyavati"),
        ("shabari", "Epic · Shabari"),
        ("draupadi", "Epic · Draupadi"),
        ("sita", "Epic · Sita"),
    ]
    for needle, name in epic_map:
        if has_word(h, needle):
            add("The Epic Project")
            add(name)
            add("Roots of Bharat")

    # Civilizations — word-boundary to avoid "romantic" → Rome
    civ_map = [
        (("greece", "greek", "hellenic", "olympus", "olympic gods"), "Civilization · Greece"),
        (("rome", "roman empire", "caesar", "augustus"), "Civilization · Rome"),
        (("egypt", "egyptian", "pharaoh", "nile"), "Civilization · Egypt"),
        (("persia", "persian", "achaemenid"), "Civilization · Persia"),
        (("china", "chinese"), "Civilization · China"),
        (("japan", "japanese", "shinto", "samurai"), "Civilization · Japan"),
    ]
    for needles, name in civ_map:
        if any(has_word(h, n) if " " not in n else n in h for n in needles):
            add("Civilizations Through Books")
            add(name)
            add("Around the World in 52 Books")

    # World region shelves
    if country in {"japan", "south korea", "china", "taiwan"} or any(
        has_word(h, x) for x in ("japanese", "korean")
    ):
        add("East Asia Shelf")
        add("Around the World in 52 Books")
    if country in {
        "egypt",
        "turkey",
        "iran",
        "iraq",
        "lebanon",
        "morocco",
        "saudi arabia",
        "united arab emirates",
        "afghanistan",
        "pakistan",
    }:
        add("Middle East & North Africa")
        add("Around the World in 52 Books")

    # Moods — prefer mood field tokens when present
    moods = " ".join(split_multi(row.get("Moods") or "")).lower()
    mood_hay = moods or h
    if any(x in mood_hay for x in ("heartbreak", "grief", "tragic", "devastat", "emotional", "melanchol")):
        add("Heartbreaking Reads")
    if any(x in mood_hay for x in ("comfort", "cozy", "warm", "feel-good", "uplifting", "hopeful")):
        add("Comfort Reads")
    if any(x in mood_hay for x in ("dark", "gothic", "atmospheric", "tense", "eerie", "ominous")):
        add("Dark & Atmospheric")
    genres = " ".join(split_multi(row.get("Genres") or "")).lower()
    if any(x in genres for x in ("thriller", "mystery", "suspense")) or "page-turner" in h:
        add("Page-Turners")
    if "literary fiction" in genres and any(x in mood_hay for x in ("reflective", "lyrical", "quiet", "slow")):
        add("Slow Literary")

    # Level / gem → tags only (avoid flooding collections)
    return cols


def enrich_row(row: dict) -> tuple[dict, list[str]]:
    flags: list[str] = []
    out = dict(row)

    title_key = (out.get("Title") or "").strip().lower()
    if title_key in KNOWN_FIXES:
        fix = KNOWN_FIXES[title_key]
        if fix.get("Title"):
            out["Title"] = fix["Title"]
        if fix.get("Author"):
            out["Author"] = fix["Author"]
        if fix.get("flag"):
            flags.append(fix["flag"])

    # Author normalize
    author_raw = re.sub(r"\s+", " ", (out.get("Author") or "").strip())
    out["Author"] = author_raw
    author_key = author_raw.lower()
    if author_key in AUTHOR_FIXES:
        out["Author"] = AUTHOR_FIXES[author_key]
        author_key = out["Author"].lower()
    elif author_raw and author_raw == author_raw.lower():
        out["Author"] = " ".join(p[:1].upper() + p[1:] for p in author_raw.split())
        author_key = out["Author"].lower()
        flags.append("Author casing normalized")

    # Title casing if lowercase
    t = (out.get("Title") or "").strip()
    if t and t == t.lower():
        out["Title"] = title_case_book(t)
        flags.append("Title casing normalized")

    before_c = (out.get("Country") or "").strip()
    mapped = normalize_country(before_c)
    if mapped:
        out["Country"] = mapped
        if before_c != mapped:
            flags.append(f"Country normalized ({before_c} → {mapped})")
    elif author_key in AUTHOR_COUNTRY:
        out["Country"] = AUTHOR_COUNTRY[author_key]
        flags.append(f"Country filled from author map ({out['Country']})")
    else:
        out["Country"] = ""

    before_l = (out.get("Language") or "").strip()
    out["Language"] = normalize_language(before_l)
    if before_l and before_l != out["Language"]:
        flags.append(f"Language normalized ({before_l} → {out['Language']})")

    # Default language when English-market signals and empty
    if not out["Language"] and out["Country"] in {
        "United States",
        "United Kingdom",
        "Canada",
        "Australia",
        "Ireland",
        "India",
    }:
        out["Language"] = "English"
        flags.append("Language defaulted to English")

    # Collections
    existing = split_multi(out.get("Collections") or "")
    assigned = assign_collections(out)
    merged = []
    seen = set()
    for c in existing + assigned:
        k = c.lower()
        if k in seen:
            continue
        seen.add(k)
        merged.append(c)
    out["Collections"] = join_multi(merged)

    # Level / gem tags (heuristic — refine in Pass 2)
    tags = split_multi(out.get("Tags") or "")
    tag_set = {t.lower() for t in tags}
    tag_add: list[str] = []
    pages = 0
    try:
        pages = int(float(out.get("Pages") or 0))
    except ValueError:
        pages = 0
    h = haystack(out)
    if "level:beginner" not in tag_set and pages and pages <= 280 and any(
        x in h for x in ("young adult", "quick read", "accessible")
    ):
        tag_add.append("level:beginner")
    elif "level:advanced" not in tag_set and pages and pages >= 500:
        tag_add.append("level:advanced")
    elif "level:intermediate" not in tag_set and (
        "literary fiction" in h or "mythology" in h
    ):
        tag_add.append("level:intermediate")

    if "gem:classic" not in tag_set and any(x in h for x in ("classic", "nobel", "booker", "pulitzer")):
        tag_add.append("gem:classic")
    elif "gem:popular" not in tag_set and any(x in h for x in ("booktok", "bestseller")):
        tag_add.append("gem:popular")
    elif "gem:hidden" not in tag_set and any(
        x in h for x in ("indie", "underrated", "hidden gem", "lesser known")
    ):
        tag_add.append("gem:hidden")

    if tag_add:
        out["Tags"] = join_multi(tags + tag_add)

    # Review flags for empties / suspects
    if not (out.get("Country") or "").strip():
        flags.append("MISSING country")
    if not (out.get("Genres") or "").strip():
        flags.append("MISSING genres")
    if not (out.get("Themes") or "").strip():
        flags.append("MISSING themes")
    if not (out.get("Moods") or "").strip():
        flags.append("MISSING moods")
    if not (out.get("Tropes") or "").strip():
        flags.append("MISSING tropes")
    if not (out.get("One-line recommendation") or "").strip():
        flags.append("MISSING one-line")
    if not (out.get("Collections") or "").strip():
        flags.append("MISSING collections")

    # Suspicious: Ancient Greece as country (setting vs nationality)
    if (out.get("Country") or "").lower() in {"ancient greece", "ancient egypt", "ancient rome"}:
        flags.append("Country looks like setting/era — confirm author nationality")

    # Genre noise
    genres = [g.lower() for g in split_multi(out.get("Genres") or "")]
    if "fiction" in genres and len(genres) == 1:
        flags.append("Genres too vague (only 'Fiction')")

    return out, flags


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True)
    ap.add_argument("--flags", dest="flags", required=True)
    args = ap.parse_args()

    inp = Path(args.inp)
    with inp.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    enriched = []
    flag_rows = []
    for i, row in enumerate(rows, start=2):
        out, flags = enrich_row(row)
        enriched.append(out)
        if flags:
            flag_rows.append(
                {
                    "row": i,
                    "Title": out.get("Title", ""),
                    "Author": out.get("Author", ""),
                    "flags": " | ".join(flags),
                    "Collections": out.get("Collections", ""),
                    "Country": out.get("Country", ""),
                }
            )

    outp = Path(args.out)
    outp.parent.mkdir(parents=True, exist_ok=True)
    with outp.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(enriched)

    flagp = Path(args.flags)
    with flagp.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["row", "Title", "Author", "flags", "Collections", "Country"])
        w.writeheader()
        w.writerows(flag_rows)

    # Summary
    with_coll = sum(1 for r in enriched if (r.get("Collections") or "").strip())
    missing_country = sum(1 for r in enriched if not (r.get("Country") or "").strip())
    print(f"Books: {len(enriched)}")
    print(f"With collections: {with_coll}/{len(enriched)}")
    print(f"Still missing country: {missing_country}")
    print(f"Flagged rows: {len(flag_rows)}")
    print(f"Wrote {outp}")
    print(f"Wrote {flagp}")


if __name__ == "__main__":
    main()
