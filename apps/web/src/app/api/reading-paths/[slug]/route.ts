import { NextResponse } from 'next/server';
import { resolveReadingPathBySlug } from '@/lib/readingPaths/resolve';

export const revalidate = 300;

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  try {
    const path = await resolveReadingPathBySlug(slug);
    if (!path) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ path });
  } catch {
    return NextResponse.json({ error: 'Failed to load path' }, { status: 500 });
  }
}
