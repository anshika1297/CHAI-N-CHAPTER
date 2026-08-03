export function slugifyBookPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Default book slug when admin leaves bookSlug empty (future /books/[slug]). */
export function suggestBookSlug(title: string, author?: string): string {
  const t = slugifyBookPart(title);
  const a = author ? slugifyBookPart(author) : '';
  if (t && a) return `${t}-by-${a}`.slice(0, 120);
  return t.slice(0, 120);
}
