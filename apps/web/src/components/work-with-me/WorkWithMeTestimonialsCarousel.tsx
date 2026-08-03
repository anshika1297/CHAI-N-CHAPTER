'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { WorkWithMeTestimonial } from '@/lib/workWithMeContent';
import TestimonialSourceBadge from '@/components/work-with-me/TestimonialSourceBadge';

type Props = {
  testimonials: WorkWithMeTestimonial[];
};

function cardsPerView(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function TestimonialCard({ t }: { t: WorkWithMeTestimonial }) {
  return (
    <blockquote className="bg-cream-light rounded-xl border border-chai-brown/10 p-6 h-full flex flex-col min-h-[220px]">
      <Quote size={20} className="text-terracotta/60 mb-3 shrink-0" aria-hidden />
      <p className="font-body text-chai-brown-light text-sm leading-relaxed mb-4 flex-1">
        &ldquo;{t.quote}&rdquo;
      </p>
      <footer className="font-sans text-sm mt-auto">
        <cite className="not-italic font-medium text-chai-brown">— {t.author}</cite>
        {t.title ? (
          <p className="text-xs text-chai-brown-light mt-1 leading-snug">{t.title}</p>
        ) : null}
        {t.source ? <TestimonialSourceBadge source={t.source} className="mt-2" /> : null}
      </footer>
    </blockquote>
  );
}

export default function WorkWithMeTestimonialsCarousel({ testimonials }: Props) {
  const [perView, setPerView] = useState(3);
  const [slide, setSlide] = useState(0);

  const updatePerView = useCallback(() => {
    setPerView(cardsPerView(window.innerWidth));
  }, []);

  useEffect(() => {
    updatePerView();
    window.addEventListener('resize', updatePerView);
    return () => window.removeEventListener('resize', updatePerView);
  }, [updatePerView]);

  const totalSlides = Math.max(1, Math.ceil(testimonials.length / perView));
  const safeSlide = Math.min(slide, totalSlides - 1);

  useEffect(() => {
    if (slide >= totalSlides) setSlide(Math.max(0, totalSlides - 1));
  }, [totalSlides, slide]);

  const slideItems = testimonials.slice(safeSlide * perView, safeSlide * perView + perView);
  const showNav = testimonials.length > perView;

  const goPrev = () => setSlide((s) => (s <= 0 ? totalSlides - 1 : s - 1));
  const goNext = () => setSlide((s) => (s >= totalSlides - 1 ? 0 : s + 1));

  if (testimonials.length === 0) return null;

  return (
    <div className="relative">
      <div
        className="grid gap-5 transition-all duration-500 ease-out"
        style={{
          gridTemplateColumns: `repeat(${Math.min(perView, slideItems.length)}, minmax(0, 1fr))`,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {slideItems.map((t, i) => (
          <TestimonialCard key={`${t.author}-${safeSlide * perView + i}`} t={t} />
        ))}
      </div>

      {showNav && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute -left-1 sm:left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-cream border border-chai-brown/15 shadow-md flex items-center justify-center text-chai-brown hover:border-terracotta hover:text-terracotta transition-colors"
            aria-label="Previous testimonials"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute -right-1 sm:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-cream border border-chai-brown/15 shadow-md flex items-center justify-center text-chai-brown hover:border-terracotta hover:text-terracotta transition-colors"
            aria-label="Next testimonials"
          >
            <ChevronRight size={22} />
          </button>

          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  i === safeSlide ? 'w-6 bg-terracotta' : 'w-2 bg-chai-brown/20 hover:bg-chai-brown/35'
                }`}
                aria-label={`Go to testimonial slide ${i + 1}`}
                aria-current={i === safeSlide ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
