import AdminLayout from '../components/AdminLayout';
import AuthGuard from '../components/AuthGuard';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AuthGuard>
  );
}
