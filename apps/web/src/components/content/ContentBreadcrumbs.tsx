import ShopBreadcrumbs, { type ShopBreadcrumbItem } from '@/components/shop/ShopBreadcrumbs';

type Props = {
  sectionLabel: string;
  sectionHref: string;
  genreHub?: { label: string; href: string };
  title?: string;
};

/** Visible breadcrumbs for editorial detail pages (reviews, lists, musings). */
export default function ContentBreadcrumbs({ sectionLabel, sectionHref, genreHub, title }: Props) {
  const items: ShopBreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: sectionLabel, href: sectionHref }];
  if (genreHub) items.push({ label: genreHub.label, href: genreHub.href });
  if (title?.trim()) items.push({ label: title.trim() });
  return <ShopBreadcrumbs items={items} />;
}
