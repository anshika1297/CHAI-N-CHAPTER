import ContentJsonLd from '@/components/content/ContentJsonLd';
import type { JsonLdObject } from '@/lib/schema';

/** Server-rendered JSON-LD injection for page routes. */
export default function PageJsonLd({ schemas }: { schemas: JsonLdObject[] | JsonLdObject | null }) {
  if (!schemas) return null;
  const list = Array.isArray(schemas) ? schemas : [schemas];
  if (!list.length) return null;
  return <ContentJsonLd data={list} />;
}
