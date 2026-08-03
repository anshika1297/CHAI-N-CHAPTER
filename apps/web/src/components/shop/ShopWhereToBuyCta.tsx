import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function ShopWhereToBuyCta({ href, className = '' }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sage text-cream font-sans text-sm font-medium hover:bg-sage/90 transition-colors ${className}`}
    >
      <ShoppingBag size={18} aria-hidden />
      Where to buy
    </Link>
  );
}
