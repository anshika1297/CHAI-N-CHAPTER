import { buildMetadata } from '@/lib/metadata';
import AdminClientShell from '@/components/admin/AdminClientShell';

export const metadata = buildMetadata({
  title: 'Admin',
  description: 'Chapters.aur.Chai administration.',
  path: '/admin',
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminClientShell>{children}</AdminClientShell>;
}
