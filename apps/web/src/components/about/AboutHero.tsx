'use client';

import { getImageUrl } from '@/lib/api';

export type HeroData = {
  name: string;
  greeting: string;
  subtitle1: string;
  subtitle2: string;
  introText: string;
  imageUrl: string;
};

const defaultHero: HeroData = {
  name: 'Anshika',
  greeting: "Hi, I'm",
  subtitle1: 'Welcome to my cozy corner',
  subtitle2: 'of the internet',
  introText:
    'A book lover, chai enthusiast, and storyteller at heart. I believe every great story deserves to be shared over a warm cup of chai. Join me as I navigate through pages, one chapter at a time.',
  imageUrl: '',
};

type Props = { hero?: Partial<HeroData> | null };

export default function AboutHero({ hero: heroProp }: Props) {
  const hero = heroProp ? { ...defaultHero, ...heroProp } : defaultHero;

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Mobile: Heading First */}
        <div className="md:hidden text-center mb-6 animate-fade-in-up">
          <p className="text-terracotta font-body italic text-lg mb-2">{hero.greeting}</p>
          <h1 className="text-4xl sm:text-5xl font-serif text-chai-brown mb-4 leading-tight">
            <span className="block text-terracotta">{hero.name}</span>
            <span className="block text-2xl sm:text-3xl mt-2 text-chai-brown-light font-normal">
              {hero.subtitle1}
            </span>
            <span className="block text-xl sm:text-2xl mt-2 text-chai-brown-light font-normal">
              {hero.subtitle2}
            </span>
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Image */}
          <div className="order-2 md:order-1 animate-fade-in w-full max-w-xs mx-auto md:max-w-md lg:max-w-lg">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-sage/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-terracotta/20 rounded-full blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full">
                <div className="aspect-square bg-chai-brown relative flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
                    }}
                  />
                  {hero.imageUrl ? (
                    <img
                      src={getImageUrl(hero.imageUrl)}
                      alt={hero.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative z-10 text-center px-4">
                      <p className="font-serif text-lg text-cream/90 font-medium">Author Photo</p>
                      <p className="font-body text-xs text-cream/70 mt-2">Placeholder</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-cream/80 rounded-full shadow-md flex items-center justify-center animate-float z-20">
                    <span className="text-lg">📚</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-3 md:order-2 text-center md:text-left animate-fade-in-up">
            <div className="hidden md:block mb-6">
              <p className="text-terracotta font-body italic text-lg mb-2">{hero.greeting}</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-chai-brown mb-4 leading-tight">
                <span className="block text-terracotta">{hero.name}</span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 text-chai-brown-light font-normal">
                  {hero.subtitle1}
                </span>
                <span className="block text-xl sm:text-2xl lg:text-3xl mt-2 text-chai-brown-light font-normal">
                  {hero.subtitle2}
                </span>
              </h1>
            </div>
            <p className="text-chai-brown-light font-body text-base sm:text-lg leading-relaxed mt-6 md:mt-0 max-w-lg mx-auto md:mx-0">
              {hero.introText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
