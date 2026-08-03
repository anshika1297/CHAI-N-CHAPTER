/** Query normalization and match scoring for global search. */

export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function tokenize(input: string): string[] {
  return normalizeQuery(input)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

/** Lightweight Levenshtein — used for fuzzy matching on short strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j], row[j - 1], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/** 0–1 similarity; 1 = exact or substring. */
export function fuzzySimilarity(haystack: string, needle: string): number {
  const h = normalizeQuery(haystack);
  const n = normalizeQuery(needle);
  if (!n || !h) return 0;
  if (h === n) return 1;
  if (h.includes(n)) return 0.92;
  if (n.length >= 3 && h.startsWith(n)) return 0.88;

  const hTokens = tokenize(h);
  const nTokens = tokenize(n);
  if (nTokens.length && nTokens.every((t) => hTokens.some((ht) => ht.includes(t) || t.includes(ht)))) {
    return 0.75;
  }

  if (n.length < 3) return 0;
  const window = h.slice(0, Math.min(h.length, n.length + 8));
  const dist = levenshtein(window, n);
  const maxLen = Math.max(window.length, n.length);
  return Math.max(0, 1 - dist / maxLen) * 0.7;
}

export type FieldScore = { score: number; reason?: string };

/** Score a single field with exact → partial → fuzzy priority. */
export function scoreField(
  value: string | undefined,
  query: string,
  weights: { exact: number; prefix: number; contains: number; fuzzy: number }
): FieldScore {
  if (!value?.trim() || !query.trim()) return { score: 0 };
  const v = normalizeQuery(value);
  const q = normalizeQuery(query);
  if (v === q) return { score: weights.exact, reason: 'exact' };
  if (v.startsWith(q)) return { score: weights.prefix, reason: 'prefix' };
  if (v.includes(q)) return { score: weights.contains, reason: 'partial' };
  const sim = fuzzySimilarity(v, q);
  if (sim >= 0.55) return { score: Math.round(weights.fuzzy * sim), reason: 'fuzzy' };
  return { score: 0 };
}

export function scoreTokenList(
  values: string[],
  query: string,
  weights: { exact: number; contains: number; fuzzy: number }
): FieldScore {
  let best = 0;
  let reason: string | undefined;
  for (const raw of values) {
    const s = scoreField(raw, query, {
      exact: weights.exact,
      prefix: weights.contains,
      contains: weights.contains,
      fuzzy: weights.fuzzy,
    });
    if (s.score > best) {
      best = s.score;
      reason = s.reason;
    }
  }
  return { score: best, reason };
}
