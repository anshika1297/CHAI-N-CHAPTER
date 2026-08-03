import './globals.css';
import ConditionalSiteShell from '@/components/ConditionalSiteShell';
import NavigationLoader from '@/components/NavigationLoader';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { buildMetadata } from '@/lib/metadata';
import SiteJsonLd from '@/components/schema/SiteJsonLd';
import { setupGlobalErrorHandlers } from '@/utils/errorHandler';

export const metadata = buildMetadata({
  title: 'Book Blogger, Content Creator & Literary Services | Anshika Mishra | India & UAE',
  description:
    'Book blogger & content creator Anshika Mishra—honest reviews, literary services & book recommendations for readers worldwide. Based in Abu Dhabi. For authors, publishers & lit fest committees in India & UAE.',
  path: '/',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Setup global error handlers (client-side only)
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandlers();
  }

  return (
    <html lang="en-IN">
      <body className="min-h-screen flex flex-col">
        <ErrorBoundary>
          <GoogleAnalytics />
          <AnalyticsTracker />
          <NavigationLoader />
          <SiteJsonLd />
          <ConditionalSiteShell>{children}</ConditionalSiteShell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
