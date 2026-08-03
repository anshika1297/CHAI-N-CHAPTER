import Link from 'next/link';

export type ShopBreadcrumbItem = { label: string; href?: string };

export default function ShopBreadcrumbs({ items }: { items: ShopBreadcrumbItem[] }) {
  if (!items.length) return null;
  return (
    <nav className="mb-6 font-sans text-sm text-chai-brown-light" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden className="text-chai-brown/30">/</span> : null}
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-terracotta transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? 'text-chai-brown font-medium' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
