import {
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  BookOpen,
  AtSign,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { siteConfig } from '@/lib/seo';
import { workWithMeConnect } from '@/lib/workWithMeContent';

const socialLinks: { name: string; icon: LucideIcon; href: string; color: string }[] = [
  { name: 'Email', icon: Mail, href: `mailto:${siteConfig.email}`, color: 'text-chai-brown' },
  { name: 'Instagram', icon: Instagram, href: siteConfig.social.instagram, color: 'text-pink-500' },
  { name: 'Facebook', icon: Facebook, href: siteConfig.social.facebook, color: 'text-blue-600' },
  { name: 'Goodreads', icon: BookOpen, href: siteConfig.social.goodreads, color: 'text-amber-700' },
  { name: 'LinkedIn', icon: Linkedin, href: siteConfig.social.linkedin, color: 'text-blue-700' },
  { name: 'Threads', icon: AtSign, href: siteConfig.social.threads, color: 'text-neutral-700' },
  { name: 'YouTube', icon: Youtube, href: siteConfig.social.youtube, color: 'text-red-500' },
];

export default function WorkWithMeSocial() {
  return (
    <section className="mb-14 sm:mb-20" aria-labelledby="wwm-connect-heading">
      <div className="bg-cream-light rounded-2xl p-8 sm:p-10 lg:p-12 border border-chai-brown/10">
        <h2
          id="wwm-connect-heading"
          className="font-serif text-2xl sm:text-3xl text-chai-brown mb-4 text-center"
        >
          {workWithMeConnect.title}
        </h2>
        <p className="font-body text-base text-chai-brown-light text-center mb-8 max-w-2xl mx-auto">
          {workWithMeConnect.description}
        </p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cream border border-chai-brown/20 hover:border-terracotta transition-all duration-300 hover:shadow-md group min-w-[5.5rem]"
              >
                <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors">
                  <Icon size={24} className={`${social.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="font-sans text-sm text-chai-brown font-medium">{social.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
