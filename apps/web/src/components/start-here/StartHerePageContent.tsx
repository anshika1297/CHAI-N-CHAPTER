import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Feather,
  ListOrdered,
  Mail,
  Sparkles,
  Users,
  Briefcase,
} from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { StartHereContent } from '@/lib/startHereContent';
import BlogCard from '@/components/blog/BlogCard';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import MusingCard from '@/components/musings/MusingCard';
import AuthorSpotlightCard from '@/components/author-spotlight/AuthorSpotlightCard';
import NewsletterSection from '@/components/newsletter/NewsletterSection';
import StartHereReadingPaths from '@/components/reading-paths/StartHereReadingPaths';

const READING_PATHS = [
  {
    href: '/blog',
    title: 'Book Reviews',
    description: 'Honest, spoiler-aware reviews with verdicts, ratings, and similar reads.',
    Icon: BookOpen,
    accent: 'bg-terracotta',
  },
  {
    href: '/recommendations',
    title: 'Book Recommendations',
    description: 'Curated lists across fiction, mythology, Indian literature, and more.',
    Icon: ListOrdered,
    accent: 'bg-sage',
  },
  {
    href: '/musings',
    title: 'Literary Musings',
    description: 'Short reflections, essays, and thoughts from the heart.',
    Icon: Feather,
    accent: 'bg-chai-brown-light',
  },
  {
    href: '/author-spotlight',
    title: 'Author Spotlights',
    description: 'Profiles, interviews, and reading pairings for writers we love.',
    Icon: Sparkles,
    accent: 'bg-terracotta-dark',
  },
  {
    href: '/book-clubs',
    title: 'Book Clubs',
    description: 'Join reader communities and themed discussions around great books.',
    Icon: Users,
    accent: 'bg-sage-dark',
  },
] as const;

const COMMUNITY_LINKS = [
  {
    href: '/book-clubs',
    title: 'Book Clubs',
    description: 'Find your people and read together — online and in spirit.',
    Icon: Users,
  },
  {
    href: '#newsletter',
    title: 'Newsletter',
    description: 'Reviews, lists, and bookish updates in your inbox.',
    Icon: Mail,
  },
  {
    href: '/work-with-me',
    title: 'Work With Me',
    description: 'Reviews, beta reads, and literary services for authors & publishers.',
    Icon: Briefcase,
  },
] as const;

type Props = {
  content: StartHereContent;
};

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
      <div>
        <h2 className="section-heading mb-1">{title}</h2>
        <p className="section-subheading mb-0">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-terracotta font-sans text-sm font-medium hover:gap-3 transition-all shrink-0"
      >
        {linkLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export default function StartHerePageContent({ content }: Props) {
  return (
    <main>
      {/* 1. Hero */}
      <section className="pt-28 pb-14 sm:pb-20 bg-gradient-to-b from-cream-light to-cream">
        <div className="site-container max-w-4xl text-center">
          <p className="font-sans text-xs sm:text-sm uppercase tracking-[0.2em] text-terracotta mb-4">
            New here? Start your reading journey
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-chai-brown mb-5 leading-tight">
            Welcome to Chapters.Aur.Chai
          </h1>
          <p className="font-body text-base sm:text-lg md:text-xl text-chai-brown-light leading-relaxed max-w-2xl mx-auto mb-8">
            A space for book reviews, recommendations, literary musings, author spotlights, and conversations around
            stories that stay with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#reading-paths" className="btn-primary inline-flex items-center justify-center gap-2">
              Start Exploring
              <ArrowRight size={18} />
            </Link>
            <Link href="#newsletter" className="btn-secondary inline-flex items-center justify-center gap-2">
              <Mail size={18} />
              Subscribe
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Choose Your Reading Path */}
      <section id="reading-paths" className="py-12 sm:py-16 bg-cream">
        <div className="site-container">
          <div className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
            <h2 className="section-heading">Choose your reading path</h2>
            <p className="section-subheading">
              Pick a door — every section is curated for readers who want honest, thoughtful book content.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {READING_PATHS.map(({ href, title, description, Icon, accent }) => (
              <Link
                key={href}
                href={href}
                className="group card p-6 sm:p-7 flex flex-col h-full border border-chai-brown/10 hover:border-terracotta/30"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${accent} text-cream flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="font-serif text-xl text-chai-brown mb-2 group-hover:text-terracotta transition-colors">
                  {title}
                </h3>
                <p className="font-body text-sm text-chai-brown-light leading-relaxed flex-1">{description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-terracotta font-sans text-sm font-medium">
                  Explore
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <StartHereReadingPaths />

      {/* 3. Featured Reviews */}
      {content.reviews.length > 0 ? (
        <section className="py-12 sm:py-16 bg-cream-dark/40">
          <div className="site-container">
            <SectionHeader
              title="Featured reviews"
              subtitle="Honest takes on fiction, history, mythology, and more"
              href="/blog"
              linkLabel="All reviews"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.reviews.map((post) => (
                <BlogCard
                  key={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  image={getImageUrl(post.image)}
                  category={post.category}
                  slug={post.slug}
                  readingTime={post.readingTime}
                  author={post.author}
                  bookTitle={post.bookTitle}
                  rating={post.rating}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. Featured Recommendations */}
      {content.recommendations.length > 0 ? (
        <section className="py-12 sm:py-16 bg-cream">
          <div className="site-container">
            <SectionHeader
              title="Featured recommendations"
              subtitle="Curated lists to help you find your next favourite read"
              href="/recommendations"
              linkLabel="All lists"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.recommendations.map((item) => (
                <RecommendationCard
                  key={item.slug}
                  title={item.title}
                  excerpt={item.excerpt}
                  image={getImageUrl(item.image)}
                  category={item.category}
                  slug={item.slug}
                  readingTime={item.readingTime}
                  bookCount={item.bookCount}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. Popular Musings */}
      {content.musings.length > 0 ? (
        <section className="py-12 sm:py-16 bg-cream-dark/40">
          <div className="site-container">
            <SectionHeader
              title="Popular musings"
              subtitle="Literary reflections from Her Musings Verse"
              href="/musings"
              linkLabel="All musings"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.musings.map((item) => (
                <MusingCard
                  key={item.slug}
                  title={item.title}
                  excerpt={item.excerpt}
                  image={getImageUrl(item.image)}
                  category={item.category}
                  slug={item.slug}
                  readingTime={item.readingTime}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 6. Featured Authors */}
      {content.authors.length > 0 ? (
        <section className="py-12 sm:py-16 bg-cream">
          <div className="site-container">
            <SectionHeader
              title="Featured authors"
              subtitle="Writers and voices we are excited to share"
              href="/author-spotlight"
              linkLabel="Author directory"
            />
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {content.authors.map((spotlight, index) => (
                <AuthorSpotlightCard
                  key={spotlight.slug}
                  spotlight={{
                    id: spotlight.slug,
                    slug: spotlight.slug,
                    name: spotlight.name,
                    tagline: spotlight.tagline ?? '',
                    coverImage: spotlight.coverImage,
                    profileImage: spotlight.profileImage,
                    genres: spotlight.genres,
                    displayOrder: index,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 7. Join The Community */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-sage/10 to-cream">
        <div className="site-container">
          <div className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
            <h2 className="section-heading">Join the community</h2>
            <p className="section-subheading">
              Go beyond the page — clubs, newsletter, and collaborations for readers and writers.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {COMMUNITY_LINKS.map(({ href, title, description, Icon }) => (
              <Link
                key={title}
                href={href}
                className="group card p-6 text-center border border-chai-brown/10 hover:border-sage/40"
              >
                <div className="w-11 h-11 rounded-full bg-sage/20 text-sage-dark flex items-center justify-center mx-auto mb-4">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="font-serif text-lg text-chai-brown mb-2 group-hover:text-terracotta transition-colors">
                  {title}
                </h3>
                <p className="font-body text-sm text-chai-brown-light leading-relaxed">{description}</p>
              </Link>
            ))}
          </div>
          <p className="text-center mt-8 font-body text-sm text-chai-brown-light">
            Also explore{' '}
            <Link href="/topics" className="text-terracotta hover:underline">
              topic hubs
            </Link>
            ,{' '}
            <Link href="/shop" className="text-terracotta hover:underline">
              shop the books
            </Link>
            , and{' '}
            <Link href="/about" className="text-terracotta hover:underline">
              about Anshika
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 8. Newsletter */}
      <NewsletterSection variant="start-here" placement="inline-start-here" showNameField />
    </main>
  );
}
