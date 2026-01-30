'use client';

import { Users, Calendar, ExternalLink } from 'lucide-react';
import { getImageUrl } from '@/lib/api';

interface BookClubCardProps {
  name: string;
  theme: string;
  description: string;
  logo: string;
  joinLink: string;
  memberCount: number;
  meetingFrequency: string;
  nextMeeting?: string;
}

export default function BookClubCard({
  name,
  theme,
  description,
  logo,
  joinLink,
  memberCount,
  meetingFrequency,
  nextMeeting,
}: BookClubCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <article className="card group h-full flex flex-col bg-cream-light hover:shadow-xl transition-all duration-300">
      {/* Logo/Header Section */}
      <div className="relative h-32 bg-gradient-to-br from-terracotta to-terracotta-dark rounded-t-2xl overflow-hidden">
        {logo ? (
          <img
            src={getImageUrl(logo)}
            alt={`${name} logo`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-cream/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">📚</span>
            </div>
          </div>
        )}
        
        {/* Theme Badge */}
        <div className="absolute bottom-3 left-3 right-3">
          <span className="bg-cream/95 text-chai-brown text-xs font-sans px-3 py-1.5 rounded-full inline-block backdrop-blur-sm">
            {theme}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Club Name */}
        <h3 className="font-serif text-2xl text-chai-brown mb-2 group-hover:text-terracotta transition-colors">
          {name}
        </h3>

        {/* Description */}
        <p className="text-chai-brown-light font-body text-sm leading-relaxed mb-4 flex-1 line-clamp-4">
          {description}
        </p>

        {/* Stats */}
        <div className="space-y-2 mb-4 pb-4 border-b border-chai-brown/10">
          <div className="flex items-center gap-2 text-xs text-chai-brown-light font-sans">
            <Users size={14} />
            <span>{memberCount} members</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-chai-brown-light font-sans">
            <Calendar size={14} />
            <span>Meets {meetingFrequency.toLowerCase()}</span>
            {nextMeeting && (
              <span className="text-terracotta">• Next: {formatDate(nextMeeting)}</span>
            )}
          </div>
        </div>

        {/* Join Button */}
        <a
          href={joinLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full btn-primary flex items-center justify-center gap-2 text-center group/btn"
        >
          <span>Join Club</span>
          <ExternalLink size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </a>
      </div>
    </article>
  );
}
