import Link from 'next/link';
import { Tag } from 'lucide-react';
import {
  resolveCategoryListingHref,
  type EditorialContentType,
} from '@/lib/genres/resolveCategoryHref';

type Style = 'pill' | 'footer';

const STYLES: Record<EditorialContentType, Record<Style, string>> = {
  blog: {
    pill: 'bg-terracotta text-cream text-xs font-sans px-3 py-1 rounded-full inline-flex items-center gap-1 hover:bg-terracotta-dark transition-colors',
    footer:
      'bg-terracotta/10 text-terracotta text-xs font-sans px-3 py-1 rounded-full border border-terracotta/30 hover:bg-terracotta/20 transition-colors inline-flex items-center gap-1',
  },
  recommendations: {
    pill: 'bg-sage text-cream text-xs font-sans px-3 py-1 rounded-full inline-flex items-center gap-1 hover:bg-sage-dark transition-colors',
    footer:
      'bg-sage/10 text-sage-dark text-xs font-sans px-3 py-1 rounded-full border border-sage/30 hover:bg-sage/20 transition-colors inline-flex items-center gap-1',
  },
  musings: {
    pill: 'bg-chai-brown-light text-cream text-xs font-sans px-3 py-1 rounded-full inline-flex items-center gap-1 hover:bg-chai-brown transition-colors',
    footer:
      'bg-chai-brown-light/10 text-chai-brown-light text-xs font-sans px-3 py-1 rounded-full border border-chai-brown-light/30 hover:bg-chai-brown-light/20 transition-colors inline-flex items-center gap-1',
  },
};

type Props = {
  category: string;
  contentType: EditorialContentType;
  style?: Style;
  showIcon?: boolean;
};

export default function CategoryLink({
  category,
  contentType,
  style = 'pill',
  showIcon = true,
}: Props) {
  const href = resolveCategoryListingHref(category, contentType);
  const className = STYLES[contentType][style];
  const label = (
    <>
      {showIcon ? <Tag size={12} aria-hidden /> : null}
      {category}
    </>
  );

  if (!href) {
    return <span className={className.replace(/hover:\S+/g, '')}>{label}</span>;
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
