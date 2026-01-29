'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/api';

export type GalleryImage = {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
};

const defaultGalleryImages: GalleryImage[] = [
  { id: '1', imageUrl: '', title: 'Book Fair 2024', description: 'Exploring the Delhi Book Fair' },
  { id: '2', imageUrl: '', title: 'Reading Corner', description: 'My cozy reading nook' },
  { id: '3', imageUrl: '', title: 'Book Haul', description: 'Latest additions to my library' },
  { id: '4', imageUrl: '', title: 'Author Meet', description: 'Meeting favorite authors' },
  { id: '5', imageUrl: '', title: 'Book Club Session', description: 'Virtual chai & book discussions' },
  { id: '6', imageUrl: '', title: 'Library Visit', description: 'A day at the local library' },
];

const SLIDE_BREAKPOINT = 1024;

type Props = { images?: GalleryImage[] | null };

function SlideImage({ image }: { image: GalleryImage }) {
  const imageSrc = image.imageUrl ? getImageUrl(image.imageUrl) : '';
  return (
    <div className="relative aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-chai-brown to-chai-brown-dark shadow-lg">
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!imageSrc && (
          <div className="absolute inset-0 bg-chai-brown/40 flex items-center justify-center">
            <div className="text-center text-cream">
              <span className="text-4xl sm:text-5xl mb-2 block">📸</span>
              <p className="font-serif text-lg sm:text-xl">{image.title ?? 'Picture Corner'}</p>
              {image.description && (
                <p className="font-body text-xs sm:text-sm mt-1 opacity-90">{image.description}</p>
              )}
            </div>
          </div>
        )}
        {imageSrc && (image.title || image.description) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-cream">
            {image.title && <p className="font-serif text-base sm:text-lg">{image.title}</p>}
            {image.description && <p className="font-body text-xs sm:text-sm opacity-90">{image.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PictureGallery({ images }: Props) {
  const list = Array.isArray(images) && images.length > 0
    ? images.filter((i) => i && (i.imageUrl?.trim() || i.title || i.description))
    : defaultGalleryImages;

  const [itemsPerSlide, setItemsPerSlide] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const updatePerSlide = () => {
      setItemsPerSlide(window.innerWidth >= SLIDE_BREAKPOINT ? 2 : 1);
    };
    updatePerSlide();
    window.addEventListener('resize', updatePerSlide);
    return () => window.removeEventListener('resize', updatePerSlide);
  }, []);

  const totalSlides = Math.ceil(list.length / itemsPerSlide);
  const safeSlide = Math.min(currentSlide, Math.max(0, totalSlides - 1));

  useEffect(() => {
    if (currentSlide >= totalSlides) setCurrentSlide(Math.max(0, totalSlides - 1));
  }, [totalSlides, currentSlide]);
  const visibleItems = list.slice(safeSlide * itemsPerSlide, safeSlide * itemsPerSlide + itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    const slide = itemsPerSlide === 1 ? index : Math.floor(index / 2);
    setCurrentSlide(slide);
  };

  const isThumbActive = (index: number) => {
    if (itemsPerSlide === 1) return index === safeSlide;
    const start = safeSlide * 2;
    return index >= start && index < start + 2;
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            Picture Corner
          </h2>
          <p className="text-terracotta font-body italic text-lg">
            Moments from my reading journey
          </p>
        </div>

        {/* Main Carousel: 1 image on small, 2 on large; shorter aspect ratio */}
        <div className="relative mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {visibleItems.map((image) => (
              <SlideImage key={image.id} image={image} />
            ))}
          </div>

          {list.length > itemsPerSlide && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-cream/90 hover:bg-cream text-chai-brown p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                aria-label="Previous"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-cream/90 hover:bg-cream text-chai-brown p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                aria-label="Next"
              >
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-cream/90 text-chai-brown px-3 py-1.5 rounded-full text-xs sm:text-sm font-sans z-10">
                {safeSlide + 1} / {totalSlides}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
          {list.map((image, index) => {
            const thumbSrc = image.imageUrl ? getImageUrl(image.imageUrl) : '';
            return (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
                  isThumbActive(index)
                    ? 'ring-4 ring-terracotta scale-105'
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              >
                {thumbSrc ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${thumbSrc})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-chai-brown-light to-chai-brown">
                    <div className="absolute inset-0 flex items-center justify-center text-cream/60">
                      <span className="text-2xl">📷</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}


