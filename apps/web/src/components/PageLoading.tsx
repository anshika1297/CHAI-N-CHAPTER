'use client';

import { BookOpen, Coffee } from 'lucide-react';

interface PageLoadingProps {
  message?: string;
}

export default function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream pt-24">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto flex items-center justify-center">
            <Coffee 
              size={48} 
              className="text-terracotta animate-bounce" 
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-terracotta/20 border-t-terracotta rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="font-serif text-lg text-chai-brown animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
