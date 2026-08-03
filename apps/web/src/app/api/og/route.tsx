import { ImageResponse } from 'next/og';
import { absoluteImageUrl, dynamicOgBrand, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/metadata/dynamicOg';

export const runtime = 'edge';

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = truncate(searchParams.get('title') || dynamicOgBrand.siteName, 100);
  const category = truncate(searchParams.get('category') || '', 40);
  const coverUrl = absoluteImageUrl(searchParams.get('cover') || '');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: dynamicOgBrand.background,
          fontFamily: 'Georgia, serif',
        }}
      >
        {coverUrl ? (
          <div
            style={{
              width: 420,
              height: '100%',
              display: 'flex',
              overflow: 'hidden',
              borderRight: `4px solid ${dynamicOgBrand.accent}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              width={420}
              height={OG_IMAGE_HEIGHT}
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : null}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: coverUrl ? '48px 56px' : '56px 64px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {category ? (
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: dynamicOgBrand.accent,
                  fontWeight: 600,
                }}
              >
                {category}
              </div>
            ) : null}
            <div
              style={{
                fontSize: coverUrl ? 52 : 58,
                lineHeight: 1.15,
                color: dynamicOgBrand.text,
                fontWeight: 700,
                maxWidth: 720,
              }}
            >
              {title}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: dynamicOgBrand.accent,
              }}
            />
            <div
              style={{
                fontSize: 28,
                color: dynamicOgBrand.muted,
                fontStyle: 'italic',
              }}
            >
              {dynamicOgBrand.siteName}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    }
  );
}
