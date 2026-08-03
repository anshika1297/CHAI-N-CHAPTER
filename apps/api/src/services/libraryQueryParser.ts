import { LibraryBookQueryParams } from './libraryBookFilter.js';

/** A single interpreted filter, shown to the admin as a chip. */
export interface QueryChip {
  field: string;
  value: string;
  label: string;
}

export interface ParsedQuery {
  params: LibraryBookQueryParams;
  chips: QueryChip[];
  /** Words we could not map to any filter (surfaced so the user can refine). */
  leftover: string;
  /** Suggested sort based on intent (e.g. "best" → highest rated). */
  sort?: string;
}

export interface ParserFacets {
  genres: string[];
  themes: string[];
  moods: string[];
  tropes: string[];
  tags: string[];
  locations: string[];
  authors: string[];
  authorCountries: string[];
  collections?: string[];
}

/** Common nationality adjectives → country name. Matched against author countries. */
const DEMONYMS: Record<string, string> = {
  indian: 'India',
  american: 'USA',
  british: 'UK',
  english: 'UK',
  japanese: 'Japan',
  korean: 'South Korea',
  chinese: 'China',
  french: 'France',
  german: 'Germany',
  italian: 'Italy',
  spanish: 'Spain',
  russian: 'Russia',
  nigerian: 'Nigeria',
  pakistani: 'Pakistan',
  irish: 'Ireland',
  canadian: 'Canada',
  australian: 'Australia',
  turkish: 'Turkey',
  brazilian: 'Brazil',
  mexican: 'Mexico',
  egyptian: 'Egypt',
  iranian: 'Iran',
  afghan: 'Afghanistan',
  srilankan: 'Sri Lanka',
  bangladeshi: 'Bangladesh',
  nepali: 'Nepal',
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'book', 'books', 'novel', 'novels', 'read', 'reads', 'reading',
  'show', 'me', 'find', 'list', 'give', 'get', 'want', 'need', 'i', 'my', 'some',
  'any', 'all', 'with', 'about', 'for', 'of', 'and', 'or', 'that', 'which', 'are',
  'is', 'by', 'from', 'to', 'in', 'on', 'please', 'author', 'authors', 'writer',
  'writers', 'story', 'stories', 'something', 'anything', 'have', 'has',
]);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s+]/g, ' ').replace(/\s+/g, ' ').trim();
}

function words(text: string): string {
  return normalize(text);
}

/** Remove a matched phrase from the working text so it isn't reused/leftover. */
function strip(text: string, phrase: string): string {
  const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  return text.replace(re, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Heuristic natural-language → structured filter parser. Deterministic, needs
 * no API key, and understands the query shapes the user cares about: page/rating
 * ranges, reading status, ownership/format/location, author nationality, and any
 * genre/theme/mood/tag/trope/author that exists in the library.
 */
export function parseLibraryQuery(raw: string, facets: ParserFacets): ParsedQuery {
  const params: LibraryBookQueryParams = {};
  const chips: QueryChip[] = [];
  let text = ` ${words(raw)} `;
  let sort: string | undefined;

  const addChip = (field: string, value: string, label: string) => {
    chips.push({ field, value, label });
  };

  const numWords: Record<string, number> = {
    two: 2, three: 3, four: 4, five: 5,
  };
  const toNum = (s: string): number | undefined => {
    if (s in numWords) return numWords[s];
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  // ---- Page ranges ----
  const between = text.match(/between\s+(\d+)\s+(?:and|-)\s+(\d+)\s*(?:pages|pgs|pp)?/);
  if (between) {
    params.minPages = parseInt(between[1], 10);
    params.maxPages = parseInt(between[2], 10);
    addChip('pages', `${params.minPages}-${params.maxPages}`, `${params.minPages}–${params.maxPages} pages`);
    text = strip(text, between[0]);
  } else {
    const under = text.match(/(?:under|below|less than|fewer than|shorter than|<|<=|at most|max)\s+(\d+)\s*(?:pages|pgs|pp)?/);
    if (under) {
      params.maxPages = parseInt(under[1], 10);
      addChip('maxPages', String(params.maxPages), `≤ ${params.maxPages} pages`);
      text = strip(text, under[0]);
    }
    const over = text.match(/(?:over|above|more than|longer than|greater than|>|>=|at least)\s+(\d+)\s*(?:pages|pgs|pp)?/);
    if (over && /pages|pgs|pp/.test(over[0])) {
      params.minPages = parseInt(over[1], 10);
      addChip('minPages', String(params.minPages), `≥ ${params.minPages} pages`);
      text = strip(text, over[0]);
    }
    const exactUnder = text.match(/(\d+)\s*(?:pages|pgs|pp)\s*(?:or\s+(?:less|fewer))/);
    if (exactUnder) {
      params.maxPages = parseInt(exactUnder[1], 10);
      addChip('maxPages', String(params.maxPages), `≤ ${params.maxPages} pages`);
      text = strip(text, exactUnder[0]);
    }
  }
  if (params.maxPages === undefined && params.minPages === undefined) {
    if (/\b(short|quick|novella|novellas)\b/.test(text)) {
      params.maxPages = 250;
      addChip('maxPages', '250', 'short (≤ 250 pages)');
      text = strip(strip(text, 'short'), 'quick');
    } else if (/\b(long|chunky|doorstopper|epic)\b/.test(text)) {
      params.minPages = 500;
      addChip('minPages', '500', 'long (≥ 500 pages)');
      text = strip(text, 'long');
    }
  }

  // ---- Rating ----
  const ratingPlus = text.match(/(\d)\s*(?:\+|\s*or more|\s*stars?\s*(?:\+|or more|and up|and above))/);
  const starsAtLeast = text.match(/(?:over|above|at least|more than|minimum)\s+(\d)\s*stars?/);
  const nStar = text.match(/\b(\d|two|three|four|five)[\s-]*stars?\b/);
  if (starsAtLeast) {
    params.minRating = parseInt(starsAtLeast[1], 10);
    addChip('minRating', String(params.minRating), `${params.minRating}★ and up`);
    text = strip(text, starsAtLeast[0]);
  } else if (ratingPlus) {
    params.minRating = parseInt(ratingPlus[1], 10);
    addChip('minRating', String(params.minRating), `${params.minRating}★ and up`);
    text = strip(text, ratingPlus[0]);
  } else if (nStar) {
    const n = toNum(nStar[1]);
    if (n) {
      params.minRating = n;
      addChip('minRating', String(n), `${n}★ and up`);
      text = strip(text, nStar[0]);
    }
  }
  if (params.minRating === undefined && /\b(highly rated|top rated|best|favou?rites?|loved|great)\b/.test(text)) {
    params.minRating = 4;
    sort = 'rating';
    addChip('minRating', '4', 'highly rated (4★+)');
    text = strip(strip(strip(strip(text, 'highly rated'), 'top rated'), 'best'), 'favourites');
    text = strip(strip(text, 'favorites'), 'loved');
  }

  // ---- Reading status ----
  if (/\b(currently reading|reading now|in progress)\b/.test(text)) {
    params.status = 'currently-reading';
    addChip('status', 'currently-reading', 'currently reading');
    text = strip(strip(text, 'currently reading'), 'reading now');
  } else if (/\b(want to read|to read|tbr|unread|haven'?t read|not read|wishlist|wanna read)\b/.test(text)) {
    params.status = 'want-to-read';
    addChip('status', 'want-to-read', 'want to read');
    text = strip(strip(strip(text, 'want to read'), 'to read'), 'tbr');
    text = strip(strip(text, 'unread'), 'wishlist');
  } else if (/\b(already read|i'?ve read|finished|read already|have read)\b/.test(text)) {
    params.status = 'read';
    addChip('status', 'read', 'read');
    text = strip(strip(strip(text, 'already read'), 'finished'), 'have read');
  } else if (/\bdnf\b/.test(text)) {
    params.status = 'dnf';
    addChip('status', 'dnf', 'did not finish');
    text = strip(text, 'dnf');
  }

  // ---- Ownership / format / location ----
  if (/\b(i own|owned|own|on my shelf|physical cop)/.test(text)) {
    params.owned = true;
    addChip('owned', 'true', 'owned');
    text = strip(strip(strip(text, 'i own'), 'owned'), 'own');
  }
  const formatMap: Record<string, string> = {
    paperback: 'paperback',
    paperbacks: 'paperback',
    hardcover: 'hardcover',
    hardback: 'hardcover',
    hardbacks: 'hardcover',
    ebook: 'ebook',
    ebooks: 'ebook',
    audiobook: 'audiobook',
    audiobooks: 'audiobook',
    audio: 'audiobook',
  };
  for (const [word, fmt] of Object.entries(formatMap)) {
    if (new RegExp(`\\b${word}\\b`).test(text)) {
      params.format = fmt;
      addChip('format', fmt, fmt);
      text = strip(text, word);
      break;
    }
  }
  // Kindle / digital → location if we have such a location, else ebook format.
  if (/\b(kindle|on my kindle)\b/.test(text)) {
    const kindleLoc = facets.locations.find((l) => /kindle/i.test(l));
    if (kindleLoc) {
      params.location = kindleLoc;
      addChip('location', kindleLoc, kindleLoc);
    } else if (!params.format) {
      params.format = 'ebook';
      addChip('format', 'ebook', 'ebook');
    }
    text = strip(text, 'kindle');
  }
  // Physical locations from facets (India, UAE, …).
  for (const loc of facets.locations) {
    if (!loc) continue;
    if (new RegExp(`\\b${loc.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)) {
      params.location = loc;
      addChip('location', loc, `in ${loc}`);
      text = strip(text, loc.toLowerCase());
    }
  }

  // ---- Women / female-author shelves (phrases → tags + collections) ----
  // Order matters: more specific phrases first.
  const womenSynonyms: { re: RegExp; strips: string[]; tag?: string; collection?: string; label: string }[] = [
    {
      re: /\bindian women (?:writers?|authors?)\b/,
      strips: ['indian women writers', 'indian women writer', 'indian women authors', 'indian women author'],
      collection: 'Indian Women Writers',
      label: 'Indian Women Writers',
    },
    {
      re: /\b(?:written by women|books? by women|books? by female authors?|female authors?|women authors?|women writers?|by women writers?|by female authors?|by women)\b/,
      strips: [
        'written by women', 'books by women', 'book by women', 'books by female authors', 'book by female authors',
        'female authors', 'female author', 'women authors', 'women author', 'women writers', 'women writer',
        'by women writers', 'by women writer', 'by female authors', 'by female author', 'by women',
      ],
      tag: 'written-by-women',
      collection: 'Women Writers',
      label: 'written by women',
    },
    {
      re: /\b(?:about women|women[- ]centric|woman[- ]centric|women centred|women centered|books? about women)\b/,
      strips: [
        'about women', 'women-centric', 'women centric', 'woman-centric', 'woman centric',
        'women centred', 'women centered', 'books about women', 'book about women',
      ],
      tag: 'about-women',
      collection: 'Women-Centric Reads',
      label: 'about / women-centric',
    },
    {
      re: /\b(?:for women(?: readers?)?|women'?s fiction|books? for women)\b/,
      strips: [
        'for women readers', 'for women reader', 'for women', "women's fiction", 'womens fiction',
        'books for women', 'book for women',
      ],
      tag: 'for-women-readers',
      collection: 'For Women Readers',
      label: 'for women readers',
    },
  ];
  for (const syn of womenSynonyms) {
    if (!syn.re.test(text)) continue;
    if (syn.tag) {
      const tags = (params.tag ? params.tag.split(',') : []).map((t) => t.trim()).filter(Boolean);
      if (!tags.some((t) => t.toLowerCase() === syn.tag!.toLowerCase())) {
        tags.push(syn.tag);
        params.tag = tags.join(',');
        addChip('tag', syn.tag, `tag: ${syn.tag}`);
      }
    }
    if (syn.collection) {
      const cols = (params.collection ? params.collection.split(',') : []).map((c) => c.trim()).filter(Boolean);
      if (!cols.some((c) => c.toLowerCase() === syn.collection!.toLowerCase())) {
        cols.push(syn.collection);
        params.collection = cols.join(',');
        addChip('collection', syn.collection, `collection: ${syn.collection}`);
      }
    }
    for (const s of syn.strips) text = strip(text, s);
  }

  // ---- Author nationality (demonyms) ----
  for (const [demonym, country] of Object.entries(DEMONYMS)) {
    if (new RegExp(`\\b${demonym}\\b`).test(text)) {
      const known = facets.authorCountries.find((c) => c.toLowerCase() === country.toLowerCase());
      params.authorCountry = known ?? country;
      addChip('authorCountry', params.authorCountry, `${country} authors`);
      text = strip(text, demonym);
      break;
    }
  }
  // Also match explicit country names present in author data.
  if (!params.authorCountry) {
    for (const country of facets.authorCountries) {
      if (new RegExp(`\\b${country.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)) {
        params.authorCountry = country;
        addChip('authorCountry', country, `${country} authors`);
        text = strip(text, country.toLowerCase());
        break;
      }
    }
  }

  // ---- Facet matching: genres, moods, themes, tropes, tags, collections, authors ----
  // Longest facet values first so multi-word phrases win over their sub-words.
  const facetGroups: { field: keyof LibraryBookQueryParams; label: string; values: string[] }[] = [
    { field: 'author', label: 'author', values: facets.authors },
    { field: 'collection', label: 'collection', values: facets.collections ?? [] },
    { field: 'genre', label: 'genre', values: facets.genres },
    { field: 'mood', label: 'mood', values: facets.moods },
    { field: 'theme', label: 'theme', values: facets.themes },
    { field: 'trope', label: 'trope', values: facets.tropes },
    { field: 'tag', label: 'tag', values: facets.tags },
  ];

  const matchedByField: Record<string, string[]> = {};
  const allCandidates: { field: keyof LibraryBookQueryParams; label: string; value: string }[] = [];
  for (const g of facetGroups) {
    for (const v of g.values) {
      if (v && v.trim().length >= 3) allCandidates.push({ field: g.field, label: g.label, value: v });
    }
  }
  allCandidates.sort((a, b) => b.value.length - a.value.length);

  for (const cand of allCandidates) {
    const needle = normalize(cand.value);
    if (!needle || needle.length < 3) continue;
    if (new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)) {
      const key = cand.field as string;
      // Don't double-apply the same field/value; author is single-value.
      if (cand.field === 'author') {
        if (!params.author) {
          params.author = cand.value;
          addChip('author', cand.value, `by ${cand.value}`);
          text = strip(text, needle);
        }
        continue;
      }
      matchedByField[key] = matchedByField[key] || [];
      if (!matchedByField[key].includes(cand.value)) {
        matchedByField[key].push(cand.value);
        addChip(key, cand.value, `${cand.label}: ${cand.value}`);
        text = strip(text, needle);
      }
    }
  }
  for (const [field, vals] of Object.entries(matchedByField)) {
    (params as Record<string, unknown>)[field] = vals.join(',');
  }

  // ---- Leftover → free-text search ----
  const leftoverWords = text
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w && !STOPWORDS.has(w) && w.length > 1);
  const leftover = leftoverWords.join(' ');
  if (leftover) params.q = leftover;

  return { params, chips, leftover, sort };
}
