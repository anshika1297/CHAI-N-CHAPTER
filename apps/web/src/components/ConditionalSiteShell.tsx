'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GlobalSearchProvider from '@/components/search/GlobalSearchProvider';
import NewsletterStickyMobile from '@/components/newsletter/NewsletterStickyMobile';

export default function ConditionalSiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <GlobalSearchProvider>
      <Header />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <Footer />
      <NewsletterStickyMobile />
    </GlobalSearchProvider>
  );
}
