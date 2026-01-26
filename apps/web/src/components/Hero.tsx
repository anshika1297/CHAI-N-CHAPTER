'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Image */}
          <div className="order-1 md:order-1 animate-fade-in w-full max-w-xs mx-auto md:max-w-md lg:max-w-lg">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-sage/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-terracotta/20 rounded-full blur-2xl" />
              
              {/* Main image container */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full">
                <div className="aspect-square bg-chai-brown relative flex items-center justify-center">
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
                  }}></div>
                  
                  {/* Simple placeholder text */}
                  <div className="relative z-10 text-center px-4">
                    <p className="font-serif text-lg text-cream/90 font-medium">Author Image</p>
                    <p className="font-body text-xs text-cream/70 mt-2">Placeholder</p>
                  </div>
                  
                  {/* Small floating decoration */}
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-cream/80 rounded-full shadow-md flex items-center justify-center animate-float z-20">
                    <span className="text-lg">☕</span>
                  </div>
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
            <div className="mt-6 sm:mt-8 flex justify-center md:justify-start gap-6 sm:gap-8">
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
