import { NextResponse } from 'next/server';
import { resolveReadingPathsForReview } from '@/lib/readingPaths/resolve';

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? undefined;
  const tagsRaw = searchParams.get('tags') ?? '';
  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const paths = await resolveReadingPathsForReview(category, tags);
    return NextResponse.json({ paths });
  } catch {
    return NextResponse.json({ paths: [] }, { status: 500 });
  }
}
