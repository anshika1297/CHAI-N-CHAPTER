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
  CircleUserRound,
  ShoppingBag,
  MessageCircle,
  Library,
  Tags,
  Upload,
  ListChecks,
  Compass,
  BarChart3,
  GitMerge,
} from 'lucide-react';
import { getAdminToken, clearAdminToken } from '@/lib/api';

const libraryNavLinks = [
  { name: 'Library Dashboard', href: '/admin/library', icon: Library },
  { name: 'Ask (AI Search)', href: '/admin/library/ask', icon: Sparkles },
  { name: 'Recommend', href: '/admin/library/recommend', icon: ListChecks },
  { name: 'Collections', href: '/admin/library/collections', icon: Library },
  { name: 'Hook Studio', href: '/admin/library/content', icon: Sparkles },
  { name: 'Discovery', href: '/admin/library/discovery', icon: Compass },
  { name: 'Analytics', href: '/admin/library/analytics', icon: BarChart3 },
  { name: 'My Books', href: '/admin/library/books', icon: BookOpen },
  { name: 'Duplicates', href: '/admin/library/books/duplicates', icon: GitMerge },
  { name: 'Authors', href: '/admin/library/authors', icon: CircleUserRound },
  { name: 'Master Data', href: '/admin/library/taxonomy', icon: Tags },
  { name: 'Import Books', href: '/admin/library/import', icon: Upload },
];

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
  { name: 'Author spotlight', href: '/admin/author-spotlight', icon: CircleUserRound },
  { name: 'Her Musings Verse', href: '/admin/musings', icon: Sparkles },
  { name: 'Work With Me', href: '/admin/work-with-me', icon: Briefcase },
  { name: 'Contact Page', href: '/admin/contact', icon: MessageSquare },
  { name: 'Enquiries', href: '/admin/messages', icon: Inbox },
  { name: 'Comments', href: '/admin/comments', icon: MessageCircle },
  { name: 'Book Clubs', href: '/admin/book-clubs', icon: BookOpen },
  { name: 'Shop (public)', href: '/shop', icon: ShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Terms & Conditions', href: '/admin/terms', icon: FileText },
  { name: 'Privacy Policy', href: '/admin/privacy', icon: Shield },
];

export default function AdminClientShell({ children }: { children: React.ReactNode }) {
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

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="lg:hidden bg-white border-b border-chai-brown/10 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-serif text-xl text-chai-brown">Admin Panel</h1>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-chai-brown p-2">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="flex">
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
            <div className="hidden lg:block mb-8">
              <h1 className="font-serif text-2xl text-chai-brown">Admin Panel</h1>
              <p className="font-body text-xs text-chai-brown-light mt-1">Chapters.aur.Chai</p>
            </div>

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
                      ${isActive ? 'bg-terracotta/10 text-terracotta' : 'text-chai-brown hover:bg-cream'}
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-body text-sm">{link.name}</span>
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-chai-brown/10">
                <p className="px-4 mb-2 font-sans text-[11px] uppercase tracking-[0.15em] text-chai-brown/50">
                  Library OS
                </p>
                {libraryNavLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.href === '/admin/library'
                      ? pathname === link.href
                      : pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${isActive ? 'bg-terracotta/10 text-terracotta' : 'text-chai-brown hover:bg-cream'}
                      `}
                    >
                      <Icon size={20} />
                      <span className="font-body text-sm">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <button
              onClick={handleLogout}
              className="mt-8 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-body text-sm">Logout</span>
            </button>
          </div>
        </aside>

        {isMenuOpen ? (
          <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setIsMenuOpen(false)} />
        ) : null}

        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
