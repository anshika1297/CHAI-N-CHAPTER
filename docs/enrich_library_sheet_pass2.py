#!/usr/bin/env python3
"""
Pass 2 editorial enrichment on Pass 1 CSV.

- Strip false-positive India/Roots collections for non-India books
- Fill missing tropes from genre/mood heuristics
- Fill known empty popular titles with baseline metadata
- Correct a few known wrong countries
- Re-run collection assignment lightly for cleaned rows

Usage:
  python3 docs/enrich_library_sheet_pass2.py \
    --in docs/library-books-enriched-pass1.csv \
    --out docs/library-books-editorial-v1.csv
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import re
from pathlib import Path

# Load pass-1 helpers
SPEC = importlib.util.spec_from_file_location(
    "enrich1",
    Path(__file__).with_name("enrich_library_sheet.py"),
)
enrich1 = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(enrich1)

split_multi = enrich1.split_multi
join_multi = enrich1.join_multi
assign_collections = enrich1.assign_collections
haystack = enrich1.haystack
title_case_book = enrich1.title_case_book
has_word = enrich1.has_word

KNOWN_FILLS = {
    ("practice makes perfect", "sarah adams"): {
        "Genres": "Romance; Contemporary Romance",
        "Themes": "second chances; small town; self-worth; friendship",
        "Moods": "warm; witty; romantic; uplifting",
        "Tropes": "friends to lovers; forced proximity; small town romance",
        "Tags": "romantic comedy; light read; book club pick; level:beginner",
        "Seasonal": "Summer read; Valentine's Day",
        "One-line recommendation": "A warm, witty romance about finding confidence and the person who already sees you.",
        "Confidence": "medium",
    },
    ("the happily ever after playlist", "abby jimenez"): {
        "Genres": "Romance; Contemporary Romance",
        "Themes": "grief; healing; music; found family; second chances",
        "Moods": "emotional; warm; bittersweet; hopeful",
        "Tropes": "grumpy sunshine; musician romance; emotional healing",
        "Tags": "romantic comedy; tearjerker romance; book club pick; level:beginner",
        "Seasonal": "Valentine's Day; rainy day read",
        "One-line recommendation": "An emotionally rich rom-com about grief, music, and learning to love again.",
        "Confidence": "high",
    },
    ("book lovers", "emily henry"): {
        "Genres": "Romance; Contemporary Romance",
        "Themes": "ambition; family; small town; publishing; identity",
        "Moods": "witty; romantic; warm; sharp",
        "Tropes": "enemies to lovers; forced proximity; workplace rivalry",
        "Tags": "romantic comedy; publishing world; summer read; book club pick; level:beginner",
        "Seasonal": "Summer read; Vacation Reads",
        "One-line recommendation": "A sharp enemies-to-lovers rom-com set between NYC publishing and a sleepy lakeside town.",
        "Confidence": "must-recommend",
    },
    ("yours truly", "abby jimenez"): {
        "Genres": "Romance; Contemporary Romance",
        "Themes": "loneliness; friendship; workplace; anxiety; belonging",
        "Moods": "warm; funny; tender; hopeful",
        "Tropes": "workplace romance; fake relationship adjacent; email romance",
        "Tags": "romantic comedy; hospital setting; book club pick; level:beginner",
        "Seasonal": "Valentine's Day; Comfort Reads",
        "One-line recommendation": "A tender workplace rom-com about loneliness, friendship, and unexpected connection.",
        "Confidence": "high",
    },
    ("part of your world", "abby jimenez"): {
        "Genres": "Romance; Contemporary Romance",
        "Themes": "class difference; hometown; ambition; belonging",
        "Moods": "emotional; romantic; warm",
        "Tropes": "small town romance; opposites attract; second chance",
        "Tags": "romantic comedy; book club pick; level:beginner",
        "Seasonal": "Summer read; Valentine's Day",
        "One-line recommendation": "A heartfelt small-town romance about ambition, belonging, and choosing your own world.",
        "Confidence": "high",
    },
    ("the cheat sheet", "sarah adams"): {
        "Genres": "Romance; Contemporary Romance",
        "Themes": "friendship; fame; small town; vulnerability",
        "Moods": "witty; warm; romantic",
        "Tropes": "friends to lovers; fake dating; celebrity romance",
        "Tags": "romantic comedy; light read; level:beginner",
        "Seasonal": "Summer read; Valentine's Day",
        "One-line recommendation": "A charming friends-to-lovers rom-com with fake dating and small-town spark.",
        "Confidence": "medium",
    },
    ("the house in the cerulean sea", "t.j. klune"): {
        "Genres": "Fantasy; Contemporary Fantasy",
        "Themes": "found family; bureaucracy; acceptance; belonging; love",
        "Moods": "cozy; hopeful; whimsical; tender",
        "Tropes": "found family; magical orphans; slow burn romance",
        "Tags": "cozy fantasy; LGBTQ+; comfort read; book club pick; gem:popular; level:beginner",
        "Seasonal": "Cozy Weekend; rainy day read",
        "One-line recommendation": "A cozy, queer found-family fantasy that feels like a warm hug with a bureaucratic edge.",
        "Confidence": "must-recommend",
    },
    ("divine rivals", "rebecca ross"): {
        "Genres": "Fantasy; romantasy; Young Adult",
        "Themes": "war; ambition; letters; rivalry; love",
        "Moods": "romantic; atmospheric; bittersweet",
        "Tropes": "enemies to lovers; pen pals; wartime romance",
        "Tags": "romantasy; YA crossover; booktok; level:intermediate",
        "Seasonal": "Autumn read; Valentine's Day",
        "One-line recommendation": "A lyrical wartime romantasy of rival writers falling in love through letters.",
        "Confidence": "high",
    },
    ("the cruel prince", "holly black"): {
        "Genres": "Fantasy; Young Adult; Dark Fantasy",
        "Themes": "power; belonging; revenge; politics; identity",
        "Moods": "dark; sharp; tense; atmospheric",
        "Tropes": "enemies to lovers; mortal in faerie court; political intrigue",
        "Tags": "faerie fantasy; YA dark fantasy; booktok; level:intermediate",
        "Seasonal": "Autumn read; Halloween",
        "One-line recommendation": "A viciously clever faerie-court fantasy of power, belonging, and dangerous attraction.",
        "Confidence": "high",
    },
    ("red rising", "pierce brown"): {
        "Genres": "Science Fiction; Dystopia",
        "Themes": "class oppression; rebellion; identity; vengeance",
        "Moods": "intense; brutal; propulsive",
        "Tropes": "underdog; infiltration; revolution",
        "Tags": "sci-fi saga; book club pick; level:intermediate",
        "Seasonal": "Winter binge read",
        "One-line recommendation": "A brutal, propulsive sci-fi uprising story with mythic ambition.",
        "Confidence": "high",
    },
    ("never lie", "freida mcfadden"): {
        "Genres": "Thriller; Mystery",
        "Themes": "deception; marriage; secrets; danger",
        "Moods": "tense; twisty; unsettling",
        "Tropes": "unreliable narrator; isolated house; twist ending",
        "Tags": "psychological thriller; quick read; level:beginner",
        "Seasonal": "rainy day read; Halloween",
        "One-line recommendation": "A twisty locked-house thriller that keeps yanking the rug out from under you.",
        "Confidence": "medium",
    },
    ("the city of brass", "s.a. chakraborty"): {
        "Country": "United States",
        "Genres": "Fantasy; Epic Fantasy; Historical Fantasy",
        "Themes": "power; identity; colonialism; found family; heritage",
        "Moods": "atmospheric; vibrant; intense",
        "Tropes": "hidden city; djinn politics; reluctant heroine",
        "Tags": "Middle Eastern fantasy; djinn mythology; diverse fantasy; level:intermediate",
        "Seasonal": "Summer fantasy read; Autumn read",
        "One-line recommendation": "A lush Cairo-to-Daevabad epic of djinn politics, identity, and dangerous magic.",
        "Confidence": "must-recommend",
    },
    ("the kingdom of copper", "s.a. chakraborty"): {
        "Country": "United States",
        "Genres": "Fantasy; Epic Fantasy; Historical Fantasy",
        "Themes": "power; revenge; identity; revolution; belonging",
        "Moods": "dark; intense; atmospheric",
        "Tropes": "royal politics; rebellion; morally grey alliances",
        "Tags": "Middle Eastern fantasy; djinn mythology; series; level:intermediate",
        "Seasonal": "Autumn read; Winter binge read",
        "One-line recommendation": "A darker, sharper middle volume of djinn-city intrigue and uprising.",
        "Confidence": "high",
    },
    ("the empire of gold", "s.a. chakraborty"): {
        "Country": "United States",
    },
}

TROPE_BY_GENRE = {
    "romance": ["slow burn", "emotional payoff"],
    "contemporary romance": ["forced proximity", "banter"],
    "thriller": ["twist ending", "unreliable narrator"],
    "mystery": ["whodunit", "red herrings"],
    "fantasy": ["unique magic system", "quest"],
    "dark fantasy": ["morally grey protagonist", "high stakes"],
    "historical fiction": ["period setting", "social constraints"],
    "mythology": ["mythology retelling", "divine politics"],
    "literary fiction": ["character-driven", "interiority"],
    "young adult": ["coming of age", "found identity"],
    "science fiction": ["worldbuilding", "ethical dilemma"],
    "memoir": ["personal reckoning", "voice-driven"],
}


def infer_tropes(row: dict) -> list[str]:
    existing = split_multi(row.get("Tropes") or "")
    if existing:
        return existing
    genres = [g.lower() for g in split_multi(row.get("Genres") or "")]
    tags = " ".join(split_multi(row.get("Tags") or "")).lower()
    out: list[str] = []
    for g in genres:
        for t in TROPE_BY_GENRE.get(g, []):
            if t not in out:
                out.append(t)
    # tag-driven tropes
    for needle, trope in (
        ("enemies to lovers", "enemies to lovers"),
        ("friends to lovers", "friends to lovers"),
        ("fake dating", "fake dating"),
        ("grumpy", "grumpy sunshine"),
        ("forced proximity", "forced proximity"),
        ("mythology retelling", "mythology retelling"),
        ("partition", "historical trauma"),
        ("booktok", "viral romance energy"),
    ):
        if needle in tags and trope not in out:
            out.append(trope)
    return out[:6]


def clean_collections(row: dict) -> list[str]:
    """Drop India/Roots false positives for clearly non-India books, then reassign."""
    country = (row.get("Country") or "").strip().lower()
    h = haystack(row)
    india = country == "india" or any(
        has_word(h, w)
        for w in (
            "india",
            "indian",
            "bharat",
            "partition",
            "mahabharata",
            "ramayana",
            "delhi",
            "mumbai",
            "kerala",
            "bengal",
            "kashmir",
            "punjab",
        )
    ) or "indian mythology" in h or "indian literature" in h

    # Clear and rebuild from signals (pass1 assign_collections)
    rebuilt = assign_collections(row)
    if not india:
        rebuilt = [
            c
            for c in rebuilt
            if c
            not in {
                "India Bookshelf",
                "Roots of Bharat",
                "Indian Mythology Retellings",
                "Indian Historical Fiction",
                "Indian Literary Fiction",
                "Partition Stories",
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
            and not c.startswith("Epic ·")
        ]
        if "The Epic Project" in rebuilt and not india:
            rebuilt = [c for c in rebuilt if c != "The Epic Project"]
        if "World Bookshelf" not in rebuilt:
            rebuilt.insert(0, "World Bookshelf")
    return rebuilt


def apply_known_fill(row: dict) -> dict:
    key = ((row.get("Title") or "").strip().lower(), (row.get("Author") or "").strip().lower())
    # also try title-only fuzzy on known fills
    fill = KNOWN_FILLS.get(key)
    if not fill:
        for (t, a), payload in KNOWN_FILLS.items():
            if key[0] == t and (not a or a in key[1] or key[1] in a):
                fill = payload
                break
    if not fill:
        return row
    out = dict(row)
    for k, v in fill.items():
        if k == "Country" or not (out.get(k) or "").strip():
            out[k] = v
        elif k == "Country":
            out[k] = v
    return out


def enrich_row(row: dict) -> dict:
    out = dict(row)
    # title/author light cleanup
    if out.get("Title") and out["Title"] == out["Title"].lower():
        out["Title"] = title_case_book(out["Title"])
    if out.get("Author"):
        out["Author"] = re.sub(r"\s+", " ", out["Author"]).strip()
        if out["Author"] == out["Author"].lower():
            out["Author"] = " ".join(p[:1].upper() + p[1:] for p in out["Author"].split())

    out = apply_known_fill(out)

    # Default language
    if not (out.get("Language") or "").strip() and (out.get("Country") or "") in {
        "United States",
        "United Kingdom",
        "Canada",
        "Australia",
        "Ireland",
        "India",
    }:
        out["Language"] = "English"

    tropes = infer_tropes(out)
    out["Tropes"] = join_multi(tropes)

    out["Collections"] = join_multi(clean_collections(out))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True)
    args = ap.parse_args()

    with Path(args.inp).open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fields = list(reader.fieldnames or [])
        rows = [enrich_row(r) for r in reader]

    with Path(args.out).open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    missing_tropes = sum(1 for r in rows if not (r.get("Tropes") or "").strip())
    missing_genres = sum(1 for r in rows if not (r.get("Genres") or "").strip())
    missing_oneline = sum(1 for r in rows if not (r.get("One-line recommendation") or "").strip())
    india = sum(1 for r in rows if "India Bookshelf" in (r.get("Collections") or ""))
    roots = sum(1 for r in rows if "Roots of Bharat" in (r.get("Collections") or ""))
    print(f"Wrote {args.out} ({len(rows)} books)")
    print(f"Missing tropes: {missing_tropes}")
    print(f"Missing genres: {missing_genres}")
    print(f"Missing one-line: {missing_oneline}")
    print(f"India Bookshelf: {india}")
    print(f"Roots of Bharat: {roots}")


if __name__ == "__main__":
    main()
