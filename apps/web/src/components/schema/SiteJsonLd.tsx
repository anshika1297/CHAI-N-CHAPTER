import ContentJsonLd from '@/components/content/ContentJsonLd';
import { buildOrganizationSchema, buildSitePersonSchema, buildWebSiteSchema } from '@/lib/schema';

/** Global Organization + Person + WebSite schemas — rendered once in root layout. */
export default function SiteJsonLd() {
  return (
    <ContentJsonLd data={[buildOrganizationSchema(), buildSitePersonSchema(), buildWebSiteSchema()]} />
  );
}
