'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Dummy images - replace with actual image URLs later
const galleryImages = [
  { id: 1, title: 'Book Fair 2024', description: 'Exploring the Delhi Book Fair' },
  { id: 2, title: 'Reading Corner', description: 'My cozy reading nook' },
  { id: 3, title: 'Book Haul', description: 'Latest additions to my library' },
  { id: 4, title: 'Author Meet', description: 'Meeting favorite authors' },
  { id: 5, title: 'Book Club Session', description: 'Virtual chai & book discussions' },
  { id: 6, title: 'Library Visit', description: 'A day at the local library' },
];

export default function PictureGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
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

        {/* Main Carousel */}
        <div className="relative mb-8">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl">
            <div 
              className="absolute inset-0 bg-gradient-to-br from-chai-brown to-chai-brown-dark transition-all duration-500"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Placeholder overlay */}
              <div className="absolute inset-0 bg-chai-brown/40 flex items-center justify-center">
                <div className="text-center text-cream">
                  <span className="text-6xl mb-4 block">📸</span>
                  <p className="font-serif text-xl">{galleryImages[currentIndex].title}</p>
                  <p className="font-body text-sm mt-2 opacity-90">{galleryImages[currentIndex].description}</p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-cream/90 hover:bg-cream text-chai-brown p-2 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-cream/90 hover:bg-cream text-chai-brown p-2 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-cream/90 text-chai-brown px-4 py-2 rounded-full text-sm font-sans">
              {currentIndex + 1} / {galleryImages.length}
            </div>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
                index === currentIndex
                  ? 'ring-4 ring-terracotta scale-105'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-chai-brown-light to-chai-brown">
                <div className="absolute inset-0 flex items-center justify-center text-cream/60">
                  <span className="text-2xl">📷</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
