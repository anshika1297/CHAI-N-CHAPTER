import WorkWithMe from '@/components/WorkWithMe';
import { WorkWithMePageSchemas } from '@/components/work-with-me/WorkWithMeSchemas';
import { buildMetadata } from '@/lib/metadata';
import { getPageSettingsServer } from '@/lib/api';
import {
  mergeWorkWithMeFaq,
  resolveAdditionalFaq,
  resolveWorkWithMeTestimonials,
} from '@/lib/workWithMeContent';

/** Always read fresh testimonials from the API (admin-editable). */
export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Work With Me – Book Reviewer, Proofreader & Author Strategist | India',
  description:
    'Work with Anshika Mishra (Chapters.Aur.Chai) — book reviewer, proofreader, and author strategist. Book reviews, recommendations, author spotlights, beta reading, proofreading, and visibility support for authors in India & the UAE.',
  path: '/work-with-me',
  keywords: [
    'book reviewer India',
    'book reviewer',
    'proofreader India',
    'proofreader for authors',
    'author strategist India',
    'author strategist',
    'book visibility',
    'book marketing for authors',
    'book reviews India',
    'book recommendations',
    'author spotlight',
    'beta reading',
    'beta reader India',
    'manuscript feedback',
    'ARC reviews',
  ],
});

export default async function WorkWithMePage() {
  let testimonials = resolveWorkWithMeTestimonials(null);
  let faq = mergeWorkWithMeFaq([]);
  try {
    const { content } = await getPageSettingsServer('work-with-me');
    testimonials = resolveWorkWithMeTestimonials(content);
    faq = mergeWorkWithMeFaq(resolveAdditionalFaq(content));
  } catch {
    // API unavailable — use code defaults
  }

  return (
    <>
      <WorkWithMePageSchemas testimonials={testimonials} faq={faq} />
      <WorkWithMe testimonials={testimonials} faq={faq} />
    </>
  );
}
