import ContentJsonLd from '@/components/content/ContentJsonLd';
import { buildFaqPageSchema, buildProfessionalServiceSchema, buildSitePersonSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/seo';
import {
  workWithMeServices,
  type WorkWithMeFaqItem,
  type WorkWithMeTestimonial,
} from '@/lib/workWithMeContent';

type Props = {
  testimonials: WorkWithMeTestimonial[];
  faq: WorkWithMeFaqItem[];
};

/** Server-rendered Work With Me JSON-LD: ProfessionalService + FAQ (+ Person reference). */
export function WorkWithMePageSchemas({ testimonials, faq }: Props) {
  const pageUrl = '/work-with-me';

  const schemas = [
    buildSitePersonSchema(),
    buildProfessionalServiceSchema({
      name: 'Chapters.aur.Chai Literary Services',
      description:
        'Book reviews, recommendations, author spotlights, beta reading, proofreading, and author strategy for book visibility — helping authors connect with readers in India and the UAE.',
      path: pageUrl,
      serviceTypes: workWithMeServices.map((s) => s.title),
      providerName: siteConfig.author,
    }),
    buildFaqPageSchema(faq),
    ...testimonials.map((t) => ({
      '@context': 'https://schema.org',
      '@type': 'Review',
      reviewBody: t.quote,
      author: { '@type': 'Person', name: t.author },
      itemReviewed: {
        '@type': 'ProfessionalService',
        name: 'Chapters.aur.Chai Literary Collaboration',
        url: `${siteConfig.url.replace(/\/$/, '')}${pageUrl}`,
      },
    })),
  ].filter((s): s is Record<string, unknown> => s != null);

  return <ContentJsonLd data={schemas} />;
}
