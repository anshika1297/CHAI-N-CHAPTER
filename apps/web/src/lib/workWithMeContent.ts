/** Static copy for /work-with-me — source of truth for the public page. */

export const workWithMeHero = {
  h1: 'Helping Authors Connect More Deeply With Readers',
  subheading:
    'Book reviewer · proofreader · author strategist — reviews, recommendations, spotlights, beta reading & visibility.',
  supporting:
    'I work closely with authors to shape stories, give honest feedback, and grow book visibility — so your writing reaches the readers it was meant for. India & UAE.',
  trustLine: 'Open to authors, publishers, and literary professionals in India, the UAE, and beyond.',
};

export const workWithMeConnect = {
  title: 'Connect With Me',
  description:
    'Follow me on social media to stay updated with my latest reviews, recommendations, and bookish content.',
};

export const workWithMeSummary = [
  {
    question: 'Who is this page for?',
    answer:
      'Authors and publishers who want a book reviewer, proofreader, and author strategist — for feedback, visibility, and closer connection with readers.',
  },
  {
    question: 'What does Chapters.Aur.Chai offer?',
    answer:
      'Book reviews, recommendations, author spotlights, beta reading, proofreading, and marketing-minded visibility support — always reader-focused.',
  },
  {
    question: 'Who is Anshika?',
    answer:
      'Anshika Mishra is a book reviewer, proofreader, and author strategist who works closely with authors on feedback, story shaping, and helping books find their readers.',
  },
] as const;

export type WorkWithMeService = {
  id: string;
  title: string;
  definition: string;
  deliverables: string[];
  featured?: boolean;
};

export const workWithMeServices: WorkWithMeService[] = [
  {
    id: 'beta-reading',
    title: 'Beta Reading',
    featured: true,
    definition:
      'Close, reader-focused feedback before publication — structure, pacing, emotional resonance, and where the story loses or holds the reader.',
    deliverables: [
      'Reader experience feedback',
      'Pacing analysis',
      'Character engagement insights',
      'Emotional resonance notes',
      'Confusion/disengagement points',
    ],
  },
  {
    id: 'book-review',
    title: 'Book Reviews',
    definition:
      'Honest, spoiler-free reviews that help readers discover your book and give authors clear visibility on Chapters.Aur.Chai and selected platforms.',
    deliverables: [
      'Detailed review',
      'Reader recommendation perspective',
      'Social / Bookstagram feature (if applicable)',
    ],
  },
  {
    id: 'author-spotlight',
    title: 'Author Spotlights & Interviews',
    definition:
      'Feature content that introduces you and your work to new readers — journey, craft, and the book behind the name.',
    deliverables: [
      'Author feature article',
      'Writing journey highlight',
      'Book introduction',
      'Reader discovery content',
    ],
  },
  {
    id: 'manuscript-feedback',
    title: 'Reader-Focused Manuscript Feedback',
    definition:
      'Hands-on notes on how readers experience your manuscript — clarity, engagement, and shaping the story so it connects.',
    deliverables: [
      'Reader perception analysis',
      'Clarity feedback',
      'Engagement insights',
      'Emotional impact review',
    ],
  },
  {
    id: 'proofreading',
    title: 'Proofreading',
    definition:
      'Careful proofreading for grammar, spelling, punctuation, and formatting consistency before your book goes out.',
    deliverables: ['Grammar and spelling review', 'Punctuation consistency', 'Formatting check'],
  },
  {
    id: 'collaboration',
    title: 'Visibility, Recommendations & Collaborations',
    definition:
      'Author strategy for book visibility — recommendations, promotional features, social reach, and partnerships that help your book find its audience.',
    deliverables: [
      'Book recommendations & lists',
      'Visibility / marketing features',
      'Bookstagram & social reach',
      'Blog collaborations',
      'Literary partnerships',
    ],
  },
];

export const workWithMeServiceOptions = [
  { value: 'beta-reading', label: 'Beta Reading' },
  { value: 'book-review', label: 'Book Review' },
  { value: 'author-spotlight', label: 'Author Spotlight' },
  { value: 'manuscript-feedback', label: 'Manuscript Feedback' },
  { value: 'proofreading', label: 'Proofreading' },
  { value: 'collaboration', label: 'Visibility & Collaboration' },
] as const;

export const workWithMeTestimonialSourceOptions = [
  { value: 'google', label: 'Google' },
  { value: 'linkedin', label: 'LinkedIn' },
] as const;

export type WorkWithMeTestimonialSource = (typeof workWithMeTestimonialSourceOptions)[number]['value'];

const VALID_TESTIMONIAL_SOURCES = new Set<string>(
  workWithMeTestimonialSourceOptions.map((o) => o.value)
);

export function parseTestimonialSource(raw: unknown): WorkWithMeTestimonialSource | undefined {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return VALID_TESTIMONIAL_SOURCES.has(s) ? (s as WorkWithMeTestimonialSource) : undefined;
}

export type WorkWithMeTestimonial = {
  quote: string;
  author: string;
  /** Optional role, e.g. "Author of …" or "Founder, … Publishing" */
  title?: string;
  /** Optional review source — shown with icon on the card */
  source?: WorkWithMeTestimonialSource;
};

export const defaultWorkWithMeTestimonials: WorkWithMeTestimonial[] = [
  {
    quote: 'She reads with both the sharpness of an editor and the sensitivity of a reader.',
    author: 'Raman Sharma',
  },
  {
    quote: 'Her review helped me learn and grow as an author.',
    author: 'Sagar Azad',
  },
  {
    quote:
      'Her insights are strategically valuable in shaping a manuscript that truly connects with its audience.',
    author: 'Naman Gupta',
  },
  {
    quote: 'The inputs she gave me were valuable and top class.',
    author: 'Deepanshu Saini',
  },
];

/** @deprecated Use defaultWorkWithMeTestimonials */
export const workWithMeTestimonials = defaultWorkWithMeTestimonials;

function normalizeOneTestimonial(raw: unknown): WorkWithMeTestimonial | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const quote = typeof o.quote === 'string' ? o.quote.trim() : '';
  const author = typeof o.author === 'string' ? o.author.trim() : '';
  if (!quote || !author) return null;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const source = parseTestimonialSource(o.source);
  const item: WorkWithMeTestimonial = { quote, author };
  if (title) item.title = title;
  if (source) item.source = source;
  return item;
}

/** Build payload for CMS save from admin form values. */
export function formatTestimonialForSave(t: WorkWithMeTestimonial): WorkWithMeTestimonial | null {
  const quote = t.quote.trim();
  const author = t.author.trim();
  if (!quote || !author) return null;
  const title = t.title?.trim();
  const source = parseTestimonialSource(t.source);
  const item: WorkWithMeTestimonial = { quote, author };
  if (title) item.title = title;
  if (source) item.source = source;
  return item;
}

/** Resolve testimonials from CMS page settings, with code defaults as fallback. */
export function resolveWorkWithMeTestimonials(content: unknown): WorkWithMeTestimonial[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return defaultWorkWithMeTestimonials;
  }
  const list = (content as Record<string, unknown>).testimonials;
  if (!Array.isArray(list) || list.length === 0) {
    return defaultWorkWithMeTestimonials;
  }
  const parsed = list.map(normalizeOneTestimonial).filter((t): t is WorkWithMeTestimonial => t !== null);
  return parsed.length > 0 ? parsed : defaultWorkWithMeTestimonials;
}

export type WorkWithMeFaqItem = {
  question: string;
  answer: string;
};

/** Core FAQ — always shown; edit in code only. */
export const workWithMeFaq: WorkWithMeFaqItem[] = [
  {
    question: 'What is beta reading?',
    answer:
      'Beta reading is close, reader-focused feedback on a manuscript before publication — helping you shape the story so it connects with readers.',
  },
  {
    question: 'How do book reviews work?',
    answer:
      'I write honest, spoiler-free reviews shared on Chapters.Aur.Chai and selected platforms — part of how I help authors with book visibility.',
  },
  {
    question: 'Do you help with book visibility and marketing?',
    answer:
      'Yes. As an author strategist I support visibility through book reviews, recommendations, author spotlights, and promotional collaborations.',
  },
  {
    question: 'Do you offer proofreading?',
    answer:
      'Yes. I proofread for grammar, spelling, punctuation, and formatting consistency before publication.',
  },
  {
    question: 'Do you work with publishers?',
    answer: 'Yes, I collaborate with both authors and publishers.',
  },
  {
    question: 'Do you accept ARCs?',
    answer: 'Yes, depending on availability and fit.',
  },
  {
    question: 'Do you provide manuscript feedback?',
    answer:
      'Yes — focused on reader experience, clarity, engagement, and shaping stories so authors connect more deeply with readers.',
  },
  {
    question: 'What genres do you prefer?',
    answer:
      'Indian mythology, historical fiction, literary fiction, cultural narratives, contemporary fiction.',
  },
  {
    question: 'Do you work with authors in India?',
    answer:
      'Yes. I work closely with authors and publishers in India and the UAE as a book reviewer, proofreader, and author strategist.',
  },
];

function normalizeFaqItem(raw: unknown): WorkWithMeFaqItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const question = typeof o.question === 'string' ? o.question.trim() : '';
  const answer = typeof o.answer === 'string' ? o.answer.trim() : '';
  if (!question || !answer) return null;
  return { question, answer };
}

/** Extra FAQ entries saved in admin (appended after permanent FAQ). */
export function resolveAdditionalFaq(content: unknown): WorkWithMeFaqItem[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return [];
  const list = (content as Record<string, unknown>).additionalFaq;
  if (!Array.isArray(list)) return [];
  return list.map(normalizeFaqItem).filter((item): item is WorkWithMeFaqItem => item !== null);
}

export function mergeWorkWithMeFaq(additional: WorkWithMeFaqItem[]): WorkWithMeFaqItem[] {
  return [...workWithMeFaq, ...additional];
}

export function formatFaqForSave(item: WorkWithMeFaqItem): WorkWithMeFaqItem | null {
  const question = item.question.trim();
  const answer = item.answer.trim();
  if (!question || !answer) return null;
  return { question, answer };
}
