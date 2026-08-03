/**
 * @deprecated Use SiteJsonLd from '@/components/schema/SiteJsonLd' or page-level PageJsonLd.
 * Kept for backward compatibility.
 */
import SiteJsonLd from '@/components/schema/SiteJsonLd';

export function PersonSchema() {
  return <SiteJsonLd />;
}

export function WebSiteSchema() {
  return null;
}

export function BlogSchema() {
  return null;
}

export function ArticleSchema() {
  return null;
}
