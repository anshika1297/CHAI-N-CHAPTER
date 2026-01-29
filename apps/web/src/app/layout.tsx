import './globals.css';
import ConditionalSiteShell from '@/components/ConditionalSiteShell';
import NavigationLoader from '@/components/NavigationLoader';
import { buildMetadata } from '@/lib/metadata';
import { PersonSchema, WebSiteSchema } from '@/components/JsonLd';

export const metadata = buildMetadata({
  title: 'Book Blogger & Book Critic by Anshika Mishra',
  description:
    'Book reviews, recommendations & literary reflections by Anshika Mishra. Fiction, history & mythology from around the world. Indian book blogger with a global reach—open to authors everywhere who write in English.',
  path: '/',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen flex flex-col">
        <NavigationLoader />
        <PersonSchema />
        <WebSiteSchema />
        <ConditionalSiteShell>{children}</ConditionalSiteShell>
      </body>
    </html>
  );
}
