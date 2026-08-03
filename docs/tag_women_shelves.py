#!/usr/bin/env python3
"""
Tag women-related shelves on editorial v2 CSV.

Adds collections + tags:
  - Women Writers / written-by-women / female-author
  - Women-Centric Reads / about-women / women-centric
  - For Women Readers / for-women-readers
  - Indian Women Writers (when India + woman author)

Author gender comes from docs/editorial/women-authors.txt (+ male blocklist
and first-name heuristic for unlisted names).

Usage:
  python3 docs/tag_women_shelves.py
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EDITORIAL = ROOT / "editorial"

MALE_AUTHORS = {
    "a.c. bhaktivedanta swami prabhupada",
    "a.j. finn",
    "a.l. basham",
    "aaditya sengupta dhar",
    "abhishek tripathi",
    "abhishek singh",
    "abraham verghese",
    "ahmet ümit",
    "ajay k. pandey",
    "ajit",
    "akshat gupta",
    "alex michaelides",
    "ali akbar natiq",
    "amish tripathi",
    "amitabha bagchi",
    "amitav ghosh",
    "amor towles",
    "anand neelakantan",
    "andy weir",
    "anthony doerr",
    "anuj ghai",
    "anuj tiwari",
    "aravind adiga",
    "arun krishnan",
    "ashok bhasin",
    "ashok k. banker",
    "ashraf karayath",
    "ashwin sanghi",
    "ayushmann khurrana",
    "bhisham sahni",
    "bibek debroy",
    "bilal siddiqi",
    "blake crouch",
    "carsten henn",
    "charles allen",
    "chetan bhagat",
    "christopher c. doyle",
    "christopher greyson",
    "cyrus mistry",
    "dan brown",
    "daniel chidiac",
    "daniel paul singh",
    "deepak chopra",
    "devdutt pattanaik",
    "dr. akhilesh kumar",
    "durian sukegawa",
    "dustin thao",
    "eknath easwaran",
    "ernest wood & s.v. subrahmanyam",
    "franz kafka",
    "fredrik backman",
    "fyodor dostoevsky",
    "gaur gopal das",
    "gaurav mohanty",
    "george orwell",
    "gourav mohanty",
    "gregory l. possehl",
    "gurcharan das",
    "gurucharan singh gandhi",
    "haruki murakami",
    "heo tae-yeon",
    "hiro arikawa",
    "hisashi kashiwai",
    "homer",
    "héctor garcía",
    "héctor garcía & francesc miralles",
    "intizar husain",
    "j.l. shastri",
    "james clear",
    "james patterson",
    "jan knappert",
    "jayanta g. borpujari",
    "jayanta gopal borpujari",
    "jeet thayil",
    "jeffrey archer",
    "jerry pinto",
    "john green",
    "john grisham",
    "john keay",
    "john marrs",
    "john steinbeck",
    "kahlil gibran",
    "kalki krishnamurthy",
    "kazuo ishiguro",
    "keigo higashino",
    "ken liu",
    "kenji ueda",
    "kevin missal",
    "khaled hosseini",
    "khushwant singh",
    "kiran nagarkar",
    "krishan chander",
    "krishnamurthy shrikanth",
    "kushagra singh",
    "lucas rijneveld",
    "mainak dhar",
    "manav kaul",
    "manoj phulambrikar",
    "manu joseph",
    "mark lawrence",
    "mark tully",
    "markus zusak",
    "matt haig",
    "matthew reilly",
    "merriam",
    "michael bar-zohar",
    "mitch albom",
    "neel mukherjee",
    "nick bradley",
    "nick mccarty",
    "nimit oza",
    "nishith s. parikh",
    "nitish bhushan",
    "novoneel chakraborty",
    "novoneel chakravorty",
    "ocean vuong",
    "paramahansa yogananda",
    "paulo coelho",
    "perumal murugan",
    "peter swanson",
    "pierce brown",
    "pranay bhalerao",
    "pravin agarawal",
    "r.c. majumdar",
    "r.k. narayan",
    "raj kamal jha",
    "rajessh m iyer",
    "rajinder singh bedi",
    "raman sharma",
    "ramesh menon",
    "ravi shankar etteth",
    "ravi subramanian",
    "razi",
    "rishi shrivastava",
    "robert crais",
    "robin sharma",
    "rohan kailasam",
    "rohinton mistry",
    "rumi",
    "rupeen popat",
    "ruskin bond",
    "s. deepanshu",
    "saadat hasan manto",
    "saikat majumdar",
    "saksham garg",
    "sam ripley",
    "samar",
    "sandeep sharma",
    "sankar",
    "satoshi yagisawa",
    "satyam srivastava",
    "satyarth nayak",
    "saugata chakraborty",
    "seo dong-won",
    "shabir ahmad mir",
    "shankar",
    "shatrujeet nath",
    "shiv aroor",
    "shivaji sawant",
    "shreyas bhave",
    "shubha vilas",
    "sidney sheldon",
    "sohil makwana",
    "sri m.",
    "steven j. rosen",
    "sujay",
    "swami chinmayananda",
    "swami satchidananda",
    "swami sivananda",
    "swami vivekananda",
    "swapnil pandey",
    "swarnendu bhushan",
    "t. j. klune",
    "t.j. klune",
    "takashi hiraide",
    "takuya asakura",
    "taylor adams",
    "toshikazu kawaguchi",
    "v. e. schwab",
    "valmiki",
    "vamshi krishna",
    "vimkesh kanti verma",
    "vineet bajpai",
    "vivek dutta mishra",
    "vivek shanbhag",
    "wilbur smith",
    "wilkie collins",
    "william dalrymple",
    "yashpal",
    "you yeong-gwang",
    "yuta takahashi",
    "yuval noah harari",
}

FEMALE_FIRST = {
    "aanchal", "abby", "aditi", "adrienne", "aishwarya", "alexandra", "alice", "alison",
    "alix", "alka", "amrita", "amy", "angeline", "anita", "ann", "annie", "anuja",
    "anuradha", "aparna", "arundhati", "asako", "ashley", "attia", "audrey", "axie",
    "balli", "bapsi", "barbara", "becky", "bell", "bonnie", "bora", "bulbul", "cara",
    "carissa", "carol", "carole", "catherine", "catriona", "cay", "cecile", "chelsea",
    "cheon", "chitra", "claire", "clare", "coco", "colleen", "costanza", "danielle",
    "daphne", "debanjana", "deborah", "deepa", "deepanjana", "delia", "dena", "diane",
    "diya", "dolly", "donna", "elena", "elif", "emily", "ema", "etaf", "evie", "fiona",
    "fonda", "freida", "gabrielle", "gail", "genevieve", "gillian", "githa", "glendy",
    "han", "hannah", "hanya", "harini", "heather", "helene", "hiyoko", "holly",
    "homeira", "hwang", "indira", "indu", "ira", "irawati", "isabel", "ismat",
    "jacqueline", "jane", "jennifer", "jessica", "jessie", "jhumpa", "jodi", "jojo",
    "joss", "kate", "katy", "kavita", "kerry", "kiersten", "kiran", "konda", "koral",
    "kristin", "kritika", "kylie", "laura", "lauren", "laurie", "leah", "leigh",
    "lesley", "lily", "lisa", "lori", "luna", "lynn", "madeline", "madhavi", "madhuri",
    "maggie", "mai", "maile", "manju", "margaret", "marion", "marjan", "mary", "meg",
    "megan", "megha", "melissa", "michelle", "michiko", "mieko", "min", "miye",
    "monica", "monika", "nadia", "namita", "nanako", "natalie", "natasha", "neelima",
    "nicola", "nidhi", "nikita", "nitya", "pat", "paula", "poppy", "pratibha", "preeti",
    "priyanka", "rachel", "rashna", "rebecca", "rita", "romila", "roshani", "rosie",
    "saara", "saiswaroopa", "sally", "samantha", "sammar", "sanaka", "sanjana",
    "sanskriti", "sara", "sarah", "savita", "sayaka", "shannon", "shashi", "shauna",
    "shelby", "shelley", "shilpi", "shraddha", "shravya", "shubhangi", "shubhi",
    "sirjandeep", "sonoko", "sophie", "srishti", "stephanie", "sudha", "sue", "sujata",
    "suman", "supriya", "susanna", "suzanne", "swati", "sylvia", "syou", "tami",
    "tanushree", "tilly", "tracy", "tripti", "tulika", "vaishnavi", "virginia",
    "volga", "yeon", "yoko", "zoulfa", "manini", "samhita", "kira",
}


def norm_author(a: str) -> str:
    return re.sub(r"\s+", " ", (a or "").strip().lower())


def load_women_authors() -> set[str]:
    path = EDITORIAL / "women-authors.txt"
    out: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        out.add(norm_author(line))
    return out


def split_multi(val: str) -> list[str]:
    if not val or not str(val).strip():
        return []
    out, seen = [], set()
    for p in re.split(r"[;|,]", str(val)):
        t = re.sub(r"\s+", " ", p).strip()
        if not t:
            continue
        k = t.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(t)
    return out


def join_multi(vals: list[str]) -> str:
    return "; ".join(vals)


def is_woman_author(author: str, women: set[str]) -> bool | None:
    key = norm_author(author)
    if not key:
        return None
    if key in MALE_AUTHORS:
        return False
    if key in women:
        return True
    first_tok = key.split(" ")[0]
    # Initials / single-letter first names: require explicit list
    if len(first_tok.rstrip(".")) <= 2 or "." in first_tok:
        return None
    if first_tok in FEMALE_FIRST:
        return True
    return None


def content_flags(row: dict) -> dict[str, bool]:
    blob = " ".join(
        [
            row.get("Title") or "",
            row.get("Genres") or "",
            row.get("Themes") or "",
            row.get("Moods") or "",
            row.get("Tropes") or "",
            row.get("Tags") or "",
            row.get("Seasonal") or "",
            row.get("Collections") or "",
            row.get("One-line recommendation") or "",
        ]
    ).lower()

    about = any(
        x in blob
        for x in (
            "women's fiction",
            "women’s fiction",
            "about women",
            "women-centric",
            "woman-centric",
            "female protagonist",
            "strong female",
            "mother-daughter",
            "motherhood",
            "girlhood",
            "women's lives",
            "feminist",
            "patriarchy",
            "women's history",
            "international women's",
            "women's rights",
            "women's voices",
            "women's stories",
            "sisterhood",
            "girl boss",
            "female perspective",
            "female empowerment",
            "women in stem",
            "women of epics",
            "women in mythology",
        )
    )
    about = about or any(
        x in blob
        for x in (
            "draupadi",
            "sita",
            "kunti",
            "gandhari",
            "mandodari",
            "radha",
            "satyavati",
            "shabari",
            "cleopatra",
            "persephone",
            "circe",
            "medusa",
            "penelope",
        )
    )

    genres_l = (row.get("Genres") or "").lower()
    for_women = about or any(
        x in genres_l
        for x in (
            "women's fiction",
            "women’s fiction",
            "romance",
            "romantasy",
            "romantic comedy",
        )
    ) or any(
        x in blob
        for x in (
            "for women",
            "women readers",
        )
    )
    return {"about": about, "for_women": for_women}


def tag_row(row: dict, women: set[str]) -> dict:
    out = dict(row)
    woman = is_woman_author(out.get("Author") or "", women)

    WOMEN_TAGS = {
        "written-by-women",
        "female-author",
        "about-women",
        "women-centric",
        "for-women-readers",
    }
    WOMEN_COLS = {
        "women writers",
        "women-centric reads",
        "for women readers",
        "indian women writers",
    }

    # Clear previous women shelves before scoring content (avoid sticky re-tag loops).
    tags = [t for t in split_multi(out.get("Tags") or "") if t.lower() not in WOMEN_TAGS]
    cols = [c for c in split_multi(out.get("Collections") or "") if c.lower() not in WOMEN_COLS]
    out["Tags"] = join_multi(tags)
    out["Collections"] = join_multi(cols)

    flags = content_flags(out)
    tag_set = {t.lower() for t in tags}
    col_set = {c.lower() for c in cols}

    def add_tag(t: str) -> None:
        if t.lower() not in tag_set:
            tags.append(t)
            tag_set.add(t.lower())

    def add_col(c: str) -> None:
        if c.lower() not in col_set:
            cols.append(c)
            col_set.add(c.lower())

    if woman is True:
        add_tag("written-by-women")
        add_tag("female-author")
        add_col("Women Writers")
        country = (out.get("Country") or "").lower()
        blob = " ".join(
            [
                out.get("Tags") or "",
                out.get("Genres") or "",
                out.get("Themes") or "",
                out.get("Collections") or "",
                country,
            ]
        ).lower()
        if country == "india" or "indian" in blob or "india bookshelf" in blob:
            add_col("Indian Women Writers")

    if flags["about"]:
        add_tag("about-women")
        add_tag("women-centric")
        add_col("Women-Centric Reads")

    genres = (out.get("Genres") or "").lower()
    themes = (out.get("Themes") or "").lower()
    # "For women" = women's fiction / romance energy, or clearly about-women shelf —
    # not every book by a woman author.
    if flags["for_women"] or (
        woman is True
        and any(
            x in genres
            for x in ("romance", "women's fiction", "romantasy", "young adult")
        )
    ):
        add_tag("for-women-readers")
        add_col("For Women Readers")

    if woman is True and any(
        x in genres + themes
        for x in ("mother", "daughter", "wife", "widow", "girl", "queen", "feminist", "identity")
    ):
        add_tag("about-women")
        add_tag("women-centric")
        add_col("Women-Centric Reads")

    out["Tags"] = join_multi(tags)
    out["Collections"] = join_multi(cols)
    return out


IMPORT_HEADERS = [
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


def main() -> None:
    women = load_women_authors()
    inp = ROOT / "library-books-editorial-v2.csv"
    rows_in = list(csv.DictReader(inp.open(encoding="utf-8-sig")))
    fields = list(rows_in[0].keys())
    rows = [tag_row(r, women) for r in rows_in]

    with inp.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    # Preserve Format / Location / Series Number from previous import file when present.
    prev_path = ROOT / "library-books-editorial-v2-import.csv"
    prev_by_key: dict[str, dict] = {}
    if prev_path.exists():
        for r in csv.DictReader(prev_path.open(encoding="utf-8-sig")):
            key = f"{norm_author(r.get('Title') or '')}|{norm_author(r.get('Author') or '')}"
            prev_by_key[key] = r

    with prev_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=IMPORT_HEADERS)
        w.writeheader()
        for r in rows:
            key = f"{norm_author(r.get('Title') or '')}|{norm_author(r.get('Author') or '')}"
            prev = prev_by_key.get(key, {})
            row = {}
            for h in IMPORT_HEADERS:
                if h in r and (r.get(h) or "").strip():
                    row[h] = r.get(h, "")
                else:
                    row[h] = prev.get(h, "") if h in prev else r.get(h, "")
            w.writerow(row)

    def has(col: str, needle: str) -> int:
        return sum(1 for r in rows if needle.lower() in (r.get(col) or "").lower())

    unknown = []
    for r in rows:
        w = is_woman_author(r.get("Author") or "", women)
        if w is None:
            unknown.append(r.get("Author") or "")
    unknown_u = sorted(set(unknown))

    print(f"Tagged {len(rows)} books ({len(women)} known women authors)")
    print(f"  Women Writers collection: {has('Collections', 'Women Writers')}")
    print(f"  Women-Centric Reads: {has('Collections', 'Women-Centric Reads')}")
    print(f"  For Women Readers: {has('Collections', 'For Women Readers')}")
    print(f"  Indian Women Writers: {has('Collections', 'Indian Women Writers')}")
    print(f"  tag written-by-women: {has('Tags', 'written-by-women')}")
    print(f"  tag about-women: {has('Tags', 'about-women')}")
    print(f"  tag for-women-readers: {has('Tags', 'for-women-readers')}")
    print(f"  tag female-author: {has('Tags', 'female-author')}")
    print(f"  authors still gender-unknown: {len(unknown_u)}")
    if unknown_u[:25]:
        print("  sample unknown:", "; ".join(unknown_u[:25]))


if __name__ == "__main__":
    main()
