'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Import từng icon riêng lẻ
// @ts-ignore - Bỏ qua lỗi TypeScript tạm thời
import Home from 'lucide-react/dist/esm/icons/home';
// @ts-ignore
import Users2 from 'lucide-react/dist/esm/icons/users-2';
// @ts-ignore
import Users from 'lucide-react/dist/esm/icons/users';
// @ts-ignore
import Building2 from 'lucide-react/dist/esm/icons/building-2';
// @ts-ignore
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
// @ts-ignore
import Ruler from 'lucide-react/dist/esm/icons/ruler';
// @ts-ignore
import Package2 from 'lucide-react/dist/esm/icons/package-2';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="h-full min-h-screen bg-card border-r w-64">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <h1 className="text-lg font-semibold text-card-foreground">Admin IITS</h1>
      </div>
      <nav className="space-y-1 px-3 py-3">
        <Button
          asChild
          variant={pathname === '/dashboard' ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard" className="flex items-center">
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/users') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/users" className="flex items-center">
            <Users2 className="mr-3 h-5 w-5" />
            Quản lý người dùng
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/teams') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/teams" className="flex items-center">
            <Users className="mr-3 h-5 w-5" />
            Quản lý nhóm
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/clients') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/clients" className="flex items-center">
            <Building2 className="mr-3 h-5 w-5" />
            Quản lý khách hàng
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/orders') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/orders" className="flex items-center">
            <ClipboardList className="mr-3 h-5 w-5" />
            Quản lý đơn hàng
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/units') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/units" className="flex items-center">
            <Ruler className="mr-3 h-5 w-5" />
            Quản lý đơn vị tính
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/commodities') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/commodities" className="flex items-center">
            <Package2 className="mr-3 h-5 w-5" />
            Quản lý hàng hóa
          </Link>
        </Button>
      </nav>
    </div>
  );
};

export default Sidebar; 