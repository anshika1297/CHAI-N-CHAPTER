'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  MessageSquare,
  FileText,
  Shield,
  Briefcase,
  LogOut,
  Menu,
  X,
  PenSquare,
  ListOrdered,
  Sparkles,
  PanelTop,
  PanelBottom,
  Home,
  UserCircle,
  Mail,
  Inbox,
  Send,
} from 'lucide-react';
import { getAdminToken, clearAdminToken } from '@/lib/api';

const adminNavLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Admin Users', href: '/admin/users', icon: Users },
  { name: 'Subscribers', href: '/admin/subscribers', icon: Mail },
  { name: 'Subscriber emails', href: '/admin/email-settings', icon: Send },
  { name: 'Home (Hero)', href: '/admin/home', icon: Home },
  { name: 'Header', href: '/admin/header', icon: PanelTop },
  { name: 'Footer', href: '/admin/footer', icon: PanelBottom },
  { name: 'About Me', href: '/admin/about', icon: UserCircle },
  { name: 'Book Reviews', href: '/admin/blog', icon: PenSquare },
  { name: 'Book Recommendations', href: '/admin/recommendations', icon: ListOrdered },
  { name: 'Her Musings Verse', href: '/admin/musings', icon: Sparkles },
  { name: 'Work With Me', href: '/admin/work-with-me', icon: Briefcase },
  { name: 'Contact Page', href: '/admin/contact', icon: MessageSquare },
  { name: 'Enquiries', href: '/admin/messages', icon: Inbox },
  { name: 'Book Clubs', href: '/admin/book-clubs', icon: BookOpen },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Terms & Conditions', href: '/admin/terms', icon: FileText },
  { name: 'Privacy Policy', href: '/admin/privacy', icon: Shield },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      setIsAuthenticated(true);
    } else if (pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    clearAdminToken();
    router.push('/admin/login');
  };

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-chai-brown/10 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-serif text-xl text-chai-brown">Admin Panel</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-chai-brown p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-chai-brown/10 z-30
            transform transition-transform duration-300 ease-in-out
            ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            w-64 overflow-y-auto
          `}
        >
          <div className="p-4">
            {/* Desktop Logo/Title */}
            <div className="hidden lg:block mb-8">
              <h1 className="font-serif text-2xl text-chai-brown">Admin Panel</h1>
              <p className="font-body text-xs text-chai-brown-light mt-1">
                Chapters.aur.Chai
              </p>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {adminNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-terracotta/10 text-terracotta' 
                        : 'text-chai-brown hover:bg-cream'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-body text-sm">{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="mt-8 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-body text-sm">Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
