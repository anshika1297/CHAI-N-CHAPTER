'use client';

import { useState, useEffect } from 'react';
import { Eye, BookOpen, Mail, Users } from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const DUMMY_STATS: DashboardStats = {
  totalVisitors: 1250,
  monthlyVisitors: 320,
  totalPosts: 45,
  totalSubscribers: 89,
  totalAdminUsers: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(DUMMY_STATS);
  const [loading, setLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setStats(data);
        setUseBackend(true);
      })
      .catch(() => {
        setStats(DUMMY_STATS);
        setUseBackend(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: 'Total Visitors',
      value: stats.totalVisitors.toLocaleString(),
      icon: Eye,
      color: 'text-terracotta',
      bgColor: 'bg-terracotta/10',
    },
    {
      title: 'Monthly Visitors',
      value: stats.monthlyVisitors.toLocaleString(),
      icon: Eye,
      color: 'text-sage-green',
      bgColor: 'bg-sage-green/10',
    },
    {
      title: 'Total Posts',
      value: String(stats.totalPosts),
      icon: BookOpen,
      color: 'text-chai-brown',
      bgColor: 'bg-chai-brown/10',
    },
    {
      title: 'Subscribers',
      value: stats.totalSubscribers.toLocaleString(),
      icon: Mail,
      color: 'text-terracotta',
      bgColor: 'bg-terracotta/10',
    },
    ...(typeof stats.totalAdminUsers === 'number'
      ? [
          {
            title: 'Admin Users',
            value: String(stats.totalAdminUsers),
            icon: Users,
            color: 'text-chai-brown',
            bgColor: 'bg-chai-brown/10',
          },
        ]
      : []),
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
          Overview of your website statistics
        </p>
      </div>
      {!useBackend && (
        <div className="mb-6 px-4 py-3 rounded-lg font-body text-sm bg-amber-50 text-amber-800 border border-amber-200">
          Showing placeholder stats. Sign in and ensure the API is running to load data from the backend.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg p-6 border border-chai-brown/10 shadow-sm"
            >
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
