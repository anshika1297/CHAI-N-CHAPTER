import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'chai.n.chapter | A Personal Book Blog',
  description: 'A cozy corner of the internet where books meet chai. Honest book reviews, curated recommendations, and reflections from a passionate reader.',
  keywords: ['book blog', 'book reviews', 'book recommendations', 'reading', 'chai', 'indian books'],
  authors: [{ name: 'Anshika Mishra' }],
  openGraph: {
    title: 'chai.n.chapter | A Personal Book Blog',
    description: 'A cozy corner of the internet where books meet chai.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
