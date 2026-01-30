'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ListOrdered, PenSquare, Mail, Users, MessageCircle, Eye } from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const defaultStats: DashboardStats = {
  totalVisitors: 0,
  monthlyVisitors: 0,
  totalPosts: 0,
  totalRecommendations: 0,
  totalMusings: 0,
  totalBookClubs: 0,
  totalSubscribers: 0,
  totalMessages: 0,
  unreadMessages: 0,
  totalAdminUsers: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load stats');
        setStats(defaultStats);
      })
      .finally(() => setLoading(false));
  }, []);

  type StatCard = {
    title: string;
    value: string;
    icon: typeof BookOpen;
    color: string;
    bgColor: string;
    href: string;
    subValue?: string | null;
  };

  const statCards: StatCard[] = [
    { title: 'Total Visitors', value: stats.totalVisitors.toLocaleString(), icon: Eye, color: 'text-terracotta', bgColor: 'bg-terracotta/10', href: '#' },
    { title: 'Monthly Visitors', value: stats.monthlyVisitors.toLocaleString(), icon: Eye, color: 'text-sage', bgColor: 'bg-sage/10', href: '#' },
    { title: 'Book Reviews', value: String(stats.totalPosts), icon: PenSquare, color: 'text-terracotta', bgColor: 'bg-terracotta/10', href: '/admin/blog' },
    { title: 'Recommendations', value: String(stats.totalRecommendations), icon: ListOrdered, color: 'text-sage', bgColor: 'bg-sage/10', href: '/admin/recommendations' },
    { title: 'Musings', value: String(stats.totalMusings), icon: PenSquare, color: 'text-chai-brown', bgColor: 'bg-chai-brown/10', href: '/admin/musings' },
    { title: 'Book Clubs', value: String(stats.totalBookClubs), icon: BookOpen, color: 'text-terracotta', bgColor: 'bg-terracotta/10', href: '/admin/book-clubs' },
    { title: 'Subscribers', value: stats.totalSubscribers.toLocaleString(), icon: Mail, color: 'text-sage', bgColor: 'bg-sage/10', href: '/admin/subscribers' },
    { title: 'Messages', value: stats.totalMessages.toLocaleString(), subValue: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : null, icon: MessageCircle, color: 'text-chai-brown', bgColor: 'bg-chai-brown/10', href: '/admin/messages' },
    { title: 'Admin Users', value: String(stats.totalAdminUsers), icon: Users, color: 'text-chai-brown', bgColor: 'bg-chai-brown/10', href: '/admin/users' },
  ];

  if (loading) {
    return <PageLoading message="Loading dashboard…" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
          Dashboard
        </h1>
        <p className="font-body text-chai-brown-light">
          Real-time overview of your website
        </p>
      </div>
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg font-body text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const cardContent = (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
              <h3 className="font-body text-sm text-chai-brown-light mb-1">
                {stat.title}
              </h3>
              <p className="font-serif text-2xl text-chai-brown">
                {stat.value}
              </p>
              {stat.subValue && (
                <p className="font-body text-xs text-terracotta mt-1">{stat.subValue}</p>
              )}
            </>
          );
          return (
            <div
              key={index}
              className="bg-white rounded-lg p-6 border border-chai-brown/10 shadow-sm"
            >
              {stat.href === '#' ? (
                <div className="cursor-default">{cardContent}</div>
              ) : (
                <Link href={stat.href} className="block hover:bg-cream/50 rounded-lg -m-2 p-2 transition-colors">
                  {cardContent}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 border border-chai-brown/10 shadow-sm">
        <h2 className="font-serif text-xl text-chai-brown mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/about"
            className="p-4 border border-chai-brown/10 rounded-lg hover:bg-cream transition-colors"
          >
            <h3 className="font-body font-medium text-chai-brown mb-1">
              Edit About Me
            </h3>
            <p className="font-body text-sm text-chai-brown-light">
              Update your personal information
            </p>
          </a>
          <a
            href="/admin/book-clubs"
            className="p-4 border border-chai-brown/10 rounded-lg hover:bg-cream transition-colors"
          >
            <h3 className="font-body font-medium text-chai-brown mb-1">
              Manage Book Clubs
            </h3>
            <p className="font-body text-sm text-chai-brown-light">
              Add or edit book clubs
            </p>
          </a>
          <a
            href="/admin/blog"
            className="p-4 border border-chai-brown/10 rounded-lg hover:bg-cream transition-colors"
          >
            <h3 className="font-body font-medium text-chai-brown mb-1">
              Manage Book Reviews
            </h3>
            <p className="font-body text-sm text-chai-brown-light">
              Create and edit blog posts
            </p>
          </a>
          <a
            href="/admin/recommendations"
            className="p-4 border border-chai-brown/10 rounded-lg hover:bg-cream transition-colors"
          >
            <h3 className="font-body font-medium text-chai-brown mb-1">
              Manage Book Recommendations
            </h3>
            <p className="font-body text-sm text-chai-brown-light">
              Create and edit recommendation lists
            </p>
          </a>
          <a
            href="/admin/musings"
            className="p-4 border border-chai-brown/10 rounded-lg hover:bg-cream transition-colors"
          >
            <h3 className="font-body font-medium text-chai-brown mb-1">
              Her Musings Verse
            </h3>
            <p className="font-body text-sm text-chai-brown-light">
              Create and edit musings & reflections
            </p>
          </a>
          <a
            href="/admin/categories"
            className="p-4 border border-chai-brown/10 rounded-lg hover:bg-cream transition-colors"
          >
            <h3 className="font-body font-medium text-chai-brown mb-1">
              Manage Categories
            </h3>
            <p className="font-body text-sm text-chai-brown-light">
              Organize your content categories
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
