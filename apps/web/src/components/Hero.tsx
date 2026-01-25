'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="min-h-screen pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Image */}
          <div className="order-1 md:order-1 animate-fade-in">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-sage/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-terracotta/20 rounded-full blur-2xl" />
              
              {/* Main image container */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/5] bg-gradient-to-br from-chai-brown-light to-chai-brown relative">
                  {/* Placeholder for author image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-cream/80">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-cream/20 flex items-center justify-center">
                        <span className="text-4xl">📚</span>
                      </div>
                      <p className="font-serif text-lg">Author Image</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating chai cup decoration */}
                <div className="absolute bottom-4 right-4 w-16 h-16 bg-cream rounded-full shadow-lg flex items-center justify-center animate-float">
                  <span className="text-2xl">☕</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-2 md:order-2 text-center md:text-left animate-fade-in-up">
            <p className="text-terracotta font-body italic text-lg mb-4">
              Welcome to my cozy corner
            </p>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-chai-brown mb-4 sm:mb-6 leading-tight">
              Where Chai Meets
              <span className="block text-terracotta">Stories</span>
            </h1>
            
            <p className="text-chai-brown-light font-body text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0">
              Hello, I'm <span className="text-chai-brown font-semibold">Anshika</span> — a book lover, 
              chai enthusiast, and storyteller at heart. Join me as I share honest book reviews, 
              curated recommendations, and reflections from my reading journey.
            </p>

            <div className="flex flex-col xs:flex-row sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <Link href="/about" className="btn-primary">
                Read My Story
              </Link>
              <Link href="/blog" className="btn-secondary">
                Explore Blogs
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 sm:mt-12 flex justify-center md:justify-start gap-6 sm:gap-8">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-serif text-chai-brown">50+</p>
                <p className="text-xs sm:text-sm text-chai-brown-light">Book Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-serif text-chai-brown">2K+</p>
                <p className="text-xs sm:text-sm text-chai-brown-light">Readers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-serif text-chai-brown">3</p>
                <p className="text-xs sm:text-sm text-chai-brown-light">Book Clubs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
