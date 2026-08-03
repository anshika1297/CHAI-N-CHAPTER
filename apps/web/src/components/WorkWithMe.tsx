import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  PenTool,
  Sparkles,
  FileText,
  MessageSquare,
  Users,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  workWithMeHero,
  workWithMeSummary,
  workWithMeServices,
  type WorkWithMeFaqItem,
  type WorkWithMeTestimonial,
} from '@/lib/workWithMeContent';
import WorkWithMeInquiryForm from '@/components/work-with-me/WorkWithMeInquiryForm';
import WorkWithMeSocial from '@/components/work-with-me/WorkWithMeSocial';
import WorkWithMeTestimonialsCarousel from '@/components/work-with-me/WorkWithMeTestimonialsCarousel';

const serviceIcons: Record<string, LucideIcon> = {
  'beta-reading': BookOpen,
  'book-review': PenTool,
  'author-spotlight': Sparkles,
  'manuscript-feedback': MessageSquare,
  proofreading: FileText,
  collaboration: Users,
};

type Props = {
  testimonials: WorkWithMeTestimonial[];
  faq: WorkWithMeFaqItem[];
};

export default function WorkWithMe({ testimonials, faq }: Props) {
  return (
    <article className="pt-24 pb-16 px-3 sm:px-5 lg:px-6 min-h-screen">
      <div className="w-full max-w-[96rem] mx-auto">
        {/* Hero — stacked: one line per block on laptop (full width, no narrow max-w) */}
        <header className="text-center mb-10 sm:mb-14 w-full">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.15rem] xl:text-5xl text-chai-brown mb-4 leading-tight w-full xl:whitespace-nowrap">
            {workWithMeHero.h1}
          </h1>
          <p className="font-body text-base sm:text-lg lg:text-[1.05rem] xl:text-xl text-chai-brown-light mb-3 leading-snug w-full xl:whitespace-nowrap">
            {workWithMeHero.subheading}
          </p>
          <p className="font-body text-base sm:text-lg lg:text-[1rem] xl:text-lg text-chai-brown-light mb-8 leading-snug w-full xl:whitespace-nowrap">
            {workWithMeHero.supporting}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5">
            <a
              href="#inquiry"
              className="w-full sm:w-auto px-8 py-3 bg-terracotta text-cream font-sans font-medium rounded-full hover:bg-terracotta/90 transition-colors text-center"
            >
              Work With Me
            </a>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-3 border border-chai-brown/25 text-chai-brown font-sans font-medium rounded-full hover:border-terracotta hover:text-terracotta transition-colors text-center"
            >
              Contact Me
            </Link>
          </div>
          <p className="font-body text-sm text-chai-brown-light/80 xl:whitespace-nowrap">
            {workWithMeHero.trustLine}
          </p>
        </header>

        {/* AI / GEO summary */}
        <section
          className="mb-10 sm:mb-14 bg-cream-light rounded-2xl border border-chai-brown/10 p-5 sm:p-6 lg:p-8"
          aria-labelledby="wwm-summary-heading"
        >
          <h2 id="wwm-summary-heading" className="sr-only">
            Work With Me overview
          </h2>
          <dl className="grid gap-6 md:grid-cols-3 md:gap-5 lg:gap-8">
            {workWithMeSummary.map((item, i) => (
              <div
                key={item.question}
                className={`min-w-0 text-center md:text-left ${i > 0 ? 'md:border-l md:border-chai-brown/10 md:pl-5 lg:pl-8' : ''}`}
              >
                <dt className="font-sans text-base sm:text-lg font-semibold text-chai-brown mb-2 leading-snug md:whitespace-nowrap">
                  {item.question}
                </dt>
                <dd className="font-body text-sm sm:text-base lg:text-base text-chai-brown-light leading-relaxed">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Services — 3 per row on large screens */}
        <section className="mb-12 sm:mb-16" aria-labelledby="wwm-services-heading">
          <h2
            id="wwm-services-heading"
            className="font-serif text-2xl sm:text-3xl text-chai-brown mb-8 text-center"
          >
            Services
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {workWithMeServices.map((service) => {
              const Icon = serviceIcons[service.id] ?? BookOpen;
              return (
                <div
                  key={service.id}
                  className={`rounded-xl p-6 border bg-cream-light flex flex-col h-full ${
                    service.featured
                      ? 'border-terracotta/40 ring-1 ring-terracotta/20'
                      : 'border-chai-brown/10'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-terracotta" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg sm:text-xl text-chai-brown leading-snug">
                        {service.title}
                        {service.featured && (
                          <span className="ml-2 text-xs font-sans font-medium text-terracotta align-middle">
                            Featured
                          </span>
                        )}
                      </h3>
                      <p className="font-body text-sm text-chai-brown-light mt-1.5 leading-relaxed">
                        {service.definition}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {service.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2 font-body text-sm text-chai-brown-light">
                        <Check size={14} className="text-terracotta shrink-0 mt-0.5" aria-hidden />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="flex-1 min-h-3" aria-hidden />
                </div>
              );
            })}
          </div>
        </section>

        {/* Testimonials carousel — 3 cards on laptop, swipe pages for more */}
        <section className="mb-12 sm:mb-16 px-2 sm:px-6" aria-labelledby="wwm-testimonials-heading">
          <h2
            id="wwm-testimonials-heading"
            className="font-serif text-2xl sm:text-3xl text-chai-brown mb-8 text-center"
          >
            What Authors Say
          </h2>
          <WorkWithMeTestimonialsCarousel testimonials={testimonials} />
        </section>

        {/* Connect / social */}
        <WorkWithMeSocial />

        {/* FAQ + inquiry form — side by side on large screens */}
        <section
          id="inquiry"
          className="scroll-mt-28 grid lg:grid-cols-2 gap-8 lg:gap-10 items-start"
          aria-labelledby="wwm-faq-heading"
        >
          <div>
            <h2
              id="wwm-faq-heading"
              className="font-serif text-2xl sm:text-3xl text-chai-brown mb-6"
            >
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details
                  key={`${item.question}-${i}`}
                  className="group bg-cream-light rounded-xl border border-chai-brown/10 overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 font-sans text-sm sm:text-base font-medium text-chai-brown hover:text-terracotta transition-colors [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-chai-brown-light transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="px-5 pb-4 font-body text-sm sm:text-base text-chai-brown-light leading-relaxed border-t border-chai-brown/5 pt-3">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div>
            <WorkWithMeInquiryForm embedded />
          </div>
        </section>
      </div>
    </article>
  );
}
