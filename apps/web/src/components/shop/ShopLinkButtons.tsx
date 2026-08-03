import { ExternalLink, ShoppingBag } from 'lucide-react';
import { buttonClassForChannel, relForChannel } from '@/lib/shop/channels';
import type { ShopPurchaseLink } from '@/lib/shop/types';

export default function ShopLinkButtons({ links, className = '' }: { links: ShopPurchaseLink[]; className?: string }) {
  if (!links.length) return null;
  return (
    <ul className={`flex flex-col sm:flex-row flex-wrap gap-3 ${className}`}>
      {links.map((link, i) => (
        <li key={`${link.url}-${i}`}>
          <a
            href={link.url}
            target="_blank"
            rel={relForChannel(link.channel)}
            className={buttonClassForChannel(link.channel)}
          >
            <ShoppingBag size={16} aria-hidden />
            {link.label}
            <ExternalLink size={14} className="opacity-80" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
