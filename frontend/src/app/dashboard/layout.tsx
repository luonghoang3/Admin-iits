'use client';

import { SidebarProvider } from '@/contexts/SidebarContext';
import Sidebar from '@/components/admin/Sidebar';
import AuthCheck from '@/components/auth/AuthCheck';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck>
      <SidebarProvider>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 overflow-hidden">
            <main className="p-4 md:p-6 h-full overflow-auto">{children}</main>
            <Toaster />
          </div>
        </div>
      </SidebarProvider>
    </AuthCheck>
  );
}
