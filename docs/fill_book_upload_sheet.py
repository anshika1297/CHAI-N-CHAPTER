#!/usr/bin/env python3
"""Fill missing Library OS fields for the latest docs/book upload sheet.xlsx"""
from __future__ import annotations

from pathlib import Path
import csv
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / ".tmp_py"))
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "book upload sheet.xlsx"
OUT_XLSX = ROOT / "docs" / "book-upload-sheet-filled.xlsx"
OUT_CSV = ROOT / "docs" / "book-upload-sheet-filled.csv"

COLS = [
    "Title", "Author", "Subtitle", "ISBN", "Status", "Rating", "Pages", "Publisher",
    "Series", "Series Number", "Country", "Language", "Ownership", "Format", "Location",
    "Genres", "Subgenres", "Themes", "Tropes", "Moods", "Tags", "Seasonal", "Collections",
    "One-line recommendation", "Confidence", "Why I recommend it", "Personal notes",
    "Finished", "Added",
]
IDX = {h: i for i, h in enumerate(COLS)}
NOTE = "Auto-filled for Library OS; verify ISBN/pages/publisher before publishing."


def norm(s: object) -> str:
    return " ".join(str(s or "").lower().split())


def key(title: object, author: object) -> str:
    return f"{norm(title)}|{norm(author)}"


def e(**kw: str) -> dict[str, str]:
    kw.setdefault("Personal notes", NOTE)
    kw.setdefault("Status", "want-to-read")
    kw.setdefault("Format", "paperback")
    kw.setdefault("Language", "English")
    return kw


FILL: dict[str, dict[str, str]] = {}


def put(title: str, author: str, **kw: str) -> None:
    FILL[key(title, author)] = e(**kw)


# --- Row data (match ORIGINAL sheet title|author) ---
put(
    "As long as the lemon trees grow", "Zoulfa katouh",
    Title="As Long as the Lemon Trees Grow", Author="Zoulfa Katouh",
    Country="Syria", Publisher="Bloomsbury YA",
    Genres="Young Adult; Contemporary Fiction", Subgenres="War Fiction; Own Voices",
    Themes="War; Hope; Survival; Love", Moods="Heartbreaking; Urgent; Hopeful",
    Tags="Syria; YA; Revolution",
    **{"One-line recommendation": "A Syrian YA novel of war, pharmacy shifts, and stubborn hope.", "Confidence": "high"},
)
put(
    "The Nightangle", "kristin hannah",
    Title="The Nightingale", Author="Kristin Hannah",
    Country="United States", Publisher="St. Martin's Press", ISBN="9780312576493", Pages="440",
    Genres="Historical Fiction", Subgenres="WWII Fiction; Sister Saga",
    Themes="War; Sisterhood; Resistance; Sacrifice", Moods="Epic; Emotional; Devastating",
    Tags="WWII; France; Kristin Hannah",
    **{"One-line recommendation": "Two sisters in occupied France — courage in different keys.", "Confidence": "high",
       "Personal notes": "Corrected title spelling Nightingale. " + NOTE},
)
put(
    "six of crows", "leigh bardugo",
    Title="Six of Crows", Author="Leigh Bardugo",
    Country="United States", Publisher="Henry Holt", ISBN="9781627792127",
    Series="Six of Crows", **{"Series Number": "1"},
    Genres="Young Adult; Fantasy", Subgenres="Heist Fantasy; Grishaverse",
    Themes="Found Family; Crime; Loyalty", Moods="Clever; Dark; Propulsive",
    Tags="Grishaverse; Heist; YA fantasy",
    **{"One-line recommendation": "A deadly heist crew, impossible odds, unforgettable banter.", "Confidence": "high"},
)
put(
    "the seven husabands of evelyn hugo", "taylor jenkins reid",
    Title="The Seven Husbands of Evelyn Hugo", Author="Taylor Jenkins Reid",
    Country="United States", Publisher="Atria Books", ISBN="9781501139239",
    Genres="Historical Fiction; Contemporary Fiction", Subgenres="Hollywood Fiction; LGBTQ+",
    Themes="Fame; Love; Ambition; Identity", Moods="Glamorous; Addictive; Emotional",
    Tags="Hollywood; TJR; Queer romance",
    **{"One-line recommendation": "A screen siren’s confessions — husbands, secrets, and one true love story.", "Confidence": "high",
       "Personal notes": "Corrected title spelling. " + NOTE},
)
put(
    "the invisible life of addie larue", "V.E. Schwab",
    Title="The Invisible Life of Addie LaRue", Author="V. E. Schwab",
    Country="United States", Publisher="Tor Books", ISBN="9780765387561",
    Genres="Fantasy; Literary Fiction", Subgenres="Historical Fantasy; Deal-with-the-Devil",
    Themes="Memory; Freedom; Loneliness; Art", Moods="Lyrical; Romantic; Bittersweet",
    Tags="Immortality; V.E. Schwab",
    **{"One-line recommendation": "Cursed to be forgotten — until someone finally remembers her name.", "Confidence": "high"},
)
put(
    "my friends", "fredrik backman",
    Title="My Friends", Author="Fredrik Backman",
    Country="Sweden", Publisher="Atria Books",
    Genres="Literary Fiction; Contemporary Fiction", Subgenres="Coming of Age",
    Themes="Friendship; Art; Belonging; Grief", Moods="Tender; Witty; Heartfelt",
    Tags="Backman; Friendship; Art",
    **{"One-line recommendation": "Backman on friendship, art, and the people who save us.", "Confidence": "high"},
)
put(
    "the giver of stars", "jojo moyes",
    Title="The Giver of Stars", Author="Jojo Moyes",
    Country="United Kingdom", Publisher="Penguin", ISBN="9780399562488",
    Genres="Historical Fiction", Subgenres="Sisterhood Fiction; Americana",
    Themes="Friendship; Freedom; Books; Women", Moods="Warm; Inspiring; Romantic",
    Tags="Packhorse librarians; Friendship; Kentucky",
    **{"One-line recommendation": "Packhorse librarians in Depression-era Kentucky — friendship on horseback.", "Confidence": "high"},
)
put(
    "pachinko", "min jin lee",
    Title="Pachinko", Author="Min Jin Lee",
    Country="South Korea", Publisher="Grand Central", ISBN="9781455563920", Pages="496",
    Genres="Historical Fiction; Literary Fiction", Subgenres="Family Saga; Korean Diaspora",
    Themes="Family; Belonging; Survival; Identity", Moods="Epic; Intimate; Unforgettable",
    Tags="Korea; Japan; Family saga; Complex families",
    **{"One-line recommendation": "Four generations of a Korean family carving a life in Japan.", "Confidence": "high"},
)
put(
    "a woman is no man", "etaf rum",
    Title="A Woman Is No Man", Author="Etaf Rum",
    Country="Palestine", Publisher="Harper", ISBN="9780062699763",
    Genres="Literary Fiction; Contemporary Fiction", Subgenres="Own Voices; Family Saga",
    Themes="Patriarchy; Silence; Motherhood; Freedom", Moods="Urgent; Heartbreaking; Powerful",
    Tags="Palestinian American; Complex families",
    **{"One-line recommendation": "Three generations of Palestinian American women breaking (and keeping) silence.", "Confidence": "high"},
)
put(
    "land", "maggie o'FARRELL",
    Title="Hamnet", Author="Maggie O'Farrell",
    Country="United Kingdom", Publisher="Tinder Press", ISBN="9781472223791",
    Genres="Historical Fiction; Literary Fiction", Subgenres="Shakespeare-adjacent; Family Drama",
    Themes="Grief; Family; Marriage; Art", Moods="Luminous; Devastating; Intimate",
    Tags="Complex families; Maggie O'Farrell; Grief",
    **{"One-line recommendation": "A family’s grief in plague-era England — and the making of a play.", "Confidence": "low",
       "Personal notes": "Sheet title was “land”; mapped to Hamnet (O’Farrell’s major family/grief novel). Confirm if you meant another title. " + NOTE},
)
put(
    "INTERMEZZO", "sally rooney",
    Title="Intermezzo", Author="Sally Rooney",
    Country="Ireland", Publisher="Faber & Faber",
    Genres="Literary Fiction; Contemporary Fiction", Subgenres="Irish Fiction",
    Themes="Grief; Brothers; Love; Intimacy", Moods="Precise; Tender; Cerebral",
    Tags="Sally Rooney; Grief & loss; Ireland",
    **{"One-line recommendation": "Two brothers after a father’s death — Rooney on love and grief.", "Confidence": "high"},
)
put(
    "wandering souls", "cecile pin",
    Title="Wandering Souls", Author="Cecile Pin",
    Country="Vietnam", Publisher="Henry Holt",
    Genres="Literary Fiction; Historical Fiction", Subgenres="Refugee Narrative; Diaspora",
    Themes="Grief; Displacement; Family; Memory", Moods="Lyrical; Haunting; Tender",
    Tags="Vietnam; Refugees; Grief & loss",
    **{"One-line recommendation": "A Vietnamese family’s escape — and the sibling left between worlds.", "Confidence": "high"},
)
put(
    "crying in H mart", "michelle zauner",
    Title="Crying in H Mart", Author="Michelle Zauner",
    Country="United States", Publisher="Knopf", ISBN="9780525657743",
    Genres="Memoir; Nonfiction", Subgenres="Grief Memoir; Food Memoir",
    Themes="Grief; Motherhood; Identity; Food", Moods="Raw; Tender; Mouthwatering",
    Tags="Korean American; Grief & loss; H Mart",
    **{"One-line recommendation": "A daughter’s grief told through Korean food and memory.", "Confidence": "high"},
)
put(
    "blue sisters", "coco mellors",
    Title="Blue Sisters", Author="Coco Mellors",
    Country="United Kingdom", Publisher="Fourth Estate",
    Genres="Literary Fiction; Contemporary Fiction", Subgenres="Sister Saga",
    Themes="Grief; Sisterhood; Addiction; Family", Moods="Sharp; Emotional; Stylish",
    Tags="Sisters; Grief & loss",
    **{"One-line recommendation": "Three sisters reunite after loss — messy, glamorous, devastating.", "Confidence": "high"},
)
put(
    "its different this time", "joss richard",
    Title="It's Different This Time", Author="Joss Richards",
    Country="United Kingdom",
    Genres="Contemporary Fiction; Romance", Subgenres="Women's Fiction",
    Themes="Love; Second Chances; Selfhood", Moods="Warm; Reflective",
    Tags="Romance; Contemporary",
    **{"One-line recommendation": "A contemporary love story — confirm exact UK edition details.", "Confidence": "low",
       "Personal notes": "Author/title lightly normalized; verify bibliographic details. " + NOTE},
)
put(
    "the road to tender hearts", "annie hartnett",
    Title="The Road to Tender Hearts", Author="Annie Hartnett",
    Country="United States",
    Genres="Contemporary Fiction; Literary Fiction", Subgenres="Road Novel; Family Fiction",
    Themes="Family; Healing; Journeys", Moods="Warm; Quirky; Heartfelt",
    Tags="Family; Road trip",
    **{"One-line recommendation": "A tender, offbeat journey toward family and home.", "Confidence": "medium"},
)
put(
    "heart the lover", "lily king",
    Title="Heart the Lover", Author="Lily King",
    Country="United States", Publisher="Grove Press",
    Genres="Literary Fiction; Contemporary Fiction",
    Themes="Love; Ambition; Memory", Moods="Intimate; Sharp; Romantic",
    Tags="Lily King; Campus; Love",
    **{"One-line recommendation": "Lily King on desire, intellect, and the loves that shape us.", "Confidence": "medium"},
)
put(
    "great bbig beautiful life", "emily henry",
    Title="Great Big Beautiful Life", Author="Emily Henry",
    Country="United States", Publisher="Berkley",
    Genres="Romance; Contemporary Fiction", Subgenres="Romantic Comedy",
    Themes="Love; Storytelling; Ambition", Moods="Witty; Warm; Swoony",
    Tags="Emily Henry; Romance",
    **{"One-line recommendation": "Henry’s signature spark — rivals, secrets, and a great big feeling.", "Confidence": "high",
       "Personal notes": "Corrected title spelling. " + NOTE},
)
put(
    "the bright years", "sarah damoff",
    Title="The Bright Years", Author="Sarah Damoff",
    Country="United States",
    Genres="Literary Fiction; Contemporary Fiction", Subgenres="Family Saga",
    Themes="Family; Time; Love", Moods="Luminous; Emotional",
    Tags="Family; Contemporary",
    **{"One-line recommendation": "A family across years of light and fracture — confirm edition.", "Confidence": "medium"},
)
put(
    "the correspondent ", "virginia evans",
    Title="The Correspondent", Author="Virginia Evans",
    Country="United States",
    Genres="Literary Fiction; Contemporary Fiction",
    Themes="Connection; Aging; Letters", Moods="Tender; Reflective",
    Tags="Letters; Friendship",
    **{"One-line recommendation": "A life told in letters — quiet, human, unexpectedly gripping.", "Confidence": "medium"},
)
put(
    "the covenant of water", "Abraham verghese",
    Title="The Covenant of Water", Author="Abraham Verghese",
    Country="India", Publisher="Grove Press", ISBN="9780802162175", Pages="724",
    Genres="Historical Fiction; Literary Fiction", Subgenres="Family Saga; Indian Fiction",
    Themes="Family; Medicine; Faith; Water", Moods="Epic; Lush; Moving",
    Tags="Kerala; Family saga; Verghese", Location="India",
    **{"One-line recommendation": "Three generations in Kerala — medicine, mystery, and a family curse of water.", "Confidence": "high"},
)
put(
    "not quite dead yet", "holly jackson",
    Title="Not Quite Dead Yet", Author="Holly Jackson",
    Country="United Kingdom", Publisher="Electric Monkey",
    Genres="Young Adult; Mystery", Subgenres="Thriller; Crime",
    Themes="Mortality; Truth; Friendship", Moods="Twisty; Urgent; Clever",
    Tags="Holly Jackson; YA thriller",
    **{"One-line recommendation": "A dying detective races the clock to solve her own murder.", "Confidence": "high"},
)
put(
    "project hail mary", "andy weir",
    Title="Project Hail Mary", Author="Andy Weir",
    Country="United States", Publisher="Ballantine", ISBN="9780593135204", Pages="476",
    Genres="Science Fiction", Subgenres="Hard SF; Space Adventure",
    Themes="Survival; Science; Friendship", Moods="Funny; Thrilling; Heartfelt",
    Tags="Space; Andy Weir; First contact",
    **{"One-line recommendation": "A lone astronaut, impossible science, and the best buddy in the galaxy.", "Confidence": "high"},
)
put(
    "the seven year slip", "ashley poston",
    Title="The Seven Year Slip", Author="Ashley Poston",
    Country="United States", Publisher="Berkley", ISBN="9780593336496",
    Genres="Romance; Fantasy", Subgenres="Time-Travel Romance; Magical Realism",
    Themes="Grief; Love; Timing", Moods="Swoony; Bittersweet; Cozy",
    Tags="Time travel; Romance; NYC apartment",
    **{"One-line recommendation": "An apartment that slips through time — and a love that shouldn’t be possible.", "Confidence": "high"},
)
put(
    "our infinite fates", "laura steven",
    Title="Our Infinite Fates", Author="Laura Steven",
    Country="United Kingdom", Publisher="Penguin",
    Genres="Young Adult; Fantasy", Subgenres="Reincarnation Romance",
    Themes="Fate; Love; Death; Choice", Moods="Romantic; Epic; Emotional",
    Tags="YA fantasy; Reincarnation",
    **{"One-line recommendation": "Lovers reborn across lifetimes — until one final fate.", "Confidence": "high"},
)
put(
    "so thrilled for you", "holly bourne",
    Title="So Thrilled for You", Author="Holly Bourne",
    Country="United Kingdom", Publisher="Hodder",
    Genres="Contemporary Fiction; Women's Fiction", Subgenres="Friendship Fiction",
    Themes="Friendship; Motherhood; Ambition; Eldest Daughters", Moods="Sharp; Funny; Honest",
    Tags="Eldest daughters; Friendship; Holly Bourne",
    Tropes="Eldest daughters",
    **{"One-line recommendation": "Friendship under pressure — babies, ambition, and biting honesty.", "Confidence": "high"},
)
put(
    "conversations on love", "natasha lunn",
    Title="Conversations on Love", Author="Natasha Lunn",
    Country="United Kingdom", Publisher="Viking",
    Genres="Nonfiction; Essays", Subgenres="Interviews; Relationships",
    Themes="Love; Friendship; Self; Eldest Daughters", Moods="Thoughtful; Intimate; Wise",
    Tags="Eldest daughters; Love; Essays",
    Tropes="Eldest daughters",
    **{"One-line recommendation": "Interviews that expand what love can mean — romantic and otherwise.", "Confidence": "high"},
)
put(
    "everything i know about love", "dolly alderton",
    Title="Everything I Know About Love", Author="Dolly Alderton",
    Country="United Kingdom", Publisher="Fig Tree", ISBN="9780241982105",
    Genres="Memoir; Nonfiction", Subgenres="Coming of Age; Friendship Memoir",
    Themes="Friendship; Dating; Growing Up; Eldest Daughters", Moods="Funny; Vulnerable; Warm",
    Tags="Eldest daughters; Dolly Alderton; Millennial memoir",
    Tropes="Eldest daughters",
    **{"One-line recommendation": "Friendship, hangovers, and growing up in public — with heart.", "Confidence": "high"},
)
put(
    "salt water", "jessica andrews",
    Title="Saltwater", Author="Jessica Andrews",
    Country="United Kingdom", Publisher="Sceptre",
    Genres="Literary Fiction; Contemporary Fiction", Subgenres="Coming of Age",
    Themes="Class; Motherhood; Body; Eldest Daughters", Moods="Lyrical; Raw; Coastal",
    Tags="Eldest daughters; North East England",
    Tropes="Eldest daughters",
    **{"One-line recommendation": "A young woman between London and the North — body, class, becoming.", "Confidence": "high",
       "Personal notes": "Standard title spelling Saltwater. " + NOTE},
)
put(
    "really good actually", "monica heisey",
    Title="Really Good, Actually", Author="Monica Heisey",
    Country="Canada", Publisher="HarperAvenue",
    Genres="Contemporary Fiction; Comedy", Subgenres="Divorce Novel; Millennial Fiction",
    Themes="Divorce; Friendship; Reinvention; Eldest Daughters", Moods="Hilarious; Sharp; Tender",
    Tags="Eldest daughters; Divorce; Monica Heisey",
    Tropes="Eldest daughters",
    **{"One-line recommendation": "A millennial divorce comedy that is actually really good.", "Confidence": "high"},
)
put(
    "all about love", "bell hooks",
    Title="All About Love", Author="bell hooks",
    Subtitle="New Visions",
    Country="United States", Publisher="William Morrow", ISBN="9780060959470",
    Genres="Nonfiction; Essays", Subgenres="Cultural Criticism; Feminist Theory",
    Themes="Love; Community; Justice; Eldest Daughters", Moods="Clear; Radical; Nurturing",
    Tags="Eldest daughters; bell hooks; Love as practice",
    Tropes="Eldest daughters",
    **{"One-line recommendation": "Love as a verb, a practice, and a politics — essential hooks.", "Confidence": "high"},
)
put(
    "city opf djinns", "william dalrymple",
    Title="City of Djinns", Author="William Dalrymple",
    Country="India", Publisher="Penguin India", Location="India",
    Genres="Nonfiction; Travel; History", Subgenres="Delhi History; Narrative Nonfiction",
    Themes="City; Memory; Empire; Faith", Moods="Witty; Atmospheric; Learned",
    Tags="India more than history books; Delhi; Dalrymple",
    **{"One-line recommendation": "Delhi’s ghosts, djinns, and layered past — history that reads like gossip.", "Confidence": "high",
       "Personal notes": "Corrected title spelling. " + NOTE},
)
put(
    "no full stops in india", "mark tully",
    Title="No Full Stops in India", Author="Mark Tully",
    Country="India", Publisher="Penguin India", Location="India",
    Genres="Nonfiction; Essays", Subgenres="India Reportage; Cultural Commentary",
    Themes="Democracy; Faith; Everyday India", Moods="Observant; Humane; Clear",
    Tags="India more than history books; Mark Tully",
    **{"One-line recommendation": "India without easy endings — Tully’s classic essays from the ground.", "Confidence": "high"},
)
put(
    "pyre", "perumal murugan",
    Title="Pyre", Author="Perumal Murugan",
    Country="India", Publisher="Penguin India", Location="India",
    Genres="Literary Fiction; Indian Literature", Subgenres="Tamil Fiction in Translation",
    Themes="Caste; Love; Violence; Belonging", Moods="Tense; Tragic; Urgent",
    Tags="India more than history books; Tamil literature",
    **{"One-line recommendation": "A love marriage meets caste hatred in a Tamil village — spare and devastating.", "Confidence": "high"},
)
put(
    "A flight of pigeons", "Ruskin bond",
    Title="A Flight of Pigeons", Author="Ruskin Bond",
    Country="India", Publisher="Penguin India", Location="India",
    Genres="Historical Fiction; Novella", Subgenres="Indian Historical; 1857",
    Themes="War; Captivity; Humanity", Moods="Gentle; Tense; Humane",
    Tags="India more than history books; Ruskin Bond; 1857",
    **{"One-line recommendation": "1857 through a young woman’s captivity — Bond at his most historical.", "Confidence": "high"},
)
put(
    "kingdom of Ash", "sarah J. Maas",
    Title="Kingdom of Ash", Author="Sarah J. Maas",
    Country="United States", Publisher="Bloomsbury",
    Series="Throne of Glass", **{"Series Number": "7"},
    Genres="Young Adult; Fantasy", Subgenres="Epic Fantasy; Romantasy",
    Themes="War; Love; Sacrifice; Power", Moods="Epic; Emotional; Intense",
    Tags="Fall in love with reading; Throne of Glass; SJM",
    **{"One-line recommendation": "The Throne of Glass finale — kingdoms, found family, and fire.", "Confidence": "high"},
)
put(
    "one dark window", "Rachel gillig",
    Title="One Dark Window", Author="Rachel Gillig",
    Country="United States", Publisher="Orbit", ISBN="9780316312486",
    Series="The Shepherd King", **{"Series Number": "1"},
    Genres="Fantasy; Romance", Subgenres="Gothic Fantasy; Romantasy",
    Themes="Curses; Power; Trust", Moods="Atmospheric; Dark; Romantic",
    Tags="Fall in love with reading; Books that deserve the hype; Gothic fantasy",
    **{"One-line recommendation": "A cursed maiden, a highwayman, and magic that exacts a price.", "Confidence": "high"},
)
put(
    "Almond", "won-pyung sohn",
    Title="Almond", Author="Won-Pyung Sohn",
    Country="South Korea", Publisher="HarperVia", ISBN="9780062961372",
    Genres="Literary Fiction; Young Adult", Subgenres="Korean Fiction; Coming of Age",
    Themes="Empathy; Friendship; Trauma", Moods="Spare; Moving; Clear",
    Tags="Fall in love with reading; Korea; Empathy", Location="Korea",
    **{"One-line recommendation": "A boy who can’t feel fear learns the world through friendship.", "Confidence": "high"},
)
put(
    "promise me sunshine", "cara bastone",
    Title="Promise Me Sunshine", Author="Cara Bastone",
    Country="United States", Publisher="Dial Press",
    Genres="Romance; Contemporary Fiction", Subgenres="Romantic Comedy",
    Themes="Grief; Friendship; Love", Moods="Warm; Funny; Healing",
    Tags="Fall in love with reading; Cara Bastone; Romance",
    **{"One-line recommendation": "Grief, found friendship, and a romance that feels like sunshine.", "Confidence": "high"},
)
put(
    "the house in the cerrulean sea", "TJ Klune",
    Title="The House in the Cerulean Sea", Author="T. J. Klune",
    Country="United States", Publisher="Tor", ISBN="9781250217288",
    Genres="Fantasy; Romance", Subgenres="Feel-good Fantasy; LGBTQ+",
    Themes="Found Family; Kindness; Belonging", Moods="Cozy; Whimsical; Healing",
    Tags="Books that feel therapy; Found family; TJ Klune",
    **{"One-line recommendation": "A magical orphanage, a by-the-book caseworker, and radical kindness.", "Confidence": "high",
       "Personal notes": "Corrected Cerulean spelling. " + NOTE},
)
put(
    "A psalm for the wild-built", "becky chambers",
    Title="A Psalm for the Wild-Built", Author="Becky Chambers",
    Country="United States", Publisher="Tordotcom", ISBN="9781250236210",
    Series="Monk & Robot", **{"Series Number": "1"},
    Genres="Science Fiction", Subgenres="Hopepunk; Philosophical SF",
    Themes="Purpose; Rest; Nature; Care", Moods="Gentle; Wise; Restorative",
    Tags="Books that feel therapy; Monk & Robot; Hopepunk",
    **{"One-line recommendation": "A tea monk, a robot, and the question: what do humans need?", "Confidence": "high"},
)
put(
    "stori", "nimit oza",
    Title="Stori", Author="Nimit Oza",
    Country="India", Location="India",
    Genres="Indian Literature; Contemporary Fiction",
    Themes="Healing; Everyday Life; Stories", Moods="Reflective; Grounded",
    Tags="Books that feel therapy; India",
    **{"One-line recommendation": "Confirm edition — Indian contemporary fiction with a storyteller’s pulse.", "Confidence": "low"},
)
put(
    "ready or not", "cara bastone",
    Title="Ready or Not", Author="Cara Bastone",
    Country="United States", Publisher="Dial Press",
    Genres="Romance; Contemporary Fiction", Subgenres="Romantic Comedy",
    Themes="Friendship; Timing; Love", Moods="Warm; Funny; Swoony",
    Tags="Books that deserve the hype; Cara Bastone",
    **{"One-line recommendation": "Bastone’s signature cozy, character-first romance energy.", "Confidence": "high"},
)
put(
    "the serpent & the wings of night", "carissa broadbent",
    Title="The Serpent and the Wings of Night", Author="Carissa Broadbent",
    Country="United States", Publisher="Bramble",
    Series="Crowns of Nyaxia", **{"Series Number": "1"},
    Genres="Fantasy; Romance", Subgenres="Vampire Fantasy; Romantasy",
    Themes="Power; Survival; Love", Moods="Dark; Romantic; Addictive",
    Tags="Romantasy; Vampires; Crowns of Nyaxia",
    **{"One-line recommendation": "A human in a vampire tournament — blood, bargains, and slow-burn heat.", "Confidence": "high"},
)
put(
    "golden son", "pierce brown",
    Title="Golden Son", Author="Pierce Brown",
    Country="United States", Publisher="Del Rey", ISBN="9780345539823",
    Series="Red Rising", **{"Series Number": "2"},
    Genres="Science Fiction; Fantasy", Subgenres="Space Opera; Dystopia",
    Themes="Revolution; Loyalty; Ambition", Moods="Brutal; Epic; Propulsive",
    Tags="Red Rising; Pierce Brown",
    **{"One-line recommendation": "Red Rising book two — betrayal, war, and no safe ground.", "Confidence": "high"},
)
put(
    "two twisted crowns", "rachel gillig",
    Title="Two Twisted Crowns", Author="Rachel Gillig",
    Country="United States", Publisher="Orbit",
    Series="The Shepherd King", **{"Series Number": "2"},
    Genres="Fantasy; Romance", Subgenres="Gothic Fantasy; Romantasy",
    Themes="Curses; Sacrifice; Power", Moods="Dark; Atmospheric; Romantic",
    Tags="Shepherd King; Gothic fantasy",
    **{"One-line recommendation": "The Shepherd King duology closes in thorns, bargains, and twisted crowns.", "Confidence": "high"},
)
put(
    "the hunger games", "suzanne collins",
    Title="The Hunger Games", Author="Suzanne Collins",
    Country="United States", Publisher="Scholastic", ISBN="9780439023481",
    Series="The Hunger Games", **{"Series Number": "1"},
    Genres="Young Adult; Science Fiction", Subgenres="Dystopia; Survival",
    Themes="Oppression; Survival; Spectacle", Moods="Tense; Fierce; Unforgettable",
    Tags="Dystopia; YA classic",
    **{"One-line recommendation": "The arena that defined a generation of YA dystopia.", "Confidence": "high"},
)
put(
    "Atomsphere", "taylor jenkins reid",
    Title="Atmosphere", Author="Taylor Jenkins Reid",
    Country="United States", Publisher="Ballantine",
    Genres="Historical Fiction; Romance", Subgenres="Space Race Fiction; LGBTQ+",
    Themes="Ambition; Love; Space; Identity", Moods="Glowing; Romantic; Ambitious",
    Tags="TJR; NASA; Queer romance",
    **{"One-line recommendation": "Reid among the stars — love and ambition in the space program.", "Confidence": "high",
       "Personal notes": "Corrected title Atmosphere. " + NOTE},
)
put(
    "the bell jar", "sylvia plath",
    Title="The Bell Jar", Author="Sylvia Plath",
    Country="United States", Publisher="Harper", ISBN="9780060837020",
    Genres="Literary Fiction; Classics", Subgenres="Autobiographical Fiction",
    Themes="Mental Health; Identity; Womanhood", Moods="Sharp; Claustrophobic; Brilliant",
    Tags="Classics; Plath; Mental health",
    **{"One-line recommendation": "A young woman’s mind under glass — still piercing, still necessary.", "Confidence": "high"},
)
put(
    "the wedding people", "aLISM ESPACH",
    Title="The Wedding People", Author="Alison Espach",
    Country="United States", Publisher="Henry Holt",
    Genres="Literary Fiction; Contemporary Fiction", Subgenres="Dark Comedy",
    Themes="Grief; Reinvention; Connection", Moods="Funny; Moving; Unexpected",
    Tags="Wedding; Dark comedy; Alison Espach",
    **{"One-line recommendation": "A stranger at a wedding weekend — grief, farce, and unlikely grace.", "Confidence": "high",
       "Personal notes": "Corrected author name Alison Espach. " + NOTE},
)
put(
    "FIRE KEEPER'S DAUGHTER", "angeline boulley",
    Title="Firekeeper's Daughter", Author="Angeline Boulley",
    Country="United States", Publisher="Henry Holt", ISBN="9781250766564",
    Genres="Young Adult; Thriller", Subgenres="Own Voices; Mystery",
    Themes="Identity; Justice; Community", Moods="Tense; Powerful; Immersive",
    Tags="Ojibwe; YA thriller; Angeline Boulley",
    **{"One-line recommendation": "An Ojibwe teen, a murder investigation, and a fight for her people.", "Confidence": "high"},
)
put(
    "looking for jane", "heather marshall",
    Title="Looking for Jane", Author="Heather Marshall",
    Country="Canada", Publisher="Simon & Schuster",
    Genres="Historical Fiction", Subgenres="Feminist Historical; Multi-timeline",
    Themes="Abortion Access; Sisterhood; Secrets", Moods="Urgent; Emotional; Illuminating",
    Tags="Canada; Reproductive rights; Historical",
    **{"One-line recommendation": "Decades of women, a secret network, and the fight for bodily autonomy.", "Confidence": "high"},
)
put(
    "funny story", "emily henry",
    Title="Funny Story", Author="Emily Henry",
    Country="United States", Publisher="Berkley", ISBN="9780593441213",
    Genres="Romance; Contemporary Fiction", Subgenres="Romantic Comedy",
    Themes="Heartbreak; Friendship; Second Chances", Moods="Funny; Warm; Swoony",
    Tags="Emily Henry; Fake dating; Romance",
    Tropes="Fake dating; Friends to lovers",
    **{"One-line recommendation": "Two dump-ees, one summer, and a fake-dating arrangement with real feelings.", "Confidence": "high"},
)
put(
    "the unmaking of june farrow", "adrienne young",
    Title="The Unmaking of June Farrow", Author="Adrienne Young",
    Country="United States", Publisher="Delacorte",
    Genres="Fantasy; Historical Fiction", Subgenres="Time-Slip; Southern Gothic",
    Themes="Family Curses; Choice; Belonging", Moods="Atmospheric; Romantic; Mysterious",
    Tags="Time travel; Adrienne Young",
    **{"One-line recommendation": "A North Carolina curse, a disappeared mother, and a door through time.", "Confidence": "high"},
)
put(
    "daughters of olympus", "hannah lynn",
    Title="Daughters of Olympus", Author="Hannah Lynn",
    Country="United Kingdom",
    Genres="Mythology Retelling; Fantasy", Subgenres="Greek Mythology; Feminist Retelling",
    Themes="Sisterhood; Power; Myth", Moods="Lush; Dramatic",
    Tags="Greek mythology; Hannah Lynn",
    **{"One-line recommendation": "Olympian daughters reclaiming space in the old myths.", "Confidence": "medium"},
)
put(
    "the everlasting", "Alix e. harrow",
    Title="The Everlasting", Author="Alix E. Harrow",
    Country="United States", Publisher="Tor",
    Genres="Fantasy; Literary Fiction", Subgenres="Fairytale Retelling",
    Themes="Love; Time; Storytelling", Moods="Lyrical; Romantic; Clever",
    Tags="Alix E. Harrow; Fantasy",
    **{"One-line recommendation": "Harrow’s signature fairy-tale shimmer — confirm exact synopsis for your shelf.", "Confidence": "medium"},
)
put(
    "Athena's child", "hannah lynn",
    Title="Athena's Child", Author="Hannah Lynn",
    Country="United Kingdom", Publisher="Muswell Press",
    Genres="Mythology Retelling; Fantasy", Subgenres="Greek Mythology; Feminist Retelling",
    Themes="Monstrosity; Agency; Betrayal", Moods="Dark; Empathetic; Fierce",
    Tags="Medusa; Greek mythology; Hannah Lynn",
    **{"One-line recommendation": "Medusa’s story — not monster, but Athena’s child made myth.", "Confidence": "high"},
)
put(
    "psyche and eros", "luna mcnamara",
    Title="Psyche and Eros", Author="Luna McNamara",
    Country="United States", Publisher="William Morrow",
    Genres="Mythology Retelling; Romance", Subgenres="Greek Mythology; Romantic Fantasy",
    Themes="Love; Trust; Trials", Moods="Romantic; Lush; Adventurous",
    Tags="Psyche; Eros; Greek mythology",
    **{"One-line recommendation": "The classic love myth retold with heat, quests, and heart.", "Confidence": "high"},
)


def cell_str(v: object) -> str:
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def merge_list(old: str, new: str) -> str:
    """Keep existing tags/themes and append new unique pieces."""
    if not old:
        return new
    if not new:
        return old
    seen = set()
    out: list[str] = []
    for part in (old.replace(",", ";").split(";") + new.replace(",", ";").split(";")):
        t = part.strip()
        if not t:
            continue
        k = t.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(t)
    return "; ".join(out)


def main() -> None:
    wb = openpyxl.load_workbook(SRC)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    out_rows: list[list[str]] = [COLS]
    matched = 0
    unmatched: list[str] = []

    for raw in rows[1:]:
        if raw is None or all(c is None or str(c).strip() == "" for c in raw):
            continue
        vals = [cell_str(raw[i]) if i < len(raw) else "" for i in range(len(COLS))]
        title, author = vals[0], vals[1]
        if not title:
            continue
        # Skip example-only first template row if still present with fake ISBN
        if title == "The Ministry of Utmost Happiness" and "9780200000000" in vals[3]:
            # keep as-is lightly normalized
            if vals[IDX["Status"]].lower() == "read":
                vals[IDX["Status"]] = "read"
            out_rows.append(vals)
            unmatched.append(f"{title} | {author} (example row kept)")
            continue

        patch = FILL.get(key(title, author))
        if not patch:
            unmatched.append(f"{title} | {author}")
            # still normalize status
            st = vals[IDX["Status"]].lower().replace(" ", "-")
            if st in ("", "not-read", "notread"):
                vals[IDX["Status"]] = "want-to-read"
            if not vals[IDX["Format"]]:
                vals[IDX["Format"]] = "paperback"
            out_rows.append(vals)
            continue

        matched += 1
        for col, new_v in patch.items():
            if col not in IDX or not new_v:
                continue
            i = IDX[col]
            old = vals[i]
            if col in ("Title", "Author", "Subtitle", "Status", "Series", "Series Number"):
                vals[i] = new_v
            elif col in ("Themes", "Tags", "Tropes", "Moods"):
                vals[i] = merge_list(old, new_v)
            elif not old:
                vals[i] = new_v

        st = vals[IDX["Status"]].lower().replace(" ", "-")
        if st in ("", "not-read", "notread"):
            vals[IDX["Status"]] = "want-to-read"
        if not vals[IDX["Format"]]:
            vals[IDX["Format"]] = "paperback"
        out_rows.append(vals)

    wb2 = openpyxl.Workbook()
    ws2 = wb2.active
    ws2.title = "Library Import"
    for r in out_rows:
        ws2.append(r)
    wb2.save(OUT_XLSX)

    with OUT_CSV.open("w", newline="", encoding="utf-8-sig") as f:
        csv.writer(f).writerows(out_rows)

    empty_g = sum(1 for r in out_rows[1:] if not r[IDX["Genres"]])
    print(f"Wrote {OUT_XLSX.name} + {OUT_CSV.name}")
    print(f"Books: {len(out_rows)-1}; enriched: {matched}; empty genres: {empty_g}")
    if unmatched:
        print("Notes:")
        for u in unmatched:
            print(" -", u)


if __name__ == "__main__":
    main()
