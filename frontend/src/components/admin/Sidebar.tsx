'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  HomeIcon, 
  Users2Icon, 
  UsersIcon, 
  Building2Icon, 
  ClipboardListIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            <HomeIcon className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/users') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/users" className="flex items-center">
            <Users2Icon className="mr-3 h-5 w-5" />
            Quản lý người dùng
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/teams') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/teams" className="flex items-center">
            <UsersIcon className="mr-3 h-5 w-5" />
            Quản lý nhóm
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/clients') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/clients" className="flex items-center">
            <Building2Icon className="mr-3 h-5 w-5" />
            Quản lý khách hàng
          </Link>
        </Button>
        
        <Button
          asChild
          variant={pathname.includes('/dashboard/orders') ? 'default' : 'ghost'}
          className="w-full justify-start"
        >
          <Link href="/dashboard/orders" className="flex items-center">
            <ClipboardListIcon className="mr-3 h-5 w-5" />
            Quản lý đơn hàng
          </Link>
        </Button>
      </nav>
    </div>
  );
};

export default Sidebar; 