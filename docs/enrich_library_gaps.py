#!/usr/bin/env python3
"""Fill remaining editorial gaps on library-books-editorial-v1.csv → v2 + import CSV."""

from __future__ import annotations

import csv
import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("e1", ROOT / "enrich_library_sheet.py")
e1 = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(e1)

split_multi = e1.split_multi
join_multi = e1.join_multi
assign_collections = e1.assign_collections
title_case_book = e1.title_case_book

# title lower → fill dict (author optional check)
FILLS: dict[str, dict[str, str]] = {
    "summer in the city": {
        "Author": "Alex Aster",
        "Genres": "Romance; Contemporary Romance; Young Adult",
        "Themes": "summer romance; friendship; identity; first love",
        "Moods": "warm; romantic; nostalgic; lighthearted",
        "Tropes": "summer fling; friends to lovers; city romance",
        "Tags": "YA romance; summer read; light read; level:beginner",
        "Seasonal": "Summer read; Vacation Reads",
        "One-line recommendation": "A sunlit summer romance about friendship tipping into something more.",
        "Language": "English",
        "Confidence": "medium",
    },
    "talking at night": {
        "Author": "Claire Daverley",
        "Genres": "Literary Fiction; Contemporary Fiction; Romance",
        "Themes": "grief; friendship; class; first love; growing up",
        "Moods": "emotional; bittersweet; intimate; reflective",
        "Tropes": "childhood friends; star-crossed; dual timeline",
        "Tags": "book club pick; emotional read; level:intermediate",
        "Seasonal": "rainy day read; Autumn read",
        "One-line recommendation": "A sweeping, tender story of two friends whose lives keep colliding across years.",
        "Language": "English",
        "Confidence": "high",
    },
    "the convenience store by the sea": {
        "Author": "Sonoko Machida",
        "Genres": "Literary Fiction; Contemporary Fiction",
        "Themes": "community; kindness; everyday life; belonging",
        "Moods": "gentle; cozy; hopeful; warm",
        "Tropes": "slice of life; found community; quiet healing",
        "Tags": "Japanese fiction; translated fiction; comfort read; level:beginner",
        "Seasonal": "Cozy Weekend; rainy day read",
        "One-line recommendation": "A gentle Japanese comfort novel about the quiet magic of a seaside convenience store.",
        "Country": "Japan",
        "Language": "Japanese",
        "Confidence": "high",
    },
    "the lion women of tehran": {
        "Author": "Marjan Kamali",
        "Genres": "Historical Fiction; Literary Fiction",
        "Themes": "friendship; feminism; Iran; political upheaval; loyalty",
        "Moods": "emotional; powerful; bittersweet",
        "Tropes": "female friendship; coming of age against history",
        "Tags": "Iranian history; book club pick; women's fiction; level:intermediate",
        "Seasonal": "Women's History Month; International Women's Day",
        "One-line recommendation": "An unforgettable friendship saga set against decades of change in Tehran.",
        "Language": "English",
        "Confidence": "must-recommend",
    },
    "once upon a broken heart": {
        "Author": "Stephanie Garber",
        "Genres": "Fantasy; Young Adult; romantasy",
        "Themes": "love; fate; bargains; identity; desire",
        "Moods": "whimsical; romantic; darkly magical",
        "Tropes": "faerie bargains; love triangle; enchanted realm",
        "Tags": "YA fantasy; booktok; romantasy; level:intermediate",
        "Seasonal": "Autumn read; Valentine's Day",
        "One-line recommendation": "A glittering, addictive romantasy of wishes, bargains, and broken hearts.",
        "Language": "English",
        "Confidence": "high",
    },
    "the butcher": {
        "Author": "Jennifer Hillier",
        "Genres": "Thriller; Mystery; Crime",
        "Themes": "family secrets; violence; inheritance; justice",
        "Moods": "tense; dark; twisty",
        "Tropes": "family curse; cold case; unreliable past",
        "Tags": "psychological thriller; crime fiction; level:intermediate",
        "Seasonal": "Halloween; rainy day read",
        "One-line recommendation": "A dark family-secrets thriller with a butcher shop at its bloody center.",
        "Language": "English",
        "Confidence": "medium",
    },
    "you killed me first": {
        "Author": "John Marrs",
        "Genres": "Thriller; Psychological Thriller",
        "Themes": "revenge; deception; marriage; secrets",
        "Moods": "tense; twisty; unsettling",
        "Tropes": "unreliable narrator; revenge plot; domestic thriller",
        "Tags": "psychological thriller; quick read; level:beginner",
        "Seasonal": "rainy day read",
        "One-line recommendation": "A twisty psychological thriller about the stories couples tell — and weaponize.",
        "Language": "English",
        "Confidence": "medium",
    },
    "that's not my name": {
        "Author": "Megan Lally",
        "Genres": "Thriller; Young Adult; Mystery",
        "Themes": "identity; memory; danger; friendship",
        "Moods": "tense; twisty; propulsive",
        "Tropes": "amnesia; unreliable memory; missing person energy",
        "Tags": "YA thriller; twisty; level:beginner",
        "Seasonal": "rainy day read",
        "One-line recommendation": "A propulsive YA thriller about a girl who wakes up knowing everyone — except herself.",
        "Language": "English",
        "Confidence": "medium",
    },
    "morning star": {
        "Author": "Pierce Brown",
        "Genres": "Science Fiction; Dystopia",
        "Themes": "revolution; loyalty; war; identity; sacrifice",
        "Moods": "epic; intense; brutal",
        "Tropes": "war finale; rebellion; found family under fire",
        "Tags": "Red Rising saga; sci-fi epic; level:intermediate",
        "Seasonal": "Winter binge read",
        "One-line recommendation": "The explosive finale of a rebellion saga that never lets up.",
        "Language": "English",
        "Confidence": "high",
    },
    "the surviving sky": {
        "Author": "Kritika H. Rao",
        "Genres": "Fantasy; Science Fantasy",
        "Themes": "marriage; ecology; power; memory; survival",
        "Moods": "atmospheric; intense; original",
        "Tropes": "arranged marriage; living cities; plant magic",
        "Tags": "South Asian fantasy; unique worldbuilding; level:intermediate",
        "Seasonal": "Autumn read",
        "One-line recommendation": "A wildly original South Asian-inspired fantasy of living cities and a marriage under siege.",
        "Language": "English",
        "Confidence": "high",
    },
    "the startouched queen": {
        "Author": "Roshani Chokshi",
        "Genres": "Fantasy; Young Adult; Mythology",
        "Themes": "power; destiny; sisterhood; magic; empire",
        "Moods": "lush; romantic; adventurous",
        "Tropes": "chosen one adjacent; court intrigue; celestial magic",
        "Tags": "YA fantasy; mythic fantasy; AAPI author; level:intermediate",
        "Seasonal": "Diwali; Autumn read",
        "One-line recommendation": "A lush, starlit fantasy of queenship, magic, and dangerous desire.",
        "Language": "English",
        "Confidence": "high",
    },
    "the tiger at midnight": {
        "Author": "Swati Teerdhala",
        "Genres": "Fantasy; Young Adult; Adventure",
        "Themes": "revenge; justice; identity; rebellion",
        "Moods": "adventurous; romantic; tense",
        "Tropes": "enemies to lovers; assassin; rebel kingdom",
        "Tags": "South Asian YA fantasy; adventure; level:intermediate",
        "Seasonal": "Summer read; Diwali",
        "One-line recommendation": "A fierce South Asian YA fantasy of assassins, rebels, and enemies-to-lovers fire.",
        "Language": "English",
        "Confidence": "high",
    },
    "the phoenix king": {
        "Author": "Aparna Verma",
        "Genres": "Fantasy; Epic Fantasy",
        "Themes": "power; prophecy; empire; identity; vengeance",
        "Moods": "dark; epic; atmospheric",
        "Tropes": "court intrigue; prophecy; morally grey heirs",
        "Tags": "Indian-inspired fantasy; debut; level:intermediate",
        "Seasonal": "Autumn read; Diwali",
        "One-line recommendation": "A dark, Indian-inspired epic of empire, prophecy, and ruthless ambition.",
        "Language": "English",
        "Confidence": "high",
    },
    "the library of fates": {
        "Author": "Aditi Khorana",
        "Genres": "Fantasy; Young Adult; Mythology",
        "Themes": "fate; colonialism; identity; resistance; love",
        "Moods": "magical; thoughtful; romantic",
        "Tropes": "oracle; arranged marriage politics; resistance",
        "Tags": "South Asian YA; mythology-inspired; level:intermediate",
        "Seasonal": "Diwali; Women's History Month",
        "One-line recommendation": "A South Asian-inspired YA fantasy where an oracle princess must rewrite fate itself.",
        "Language": "English",
        "Confidence": "high",
    },
}

# Trope packs by signal in themes/genres/tags/moods
SIGNAL_TROPES = [
    (("partition",), ["historical trauma", "disrupted families", "memory of violence"]),
    (("mythology", "retelling", "mahabharata", "ramayana", "epic"), ["mythology retelling", "divine politics", "moral dilemma"]),
    (("draupadi", "sita", "karna", "kunti"), ["character study retelling", "epic side voice"]),
    (("romance", "romantic"), ["emotional payoff", "relationship arc"]),
    (("thriller", "mystery", "suspense"), ["twist ending", "rising dread"]),
    (("cozy", "comfort", "bookshop", "café", "cafe", "library", "cat"), ["slice of life", "quiet healing", "found community"]),
    (("memoir", "self-help"), ["personal reckoning", "voice-driven"]),
    (("poetry",), ["lyric voice", "fragmented memory"]),
    (("historical fiction",), ["period pressure", "social constraints"]),
    (("fantasy",), ["magic system", "quest or court"]),
    (("literary",), ["character-driven", "interiority"]),
    (("war", "grief", "loss"), ["grief work", "aftermath"]),
    (("friendship",), ["found family", "loyalty tested"]),
]


def infer_tropes(row: dict) -> list[str]:
    existing = split_multi(row.get("Tropes") or "")
    if existing:
        return existing
    blob = " ".join(
        [
            row.get("Genres") or "",
            row.get("Themes") or "",
            row.get("Moods") or "",
            row.get("Tags") or "",
            row.get("One-line recommendation") or "",
            row.get("Title") or "",
        ]
    ).lower()
    out: list[str] = []
    for needles, tropes in SIGNAL_TROPES:
        if any(n in blob for n in needles):
            for t in tropes:
                if t not in out:
                    out.append(t)
    if not out:
        out = ["character-driven", "story-forward"]
    return out[:6]


def apply_fill(row: dict) -> dict:
    out = dict(row)
    key = (out.get("Title") or "").strip().lower()
    # normalize odd casing titles for lookup
    key = re.sub(r"\s+", " ", key)
    fill = FILLS.get(key)
    if not fill and key.startswith("that"):
        fill = FILLS.get("that's not my name")
    if fill:
        for k, v in fill.items():
            if k == "Author":
                if not (out.get("Author") or "").strip() or out["Author"].lower() == v.lower():
                    out["Author"] = v
                continue
            if k in ("Country", "Language") or not (out.get(k) or "").strip():
                out[k] = v
    return out


def enrich(row: dict) -> dict:
    out = apply_fill(row)
    if out.get("Title") and out["Title"] == out["Title"].lower():
        out["Title"] = title_case_book(out["Title"])
    if not (out.get("Language") or "").strip():
        c = (out.get("Country") or "").strip()
        if c in {"United States", "United Kingdom", "Canada", "Australia", "Ireland", "India", "South Africa"}:
            out["Language"] = "English"
        elif c == "Japan":
            out["Language"] = "Japanese"
        elif c == "South Korea":
            out["Language"] = "Korean"
        elif c in {"Greece", "Italy", "Ancient Greece", "Ancient Persia"}:
            out["Language"] = "English"
    out["Tropes"] = join_multi(infer_tropes(out))
    cols = assign_collections(out)
    country = (out.get("Country") or "").lower()
    blob = " ".join(
        [
            out.get("Genres") or "",
            out.get("Tags") or "",
            out.get("Themes") or "",
            out.get("Title") or "",
            country,
        ]
    ).lower()
    india = country == "india" or any(
        x in blob
        for x in (
            "indian",
            "partition",
            "mahabharata",
            "ramayana",
            "bharat",
            "delhi",
            "mumbai",
            "kerala",
            "bengal",
            "kashmir",
        )
    )
    if not india:
        ban_prefix = ("Epic ·",)
        ban = {
            "India Bookshelf",
            "Roots of Bharat",
            "Indian Mythology Retellings",
            "Indian Historical Fiction",
            "Indian Literary Fiction",
            "Partition Stories",
            "The Epic Project",
            "States Through Stories",
            "Kerala Stories",
            "Bengal Stories",
            "Kashmir Stories",
            "Rajasthan Stories",
            "Tamil Nadu Stories",
            "Gujarat Stories",
            "Assam & Northeast Stories",
            "Maharashtra Stories",
            "Punjab Stories",
        }
        cols = [c for c in cols if c not in ban and not c.startswith(ban_prefix)]
        if "World Bookshelf" not in cols:
            cols.insert(0, "World Bookshelf")
    out["Collections"] = join_multi(cols)
    return out


def main() -> None:
    inp = ROOT / "library-books-editorial-v1.csv"
    outp = ROOT / "library-books-editorial-v2.csv"
    with inp.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fields = list(reader.fieldnames or [])
        rows = [enrich(r) for r in reader]

    with outp.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    # import-shaped
    headers = [
        "Title",
        "Author",
        "Subtitle",
        "ISBN",
        "Status",
        "Rating",
        "Pages",
        "Publisher",
        "Series",
        "Series Number",
        "Country",
        "Language",
        "Ownership",
        "Format",
        "Location",
        "Genres",
        "Subgenres",
        "Themes",
        "Tropes",
        "Moods",
        "Tags",
        "Seasonal",
        "Collections",
        "One-line recommendation",
        "Confidence",
        "Why I recommend it",
        "Personal notes",
        "Finished",
        "Added",
    ]
    import_path = ROOT / "library-books-editorial-v2-import.csv"
    with import_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        for r in rows:
            row = {h: r.get(h, "") if h in r else "" for h in headers}
            w.writerow(row)

    def miss(col: str) -> int:
        return sum(1 for r in rows if not (r.get(col) or "").strip())

    print(f"Wrote {outp.name} and {import_path.name} ({len(rows)})")
    for col in ["Genres", "Themes", "Moods", "Tropes", "One-line recommendation", "Country", "Language", "Collections"]:
        print(f"  missing {col}: {miss(col)}")


if __name__ == "__main__":
    main()
