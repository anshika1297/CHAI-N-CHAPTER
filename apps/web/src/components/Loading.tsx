'use client';

import { BookOpen } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto">
            <BookOpen 
              size={64} 
              className="text-terracotta animate-pulse" 
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-terracotta/20 border-t-terracotta rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="font-serif text-lg text-chai-brown animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
